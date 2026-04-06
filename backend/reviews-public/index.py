"""
Публичная база одобренных отзывов — доступна без авторизации.
Поддерживает фильтрацию по маркетплейсу, поиск, пагинацию.
"""

import json
import os
import re
import psycopg2


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def ok(body):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(body, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def schema():
    s = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{s}." if s else ""


def sanitize(text, max_len=200):
    if not text:
        return ""
    return re.sub(r"<[^>]*>", "", str(text))[:max_len].strip()


def handler(event: dict, context) -> dict:
    """Публичная база одобренных отзывов. Фильтрация по маркетплейсу, поиск, пагинация."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": cors(), "body": ""}

    if event.get("httpMethod") != "GET":
        return err("Только GET", 405)

    s = schema()
    params = event.get("queryStringParameters") or {}
    marketplace = sanitize(params.get("marketplace", ""), 50)
    search = sanitize(params.get("search", ""), 200)
    seller = sanitize(params.get("seller", ""), 255)
    min_rating = params.get("min_rating")
    limit = min(int(params.get("limit", 20)), 100)
    offset = int(params.get("offset", 0))

    conn = db()
    try:
        cur = conn.cursor()
        conds = ["r.status = 'approved'"]
        args = []

        if marketplace:
            conds.append("r.marketplace = %s")
            args.append(marketplace)
        if seller:
            conds.append("r.seller ILIKE %s")
            args.append(f"%{seller}%")
        if search:
            conds.append("(r.product_article ILIKE %s OR r.seller ILIKE %s OR r.review_text ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if min_rating:
            try:
                conds.append("r.rating >= %s")
                args.append(int(min_rating))
            except ValueError:
                pass

        where = "WHERE " + " AND ".join(conds)
        count_args = args[:]

        cur.execute(f"SELECT COUNT(*) FROM {s}reviews r {where}", count_args)
        total = cur.fetchone()[0]

        args += [limit, offset]
        cur.execute(
            f"""SELECT r.id, r.marketplace, r.product_article, r.product_link, r.seller,
                       r.rating, r.review_text, r.created_at, r.moderated_at,
                       u.name, u.avatar_url
                FROM {s}reviews r JOIN {s}users u ON u.id = r.user_id
                {where} ORDER BY r.moderated_at DESC NULLS LAST, r.created_at DESC
                LIMIT %s OFFSET %s""",
            args,
        )
        rows = cur.fetchall()

        ids = [r[0] for r in rows]
        files_map = {}
        if ids:
            ph = ",".join(["%s"] * len(ids))
            cur.execute(
                f"SELECT review_id, file_path FROM {s}review_files WHERE review_id IN ({ph}) ORDER BY id",
                ids,
            )
            for f in cur.fetchall():
                files_map.setdefault(f[0], []).append(f[1])
            # legacy images
            cur.execute(
                f"SELECT review_id, image_url FROM {s}review_images WHERE review_id IN ({ph}) ORDER BY id",
                ids,
            )
            for r in cur.fetchall():
                if r[1] not in files_map.get(r[0], []):
                    files_map.setdefault(r[0], []).append(r[1])

        reviews = [{
            "id": r[0], "marketplace": r[1], "product_article": r[2],
            "product_link": r[3], "seller": r[4], "rating": r[5],
            "review_text": r[6], "created_at": str(r[7]),
            "moderated_at": str(r[8]) if r[8] else None,
            "author_name": r[9], "author_avatar": r[10],
            "images": files_map.get(r[0], []),
        } for r in rows]

        return ok({"reviews": reviews, "total": total, "limit": limit, "offset": offset})
    finally:
        conn.close()
