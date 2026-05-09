"""
Google OAuth2 для web/PWA версии.
Принимает code от Google OAuth, обменивает на id_token,
парсит профиль пользователя, авто-регистрирует и возвращает JWT.
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


def exchange_code_for_id_token(code: str, redirect_uri: str) -> dict:
    """Обменивает code на токены через Google Token endpoint."""
    client_id = os.environ["GOOGLE_CLIENT_ID"]
    client_secret = os.environ["GOOGLE_CLIENT_SECRET"]

    body = urllib.parse.urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode()

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=10)
    data = json.loads(resp.read())

    if "error" in data:
        raise ValueError(f"Google token error: {data.get('error_description', data['error'])}")

    return data


def decode_google_id_token(id_token: str) -> dict:
    """Декодирует Google id_token без верификации подписи (доверяем Google endpoint)."""
    import base64
    parts = id_token.split(".")
    if len(parts) < 2:
        raise ValueError("Invalid id_token format")
    payload_b64 = parts[1]
    padding = 4 - len(payload_b64) % 4
    if padding != 4:
        payload_b64 += "=" * padding
    return json.loads(base64.urlsafe_b64decode(payload_b64))


def create_jwt_token(user_id: int, is_admin: int) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def upsert_google_user(google_id: str, name: str, avatar_url: str | None, email: str | None) -> dict:
    schema = get_schema()
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, is_admin FROM {schema}users WHERE google_id = %s",
            (google_id,)
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
                    (google_id, name, avatar_url, email, auth_provider, email_verified, password_hash, is_admin, created_at, updated_at, last_login_at)
                    VALUES (%s, %s, %s, %s, 'google', TRUE, '', 0, NOW(), NOW(), NOW())
                    RETURNING id, is_admin""",
                (google_id, name, avatar_url, email)
            )
            user_id, is_admin = cur.fetchone()

        conn.commit()
        return {"id": user_id, "is_admin": is_admin, "name": name, "avatar_url": avatar_url, "google_id": google_id}
    except Exception as e:
        conn.rollback()
        print(f"[DB] ERROR: {type(e).__name__}: {e}")
        raise
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Google OAuth2 для web/PWA. Принимает code и redirect_uri, возвращает JWT."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    body = json.loads(event.get("body") or "{}")
    code = body.get("code", "")
    redirect_uri = body.get("redirect_uri", "")

    if not code or not redirect_uri:
        return json_response(400, {"error": "code and redirect_uri required"})

    token_data = exchange_code_for_id_token(code, redirect_uri)
    id_token = token_data.get("id_token", "")
    if not id_token:
        return json_response(500, {"error": "No id_token from Google"})

    profile = decode_google_id_token(id_token)
    google_id = profile.get("sub", "")
    if not google_id:
        return json_response(500, {"error": "No sub in id_token"})

    name = profile.get("name") or profile.get("email", f"Google User")
    email = profile.get("email")
    avatar_url = profile.get("picture")

    user = upsert_google_user(google_id, name, avatar_url, email)
    jwt_token = create_jwt_token(user["id"], user["is_admin"])

    return json_response(200, {
        "token": jwt_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
            "telegram_id": None,
            "vk_id": None,
            "google_id": user["google_id"],
            "auth_provider": "google",
            "is_admin": user["is_admin"],
        }
    })
