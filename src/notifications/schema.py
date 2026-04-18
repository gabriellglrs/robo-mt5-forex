from __future__ import annotations

from datetime import datetime

ALLOWED_PRIORITIES = {"P1", "P2", "P3"}
ALLOWED_SEVERITIES = {"critical", "high", "medium", "low"}
ALLOWED_CATEGORIES = {"execution", "risk", "health", "setup"}


def _as_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_notification_event(payload: dict) -> dict:
    """Normaliza evento de notificacao para contrato canonico e serializavel."""
    event = dict(payload or {})
    now_iso = datetime.now().isoformat(timespec="seconds")

    priority = str(event.get("priority") or "P2").upper()
    if priority not in ALLOWED_PRIORITIES:
        priority = "P2"

    severity = str(event.get("severity") or "medium").lower()
    if severity not in ALLOWED_SEVERITIES:
        severity = "medium"

    category = str(event.get("category") or "setup").lower()
    if category not in ALLOWED_CATEGORIES:
        category = "setup"

    ticket = event.get("ticket")
    try:
        ticket = int(ticket) if ticket is not None else None
    except (TypeError, ValueError):
        ticket = None

    return {
        "timestamp": str(event.get("timestamp") or now_iso),
        "event_type": str(event.get("event_type") or "UNKNOWN_EVENT"),
        "category": category,
        "priority": priority,
        "severity": severity,
        "message": str(event.get("message") or "Evento operacional sem mensagem."),
        "symbol": event.get("symbol"),
        "ticket": ticket,
        "side": event.get("side"),
        "rule_id": event.get("rule_id"),
        "price": _as_float(event.get("price")),
        "sl": _as_float(event.get("sl")),
        "tp": _as_float(event.get("tp")),
        "metadata": event.get("metadata") if isinstance(event.get("metadata"), dict) else {},
    }

