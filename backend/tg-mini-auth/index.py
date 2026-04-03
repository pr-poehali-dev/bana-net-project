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
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_schema():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{schema}." if schema else ""


def validate_init_data(init_data: str, bot_token: str) -> dict | None:
    """Валидирует initData от Telegram WebApp. Возвращает user dict или None."""
    parsed = parse_qs(init_data, keep_blank_values=True)
    hash_value = parsed.get("hash", [None])[0]
    if not hash_value:
        return None

    data_check_parts = []
    for key, values in sorted(parsed.items()):
        if key != "hash":
            data_check_parts.append(f"{key}={values[0]}")
    data_check_string = "\n".join(data_check_parts)

    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, hash_value):
        return None

    user_str = parsed.get("user", [None])[0]
    if not user_str:
        return None
    return json.loads(unquote(user_str))


def create_jwt_token(user_id: int, role: str) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def upsert_user(tg_user: dict) -> dict:
    """Создаёт или обновляет пользователя, возвращает dict с id и role."""
    schema = get_schema()
    telegram_id = str(tg_user["id"])
    first_name = tg_user.get("first_name", "")
    last_name = tg_user.get("last_name", "")
    name = f"{first_name} {last_name}".strip() or f"User {telegram_id}"
    photo_url = tg_user.get("photo_url")

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, role FROM {schema}users WHERE telegram_id = %s",
            (telegram_id,)
        )
        row = cur.fetchone()
        if row:
            user_id, role = row
            cur.execute(
                f"""UPDATE {schema}users
                    SET name = %s, avatar_url = COALESCE(%s, avatar_url),
                        last_login_at = NOW(), updated_at = NOW()
                    WHERE id = %s""",
                (name, photo_url, user_id)
            )
        else:
            cur.execute(
                f"""INSERT INTO {schema}users
                    (telegram_id, name, avatar_url, email_verified, password_hash, role, created_at, updated_at, last_login_at)
                    VALUES (%s, %s, %s, TRUE, '', 'user', NOW(), NOW(), NOW())
                    RETURNING id, role""",
                (telegram_id, name, photo_url)
            )
            user_id, role = cur.fetchone()
        conn.commit()
        return {"id": user_id, "role": role, "name": name, "avatar_url": photo_url, "telegram_id": telegram_id}
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Авторизация через Telegram Mini App initData."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    body = json.loads(event.get("body") or "{}")
    init_data = body.get("initData", "")

    if not init_data:
        return json_response(400, {"error": "initData required"})

    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    tg_user = validate_init_data(init_data, bot_token)

    if not tg_user:
        return json_response(401, {"error": "Invalid initData"})

    user = upsert_user(tg_user)
    token = create_jwt_token(user["id"], user["role"])

    return json_response(200, {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
            "telegram_id": user["telegram_id"],
            "role": user["role"],
        }
    })
