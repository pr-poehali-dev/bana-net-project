import json
import os
import uuid
import jwt
import boto3
from botocore.config import Config


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
    }


def ok(body):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(body)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def verify_jwt(event):
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
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    """Генерирует presigned URL для прямой PUT-загрузки файла в S3 с клиента."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    payload = verify_jwt(event)
    if not payload:
        return err("Требуется авторизация", 401)

    body = json.loads(event.get("body") or "{}")
    ext = body.get("ext", "jpg").lower().strip(".")
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"
    content_type = f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"

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

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "files", "Key": filename, "ContentType": content_type},
        ExpiresIn=300,
    )

    print(f"[presigned-url] user={payload.get('user_id')} key={filename} ct={content_type}")
    return ok({"upload_url": upload_url, "cdn_url": cdn_url, "content_type": content_type})