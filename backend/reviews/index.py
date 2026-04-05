"""
Управление отзывами: создание, получение, прикрепление фото, модерация.
Требует JWT в заголовке X-Authorization.
"""

import json
import os
import psycopg2
import jwt
import requests


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


def notify_admin(review_id, marketplace, rating, review_text, user_name, product_article, seller):
    admin_id = os.environ.get("ADMIN_TELEGRAM_ID")
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not admin_id or not bot_token:
        return
    text = (
        f"📝 <b>Новый отзыв #{review_id} на модерации</b>\n\n"
        f"👤 Автор: {user_name}\n"
        f"🏪 Маркетплейс: {marketplace}\n"
        f"📦 Артикул: {product_article or '—'}\n"
        f"🏭 Продавец: {seller or '—'}\n"
        f"⭐ Оценка: {rating}/5\n\n"
        f"💬 {review_text[:300]}{'...' if len(review_text) > 300 else ''}"
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
    """Отзывы: создание, список, прикрепление фото, модерация."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": cors(), "body": ""}

    payload = auth(event)
    if not payload:
        return err("Требуется авторизация", 401)

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    path = event.get("path", "/")

    # POST /attach-image — прикрепить уже загруженное фото к отзыву
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
    """GET — список отзывов."""
    s = schema()
    params = event.get("queryStringParameters") or {}
    status_filter = params.get("status")
    my_only = params.get("my") == "1"
    marketplace = params.get("marketplace")
    search = params.get("search", "").strip()
    is_admin = payload.get("is_admin", 0)
    user_id = payload.get("user_id")

    conn = db()
    try:
        cur = conn.cursor()
        conds, args = [], []

        if not is_admin:
            if my_only:
                conds.append("r.user_id = %s"); args.append(user_id)
            else:
                conds.append("(r.status = 'approved' OR r.user_id = %s)"); args.append(user_id)
        elif status_filter:
            conds.append("r.status = %s"); args.append(status_filter)

        if marketplace:
            conds.append("r.marketplace = %s"); args.append(marketplace)
        if search:
            conds.append("(r.product_article ILIKE %s OR r.seller ILIKE %s OR r.product_link ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]

        where = ("WHERE " + " AND ".join(conds)) if conds else ""
        cur.execute(f"""
            SELECT r.id, r.marketplace, r.product_article, r.product_link, r.seller,
                   r.rating, r.review_text, r.status, r.created_at,
                   u.name, u.avatar_url, u.telegram_id, r.user_id
            FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id
            {where} ORDER BY r.created_at DESC LIMIT 100
        """, args)
        rows = cur.fetchall()

        ids = [r[0] for r in rows]
        imgs = {}
        if ids:
            ph = ",".join(["%s"] * len(ids))
            cur.execute(f"SELECT review_id, image_url FROM {s}review_images WHERE review_id IN ({ph})", ids)
            for row in cur.fetchall():
                imgs.setdefault(row[0], []).append(row[1])

        reviews = [{"id": r[0], "marketplace": r[1], "product_article": r[2], "product_link": r[3],
                    "seller": r[4], "rating": r[5], "review_text": r[6], "status": r[7],
                    "created_at": str(r[8]), "author_name": r[9], "author_avatar": r[10],
                    "telegram_id": r[11], "user_id": r[12], "images": imgs.get(r[0], [])} for r in rows]
        return ok({"reviews": reviews})
    finally:
        conn.close()


def handle_create(event, payload):
    """POST — создать отзыв БЕЗ фото. Фото прикрепляются отдельно через ?action=attach."""
    s = schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")

    marketplace = body.get("marketplace", "").strip()
    review_text = body.get("review_text", "").strip()
    rating = body.get("rating")
    product_article = body.get("product_article", "").strip() or None
    product_link = body.get("product_link", "").strip() or None
    seller = body.get("seller", "").strip() or None

    if not marketplace or not review_text or not rating:
        return err("marketplace, review_text и rating обязательны")

    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {s}reviews
            (user_id, marketplace, product_article, product_link, seller, rating, review_text, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft')
            RETURNING id
        """, (user_id, marketplace, product_article, product_link, seller, rating, review_text))
        review_id = cur.fetchone()[0]
        conn.commit()
        return ok({"id": review_id, "status": "draft"}, 201)
    finally:
        conn.close()


def handle_attach_image(event, payload):
    """POST ?action=attach — прикрепить CDN URL фото к отзыву. Когда все фото — переводим в pending и уведомляем."""
    s = schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")
    review_id = body.get("review_id")
    image_url = body.get("image_url", "").strip()
    is_last = body.get("is_last", False)

    if not review_id or not image_url:
        return err("review_id и image_url обязательны")

    conn = db()
    try:
        cur = conn.cursor()
        # Проверяем что отзыв принадлежит пользователю
        cur.execute(f"SELECT id, status, marketplace, rating, review_text, product_article, seller FROM {s}reviews WHERE id = %s AND user_id = %s", (review_id, user_id))
        row = cur.fetchone()
        if not row:
            return err("Отзыв не найден", 404)

        cur.execute(f"INSERT INTO {s}review_images (review_id, image_url) VALUES (%s, %s)", (review_id, image_url))

        if is_last:
            # Переводим отзыв в pending и уведомляем админа
            cur.execute(f"UPDATE {s}reviews SET status = 'pending' WHERE id = %s", (review_id,))
            conn.commit()
            cur.execute(f"SELECT name FROM {s}users WHERE id = %s", (user_id,))
            user_name = cur.fetchone()[0]
            notify_admin(review_id, row[2], row[3], row[4], user_name, row[5], row[6])
        else:
            conn.commit()

        return ok({"ok": True, "review_id": review_id})
    finally:
        conn.close()


def handle_moderate(event, payload):
    """PUT — модерация (только admin)."""
    if not payload.get("is_admin"):
        return err("Нет прав", 403)
    s = schema()
    body = json.loads(event.get("body") or "{}")
    review_id = body.get("review_id")
    action = body.get("action")
    admin_comment = body.get("admin_comment", "")

    if not review_id or action not in ("approve", "reject"):
        return err("review_id и action (approve/reject) обязательны")

    status = "approved" if action == "approve" else "rejected"
    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(f"UPDATE {s}reviews SET status = %s, admin_comment = %s WHERE id = %s", (status, admin_comment, review_id))
        conn.commit()
        return ok({"ok": True, "status": status})
    finally:
        conn.close()