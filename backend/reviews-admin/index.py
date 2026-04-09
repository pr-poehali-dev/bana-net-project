"""
Панель администратора: список отзывов на модерации, одобрение/отклонение, логи.
Требует JWT с is_admin=1 в заголовке X-Authorization.
"""

import json
import os
import re
import urllib.request
import psycopg2
import jwt


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


def auth_admin(event):
    h = event.get("headers", {})
    print("DEBUG headers keys:", list(h.keys()))
    token = (h.get("X-Authorization") or h.get("x-authorization") or h.get("Authorization") or h.get("authorization") or "")
    print("DEBUG token prefix:", token[:30] if token else "EMPTY")
    if not token.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(token[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
        print("DEBUG payload is_admin:", payload.get("is_admin"))
        if not payload.get("is_admin"):
            return None
        return payload
    except jwt.PyJWTError as e:
        print("DEBUG jwt error:", e)
        return None


def sanitize(text, max_len=2000):
    if not text:
        return ""
    clean = re.sub(r"<[^>]*>", "", str(text))
    return clean[:max_len].strip()


def notify_user(telegram_id, review_id, status, marketplace, admin_comment):
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    print(f"[notify_user] telegram_id={telegram_id} review_id={review_id} status={status} has_token={bool(bot_token)}")
    if not bot_token or not telegram_id:
        print(f"[notify_user] SKIP — bot_token={bool(bot_token)} telegram_id={telegram_id}")
        return
    site_url = os.environ.get("SITE_URL", "")
    if status == "approved":
        text = (
            f"✅ <b>Ваш отзыв #{review_id} опубликован!</b>\n\n"
            f"🏪 Маркетплейс: {marketplace}\n\n"
            f"Ваш отзыв прошёл модерацию и теперь виден всем пользователям."
            + (f"\n\n🔗 {site_url}" if site_url else "")
        )
    else:
        text = (
            f"❌ <b>Ваш отзыв #{review_id} отклонён</b>\n\n"
            f"🏪 Маркетплейс: {marketplace}\n\n"
            + (f"💬 <b>Причина:</b> {admin_comment}\n\n" if admin_comment else "")
            + "Вы можете исправить отзыв и отправить повторно в разделе «Профиль»."
            + (f"\n\n🔗 {site_url}" if site_url else "")
        )
    try:
        payload = json.dumps({"chat_id": telegram_id, "text": text, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"[notify_user] tg_response={resp.status} body={resp.read(200)}")
    except Exception as e:
        print(f"[notify_user] ERROR: {e}")


def handler(event: dict, context) -> dict:
    """Администрирование отзывов: список pending, статистика, одобрение/отклонение, история модерации."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": cors(), "body": ""}

    payload = auth_admin(event)
    if not payload:
        return err("Требуется авторизация администратора", 401)

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET" and params.get("action") == "stats":
        return handle_stats(payload)

    if method == "GET" and params.get("action") == "logs":
        return handle_logs(params, payload)

    if method == "GET":
        return handle_list(params, payload)

    if method == "PUT":
        return handle_moderate(event, payload)

    return err("Метод не поддерживается", 405)


def handle_list(params, payload):
    """GET — список отзывов с фильтрацией по статусу."""
    s = schema()
    status_filter = params.get("status", "pending")
    limit = min(int(params.get("limit", 50)), 200)
    offset = int(params.get("offset", 0))
    search = sanitize(params.get("search", ""), 200)

    conn = db()
    try:
        cur = conn.cursor()
        conds = []
        args = []

        if status_filter in ("pending", "approved", "rejected", "draft"):
            conds.append("r.status = %s")
            args.append(status_filter)

        if search:
            conds.append("(r.product_article ILIKE %s OR r.seller ILIKE %s OR r.review_text ILIKE %s OR u.name ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%"]

        where = ("WHERE " + " AND ".join(conds)) if conds else ""
        count_args = args[:]

        cur.execute(
            f"SELECT COUNT(*) FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id {where}",
            count_args,
        )
        total = cur.fetchone()[0]

        args += [limit, offset]
        cur.execute(
            f"""SELECT r.id, r.marketplace, r.product_article, r.product_link, r.seller,
                       r.rating, r.review_text, r.status, r.created_at, r.admin_comment, r.moderated_at,
                       u.name, u.avatar_url, u.telegram_id, r.user_id
                FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id
                {where} ORDER BY r.created_at DESC LIMIT %s OFFSET %s""",
            args,
        )
        rows = cur.fetchall()

        ids = [r[0] for r in rows]
        files_map = {}
        if ids:
            ph = ",".join(["%s"] * len(ids))
            cur.execute(
                f"SELECT review_id, file_path, original_filename, file_size, compressed_size, is_compressed FROM {s}review_files WHERE review_id IN ({ph}) ORDER BY id",
                ids,
            )
            for f in cur.fetchall():
                files_map.setdefault(f[0], []).append({
                    "url": f[1], "original_filename": f[2],
                    "file_size": f[3], "compressed_size": f[4], "is_compressed": f[5],
                })
            # Обратная совместимость
            cur.execute(
                f"SELECT review_id, image_url FROM {s}review_images WHERE review_id IN ({ph}) ORDER BY id",
                ids,
            )
            for r in cur.fetchall():
                entry = {"url": r[1], "original_filename": "", "file_size": 0, "compressed_size": None, "is_compressed": False}
                if r[0] not in files_map or not any(f["url"] == r[1] for f in files_map.get(r[0], [])):
                    files_map.setdefault(r[0], []).append(entry)

        reviews = []
        for r in rows:
            files = files_map.get(r[0], [])
            reviews.append({
                "id": r[0], "marketplace": r[1], "product_article": r[2],
                "product_link": r[3], "seller": r[4], "rating": r[5],
                "review_text": r[6], "status": r[7], "created_at": str(r[8]),
                "admin_comment": r[9], "moderated_at": str(r[10]) if r[10] else None,
                "author_name": r[11], "author_avatar": r[12], "telegram_id": r[13], "user_id": r[14],
                "files": files,
                "images": [f["url"] for f in files],
            })

        return ok({"reviews": reviews, "total": total, "limit": limit, "offset": offset})
    finally:
        conn.close()


def handle_stats(payload):
    """GET ?action=stats — статистика модерации."""
    s = schema()
    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""SELECT
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'approved') as approved,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE status = 'draft') as draft,
                COUNT(*) as total
            FROM {s}reviews"""
        )
        row = cur.fetchone()
        return ok({
            "pending": row[0], "approved": row[1],
            "rejected": row[2], "draft": row[3], "total": row[4],
        })
    finally:
        conn.close()


def handle_logs(params, payload):
    """GET ?action=logs — история действий модерации."""
    s = schema()
    limit = min(int(params.get("limit", 50)), 200)
    conn = db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""SELECT ml.id, ml.review_id, ml.action, ml.comment, ml.created_at,
                       u.name as admin_name, r.marketplace, r.product_article
                FROM {s}moderation_logs ml
                JOIN {s}users u ON u.id = ml.admin_id
                JOIN {s}reviews r ON r.id = ml.review_id
                ORDER BY ml.created_at DESC LIMIT %s""",
            (limit,),
        )
        logs = [{
            "id": r[0], "review_id": r[1], "action": r[2], "comment": r[3],
            "created_at": str(r[4]), "admin_name": r[5], "marketplace": r[6], "product_article": r[7],
        } for r in cur.fetchall()]
        return ok({"logs": logs})
    finally:
        conn.close()


def handle_moderate(event, payload):
    """PUT — одобрить или отклонить отзыв с комментарием."""
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

        # Получаем telegram_id автора ДО изменений
        cur.execute(
            f"SELECT u.telegram_id, r.marketplace FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id WHERE r.id = %s",
            (review_id,),
        )
        author_row = cur.fetchone()
        if not author_row:
            return err("Отзыв не найден", 404)

        telegram_id = author_row[0]
        marketplace = author_row[1]

        cur.execute(
            f"""UPDATE {s}reviews
                SET status = %s, admin_comment = %s, moderated_at = NOW()
                WHERE id = %s""",
            (status, admin_comment or None, review_id),
        )
        cur.execute(
            f"""INSERT INTO {s}moderation_logs (review_id, admin_id, action, comment)
                VALUES (%s, %s, %s, %s)""",
            (review_id, admin_id, status, admin_comment or None),
        )
        conn.commit()

        notify_user(telegram_id, review_id, status, marketplace, admin_comment)

        return ok({"ok": True, "status": status, "review_id": review_id, "marketplace": marketplace})
    finally:
        conn.close()