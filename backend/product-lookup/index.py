"""
Определяет маркетплейс, артикул и ссылку на товар по артикулу или ссылке.
Поддерживает Wildberries и OZON.
"""

import json
import re
import requests


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


# ─── Wildberries ─────────────────────────────────────────────────────────────

def wb_url_from_article(article: str) -> str:
    return f"https://www.wildberries.ru/catalog/{article}/detail.aspx"


def wb_article_from_url(url: str) -> str | None:
    m = re.search(r"/catalog/(\d+)", url)
    return m.group(1) if m else None


def wb_lookup_by_article(article: str) -> dict:
    """Проверяем через официальный WB API карточек."""
    api_url = (
        f"https://card.wb.ru/cards/v1/detail"
        f"?appType=1&curr=rub&dest=-1257786&nm={article}"
    )
    try:
        resp = requests.get(api_url, headers={
            **HEADERS,
            "Accept": "application/json",
            "Referer": "https://www.wildberries.ru/",
            "Origin": "https://www.wildberries.ru",
        }, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("data", {}).get("products", [])
            if products:
                p = products[0]
                name = p.get("name", "")
                brand = p.get("brand", "")
                title = f"{brand} — {name}" if brand and name else name or brand or ""
                return {
                    "ok": True,
                    "marketplace": "Wildberries",
                    "article": str(article),
                    "url": wb_url_from_article(article),
                    "title": title,
                }
    except Exception:
        pass
    # Fallback: API недоступен или товар не найден — возвращаем ссылку без названия
    return {
        "ok": True,
        "marketplace": "Wildberries",
        "article": str(article),
        "url": wb_url_from_article(article),
        "title": "",
    }


# ─── OZON ─────────────────────────────────────────────────────────────────────

def ozon_url_from_article(article: str) -> str:
    return f"https://www.ozon.ru/product/{article}/"


def ozon_article_from_url(url: str) -> str | None:
    # https://www.ozon.ru/product/nazvanie-tovara-597240033/ — ID в конце slug
    m = re.search(r"/product/[^/]*?-(\d{5,})/?(?:\?|#|$)", url)
    if m:
        return m.group(1)
    # https://www.ozon.ru/product/597240033/
    m2 = re.search(r"/product/(\d+)/?(?:\?|#|$)", url)
    if m2:
        return m2.group(1)
    return None


def ozon_lookup_by_article(article: str) -> dict:
    """Пробуем получить название через OZON internal API."""
    title = ""
    try:
        api_url = (
            f"https://www.ozon.ru/api/entrypoint-api.bx/page/json/v2"
            f"?url=/product/{article}/"
        )
        resp = requests.get(api_url, headers={
            **HEADERS,
            "Accept": "application/json",
            "Referer": f"https://www.ozon.ru/product/{article}/",
        }, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            for key, value in data.get("widgetStates", {}).items():
                if "webProductHeading" in key or "webProductCard" in key:
                    try:
                        wdata = json.loads(value) if isinstance(value, str) else value
                        title = (
                            wdata.get("title")
                            or wdata.get("heading")
                            or wdata.get("name")
                            or ""
                        )
                        if title:
                            break
                    except Exception:
                        pass
    except Exception:
        pass
    return {
        "ok": True,
        "marketplace": "OZON",
        "article": str(article),
        "url": ozon_url_from_article(article),
        "title": title,
    }


# ─── Определение маркетплейса по URL ─────────────────────────────────────────

def detect_marketplace_from_url(url: str) -> str | None:
    if "wildberries.ru" in url or "wb.ru" in url:
        return "Wildberries"
    if "ozon.ru" in url:
        return "OZON"
    return None


# ─── Handler ──────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": cors,
                "body": json.dumps({"error": "Invalid JSON"})}

    article = (body.get("article") or "").strip()
    url = (body.get("url") or "").strip()
    marketplace = (body.get("marketplace") or "").strip()

    # ── Поиск по URL ──────────────────────────────────────────────────────────
    if url:
        detected_mp = detect_marketplace_from_url(url)
        if not detected_mp:
            return {"statusCode": 200, "headers": cors,
                    "body": json.dumps({
                        "ok": False,
                        "error": "Ссылка не относится к поддерживаемым маркетплейсам (Wildberries, OZON)"
                    })}

        if detected_mp == "Wildberries":
            found_article = wb_article_from_url(url)
            if not found_article:
                return {"statusCode": 200, "headers": cors,
                        "body": json.dumps({
                            "ok": False,
                            "error": "Не удалось извлечь артикул из ссылки Wildberries"
                        })}
            result = wb_lookup_by_article(found_article)
            result["url"] = url
        else:
            found_article = ozon_article_from_url(url)
            if not found_article:
                return {"statusCode": 200, "headers": cors,
                        "body": json.dumps({
                            "ok": False,
                            "error": "Не удалось извлечь артикул из ссылки OZON. "
                                     "Убедитесь, что ссылка полная (например: ozon.ru/product/nazvanie-12345678/)"
                        })}
            result = ozon_lookup_by_article(found_article)
            result["url"] = url

        return {"statusCode": 200, "headers": cors, "body": json.dumps(result)}

    # ── Поиск по артикулу ────────────────────────────────────────────────────
    if article:
        if not re.match(r"^\d+$", article):
            return {"statusCode": 200, "headers": cors,
                    "body": json.dumps({
                        "ok": False,
                        "error": "Артикул должен содержать только цифры"
                    })}

        if marketplace == "Wildberries":
            return {"statusCode": 200, "headers": cors,
                    "body": json.dumps(wb_lookup_by_article(article))}
        if marketplace == "OZON":
            return {"statusCode": 200, "headers": cors,
                    "body": json.dumps(ozon_lookup_by_article(article))}

        # Маркетплейс не указан — пробуем WB через API, OZON через API
        # Если WB API вернул реальный товар (с title) — он приоритетнее
        wb_result = wb_lookup_by_article(article)
        if wb_result.get("title"):
            return {"statusCode": 200, "headers": cors, "body": json.dumps(wb_result)}

        ozon_result = ozon_lookup_by_article(article)
        if ozon_result.get("title"):
            return {"statusCode": 200, "headers": cors, "body": json.dumps(ozon_result)}

        # Оба без названия — возвращаем WB как дефолт
        return {"statusCode": 200, "headers": cors, "body": json.dumps(wb_result)}

    return {"statusCode": 400, "headers": cors,
            "body": json.dumps({"ok": False, "error": "Укажите article или url"})}
