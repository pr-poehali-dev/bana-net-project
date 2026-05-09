"""
Яндекс OAuth2 для web/PWA версии.
Принимает code от Яндекс OAuth, обменивает на access_token,
получает профиль через Яндекс ID API, авто-регистрирует и возвращает JWT.
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
    """Обменивает code на access_token через Яндекс OAuth."""
    client_id = os.environ["YANDEX_CLIENT_ID"]
    client_secret = os.environ["YANDEX_CLIENT_SECRET"]

    body = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }).encode()

    req = urllib.request.Request(
        "https://oauth.yandex.ru/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=10)
    data = json.loads(resp.read())

    if "error" in data:
        raise ValueError(f"Yandex token error: {data.get('error_description', data['error'])}")

    return data


def get_yandex_user_info(access_token: str) -> dict:
    """Получает профиль пользователя через Яндекс ID API."""
    req = urllib.request.Request(
        "https://login.yandex.ru/info?format=json",
        headers={"Authorization": f"OAuth {access_token}"},
    )
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())


def create_jwt_token(user_id: int, is_admin: int) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def upsert_yandex_user(yandex_id: str, name: str, avatar_url: str | None, email: str | None) -> dict:
    schema = get_schema()
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, is_admin FROM {schema}users WHERE yandex_id = %s",
            (yandex_id,)
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
            print(f"[DB] Updated Yandex user id={user_id}")
        else:
            cur.execute(
                f"""INSERT INTO {schema}users
                    (yandex_id, name, avatar_url, email, auth_provider, email_verified, password_hash, is_admin, created_at, updated_at, last_login_at)
                    VALUES (%s, %s, %s, %s, 'yandex', TRUE, '', 0, NOW(), NOW(), NOW())
                    RETURNING id, is_admin""",
                (yandex_id, name, avatar_url, email)
            )
            user_id, is_admin = cur.fetchone()
            print(f"[DB] Inserted new Yandex user id={user_id}")

        conn.commit()
        return {"id": user_id, "is_admin": is_admin, "name": name, "avatar_url": avatar_url, "yandex_id": yandex_id}
    except Exception as e:
        conn.rollback()
        print(f"[DB] ERROR: {type(e).__name__}: {e}")
        raise
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Яндекс OAuth2 для web/PWA. Принимает code и redirect_uri, возвращает JWT."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}

    body = json.loads(event.get("body") or "{}")
    code = body.get("code", "")
    redirect_uri = body.get("redirect_uri", "")

    if not code or not redirect_uri:
        return json_response(400, {"error": "code and redirect_uri required"})

    token_data = exchange_code_for_token(code, redirect_uri)
    access_token = token_data["access_token"]

    profile = get_yandex_user_info(access_token)
    yandex_id = str(profile.get("id", ""))
    if not yandex_id:
        return json_response(500, {"error": "No id in Yandex profile"})

    first = profile.get("first_name", "")
    last = profile.get("last_name", "")
    name = f"{first} {last}".strip() or profile.get("login", f"Yandex {yandex_id}")
    email = profile.get("default_email")

    avatar_url = None
    if profile.get("default_avatar_id"):
        avatar_url = f"https://avatars.yandex.net/get-yapic/{profile['default_avatar_id']}/islands-200"

    user = upsert_yandex_user(yandex_id, name, avatar_url, email)
    jwt_token = create_jwt_token(user["id"], user["is_admin"])

    return json_response(200, {
        "token": jwt_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
            "telegram_id": None,
            "vk_id": None,
            "google_id": None,
            "yandex_id": user["yandex_id"],
            "auth_provider": "yandex",
            "is_admin": user["is_admin"],
        }
    })
