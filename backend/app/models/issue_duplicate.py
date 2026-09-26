from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID

if TYPE_CHECKING:
    from app.models.issue import Issue


class IssueDuplicate(Base, UUIDPkMixin):
    """Links a child (duplicate) issue report to the primary/group issue it was merged into."""

    __tablename__ = "issue_duplicates"
    __table_args__ = (UniqueConstraint("duplicate_issue_id", name="uq_issue_duplicate_child"),)

    primary_issue_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    duplicate_issue_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    similarity_score: Mapped[float | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    primary_issue: Mapped["Issue"] = relationship(
        "Issue", foreign_keys=[primary_issue_id], back_populates="duplicate_links_as_primary"
    )
    duplicate_issue: Mapped["Issue"] = relationship(
        "Issue", foreign_keys=[duplicate_issue_id], back_populates="duplicate_link_as_child"
    )
