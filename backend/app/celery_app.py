"""Celery application: Redis broker+backend, and the beat schedule for the
three automation rules (follow-ups, escalations, reopen candidates).

Run the worker with:      celery -A app.celery_app worker --loglevel=info
Run the beat scheduler with: celery -A app.celery_app beat --loglevel=info
"""
from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "nivaran",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.automation_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-follow-ups-hourly": {
            "task": "app.tasks.automation_tasks.check_follow_ups",
            "schedule": crontab(minute=0),
        },
        "check-escalations-hourly": {
            "task": "app.tasks.automation_tasks.check_escalations",
            "schedule": crontab(minute=15),
        },
        "check-reopen-candidates-hourly": {
            "task": "app.tasks.automation_tasks.check_reopen_candidates",
            "schedule": crontab(minute=30),
        },
    },
)
