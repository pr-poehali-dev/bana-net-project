"""
VK OAuth2 для web/PWA версии.
Принимает code от VK OAuth, обменивает на access_token,
получает профиль пользователя, авто-регистрирует и возвращает JWT.
"""

import json
import os
from datetime import datetime, timezone, timedelta
import urllib.request
import urllib.parse
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


def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """Обменивает code на access_token через VK API."""
    client_id = os.environ["VK_APP_ID"]
    client_secret = os.environ["VK_APP_SECRET"]

    params = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    })
    url = f"https://oauth.vk.com/access_token?{params}"
    req = urllib.request.urlopen(url, timeout=10)
    data = json.loads(req.read())

    if "error" in data:
        raise ValueError(f"VK OAuth error: {data.get('error_description', data['error'])}")

    return data


def get_vk_user_info(access_token: str, user_id: int) -> dict:
    """Получает профиль пользователя VK."""
    params = urllib.parse.urlencode({
        "user_ids": user_id,
        "fields": "photo_200,first_name,last_name",
        "access_token": access_token,
        "v": "5.131",
    })
    url = f"https://api.vk.com/method/users.get?{params}"
    req = urllib.request.urlopen(url, timeout=10)
    data = json.loads(req.read())

    if "error" in data:
        raise ValueError(f"VK API error: {data['error'].get('error_msg')}")

    return data["response"][0]


def create_jwt_token(user_id: int, is_admin: int) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def upsert_vk_user(vk_id: str, name: str, avatar_url: str | None, email: str | None) -> dict:
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
                        email = COALESCE(%s, email),
                        last_login_at = NOW(), updated_at = NOW()
                    WHERE id = %s""",
                (name, avatar_url, email, user_id)
            )
        else:
            cur.execute(
                f"""INSERT INTO {schema}users
                    (vk_id, name, avatar_url, email, auth_provider, email_verified, password_hash, is_admin, created_at, updated_at, last_login_at)
                    VALUES (%s, %s, %s, %s, 'vk', TRUE, '', 0, NOW(), NOW(), NOW())
                    RETURNING id, is_admin""",
                (vk_id, name, avatar_url, email)
            )
            user_id, is_admin = cur.fetchone()

        conn.commit()
        return {"id": user_id, "is_admin": is_admin, "name": name, "avatar_url": avatar_url, "vk_id": vk_id}
    except Exception as e:
        conn.rollback()
        print(f"[DB] ERROR: {type(e).__name__}: {e}")
        raise
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """VK OAuth2 для web/PWA. Принимает code и redirect_uri, возвращает JWT."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    body = json.loads(event.get("body") or "{}")
    code = body.get("code", "")
    redirect_uri = body.get("redirect_uri", "")

    if not code or not redirect_uri:
        return json_response(400, {"error": "code and redirect_uri required"})

    token_data = exchange_code_for_token(code, redirect_uri)
    access_token = token_data["access_token"]
    vk_user_id = token_data["user_id"]
    email = token_data.get("email")

    vk_user = get_vk_user_info(access_token, vk_user_id)
    name = f"{vk_user.get('first_name', '')} {vk_user.get('last_name', '')}".strip()
    avatar_url = vk_user.get("photo_200")

    user = upsert_vk_user(str(vk_user_id), name or f"VK {vk_user_id}", avatar_url, email)
    jwt_token = create_jwt_token(user["id"], user["is_admin"])

    return json_response(200, {
        "token": jwt_token,
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
