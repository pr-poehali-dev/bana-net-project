"""
Управление отзывами: создание, список, загрузка файлов со сжатием через Pillow, модерация.
Требует JWT в заголовке X-Authorization.
"""

import json
import os
import io
import uuid
import base64
import re
import psycopg2
import jwt
import requests
import boto3
from PIL import Image


ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 МБ на файл до сжатия
MAX_DIMENSION = 1920
JPEG_QUALITY = 82


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
    }


def ok(body, status=200):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(body, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def schema():
    s = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{s}." if s else ""


def auth(event):
    h = event.get("headers", {})
    token = (h.get("X-Authorization") or h.get("x-authorization") or h.get("Authorization") or h.get("authorization") or "")
    if not token.startswith("Bearer "):
        return None
    try:
        return jwt.decode(token[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def sanitize(text, max_len=5000):
    """Убираем HTML-теги и ограничиваем длину."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]*>", "", str(text))
    return clean[:max_len].strip()


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def compress_image(data: bytes, mime_type: str) -> tuple[bytes, int, int]:
    """Сжимает изображение Pillow. Возвращает (сжатые байты, исходный размер, новый размер)."""
    original_size = len(data)
    img = Image.open(io.BytesIO(data))

    # Конвертируем RGBA/P в RGB для JPEG
    if img.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Уменьшаем если больше MAX_DIMENSION
    w, h = img.size
    if w > MAX_DIMENSION or h > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    compressed = out.getvalue()
    return compressed, original_size, len(compressed)


def upload_to_s3(data: bytes, filename: str) -> str:
    """Загружает файл в S3 и возвращает CDN URL."""
    s3 = s3_client()
    key = f"reviews/{filename}"
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType="image/jpeg")
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"


def notify_admin(review_id, marketplace, rating, review_text, user_name, product_article, seller, images_count):
    admin_id = os.environ.get("ADMIN_TELEGRAM_ID")
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not admin_id or not bot_token:
        return
    site_url = os.environ.get("SITE_URL", "")
    text = (
        f"📝 <b>Новый отзыв #{review_id} на модерации</b>\n\n"
        f"👤 Автор: {user_name}\n"
        f"🏪 Маркетплейс: {marketplace}\n"
        f"📦 Артикул: {product_article or '—'}\n"
        f"🏭 Продавец: {seller or '—'}\n"
        f"⭐ Оценка: {rating}/5\n"
        f"🖼 Фото: {images_count} шт.\n\n"
        f"💬 {review_text[:400]}{'...' if len(review_text) > 400 else ''}\n\n"
        f"🔗 {site_url}/?admin=1" if site_url else ""
    )
    try:
        requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": admin_id, "text": text, "parse_mode": "HTML"},
            timeout=5,
        )
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Отзывы: создание, список, загрузка файлов со сжатием, модерация."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": cors(), "body": ""}

    payload = auth(event)
    if not payload:
        return err("Требуется авторизация", 401)

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "POST" and params.get("action") == "submit":
        return handle_submit(event, payload)

    if method == "POST" and params.get("action") == "attach":
        return handle_attach_image(event, payload)

    if method == "GET":
        return handle_get(event, payload)

    if method == "POST":
        return handle_create(event, payload)

    if method == "PUT":
        return handle_moderate(event, payload)

    return err("Метод не поддерживается", 405)


def handle_get(event, payload):
    """GET — список отзывов пользователя или для модерации (admin)."""
    s = schema()
    params = event.get("queryStringParameters") or {}
    status_filter = params.get("status")
    my_only = params.get("my") == "1"
    marketplace = params.get("marketplace")
    search = sanitize(params.get("search", ""), 200)
    is_admin = payload.get("is_admin", 0)
    user_id = payload.get("user_id")
    review_id = params.get("id")

    conn = db()
    try:
        cur = conn.cursor()

        # Один отзыв по ID
        if review_id:
            cur.execute(
                f"""SELECT r.id, r.marketplace, r.product_article, r.product_link, r.seller,
                           r.rating, r.review_text, r.status, r.created_at, r.admin_comment, r.moderated_at,
                           u.name, u.avatar_url, u.telegram_id, r.user_id
                    FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id
                    WHERE r.id = %s AND (r.user_id = %s OR r.status = 'approved' OR %s = 1)""",
                (review_id, user_id, is_admin)
            )
            row = cur.fetchone()
            if not row:
                return err("Отзыв не найден", 404)
            cur.execute(f"SELECT file_path, original_filename, file_size, compressed_size, is_compressed FROM {s}review_files WHERE review_id = %s ORDER BY id", (review_id,))
            files = [{"url": f[0], "original_filename": f[1], "file_size": f[2], "compressed_size": f[3], "is_compressed": f[4]} for f in cur.fetchall()]
            # Обратная совместимость — images как список url
            cur.execute(f"SELECT image_url FROM {s}review_images WHERE review_id = %s ORDER BY id", (review_id,))
            legacy_images = [r[0] for r in cur.fetchall()]
            return ok({"review": _row_to_dict(row, files, legacy_images)})

        conds, args = [], []

        if not is_admin:
            if my_only:
                conds.append("r.user_id = %s"); args.append(user_id)
            else:
                conds.append("(r.status = 'approved' OR r.user_id = %s)"); args.append(user_id)
        else:
            if status_filter:
                conds.append("r.status = %s"); args.append(status_filter)
            elif my_only:
                conds.append("r.user_id = %s"); args.append(user_id)

        if marketplace:
            conds.append("r.marketplace = %s"); args.append(sanitize(marketplace, 50))
        if search:
            conds.append("(r.product_article ILIKE %s OR r.seller ILIKE %s OR r.review_text ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]

        where = ("WHERE " + " AND ".join(conds)) if conds else ""
        cur.execute(
            f"""SELECT r.id, r.marketplace, r.product_article, r.product_link, r.seller,
                       r.rating, r.review_text, r.status, r.created_at, r.admin_comment, r.moderated_at,
                       u.name, u.avatar_url, u.telegram_id, r.user_id
                FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id
                {where} ORDER BY r.created_at DESC LIMIT 100""",
            args,
        )
        rows = cur.fetchall()

        ids = [r[0] for r in rows]
        files_map = {}
        images_map = {}
        if ids:
            ph = ",".join(["%s"] * len(ids))
            cur.execute(f"SELECT review_id, file_path, original_filename, file_size, compressed_size, is_compressed FROM {s}review_files WHERE review_id IN ({ph}) ORDER BY id", ids)
            for f in cur.fetchall():
                files_map.setdefault(f[0], []).append({"url": f[1], "original_filename": f[2], "file_size": f[3], "compressed_size": f[4], "is_compressed": f[5]})
            cur.execute(f"SELECT review_id, image_url FROM {s}review_images WHERE review_id IN ({ph}) ORDER BY id", ids)
            for r in cur.fetchall():
                images_map.setdefault(r[0], []).append(r[1])

        reviews = [_row_to_dict(r, files_map.get(r[0], []), images_map.get(r[0], [])) for r in rows]
        return ok({"reviews": reviews, "total": len(reviews)})
    finally:
        conn.close()


def _row_to_dict(r, files, legacy_images):
    return {
        "id": r[0], "marketplace": r[1], "product_article": r[2], "product_link": r[3],
        "seller": r[4], "rating": r[5], "review_text": r[6], "status": r[7],
        "created_at": str(r[8]), "admin_comment": r[9], "moderated_at": str(r[10]) if r[10] else None,
        "author_name": r[11], "author_avatar": r[12], "telegram_id": r[13], "user_id": r[14],
        "files": files,
        "images": [f["url"] for f in files] + legacy_images,
    }


def handle_create(event, payload):
    """POST — создать черновик отзыва (без фото)."""
    s = schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")

    marketplace = sanitize(body.get("marketplace", ""), 50)
    review_text = sanitize(body.get("review_text", ""), 5000)
    rating = body.get("rating")
    product_article = sanitize(body.get("product_article", ""), 255) or None
    product_link = sanitize(body.get("product_link", ""), 2000) or None
    seller = sanitize(body.get("seller", ""), 255) or None

    if not marketplace or not review_text or not rating:
        return err("marketplace, review_text и rating обязательны")

    try:
        rating = int(rating)
        if not (1 <= rating <= 5):
            return err("rating должен быть от 1 до 5")
    except (ValueError, TypeError):
        return err("rating должен быть числом")

    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {s}reviews
                (user_id, marketplace, product_article, product_link, seller, rating, review_text, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft')
                RETURNING id""",
            (user_id, marketplace, product_article, product_link, seller, rating, review_text),
        )
        review_id = cur.fetchone()[0]
        conn.commit()
        return ok({"id": review_id, "status": "draft"}, 201)
    finally:
        conn.close()


def handle_upload_file(event, payload):
    """POST ?action=upload — принять base64 файл, сжать через Pillow, загрузить в S3, сохранить в review_files."""
    s = schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")

    review_id = body.get("review_id")
    file_data_b64 = body.get("file_data", "")
    original_filename = sanitize(body.get("filename", "photo.jpg"), 500)
    mime_type = body.get("mime_type", "image/jpeg").lower().strip()
    is_last = body.get("is_last", False)

    if not review_id:
        return err("review_id обязателен")
    if mime_type not in ALLOWED_MIMES:
        return err(f"Недопустимый тип файла: {mime_type}. Разрешены: jpg, png, webp, gif")
    if not file_data_b64:
        return err("file_data обязателен")

    # Декодируем base64
    try:
        if "," in file_data_b64:
            file_data_b64 = file_data_b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(file_data_b64)
    except Exception:
        return err("Ошибка декодирования файла")

    if len(raw_bytes) > MAX_FILE_SIZE:
        return err(f"Файл слишком большой: {len(raw_bytes) // 1024}КБ. Максимум 10МБ")

    conn = db()
    try:
        cur = conn.cursor()
        # Проверяем что отзыв принадлежит пользователю
        cur.execute(
            f"SELECT id, status, marketplace, rating, review_text, product_article, seller FROM {s}reviews WHERE id = %s AND user_id = %s",
            (review_id, user_id),
        )
        row = cur.fetchone()
        if not row:
            return err("Отзыв не найден", 404)

        # Сжимаем изображение
        compressed, original_size, compressed_size = compress_image(raw_bytes, mime_type)
        is_compressed = compressed_size < original_size

        # Загружаем в S3
        stored_filename = f"{uuid.uuid4().hex}.jpg"
        cdn_url = upload_to_s3(compressed, stored_filename)

        # Сохраняем запись в review_files
        cur.execute(
            f"""INSERT INTO {s}review_files
                (review_id, original_filename, stored_filename, file_path, file_size, compressed_size, mime_type, is_compressed)
                VALUES (%s, %s, %s, %s, %s, %s, 'image/jpeg', %s)""",
            (review_id, original_filename, stored_filename, cdn_url, original_size, compressed_size, is_compressed),
        )

        if is_last:
            cur.execute(
                f"UPDATE {s}reviews SET status = 'pending' WHERE id = %s",
                (review_id,),
            )
            conn.commit()
            cur.execute(f"SELECT name FROM {s}users WHERE id = %s", (user_id,))
            user_name = (cur.fetchone() or ["Пользователь"])[0]
            cur.execute(f"SELECT COUNT(*) FROM {s}review_files WHERE review_id = %s", (review_id,))
            imgs_count = cur.fetchone()[0]
            notify_admin(review_id, row[2], row[3], row[4], user_name, row[5], row[6], imgs_count)
        else:
            conn.commit()

        return ok({
            "ok": True,
            "review_id": review_id,
            "file_url": cdn_url,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "is_compressed": is_compressed,
            "status": "pending" if is_last else row[1],
        })
    finally:
        conn.close()


def handle_submit(event, payload):
    """POST ?action=submit — перевести draft отзыв без фото сразу в pending (если фото не нужны)."""
    s = schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")
    review_id = body.get("review_id")

    if not review_id:
        return err("review_id обязателен")

    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, marketplace, rating, review_text, product_article, seller FROM {s}reviews WHERE id = %s AND user_id = %s AND status = 'draft'",
            (review_id, user_id),
        )
        row = cur.fetchone()
        if not row:
            return err("Черновик не найден", 404)

        cur.execute(f"UPDATE {s}reviews SET status = 'pending' WHERE id = %s", (review_id,))
        conn.commit()

        cur.execute(f"SELECT name FROM {s}users WHERE id = %s", (user_id,))
        user_name = (cur.fetchone() or ["Пользователь"])[0]
        cur.execute(f"SELECT COUNT(*) FROM {s}review_files WHERE review_id = %s", (review_id,))
        imgs_count = cur.fetchone()[0]
        notify_admin(review_id, row[1], row[2], row[3], user_name, row[4], row[5], imgs_count)

        return ok({"ok": True, "status": "pending"})
    finally:
        conn.close()


def handle_attach_image(event, payload):
    """POST ?action=attach — прикрепить CDN URL фото к отзыву. При is_last=true переводим в pending."""
    s = schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")
    review_id = body.get("review_id")
    image_url = sanitize(body.get("image_url", ""), 2000)
    is_last = body.get("is_last", False)

    if not review_id or not image_url:
        return err("review_id и image_url обязательны")

    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, status, marketplace, rating, review_text, product_article, seller FROM {s}reviews WHERE id = %s AND user_id = %s",
            (review_id, user_id),
        )
        row = cur.fetchone()
        if not row:
            return err("Отзыв не найден", 404)

        cur.execute(f"INSERT INTO {s}review_images (review_id, image_url) VALUES (%s, %s)", (review_id, image_url))

        if is_last:
            cur.execute(f"UPDATE {s}reviews SET status = 'pending' WHERE id = %s", (review_id,))
            conn.commit()
            cur.execute(f"SELECT name FROM {s}users WHERE id = %s", (user_id,))
            user_name = (cur.fetchone() or ["Пользователь"])[0]
            cur.execute(f"SELECT COUNT(*) FROM {s}review_images WHERE review_id = %s", (review_id,))
            imgs_count = cur.fetchone()[0]
            notify_admin(review_id, row[2], row[3], row[4], user_name, row[5], row[6], imgs_count)
        else:
            conn.commit()

        return ok({"ok": True, "review_id": review_id})
    finally:
        conn.close()


def handle_moderate(event, payload):
    """PUT — модерация (только admin). Обновляет статус и пишет лог."""
    if not payload.get("is_admin"):
        return err("Нет прав", 403)

    s = schema()
    admin_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")
    review_id = body.get("review_id")
    action = body.get("action")
    admin_comment = sanitize(body.get("admin_comment", ""), 2000)

    if not review_id or action not in ("approve", "reject"):
        return err("review_id и action (approve/reject) обязательны")

    status = "approved" if action == "approve" else "rejected"

    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""UPDATE {s}reviews
                SET status = %s, admin_comment = %s, moderated_at = NOW()
                WHERE id = %s""",
            (status, admin_comment or None, review_id),
        )
        # Лог модерации
        cur.execute(
            f"""INSERT INTO {s}moderation_logs (review_id, admin_id, action, comment)
                VALUES (%s, %s, %s, %s)""",
            (review_id, admin_id, status, admin_comment or None),
        )
        conn.commit()
        return ok({"ok": True, "status": status, "review_id": review_id})
    finally:
        conn.close()