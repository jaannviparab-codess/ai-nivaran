"""check_escalations: any issue open longer than ``ESCALATION_INACTIVITY_DAYS``
that is high/critical severity gets flagged (``Issue.is_escalated``) for
manual review, plus a broadcast ``Notification`` to moderators/admins.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import RESOLVED_LIKE_STATUSES, IssueSeverity, NotificationType, UserRole
from app.models.issue import Issue
from app.models.notification import Notification


def run_escalation_check(db: Session) -> int:
    """Returns the number of issues newly flagged for escalation."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.ESCALATION_INACTIVITY_DAYS)

    to_escalate = db.execute(
        select(Issue).where(
            ~Issue.status.in_(RESOLVED_LIKE_STATUSES),
            Issue.duplicate_of_id.is_(None),
            Issue.severity.in_((IssueSeverity.high, IssueSeverity.critical)),
            Issue.reported_at < cutoff,
            Issue.is_escalated.is_(False),
        )
    ).scalars().all()

    for issue in to_escalate:
        issue.is_escalated = True
        db.add(
            Notification(
                role_target=UserRole.moderator,
                issue_id=issue.id,
                type=NotificationType.escalation,
                message=(
                    f"Escalation: {issue.severity.value} severity issue {issue.tracking_id} "
                    f"('{issue.title}') has been open for over {settings.ESCALATION_INACTIVITY_DAYS} days."
                ),
            )
        )

    db.commit()
    return len(to_escalate)
