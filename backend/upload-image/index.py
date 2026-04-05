"""
Загрузка одного изображения в S3. Принимает base64, возвращает CDN URL.
Требует JWT авторизацию.
"""

import json
import os
import base64
import uuid
import jwt
import boto3


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
    }


def json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def verify_jwt(event: dict) -> dict | None:
    headers = event.get("headers", {})
    auth = (
        headers.get("X-Authorization")
        or headers.get("x-authorization")
        or headers.get("Authorization")
        or headers.get("authorization")
        or ""
    )
    if not auth.startswith("Bearer "):
        return None
    try:
        return jwt.decode(auth[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def handler(event: dict, context) -> dict:
    """Загружает одно изображение в S3, возвращает CDN URL."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    payload = verify_jwt(event)
    if not payload:
        return json_response(401, {"error": "Требуется авторизация"})

    body = json.loads(event.get("body") or "{}")
    image_b64 = body.get("image", "")

    if not image_b64:
        return json_response(400, {"error": "Поле image обязательно"})

    # Определяем расширение из data URI
    ext = "jpg"
    if "," in image_b64:
        header, image_b64 = image_b64.split(",", 1)
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"

    try:
        data = base64.b64decode(image_b64)
    except Exception:
        return json_response(400, {"error": "Невалидный base64"})

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key_id = os.environ["AWS_ACCESS_KEY_ID"]
    filename = f"reviews/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket="files", Key=filename, Body=data, ContentType=f"image/{ext}")
    cdn_url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{filename}"

    return json_response(200, {"url": cdn_url})
