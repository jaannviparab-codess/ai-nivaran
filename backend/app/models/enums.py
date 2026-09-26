"""Python enums backing every SQLAlchemy Enum column.

Keeping these as plain ``str`` enums means FastAPI/Pydantic serialize them as
their plain string value with no extra work, while SQLAlchemy still enforces
them as a real native ENUM type at the Postgres layer.
"""
from __future__ import annotations

import enum


class IssueCategory(str, enum.Enum):
    pothole = "pothole"
    garbage = "garbage"
    streetlight = "streetlight"
    water_leakage = "water_leakage"
    damaged_road = "damaged_road"
    open_manhole = "open_manhole"
    fallen_tree = "fallen_tree"
    road_obstruction = "road_obstruction"
    drainage = "drainage"
    public_cleanliness = "public_cleanliness"
    accessibility = "accessibility"
    other = "other"


class IssueSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IssueStatus(str, enum.Enum):
    reported = "reported"
    ai_analyzed = "ai_analyzed"
    verified = "verified"
    under_review = "under_review"
    work_started = "work_started"
    resolved = "resolved"
    citizen_verified = "citizen_verified"
    reopened = "reopened"


# Statuses that mean "this issue is considered closed out" for duplicate
# detection and reopen automation.
RESOLVED_LIKE_STATUSES = (IssueStatus.resolved, IssueStatus.citizen_verified)
OPEN_STATUSES = tuple(s for s in IssueStatus if s not in RESOLVED_LIKE_STATUSES)


class ImageKind(str, enum.Enum):
    report = "report"
    before = "before"
    after = "after"


class StatusActor(str, enum.Enum):
    system = "system"
    ai = "ai"
    citizen = "citizen"
    authority = "authority"


class UserRole(str, enum.Enum):
    citizen = "citizen"
    moderator = "moderator"
    admin = "admin"


class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class Language(str, enum.Enum):
    mr = "mr"
    hi = "hi"
    en = "en"


class NotificationType(str, enum.Enum):
    follow_up = "follow_up"
    escalation = "escalation"
    status_change = "status_change"
    system = "system"
