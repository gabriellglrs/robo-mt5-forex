from __future__ import annotations

import json
import time
import urllib.error
import urllib.request


class TelegramProvider:
    def __init__(self, bot_token: str | None, chat_id: str | None, timeout_seconds: float = 2.5, retries: int = 2):
        self.bot_token = (bot_token or "").strip()
        self.chat_id = (chat_id or "").strip()
        self.timeout_seconds = float(timeout_seconds)
        self.retries = max(0, int(retries))

    def is_enabled(self) -> bool:
        return bool(self.bot_token and self.chat_id)

    def send(self, text: str, parse_mode: str = "MarkdownV2") -> dict:
        if not self.is_enabled():
            return {"ok": False, "error": "telegram_not_configured"}

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        
        # Escaping for MarkdownV2 if needed
        # Telegram MarkdownV2 requires escaping characters like _ * [ ] ( ) ~ ` > # + - = | { } . !
        
        payload = json.dumps(
            {
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            }
        ).encode("utf-8")

        last_error = None
        for attempt in range(self.retries + 1):
            try:
                request = urllib.request.Request(
                    url=url,
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    if bool(data.get("ok")):
                        return {"ok": True}
                    last_error = str(data.get("description") or "telegram_send_failed")
            except (urllib.error.URLError, TimeoutError, ValueError) as exc:
                last_error = str(exc)
            if attempt < self.retries:
                time.sleep(0.15)

        return {"ok": False, "error": last_error or "telegram_send_failed"}

