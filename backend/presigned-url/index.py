"""
Генерирует presigned URL для прямой загрузки файла в S3 с фронта.
Фронт загружает файл напрямую в S3 (PUT), минуя лимиты платформы.
"""

import json
import os
import uuid
import jwt
import boto3
from botocore.config import Config


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
    """Возвращает presigned URL для PUT-загрузки файла напрямую в S3."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    payload = verify_jwt(event)
    if not payload:
        return json_response(401, {"error": "Требуется авторизация"})

    body = json.loads(event.get("body") or "{}")
    ext = body.get("ext", "jpg").lower().strip(".")
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"
    content_type = f"image/{'jpeg' if ext in ('jpg','jpeg') else ext}"

    key_id = os.environ["AWS_ACCESS_KEY_ID"]
    filename = f"reviews/{uuid.uuid4()}.{ext}"
    cdn_url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{filename}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=key_id,
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )

    presigned = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "files", "Key": filename, "ContentType": content_type},
        ExpiresIn=300,
    )

    return json_response(200, {
        "upload_url": presigned,
        "cdn_url": cdn_url,
        "content_type": content_type,
    })
