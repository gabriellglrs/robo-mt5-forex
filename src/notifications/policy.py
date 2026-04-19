from __future__ import annotations

import hashlib
import time
from collections import defaultdict


class NotificationPolicy:
    """Aplica dedupe, cooldown e agregacao para reduzir spam operacional."""

    def __init__(self, cfg: dict | None = None):
        cfg = cfg or {}
        self.dedupe_window_seconds = max(1, int(cfg.get("dedupe_window_seconds", 30)))
        self.cooldown_default_seconds = max(0, int(cfg.get("cooldown_default_seconds", 20)))
        self.cooldown_by_event = dict(cfg.get("cooldown_by_event") or {})
        self.aggregation_window_seconds = max(1, int(cfg.get("aggregation_window_seconds", 12)))
        self.aggregation_threshold = max(2, int(cfg.get("aggregation_threshold", 3)))

        self._last_seen_by_key = {}
        self._last_emitted_by_scope = {}
        self._agg_state = defaultdict(lambda: {"count": 0, "first_ts": 0.0, "last_ts": 0.0})

    @staticmethod
    def build_event_key(event: dict) -> str:
        base = "|".join(
            [
                str(event.get("event_type") or ""),
                str(event.get("symbol") or ""),
                str(event.get("ticket") or ""),
                str(event.get("rule_id") or ""),
                str(event.get("side") or ""),
            ]
        )
        return hashlib.sha1(base.encode("utf-8")).hexdigest()

    def evaluate(self, event: dict) -> dict:
        now = time.time()
        event_key = self.build_event_key(event)
        event_type = str(event.get("event_type") or "UNKNOWN")
        symbol = str(event.get("symbol") or "GLOBAL")
        priority = str(event.get("priority") or "P2").upper()

        # P1 (Critical) bypasses anti-spam (always allowed)
        if priority == "P1":
            return {
                "allowed": True,
                "reason": "critical_bypass",
                "event_key": event_key,
                "aggregated_count": 1,
            }

        last_seen = self._last_seen_by_key.get(event_key)
        if last_seen and (now - last_seen) < self.dedupe_window_seconds:
            self._last_seen_by_key[event_key] = now
            return {
                "allowed": False,
                "reason": "dedupe",
                "event_key": event_key,
                "aggregated_count": 1,
            }
        self._last_seen_by_key[event_key] = now

        cooldown_seconds = int(self.cooldown_by_event.get(event_type, self.cooldown_default_seconds))
        scope_key = f"{event_type}:{symbol}"
        last_emitted_scope = self._last_emitted_by_scope.get(scope_key)
        if cooldown_seconds > 0 and last_emitted_scope and (now - last_emitted_scope) < cooldown_seconds:
            return {
                "allowed": False,
                "reason": "cooldown",
                "event_key": event_key,
                "aggregated_count": 1,
            }

        agg_key = f"{event_type}:{symbol}:{event.get('ticket') or 'na'}"
        agg = self._agg_state[agg_key]
        if (now - agg["last_ts"]) > self.aggregation_window_seconds:
            agg["count"] = 0
            agg["first_ts"] = now
        agg["count"] += 1
        agg["last_ts"] = now

        if agg["count"] > self.aggregation_threshold:
            return {
                "allowed": False,
                "reason": "aggregation",
                "event_key": event_key,
                "aggregated_count": int(agg["count"]),
            }

        self._last_emitted_by_scope[scope_key] = now
        return {
            "allowed": True,
            "reason": None,
            "event_key": event_key,
            "aggregated_count": int(agg["count"]),
        }

