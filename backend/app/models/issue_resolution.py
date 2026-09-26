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


class IssueResolution(Base, UUIDPkMixin):
    __tablename__ = "issue_resolutions"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    before_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    after_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    resolved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    issue: Mapped["Issue"] = relationship(back_populates="resolutions")
    resolved_by_user: Mapped["User | None"] = relationship()
