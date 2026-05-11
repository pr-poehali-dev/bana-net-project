"""
Push-уведомления: управление подписками и отправка.
Endpoints:
  GET  ?action=vapid-key      — публичный VAPID ключ для фронтенда
  GET  ?action=generate-keys  — сгенерировать VAPID ключи (один раз)
  POST ?action=subscribe      — сохранить подписку пользователя
  POST ?action=unsubscribe    — удалить подписку
  POST ?action=send           — отправить уведомление (внутренний)
"""
import json
import os
import psycopg2
import base64
import subprocess
import time
import requests


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}


def ok(body):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body)}


def err(msg, status=400):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps({'error': msg})}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Web Push: подписки и отправка уведомлений пользователям."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')
    method = event.get('httpMethod', 'GET')

    if action == 'vapid-key':
        return ok({'public_key': os.environ.get('VAPID_PUBLIC_KEY', '')})

    if action == 'generate-keys':
        return handle_generate_keys()

    body = json.loads(event['body']) if event.get('body') else {}
    user_id = body.get('user_id') or qs.get('user_id')

    if action == 'subscribe':
        return handle_subscribe(user_id, body)
    if action == 'unsubscribe':
        return handle_unsubscribe(user_id, body)
    if action == 'send':
        return handle_send(body)

    return err('Unknown action')


def handle_generate_keys():
    """Генерирует VAPID ключи через openssl."""
    priv_pem = subprocess.check_output(
        ['openssl', 'ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-outform', 'PEM'],
        stderr=subprocess.DEVNULL
    ).decode()

    pub_der = subprocess.check_output(
        ['openssl', 'ec', '-pubout', '-outform', 'DER'],
        input=priv_pem.encode(), stderr=subprocess.DEVNULL
    )
    pub_b64 = base64.urlsafe_b64encode(pub_der[-65:]).decode().rstrip('=')

    return ok({
        'VAPID_PRIVATE_KEY': priv_pem,
        'VAPID_PUBLIC_KEY': pub_b64,
        'note': 'Сохрани оба значения в секреты проекта.',
    })


def handle_subscribe(user_id, body):
    if not user_id:
        return err('Unauthorized', 401)
    sub = body.get('subscription', {})
    endpoint = sub.get('endpoint')
    keys = sub.get('keys', {})
    p256dh, auth = keys.get('p256dh'), keys.get('auth')
    if not all([endpoint, p256dh, auth]):
        return err('Invalid subscription')
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (%s,%s,%s,%s) "
        "ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh=%s, auth=%s",
        (user_id, endpoint, p256dh, auth, p256dh, auth)
    )
    conn.commit(); cur.close(); conn.close()
    return ok({'ok': True})


def handle_unsubscribe(user_id, body):
    if not user_id:
        return err('Unauthorized', 401)
    endpoint = body.get('endpoint')
    conn = get_db()
    cur = conn.cursor()
    if endpoint:
        cur.execute(
            'UPDATE push_subscriptions SET endpoint=endpoint WHERE user_id=%s AND endpoint=%s',
            (user_id, endpoint)
        )
    conn.commit(); cur.close(); conn.close()
    return ok({'ok': True})


def build_vapid_token(endpoint: str, private_pem: str) -> str:
    from urllib.parse import urlparse
    audience = '{0.scheme}://{0.netloc}'.format(urlparse(endpoint))
    now = int(time.time())
    header = base64.urlsafe_b64encode(b'{"typ":"JWT","alg":"ES256"}').decode().rstrip('=')
    payload_data = json.dumps({"aud": audience, "exp": now + 43200, "sub": "mailto:admin@bana.net.ru"})
    payload = base64.urlsafe_b64encode(payload_data.encode()).decode().rstrip('=')
    signing_input = f"{header}.{payload}".encode()

    sig_der = subprocess.check_output(
        ['openssl', 'dgst', '-sha256', '-sign', '/dev/stdin'],
        input=private_pem.encode() + signing_input,
        stderr=subprocess.DEVNULL
    )
    # DER → R||S
    i = 2
    assert sig_der[i] == 0x02; i += 1
    r_len = sig_der[i]; i += 1; r = sig_der[i:i+r_len]; i += r_len
    assert sig_der[i] == 0x02; i += 1
    s_len = sig_der[i]; i += 1; s = sig_der[i:i+s_len]
    raw = r[-32:].rjust(32, b'\x00') + s[-32:].rjust(32, b'\x00')
    sig = base64.urlsafe_b64encode(raw).decode().rstrip('=')
    return f"{header}.{payload}.{sig}"


def handle_send(body):
    user_id = body.get('user_id')
    if not user_id:
        return err('user_id required')

    private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
    public_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    if not private_key or not public_key:
        return ok({'sent': 0, 'reason': 'VAPID keys not set'})

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=%s', (user_id,))
    subs = cur.fetchall(); cur.close(); conn.close()

    if not subs:
        return ok({'sent': 0})

    payload = json.dumps({
        'title': body.get('title', 'BANaNET'),
        'body': body.get('message', ''),
        'url': body.get('url', '/'),
        'icon': 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png',
    })

    sent = 0
    for endpoint, p256dh, auth_key in subs:
        try:
            token = build_vapid_token(endpoint, private_key)
            resp = requests.post(
                endpoint,
                data=payload.encode(),
                headers={
                    'Authorization': f'vapid t={token},k={public_key}',
                    'Content-Type': 'application/json',
                    'TTL': '86400',
                },
                timeout=10
            )
            if resp.status_code in (200, 201, 202):
                sent += 1
        except Exception:
            pass

    return ok({'sent': sent})
