"""
Авторизация через VK Mini App.
Принимает launch_params (строка запуска VK Mini Apps), валидирует подпись,
авто-регистрирует пользователя и возвращает JWT.
"""

import json
import os
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from urllib.parse import parse_qs, urlencode
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


def validate_vk_launch_params(query_string: str, client_secret: str) -> dict | None:
    """Валидирует подпись VK Mini App launch params. Возвращает dict параметров или None."""
    params = parse_qs(query_string.lstrip("?"), keep_blank_values=True)

    vk_sign = params.get("sign", [None])[0]
    if not vk_sign:
        print("[VK_AUTH] No sign param")
        return None

    sign_params = {k: v[0] for k, v in params.items() if k.startswith("vk_")}
    sorted_params = urlencode(sorted(sign_params.items()))

    computed = hmac.new(
        client_secret.encode(),
        sorted_params.encode(),
        hashlib.sha256
    ).digest()

    import base64
    computed_sign = base64.urlsafe_b64encode(computed).rstrip(b"=").decode()

    if not hmac.compare_digest(computed_sign, vk_sign):
        print(f"[VK_AUTH] Sign mismatch. computed={computed_sign[:8]}... got={vk_sign[:8]}...")
        return None

    return {k: v[0] for k, v in params.items()}


def create_jwt_token(user_id: int, is_admin: int) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def upsert_vk_user(vk_id: str, name: str, avatar_url: str | None) -> dict:
    """Создаёт или обновляет VK пользователя, возвращает dict."""
    schema = get_schema()
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, is_admin FROM {schema}users WHERE vk_id = %s",
            (vk_id,)
        )
        row = cur.fetchone()

        if row:
            user_id, is_admin = row
            cur.execute(
                f"""UPDATE {schema}users
                    SET name = %s, avatar_url = COALESCE(%s, avatar_url),
                        last_login_at = NOW(), updated_at = NOW()
                    WHERE id = %s""",
                (name, avatar_url, user_id)
            )
            print(f"[DB] Updated VK user id={user_id}")
        else:
            cur.execute(
                f"""INSERT INTO {schema}users
                    (vk_id, name, avatar_url, auth_provider, email_verified, password_hash, is_admin, created_at, updated_at, last_login_at)
                    VALUES (%s, %s, %s, 'vk', TRUE, '', 0, NOW(), NOW(), NOW())
                    RETURNING id, is_admin""",
                (vk_id, name, avatar_url)
            )
            user_id, is_admin = cur.fetchone()
            print(f"[DB] Inserted new VK user id={user_id}")

        conn.commit()
        return {"id": user_id, "is_admin": is_admin, "name": name, "avatar_url": avatar_url, "vk_id": vk_id}
    except Exception as e:
        conn.rollback()
        print(f"[DB] ERROR: {type(e).__name__}: {e}")
        raise
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Авторизация через VK Mini App. Валидирует launch_params и возвращает JWT."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    body = json.loads(event.get("body") or "{}")
    launch_params = body.get("launch_params", "")

    if not launch_params:
        return json_response(400, {"error": "launch_params required"})

    client_secret = os.environ.get("VK_APP_SECRET", "")
    if not client_secret:
        return json_response(500, {"error": "VK_APP_SECRET not configured"})

    vk_params = validate_vk_launch_params(launch_params, client_secret)
    if not vk_params:
        return json_response(401, {"error": "Invalid VK signature"})

    vk_user_id = vk_params.get("vk_user_id", "")
    if not vk_user_id:
        return json_response(401, {"error": "No vk_user_id in params"})

    name = f"VK User {vk_user_id}"
    avatar_url = None

    user = upsert_vk_user(str(vk_user_id), name, avatar_url)
    token = create_jwt_token(user["id"], user["is_admin"])

    return json_response(200, {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
            "telegram_id": None,
            "vk_id": user["vk_id"],
            "google_id": None,
            "auth_provider": "vk",
            "is_admin": user["is_admin"],
        }
    })
