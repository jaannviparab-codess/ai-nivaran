"""check_follow_ups: any open issue with no status change for more than
``FOLLOWUP_INACTIVITY_DAYS`` gets a ``FollowUp`` row plus a system-generated
"still open" ``Notification`` nudge.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import RESOLVED_LIKE_STATUSES, NotificationType
from app.models.follow_up import FollowUp
from app.models.issue import Issue
from app.models.issue_status_history import IssueStatusHistory
from app.models.notification import Notification


def run_follow_up_check(db: Session) -> int:
    """Returns the number of new FollowUp rows created."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.FOLLOWUP_INACTIVITY_DAYS)

    last_change_sq = (
        select(IssueStatusHistory.issue_id, func.max(IssueStatusHistory.created_at).label("last_change"))
        .group_by(IssueStatusHistory.issue_id)
        .subquery()
    )

    stale_issues = db.execute(
        select(Issue)
        .join(last_change_sq, last_change_sq.c.issue_id == Issue.id)
        .where(
            ~Issue.status.in_(RESOLVED_LIKE_STATUSES),
            Issue.duplicate_of_id.is_(None),
            last_change_sq.c.last_change < cutoff,
        )
    ).scalars().all()

    created = 0
    for issue in stale_issues:
        already_flagged = db.execute(
            select(FollowUp.id).where(FollowUp.issue_id == issue.id, FollowUp.is_resolved.is_(False))
        ).first()
        if already_flagged:
            continue  # don't spam a fresh FollowUp/Notification every single run

        reason = (
            f"No status change for over {settings.FOLLOWUP_INACTIVITY_DAYS} days "
            f"(currently '{issue.status.value}')."
        )
        db.add(FollowUp(issue_id=issue.id, reason=reason))
        db.add(
            Notification(
                issue_id=issue.id,
                type=NotificationType.follow_up,
                message=f"Issue {issue.tracking_id} ('{issue.title}') has had no updates in a while and may need attention.",
            )
        )
        created += 1

    db.commit()
    return created
