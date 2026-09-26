from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import IssueStatus, StatusActor

if TYPE_CHECKING:
    from app.models.issue import Issue


class IssueStatusHistory(Base, UUIDPkMixin):
    __tablename__ = "issue_status_history"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[IssueStatus] = mapped_column(
        SAEnum(IssueStatus, name="status_history_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    actor: Mapped[StatusActor] = mapped_column(
        SAEnum(StatusActor, name="status_history_actor", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    issue: Mapped["Issue"] = relationship(back_populates="status_history")
