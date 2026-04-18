from __future__ import annotations

import logging
from datetime import datetime

from .policy import NotificationPolicy
from .providers import TelegramProvider
from .schema import normalize_notification_event


PRIORITY_RANK = {"P1": 1, "P2": 2, "P3": 3}


class NotificationService:
    def __init__(self, db_manager=None, config: dict | None = None):
        self.logger = logging.getLogger("NotificationService")
        self.db = db_manager
        self.config = config or {}
        self.enabled = bool(self.config.get("enabled", True))
        self.categories = dict(
            self.config.get("categories")
            or {"execution": True, "risk": True, "health": True, "setup": False}
        )
        self.min_priority = str(self.config.get("min_priority", "P2")).upper()
        if self.min_priority not in PRIORITY_RANK:
            self.min_priority = "P2"

        policy_cfg = self.config.get("policy") or {}
        self.policy = NotificationPolicy(policy_cfg)
        telegram_cfg = self.config.get("telegram") or {}
        self.telegram = TelegramProvider(
            bot_token=telegram_cfg.get("bot_token"),
            chat_id=telegram_cfg.get("chat_id"),
            timeout_seconds=telegram_cfg.get("timeout_seconds", 2.5),
            retries=telegram_cfg.get("retries", 2),
        )

        self.metrics = {"emitted": 0, "suppressed": 0, "delivery_failed": 0}
        self.last_event_at = None

    def _priority_allowed(self, priority: str) -> bool:
        return PRIORITY_RANK.get(priority, 99) <= PRIORITY_RANK.get(self.min_priority, 99)

    @staticmethod
    def _render_message(event: dict) -> str:
        tags = [event["priority"], event["event_type"]]
        base = f"[{'|'.join(tags)}] {event['message']}"
        details = []
        if event.get("symbol"):
            details.append(f"symbol={event['symbol']}")
        if event.get("ticket"):
            details.append(f"ticket={event['ticket']}")
        if event.get("side"):
            details.append(f"side={event['side']}")
        if event.get("rule_id"):
            details.append(f"rule={event['rule_id']}")
        if event.get("price") is not None:
            details.append(f"price={event['price']:.5f}")
        return f"{base}\n" + " ".join(details) if details else base

    def _save(self, record: dict):
        if not self.db:
            return
        try:
            self.db.save_notification(record)
        except Exception as exc:
            self.logger.error(f"Falha ao persistir notificacao: {exc}")

    def emit(self, payload: dict) -> dict:
        event = normalize_notification_event(payload)
        self.last_event_at = datetime.now().isoformat(timespec="seconds")

        if not self.enabled:
            record = dict(event)
            record.update(
                {
                    "status": "suppressed",
                    "suppression_reason": "disabled",
                    "event_key": None,
                    "aggregated_count": 1,
                    "delivery_channel": "telegram",
                    "delivery_status": "skipped",
                    "delivery_error": None,
                    "delivered_at": None,
                }
            )
            self.metrics["suppressed"] += 1
            self._save(record)
            return {"status": "suppressed", "reason": "disabled"}

        if not bool(self.categories.get(event["category"], False)):
            record = dict(event)
            record.update(
                {
                    "status": "suppressed",
                    "suppression_reason": "category_disabled",
                    "event_key": None,
                    "aggregated_count": 1,
                    "delivery_channel": "telegram",
                    "delivery_status": "skipped",
                    "delivery_error": None,
                    "delivered_at": None,
                }
            )
            self.metrics["suppressed"] += 1
            self._save(record)
            return {"status": "suppressed", "reason": "category_disabled"}

        if not self._priority_allowed(event["priority"]):
            record = dict(event)
            record.update(
                {
                    "status": "suppressed",
                    "suppression_reason": "priority_filter",
                    "event_key": None,
                    "aggregated_count": 1,
                    "delivery_channel": "telegram",
                    "delivery_status": "skipped",
                    "delivery_error": None,
                    "delivered_at": None,
                }
            )
            self.metrics["suppressed"] += 1
            self._save(record)
            return {"status": "suppressed", "reason": "priority_filter"}

        decision = self.policy.evaluate(event)
        if not decision["allowed"]:
            record = dict(event)
            record.update(
                {
                    "status": "suppressed",
                    "suppression_reason": decision["reason"],
                    "event_key": decision["event_key"],
                    "aggregated_count": decision["aggregated_count"],
                    "delivery_channel": "telegram",
                    "delivery_status": "skipped",
                    "delivery_error": None,
                    "delivered_at": None,
                }
            )
            self.metrics["suppressed"] += 1
            self._save(record)
            return {"status": "suppressed", "reason": decision["reason"]}

        message = self._render_message(event)
        delivery = self.telegram.send(message)
        delivered_at = datetime.now().isoformat(timespec="seconds") if delivery.get("ok") else None
        status = "emitted" if delivery.get("ok") else "delivery_failed"
        if status == "delivery_failed":
            self.metrics["delivery_failed"] += 1
        self.metrics["emitted"] += 1

        record = dict(event)
        record.update(
            {
                "status": status,
                "suppression_reason": None,
                "event_key": decision["event_key"],
                "aggregated_count": decision["aggregated_count"],
                "delivery_channel": "telegram",
                "delivery_status": "sent" if delivery.get("ok") else "failed",
                "delivery_error": delivery.get("error"),
                "delivered_at": delivered_at,
            }
        )
        self._save(record)
        return {"status": status, "reason": None}

    def snapshot(self) -> dict:
        return {
            "enabled": self.enabled,
            "metrics": dict(self.metrics),
            "last_event_at": self.last_event_at,
        }

