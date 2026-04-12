"""
Тикеты поддержки для администратора: список всех обращений, просмотр, ответ.
Требует JWT с is_admin=1 в заголовке X-Authorization.
"""

import json
import os
import re
import psycopg2
import jwt
import requests


def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
    }


def ok(body, status=200):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(body, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def schema():
    s = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{s}." if s else ""


def auth_admin(event):
    h = event.get("headers", {})
    token = (h.get("X-Authorization") or h.get("x-authorization") or h.get("Authorization") or h.get("authorization") or "")
    if not token.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(token[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
        if not payload.get("is_admin"):
            return None
        return payload
    except jwt.PyJWTError:
        return None


def sanitize(text, max_len=5000):
    if not text:
        return ""
    clean = re.sub(r"<[^>]*>", "", str(text))
    return clean[:max_len].strip()


def notify_user_answer(telegram_id, ticket_id, subject, answer_text):
    """Уведомляет пользователя об ответе на его обращение через Telegram."""
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not bot_token or not telegram_id:
        return
    site_url = os.environ.get("SITE_URL", "")
    preview = answer_text[:200] + ("..." if len(answer_text) > 200 else "")
    text = (
        f"💬 <b>Ответ на ваше обращение #{ticket_id}</b>\n\n"
        f"📋 Тема: {subject}\n\n"
        f"<b>Ответ:</b>\n{preview}"
        + (f"\n\n🔗 {site_url}" if site_url else "")
    )
    try:
        requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": telegram_id, "text": text, "parse_mode": "HTML"},
            timeout=5,
        )
    except Exception:
        pass


def notify_admin_user_reply(admin_chat_id, ticket_id, subject, user_name, site_url):
    """Уведомляет администратора о новом сообщении от пользователя в тикете."""
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not bot_token or not admin_chat_id:
        return
    text = (
        f"🔔 <b>Новое сообщение в обращении #{ticket_id}</b>\n\n"
        f"👤 Пользователь: {user_name}\n"
        f"📋 Тема: {subject}"
        + (f"\n\n🔗 {site_url}" if site_url else "")
    )
    try:
        requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": admin_chat_id, "text": text, "parse_mode": "HTML"},
            timeout=5,
        )
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Управление тикетами поддержки для администратора: список, детали, ответ."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    payload = auth_admin(event)
    if not payload:
        return err("Unauthorized", 401)

    admin_id = payload["user_id"]
    method = event.get("httpMethod", "GET")
    action = (event.get("queryStringParameters") or {}).get("action", "")
    s = schema()

    # GET /tickets-admin — список всех тикетов
    if method == "GET" and not action:
        ticket_id = (event.get("queryStringParameters") or {}).get("id")
        status_filter = (event.get("queryStringParameters") or {}).get("status", "")
        conn = db()
        try:
            cur = conn.cursor()
            if ticket_id:
                # Детали тикета + сообщения
                cur.execute(
                    f"""SELECT t.id, t.subject, t.status, t.created_at, t.updated_at,
                               u.name, u.telegram_id, u.avatar_url
                        FROM {s}tickets t
                        JOIN {s}users u ON u.id = t.user_id
                        WHERE t.id = %s""",
                    (ticket_id,)
                )
                row = cur.fetchone()
                if not row:
                    return err("Not found", 404)
                ticket = {
                    "id": row[0], "subject": row[1], "status": row[2],
                    "created_at": row[3], "updated_at": row[4],
                    "user_name": row[5], "user_telegram_id": row[6], "user_avatar": row[7]
                }
                cur.execute(
                    f"""SELECT m.id, m.body, m.is_admin, m.created_at, u.name
                        FROM {s}ticket_messages m
                        JOIN {s}users u ON u.id = m.author_id
                        WHERE m.ticket_id = %s ORDER BY m.created_at ASC""",
                    (ticket_id,)
                )
                ticket["messages"] = [
                    {"id": r[0], "body": r[1], "is_admin": r[2], "created_at": r[3], "author_name": r[4]}
                    for r in cur.fetchall()
                ]
                return ok(ticket)
            else:
                where = f"WHERE t.status = '{status_filter}'" if status_filter in ("open", "answered", "closed") else ""
                cur.execute(
                    f"""SELECT t.id, t.subject, t.status, t.created_at, t.updated_at,
                               u.name,
                               (SELECT COUNT(*) FROM {s}ticket_messages WHERE ticket_id = t.id) as msg_count
                        FROM {s}tickets t
                        JOIN {s}users u ON u.id = t.user_id
                        {where}
                        ORDER BY t.updated_at DESC LIMIT 100"""
                )
                tickets = [
                    {"id": r[0], "subject": r[1], "status": r[2], "created_at": r[3], "updated_at": r[4], "user_name": r[5], "message_count": r[6]}
                    for r in cur.fetchall()
                ]
                # Счётчики
                cur.execute(
                    f"""SELECT status, COUNT(*) FROM {s}tickets GROUP BY status"""
                )
                counts = {"open": 0, "answered": 0, "closed": 0}
                for row in cur.fetchall():
                    counts[row[0]] = row[1]
                return ok({"tickets": tickets, "counts": counts})
        finally:
            conn.close()

    # POST /tickets-admin?action=reply — ответить на тикет
    if method == "POST" and action == "reply":
        body = json.loads(event.get("body") or "{}")
        ticket_id = body.get("ticket_id")
        message = sanitize(body.get("message", ""), 5000)
        if not ticket_id or not message:
            return err("ticket_id и message обязательны")

        conn = db()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT t.id, t.subject, t.status, u.telegram_id
                    FROM {s}tickets t
                    JOIN {s}users u ON u.id = t.user_id
                    WHERE t.id = %s""",
                (ticket_id,)
            )
            ticket = cur.fetchone()
            if not ticket:
                return err("Тикет не найден", 404)
            if ticket[2] == "closed":
                return err("Тикет закрыт")

            cur.execute(
                f"INSERT INTO {s}ticket_messages (ticket_id, author_id, is_admin, body) VALUES (%s, %s, TRUE, %s)",
                (ticket_id, admin_id, message)
            )
            cur.execute(
                f"UPDATE {s}tickets SET status = 'answered', updated_at = NOW() WHERE id = %s",
                (ticket_id,)
            )
            conn.commit()

            subject = ticket[1]
            user_telegram_id = ticket[3]
        finally:
            conn.close()

        notify_user_answer(user_telegram_id, ticket_id, subject, message)
        return ok({"ok": True})

    # PUT /tickets-admin?action=close — закрыть тикет (от имени администратора)
    if method == "PUT" and action == "close":
        body = json.loads(event.get("body") or "{}")
        ticket_id = body.get("ticket_id")
        if not ticket_id:
            return err("ticket_id обязателен")

        conn = db()
        try:
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {s}tickets SET status = 'closed', updated_at = NOW() WHERE id = %s",
                (ticket_id,)
            )
            if cur.rowcount == 0:
                return err("Тикет не найден", 404)
            conn.commit()
        finally:
            conn.close()

        return ok({"ok": True})

    return err("Метод не найден", 404)
