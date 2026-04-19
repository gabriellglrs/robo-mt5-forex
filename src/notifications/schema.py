from __future__ import annotations
from datetime import datetime
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field, validator

ALLOWED_PRIORITIES = {"P1", "P2", "P3"}
ALLOWED_SEVERITIES = {"critical", "high", "medium", "low"}
ALLOWED_CATEGORIES = {"execution", "risk", "health", "setup"}

class NotificationEvent(BaseModel):
    """Contrato canonico para eventos de notificacao do sistema."""
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    event_type: str = Field(default="UNKNOWN_EVENT")
    category: str = Field(default="setup")
    priority: str = Field(default="P2")
    severity: str = Field(default="medium")
    message: str = Field(default="Evento operacional sem mensagem.")
    symbol: Optional[str] = None
    ticket: Optional[int] = None
    side: Optional[str] = None
    rule_id: Optional[str] = None
    price: Optional[float] = None
    sl: Optional[float] = None
    tp: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @validator("priority")
    def validate_priority(cls, v):
        v = v.upper()
        return v if v in ALLOWED_PRIORITIES else "P2"

    @validator("severity")
    def validate_severity(cls, v):
        v = v.lower()
        return v if v in ALLOWED_SEVERITIES else "medium"

    @validator("category")
    def validate_category(cls, v):
        v = v.lower()
        return v if v in ALLOWED_CATEGORIES else "setup"

def normalize_notification_event(payload: dict) -> dict:
    """Helper para manter compatibilidade e facilitar criacao de eventos a partir de dicts brutos."""
    try:
        event = NotificationEvent(**(payload or {}))
        return event.dict()
    except Exception:
        # Fallback de seguranca caso o payload seja muito malformado
        return NotificationEvent().dict()

