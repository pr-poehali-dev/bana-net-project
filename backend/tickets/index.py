"""
Тикеты поддержки: создание обращений, просмотр своих тикетов, добавление сообщений, закрытие.
Требует JWT в заголовке X-Authorization.
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


def auth(event):
    h = event.get("headers", {})
    token = (h.get("X-Authorization") or h.get("x-authorization") or h.get("Authorization") or h.get("authorization") or "")
    if not token.startswith("Bearer "):
        return None
    try:
        return jwt.decode(token[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def sanitize(text, max_len=5000):
    if not text:
        return ""
    clean = re.sub(r"<[^>]*>", "", str(text))
    return clean[:max_len].strip()


def notify_admin_new_ticket(ticket_id, subject, user_name):
    """Уведомляет администратора о новом обращении через Telegram."""
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    admin_chat_id = os.environ.get("ADMIN_TELEGRAM_ID")
    if not bot_token or not admin_chat_id:
        return
    site_url = os.environ.get("SITE_URL", "")
    text = (
        f"📬 <b>Новое обращение #{ticket_id}</b>\n\n"
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


def notify_user_answer(telegram_id, ticket_id, subject, answer_text):
    """Уведомляет пользователя об ответе на его обращение."""
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


def handler(event: dict, context) -> dict:
    """Тикеты поддержки для пользователя: создание, список, сообщения, закрытие."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    payload = auth(event)
    if not payload:
        return err("Unauthorized", 401)

    user_id = payload["user_id"]
    method = event.get("httpMethod", "GET")
    action = (event.get("queryStringParameters") or {}).get("action", "")
    s = schema()

    # GET /tickets — список тикетов пользователя
    if method == "GET" and not action:
        ticket_id = (event.get("queryStringParameters") or {}).get("id")
        conn = db()
        try:
            cur = conn.cursor()
            if ticket_id:
                # Детали тикета + сообщения
                cur.execute(
                    f"""SELECT t.id, t.subject, t.status, t.created_at, t.updated_at
                        FROM {s}tickets t WHERE t.id = %s AND t.user_id = %s""",
                    (ticket_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    return err("Not found", 404)
                ticket = {"id": row[0], "subject": row[1], "status": row[2], "created_at": row[3], "updated_at": row[4]}
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
                cur.execute(
                    f"""SELECT t.id, t.subject, t.status, t.created_at, t.updated_at,
                               (SELECT COUNT(*) FROM {s}ticket_messages WHERE ticket_id = t.id) as msg_count
                        FROM {s}tickets t WHERE t.user_id = %s ORDER BY t.updated_at DESC""",
                    (user_id,)
                )
                tickets = [
                    {"id": r[0], "subject": r[1], "status": r[2], "created_at": r[3], "updated_at": r[4], "message_count": r[5]}
                    for r in cur.fetchall()
                ]
                return ok({"tickets": tickets})
        finally:
            conn.close()

    # POST /tickets — создать новый тикет
    if method == "POST" and not action:
        body = json.loads(event.get("body") or "{}")
        subject = sanitize(body.get("subject", ""), 200)
        message = sanitize(body.get("message", ""), 5000)
        if not subject or not message:
            return err("subject и message обязательны")

        conn = db()
        try:
            cur = conn.cursor()
            # Получаем имя пользователя
            cur.execute(f"SELECT name, telegram_id FROM {s}users WHERE id = %s", (user_id,))
            u = cur.fetchone()
            user_name = u[0] if u else "Пользователь"
            user_tg = u[1] if u else None

            cur.execute(
                f"INSERT INTO {s}tickets (user_id, subject) VALUES (%s, %s) RETURNING id",
                (user_id, subject)
            )
            ticket_id = cur.fetchone()[0]
            cur.execute(
                f"INSERT INTO {s}ticket_messages (ticket_id, author_id, is_admin, body) VALUES (%s, %s, FALSE, %s)",
                (ticket_id, user_id, message)
            )
            conn.commit()
        finally:
            conn.close()

        notify_admin_new_ticket(ticket_id, subject, user_name)
        return ok({"id": ticket_id, "subject": subject, "status": "open"}, 201)

    # POST /tickets?action=reply — добавить сообщение в тикет
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
                f"SELECT id, subject, status FROM {s}tickets WHERE id = %s AND user_id = %s",
                (ticket_id, user_id)
            )
            ticket = cur.fetchone()
            if not ticket:
                return err("Тикет не найден", 404)
            if ticket[2] == "closed":
                return err("Тикет закрыт")

            cur.execute(
                f"INSERT INTO {s}ticket_messages (ticket_id, author_id, is_admin, body) VALUES (%s, %s, FALSE, %s)",
                (ticket_id, user_id, message)
            )
            cur.execute(
                f"UPDATE {s}tickets SET status = 'open', updated_at = NOW() WHERE id = %s",
                (ticket_id,)
            )
            conn.commit()
        finally:
            conn.close()

        return ok({"ok": True})

    # PUT /tickets?action=close — закрыть тикет
    if method == "PUT" and action == "close":
        body = json.loads(event.get("body") or "{}")
        ticket_id = body.get("ticket_id")
        if not ticket_id:
            return err("ticket_id обязателен")

        conn = db()
        try:
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {s}tickets SET status = 'closed', updated_at = NOW() WHERE id = %s AND user_id = %s",
                (ticket_id, user_id)
            )
            if cur.rowcount == 0:
                return err("Тикет не найден", 404)
            conn.commit()
        finally:
            conn.close()

        return ok({"ok": True})

    return err("Метод не найден", 404)
