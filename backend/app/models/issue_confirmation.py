from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.user import User


class IssueConfirmation(Base, UUIDPkMixin):
    __tablename__ = "issue_confirmations"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    still_present: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confirmer_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    confirmer_display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    issue: Mapped["Issue"] = relationship(back_populates="confirmations")
    confirmer: Mapped["User | None"] = relationship()
