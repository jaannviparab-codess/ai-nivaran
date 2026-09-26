"""check_reopen_candidates: any resolved/citizen_verified issue that has
accumulated ``REOPEN_CONFIRMATION_THRESHOLD`` or more "still present"
confirmations since it was last marked resolved gets flipped back to
``reopened``.

The same rule also fires immediately, inline, whenever a citizen submits a
confirmation (see ``app.services.issue_service.confirm_issue``) so the
frontend gets instant feedback. This periodic sweep is a safety net that
catches anything the inline path might have missed (e.g. confirmations
recorded through another path) and keeps behavior correct regardless.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import RESOLVED_LIKE_STATUSES, IssueStatus, StatusActor
from app.models.issue import Issue
from app.models.issue_status_history import IssueStatusHistory


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def run_reopen_check(db: Session) -> int:
    """Returns the number of issues reopened."""
    candidates = db.execute(
        select(Issue)
        .where(Issue.status.in_(RESOLVED_LIKE_STATUSES), Issue.duplicate_of_id.is_(None))
        .options(selectinload(Issue.confirmations), selectinload(Issue.resolutions))
    ).scalars().all()

    reopened = 0
    for issue in candidates:
        resolution = issue.latest_resolution
        cutoff = _aware(resolution.resolved_at) if resolution else None
        recent_still_present = sum(
            1
            for c in issue.confirmations
            if c.still_present and (cutoff is None or _aware(c.created_at) >= cutoff)
        )
        if recent_still_present >= settings.REOPEN_CONFIRMATION_THRESHOLD:
            issue.status = IssueStatus.reopened
            issue.status_history.append(
                IssueStatusHistory(
                    status=IssueStatus.reopened,
                    actor=StatusActor.system,
                    note=(
                        f"Reopened automatically: {recent_still_present} citizens reported this issue is "
                        "still present after it was marked resolved."
                    ),
                )
            )
            reopened += 1

    db.commit()
    return reopened
