from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.models.enums import ChatRole
from app.schemas.base import CamelModel


class ChatRequest(CamelModel):
    message: str = Field(min_length=1, max_length=2000)


class SuggestedAction(CamelModel):
    label: str
    href: str


class ChatMessage(CamelModel):
    id: str
    role: ChatRole
    content: str
    created_at: datetime
    suggested_actions: list[SuggestedAction] | None = None
