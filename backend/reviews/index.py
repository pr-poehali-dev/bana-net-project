"""
Управление отзывами: создание, получение, модерация.
Требует JWT в заголовке Authorization.
"""

import json
import os
import base64
import uuid
from datetime import datetime, timezone
import psycopg2
import jwt
import boto3
import requests


def get_cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


def json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_schema():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{schema}." if schema else ""


def verify_jwt(event: dict) -> dict | None:
    """Декодирует JWT из заголовка Authorization. Возвращает payload или None."""
    auth = event.get("headers", {}).get("Authorization") or event.get("headers", {}).get("authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def upload_image_to_s3(base64_data: str, ext: str = "jpg") -> str:
    """Загружает base64-изображение в S3, возвращает CDN URL."""
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key_id = os.environ["AWS_ACCESS_KEY_ID"]
    filename = f"reviews/{uuid.uuid4()}.{ext}"
    data = base64.b64decode(base64_data)
    s3.put_object(Bucket="files", Key=filename, Body=data, ContentType=f"image/{ext}")
    return f"https://cdn.poehali.dev/projects/{key_id}/bucket/{filename}"


def notify_admin(review: dict, user_name: str):
    """Отправляет уведомление администратору в Telegram."""
    admin_id = os.environ.get("ADMIN_TELEGRAM_ID")
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not admin_id or not bot_token:
        return
    text = (
        f"📝 <b>Новый отзыв на модерации</b>\n\n"
        f"👤 Автор: {user_name}\n"
        f"🏪 Маркетплейс: {review['marketplace']}\n"
        f"📦 Артикул: {review.get('product_article') or '—'}\n"
        f"🏭 Продавец: {review.get('seller') or '—'}\n"
        f"⭐ Оценка: {review['rating']}/5\n\n"
        f"💬 {review['review_text'][:200]}{'...' if len(review['review_text']) > 200 else ''}"
    )
    requests.post(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        json={"chat_id": admin_id, "text": text, "parse_mode": "HTML"},
        timeout=5,
    )


# ─── Handlers ────────────────────────────────────────────────────────────────

def handle_get_reviews(event: dict, payload: dict) -> dict:
    """GET / — список отзывов. Для admin: все статусы, для user: только approved + свои."""
    schema = get_schema()
    params = event.get("queryStringParameters") or {}
    status_filter = params.get("status")
    my_only = params.get("my") == "1"
    marketplace = params.get("marketplace")
    search = params.get("search", "").strip()

    role = payload.get("role", "user")
    user_id = payload.get("user_id")

    conn = get_db()
    try:
        cur = conn.cursor()
        conditions = []
        args = []

        if role != "admin":
            if my_only:
                conditions.append("r.user_id = %s")
                args.append(user_id)
            else:
                conditions.append("(r.status = 'approved' OR r.user_id = %s)")
                args.append(user_id)
        elif status_filter:
            conditions.append("r.status = %s")
            args.append(status_filter)

        if marketplace:
            conditions.append("r.marketplace = %s")
            args.append(marketplace)

        if search:
            conditions.append("(r.product_article ILIKE %s OR r.seller ILIKE %s OR r.product_link ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cur.execute(f"""
            SELECT r.id, r.marketplace, r.product_article, r.product_link, r.seller,
                   r.rating, r.review_text, r.status, r.created_at,
                   u.name AS author_name, u.avatar_url AS author_avatar,
                   u.telegram_id, r.user_id
            FROM {schema}reviews r
            JOIN {schema}users u ON u.id = r.user_id
            {where}
            ORDER BY r.created_at DESC
            LIMIT 100
        """, args)

        rows = cur.fetchall()
        review_ids = [r[0] for r in rows]

        images_map = {}
        if review_ids:
            placeholders = ",".join(["%s"] * len(review_ids))
            cur.execute(
                f"SELECT review_id, image_url FROM {schema}review_images WHERE review_id IN ({placeholders})",
                review_ids
            )
            for img_row in cur.fetchall():
                images_map.setdefault(img_row[0], []).append(img_row[1])

        reviews = []
        for r in rows:
            reviews.append({
                "id": r[0], "marketplace": r[1], "product_article": r[2],
                "product_link": r[3], "seller": r[4], "rating": r[5],
                "review_text": r[6], "status": r[7], "created_at": str(r[8]),
                "author_name": r[9], "author_avatar": r[10],
                "telegram_id": r[11], "user_id": r[12],
                "images": images_map.get(r[0], []),
            })

        return json_response(200, {"reviews": reviews})
    finally:
        conn.close()


def handle_create_review(event: dict, payload: dict) -> dict:
    """POST / — создать отзыв (status=pending)."""
    schema = get_schema()
    user_id = payload["user_id"]
    body = json.loads(event.get("body") or "{}")

    marketplace = body.get("marketplace", "").strip()
    review_text = body.get("review_text", "").strip()
    rating = body.get("rating")
    product_article = body.get("product_article", "").strip() or None
    product_link = body.get("product_link", "").strip() or None
    seller = body.get("seller", "").strip() or None
    images_b64 = body.get("images", [])

    if not marketplace or not review_text or not rating:
        return json_response(400, {"error": "marketplace, review_text и rating обязательны"})
    if len(images_b64) < 2:
        return json_response(400, {"error": "Необходимо минимум 2 фотографии"})

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {schema}reviews
            (user_id, marketplace, product_article, product_link, seller, rating, review_text, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
        """, (user_id, marketplace, product_article, product_link, seller, rating, review_text))
        review_id = cur.fetchone()[0]

        image_urls = []
        for img in images_b64[:10]:
            ext = "jpg"
            if "," in img:
                header, img = img.split(",", 1)
                if "png" in header:
                    ext = "png"
            url = upload_image_to_s3(img, ext)
            image_urls.append(url)
            cur.execute(
                f"INSERT INTO {schema}review_images (review_id, image_url) VALUES (%s, %s)",
                (review_id, url)
            )

        conn.commit()

        cur.execute(f"SELECT name FROM {schema}users WHERE id = %s", (user_id,))
        user_name = cur.fetchone()[0]

        review_data = {
            "marketplace": marketplace, "product_article": product_article,
            "product_link": product_link, "seller": seller,
            "rating": rating, "review_text": review_text,
        }
        notify_admin(review_data, user_name)

        return json_response(201, {"id": review_id, "status": "pending", "images": image_urls})
    finally:
        conn.close()


def handle_moderate_review(event: dict, payload: dict) -> dict:
    """PUT /?action=moderate — одобрить или отклонить отзыв (только admin)."""
    if payload.get("role") != "admin":
        return json_response(403, {"error": "Недостаточно прав"})

    schema = get_schema()
    body = json.loads(event.get("body") or "{}")
    review_id = body.get("review_id")
    status = body.get("status")
    admin_comment = body.get("admin_comment", "")

    if not review_id or status not in ("approved", "rejected"):
        return json_response(400, {"error": "review_id и status (approved/rejected) обязательны"})

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {schema}reviews
            SET status = %s, admin_comment = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id
        """, (status, admin_comment, review_id))
        if not cur.fetchone():
            conn.rollback()
            return json_response(404, {"error": "Отзыв не найден"})
        conn.commit()
        return json_response(200, {"id": review_id, "status": status})
    finally:
        conn.close()


def handle_get_users(event: dict, payload: dict) -> dict:
    """GET /?action=users — список пользователей (только admin)."""
    if payload.get("role") != "admin":
        return json_response(403, {"error": "Недостаточно прав"})
    schema = get_schema()
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT u.id, u.name, u.telegram_id, u.avatar_url, u.role, u.is_blocked, u.created_at,
                   COUNT(r.id) AS reviews_count
            FROM {schema}users u
            LEFT JOIN {schema}reviews r ON r.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT 200
        """)
        users = []
        for row in cur.fetchall():
            users.append({
                "id": row[0], "name": row[1], "telegram_id": row[2],
                "avatar_url": row[3], "role": row[4], "is_blocked": row[5],
                "created_at": str(row[6]), "reviews_count": row[7],
            })
        return json_response(200, {"users": users})
    finally:
        conn.close()


def handle_set_role(event: dict, payload: dict) -> dict:
    """PUT /?action=set-role — изменить роль пользователя (только admin)."""
    if payload.get("role") != "admin":
        return json_response(403, {"error": "Недостаточно прав"})
    schema = get_schema()
    body = json.loads(event.get("body") or "{}")
    target_id = body.get("user_id")
    new_role = body.get("role")
    if not target_id or new_role not in ("user", "admin"):
        return json_response(400, {"error": "user_id и role (user/admin) обязательны"})
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"UPDATE {schema}users SET role = %s WHERE id = %s", (new_role, target_id))
        conn.commit()
        return json_response(200, {"user_id": target_id, "role": new_role})
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """API отзывов: создание, получение, модерация."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    payload = verify_jwt(event)
    if not payload:
        return json_response(401, {"error": "Требуется авторизация"})

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action")

    if method == "GET":
        if action == "users":
            return handle_get_users(event, payload)
        return handle_get_reviews(event, payload)

    if method == "PUT":
        if action == "moderate":
            return handle_moderate_review(event, payload)
        if action == "set-role":
            return handle_set_role(event, payload)

    if method == "POST":
        return handle_create_review(event, payload)

    return json_response(405, {"error": "Method not allowed"})
