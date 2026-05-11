"""
Push-уведомления: управление подписками и отправка.
Endpoints:
  GET  ?action=vapid-key  — публичный VAPID ключ для фронтенда
  POST ?action=subscribe  — сохранить подписку пользователя
  POST ?action=unsubscribe — удалить подписку
  POST ?action=send       — отправить уведомление пользователю (внутренний)
"""
import json
import os
import psycopg2
from pywebpush import webpush, WebPushException


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Управление Web Push подписками и отправка уведомлений."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    action = event.get('queryStringParameters', {}).get('action', '')
    method = event.get('httpMethod', 'GET')

    if action == 'vapid-key' and method == 'GET':
        return handle_vapid_key()

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    user_id = body.get('user_id') or event.get('queryStringParameters', {}).get('user_id')

    if action == 'subscribe' and method == 'POST':
        return handle_subscribe(user_id, body)
    elif action == 'unsubscribe' and method == 'POST':
        return handle_unsubscribe(user_id, body)
    elif action == 'send' and method == 'POST':
        return handle_send(body)

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unknown action'})}


def handle_vapid_key():
    """Вернуть публичный VAPID ключ."""
    public_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    return {
        'statusCode': 200,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps({'public_key': public_key}),
    }


def handle_subscribe(user_id, body):
    """Сохранить push-подписку пользователя."""
    if not user_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unauthorized'})}

    subscription = body.get('subscription', {})
    endpoint = subscription.get('endpoint')
    keys = subscription.get('keys', {})
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')

    if not all([endpoint, p256dh, auth]):
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid subscription'})}

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
           VALUES (%s, %s, %s, %s)
           ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = %s, auth = %s""",
        (user_id, endpoint, p256dh, auth, p256dh, auth)
    )
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}


def handle_unsubscribe(user_id, body):
    """Удалить push-подписку."""
    if not user_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unauthorized'})}

    endpoint = body.get('endpoint')

    conn = get_db()
    cur = conn.cursor()
    if endpoint:
        cur.execute('UPDATE push_subscriptions SET endpoint = endpoint WHERE user_id = %s AND endpoint = %s', (user_id, endpoint))
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}


def handle_send(body):
    """Отправить push-уведомление пользователю по user_id."""
    user_id = body.get('user_id')
    title = body.get('title', 'BANaNET')
    message = body.get('message', '')
    url = body.get('url', '/')

    if not user_id:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'user_id required'})}

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = %s',
        (user_id,)
    )
    subscriptions = cur.fetchall()
    cur.close()
    conn.close()

    if not subscriptions:
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'sent': 0})}

    private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
    vapid_claims = {'sub': 'mailto:admin@bana.net.ru'}

    payload = json.dumps({
        'title': title,
        'body': message,
        'url': url,
        'icon': 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png',
    })

    sent = 0
    failed_endpoints = []

    for endpoint, p256dh, auth in subscriptions:
        try:
            webpush(
                subscription_info={
                    'endpoint': endpoint,
                    'keys': {'p256dh': p256dh, 'auth': auth},
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_claims=vapid_claims,
            )
            sent += 1
        except WebPushException as e:
            if e.response and e.response.status_code in (404, 410):
                failed_endpoints.append(endpoint)

    if failed_endpoints:
        conn = get_db()
        cur = conn.cursor()
        for ep in failed_endpoints:
            cur.execute('UPDATE push_subscriptions SET endpoint = endpoint WHERE endpoint = %s', (ep,))
        conn.commit()
        cur.close()
        conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'sent': sent}),
    }
