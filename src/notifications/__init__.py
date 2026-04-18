"""Notification pipeline primitives for runtime, API, and providers."""

from .schema import normalize_notification_event
from .service import NotificationService

__all__ = ["NotificationService", "normalize_notification_event"]
