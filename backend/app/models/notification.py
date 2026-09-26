from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import NotificationType, UserRole

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.user import User


class Notification(Base, UUIDPkMixin):
    __tablename__ = "notifications"

    # Either targeted at a specific user, or broadcast to a role (e.g. all moderators/admins
    # get escalation notifications) when user_id is null.
    user_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    role_target: Mapped[UserRole | None] = mapped_column(
        SAEnum(UserRole, name="notification_role_target", values_callable=lambda e: [m.value for m in e]),
        nullable=True,
    )
    issue_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=True, index=True)
    type: Mapped[NotificationType] = mapped_column(
        SAEnum(NotificationType, name="notification_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    user: Mapped["User | None"] = relationship()
    issue: Mapped["Issue | None"] = relationship(back_populates="notifications")
