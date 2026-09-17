from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin
from app.db.types import GUID
from app.models.enums import Language, UserRole

if TYPE_CHECKING:
    from app.models.issue import Issue


class User(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=UserRole.citizen,
        server_default=UserRole.citizen.value,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default="true")

    profile: Mapped["CitizenProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    reported_issues: Mapped[list["Issue"]] = relationship(back_populates="reporter", foreign_keys="Issue.reporter_id")


class CitizenProfile(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "citizen_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    preferred_language: Mapped[Language | None] = mapped_column(
        SAEnum(Language, name="citizen_preferred_language", values_callable=lambda e: [m.value for m in e]),
        nullable=True,
    )
    notifications_opt_in: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default="true")

    user: Mapped["User"] = relationship(back_populates="profile")
