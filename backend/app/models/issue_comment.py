from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.user import User


class IssueComment(Base, UUIDPkMixin):
    __tablename__ = "issue_comments"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue: Mapped["Issue"] = relationship(back_populates="comments")
    author: Mapped["User | None"] = relationship()
