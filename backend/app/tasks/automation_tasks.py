"""Celery tasks wrapping the automation services.

Kept thin on purpose: each task opens its own DB session, delegates the
actual rule to ``app.services.automation.*`` (which is plain, session-taking
Python and easy to unit test on its own), and logs the outcome.
"""
from __future__ import annotations

import logging

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.automation.escalation_service import run_escalation_check
from app.services.automation.follow_up_service import run_follow_up_check
from app.services.automation.reopen_service import run_reopen_check

logger = logging.getLogger("nivaran.tasks")


@celery_app.task(name="app.tasks.automation_tasks.check_follow_ups")
def check_follow_ups() -> int:
    """Any open issue with no status change for FOLLOWUP_INACTIVITY_DAYS gets
    a FollowUp + a "still open" notification."""
    db = SessionLocal()
    try:
        created = run_follow_up_check(db)
        logger.info("check_follow_ups: created %s follow-up(s)", created)
        return created
    finally:
        db.close()


@celery_app.task(name="app.tasks.automation_tasks.check_escalations")
def check_escalations() -> int:
    """Any high/critical severity issue open longer than
    ESCALATION_INACTIVITY_DAYS gets flagged for manual review."""
    db = SessionLocal()
    try:
        escalated = run_escalation_check(db)
        logger.info("check_escalations: flagged %s issue(s)", escalated)
        return escalated
    finally:
        db.close()


@celery_app.task(name="app.tasks.automation_tasks.check_reopen_candidates")
def check_reopen_candidates() -> int:
    """Any resolved/citizen_verified issue with enough recent "still present"
    confirmations gets flipped back to reopened."""
    db = SessionLocal()
    try:
        reopened = run_reopen_check(db)
        logger.info("check_reopen_candidates: reopened %s issue(s)", reopened)
        return reopened
    finally:
        db.close()
