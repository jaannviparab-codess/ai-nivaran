from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import ImageKind

if TYPE_CHECKING:
    from app.models.issue import Issue


class IssueImage(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "issue_images"

    issue_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    kind: Mapped[ImageKind] = mapped_column(
        SAEnum(ImageKind, name="issue_image_kind", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=ImageKind.report,
    )
    caption: Mapped[str | None] = mapped_column(String(500), nullable=True)

    issue: Mapped["Issue"] = relationship(back_populates="images")
