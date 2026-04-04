"""
Авторизация через Telegram Mini App.
Принимает initData от Telegram WebApp, валидирует HMAC-подпись,
авто-регистрирует пользователя и возвращает JWT.
"""

import json
import os
import hashlib
import hmac
import secrets
from datetime import datetime, timezone, timedelta
from urllib.parse import unquote, parse_qs
import psycopg2
import jwt


def get_cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def get_db():
    dsn = os.environ["DATABASE_URL"]
    print(f"[DB] Connecting to DB...")
    return psycopg2.connect(dsn)


def get_schema():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    result = f"{schema}." if schema else ""
    print(f"[DB] Using schema prefix: '{result}'")
    return result


def validate_init_data(init_data: str, bot_token: str) -> dict | None:
    """Валидирует initData от Telegram WebApp. Возвращает user dict или None."""
    parsed = parse_qs(init_data, keep_blank_values=True)
    hash_value = parsed.get("hash", [None])[0]
    if not hash_value:
        print("[AUTH] No hash in initData")
        return None

    data_check_parts = []
    for key, values in sorted(parsed.items()):
        if key != "hash":
            data_check_parts.append(f"{key}={values[0]}")
    data_check_string = "\n".join(data_check_parts)

    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, hash_value):
        print(f"[AUTH] Hash mismatch. computed={computed_hash[:8]}... got={hash_value[:8]}...")
        return None

    user_str = parsed.get("user", [None])[0]
    if not user_str:
        print("[AUTH] No user field in initData")
        return None
    return json.loads(unquote(user_str))


def create_jwt_token(user_id: int, is_admin: int) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def upsert_user(tg_user: dict) -> dict:
    """Создаёт или обновляет пользователя, возвращает dict с id и is_admin."""
    schema = get_schema()
    telegram_id = str(tg_user["id"])
    first_name = tg_user.get("first_name", "")
    last_name = tg_user.get("last_name", "")
    name = f"{first_name} {last_name}".strip() or f"User {telegram_id}"
    photo_url = tg_user.get("photo_url")

    print(f"[DB] upsert_user: telegram_id={telegram_id}, name={name}")

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT id, is_admin FROM {schema}users WHERE telegram_id = %s", (telegram_id,))
        row = cur.fetchone()
        print(f"[DB] Existing user row: {row}")

        if row:
            user_id, is_admin = row
            cur.execute(
                f"""UPDATE {schema}users
                    SET name = %s, avatar_url = COALESCE(%s, avatar_url),
                        last_login_at = NOW(), updated_at = NOW()
                    WHERE id = %s""",
                (name, photo_url, user_id)
            )
            print(f"[DB] Updated existing user id={user_id}, is_admin={is_admin}")
        else:
            cur.execute(
                f"""INSERT INTO {schema}users
                    (telegram_id, name, avatar_url, email_verified, password_hash, is_admin, created_at, updated_at, last_login_at)
                    VALUES (%s, %s, %s, TRUE, '', 0, NOW(), NOW(), NOW())
                    RETURNING id, is_admin""",
                (telegram_id, name, photo_url)
            )
            user_id, is_admin = cur.fetchone()
            print(f"[DB] Inserted new user id={user_id}, is_admin={is_admin}")

        conn.commit()
        print(f"[DB] Commit OK")
        return {"id": user_id, "is_admin": is_admin, "name": name, "avatar_url": photo_url, "telegram_id": telegram_id}
    except Exception as e:
        print(f"[DB] ERROR in upsert_user: {type(e).__name__}: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def verify_jwt_token(token: str) -> dict | None:
    """Проверяет JWT токен, возвращает payload или None."""
    try:
        secret = os.environ["JWT_SECRET"]
        return jwt.decode(token, secret, algorithms=["HS256"])
    except Exception:
        return None


def get_user_by_id(user_id: int) -> dict | None:
    """Возвращает пользователя из БД по id."""
    schema = get_schema()
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, telegram_id, name, avatar_url, is_admin FROM {schema}users WHERE id = %s",
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "telegram_id": row[1], "name": row[2], "avatar_url": row[3], "is_admin": row[4]}
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Авторизация через Telegram Mini App initData. GET / — проверка токена."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    method = event.get("httpMethod", "POST")
    print(f"[HANDLER] Request received, httpMethod={method}")

    # GET / — проверка текущего токена
    if method == "GET":
        auth_header = event.get("headers", {}).get("X-Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        if not token:
            return json_response(401, {"error": "No token"})
        payload = verify_jwt_token(token)
        if not payload:
            return json_response(401, {"error": "Token expired or invalid"})
        user = get_user_by_id(payload["user_id"])
        if not user:
            return json_response(401, {"error": "User not found"})
        print(f"[HANDLER] Token valid for user_id={user['id']}")
        return json_response(200, {"user": user})

    body = json.loads(event.get("body") or "{}")
    init_data = body.get("initData", "")

    if not init_data:
        print("[HANDLER] No initData in body")
        return json_response(400, {"error": "initData required"})

    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    print(f"[HANDLER] bot_token present: {bool(bot_token)}, length={len(bot_token)}")

    tg_user = validate_init_data(init_data, bot_token)

    if not tg_user:
        return json_response(401, {"error": "Invalid initData"})

    print(f"[HANDLER] tg_user validated: {tg_user}")

    user = upsert_user(tg_user)
    token = create_jwt_token(user["id"], user["is_admin"])

    return json_response(200, {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
            "telegram_id": user["telegram_id"],
            "is_admin": user["is_admin"],
        }
    })