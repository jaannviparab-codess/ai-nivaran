from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import ChatRole

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.user import User


class AIConversation(Base, UUIDPkMixin, TimestampMixin):
    """A conversation thread with the Nivaran AI assistant."""

    __tablename__ = "ai_conversations"

    user_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    issue_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)

    user: Mapped["User | None"] = relationship()
    issue: Mapped["Issue | None"] = relationship(back_populates="conversations")
    messages: Mapped[list["AIConversationMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="AIConversationMessage.created_at"
    )


class AIConversationMessage(Base, UUIDPkMixin):
    __tablename__ = "ai_conversation_messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[ChatRole] = mapped_column(
        SAEnum(ChatRole, name="ai_message_role", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_actions: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")
