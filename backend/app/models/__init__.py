"""Import every model so Alembic autogenerate (and ``Base.metadata``) sees the
full schema, and so callers can do ``from app.models import Issue, User``.
"""
from app.db.base import Base  # noqa: F401
from app.models.enums import (  # noqa: F401
    ChatRole,
    ImageKind,
    IssueCategory,
    IssueStatus,
    IssueSeverity,
    Language,
    NotificationType,
    StatusActor,
    UserRole,
)
from app.models.user import User, CitizenProfile  # noqa: F401
from app.models.issue import Issue  # noqa: F401
from app.models.issue_image import IssueImage  # noqa: F401
from app.models.issue_ai_analysis import IssueAIAnalysis  # noqa: F401
from app.models.priority_score import PriorityScore  # noqa: F401
from app.models.issue_status_history import IssueStatusHistory  # noqa: F401
from app.models.issue_confirmation import IssueConfirmation  # noqa: F401
from app.models.issue_comment import IssueComment  # noqa: F401
from app.models.issue_duplicate import IssueDuplicate  # noqa: F401
from app.models.issue_resolution import IssueResolution  # noqa: F401
from app.models.issue_verification import IssueVerification  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.follow_up import FollowUp  # noqa: F401
from app.models.ai_conversation import AIConversation, AIConversationMessage  # noqa: F401

__all__ = [
    "Base",
    "ChatRole",
    "ImageKind",
    "IssueCategory",
    "IssueStatus",
    "IssueSeverity",
    "Language",
    "NotificationType",
    "StatusActor",
    "UserRole",
    "User",
    "CitizenProfile",
    "Issue",
    "IssueImage",
    "IssueAIAnalysis",
    "PriorityScore",
    "IssueStatusHistory",
    "IssueConfirmation",
    "IssueComment",
    "IssueDuplicate",
    "IssueResolution",
    "IssueVerification",
    "Notification",
    "FollowUp",
    "AIConversation",
    "AIConversationMessage",
]
