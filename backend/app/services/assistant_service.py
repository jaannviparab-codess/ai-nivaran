"""Nivaran AI assistant chat.

When AI_PROVIDER=demo (the default), replies are rule-based keyword matching,
mirroring the tone of the frontend's own demo assistant
(``lib/mock-data.ts::getAssistantReply``). When a real LLM provider is
configured, it answers with a short system prompt describing Nivaran AI, and
gracefully falls back to the rule-based reply if that call fails for any
reason -- a flaky external AI call must never break the chat experience.
"""
from __future__ import annotations

import logging

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_conversation import AIConversation, AIConversationMessage
from app.models.enums import ChatRole
from app.models.user import User
from app.schemas.assistant import ChatMessage as ChatMessageSchema
from app.schemas.assistant import SuggestedAction

logger = logging.getLogger("nivaran.assistant")

SYSTEM_PROMPT = (
    "You are the Nivaran AI assistant, embedded in Nivaran AI (निवारण AI), a "
    "civic issue reporting platform for Indian cities covering potholes, garbage, broken streetlights, water "
    "leakage, and similar public infrastructure problems. Answer briefly (2-4 sentences) and helpfully about "
    "how to report an issue, how to track a report using its tracking ID (format NVR-YYYY-XXXX), how the AI "
    "priority score works, or how duplicate reports get grouped together. If asked something unrelated to the "
    "platform, gently redirect the user back to those topics."
)

DEFAULT_REPLY = (
    "I can help you report a new problem, track an existing report using its tracking ID, or explain how "
    "priority scores are calculated. What would you like to do?"
)
DEFAULT_ACTIONS = [
    SuggestedAction(label="Report a problem", href="/report"),
    SuggestedAction(label="Track an issue", href="/track"),
]


def _rule_based_reply(message: str) -> tuple[str, list[SuggestedAction] | None]:
    text = message.lower()
    if "priority" in text:
        return (
            "Priority Score (0-100) is an AI estimate combining severity, safety risk, number of people "
            "affected, how long the issue has been open, and location importance. It helps sort issues, but "
            "it is a suggestion -- not an official government decision.",
            [SuggestedAction(label="View public map", href="/map")],
        )
    if "duplicate" in text:
        return (
            "When multiple citizens report what looks like the same problem in the same area, Nivaran AI "
            "groups them into a single issue instead of creating duplicates, so confirmations add up on one "
            "tracking ID rather than being split across several.",
            None,
        )
    if "report" in text or "submit" in text or "पोस्ट" in message:
        return (
            "To report a problem: open 'Report a Problem', add a photo, allow location access (you can adjust "
            "the pin), then add a short description or use voice reporting in Marathi, Hindi or English. AI "
            "will suggest a category and severity before you submit.",
            [SuggestedAction(label="Go to Report a Problem", href="/report")],
        )
    if "track" in text or "status" in text:
        return (
            "You can track any report using the tracking ID you received after submitting (format "
            "NVR-YYYY-XXXX). The tracker shows the live status timeline, priority score, and any resolution "
            "evidence.",
            [SuggestedAction(label="Open Track Issue", href="/track")],
        )
    return DEFAULT_REPLY, DEFAULT_ACTIONS


def _call_openai_assistant(message: str) -> tuple[str, list[SuggestedAction] | None]:
    with httpx.Client(timeout=15.0) as client:
        response = client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": settings.OPENAI_CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message},
                ],
                "temperature": 0.4,
                "max_tokens": 300,
            },
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
    return content, None


def _call_anthropic_assistant(message: str) -> tuple[str, list[SuggestedAction] | None]:
    with httpx.Client(timeout=15.0) as client:
        response = client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.ANTHROPIC_CHAT_MODEL,
                "max_tokens": 300,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": message}],
            },
        )
        response.raise_for_status()
        content = response.json()["content"][0]["text"].strip()
    return content, None


def _generate_reply(message: str) -> tuple[str, list[SuggestedAction] | None]:
    try:
        if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            return _call_openai_assistant(message)
        if settings.AI_PROVIDER == "anthropic" and settings.ANTHROPIC_API_KEY:
            return _call_anthropic_assistant(message)
    except Exception:  # noqa: BLE001 - a flaky AI call must never break the chat
        logger.warning("Real LLM assistant call failed; falling back to rule-based demo reply", exc_info=True)
    return _rule_based_reply(message)


def handle_chat_message(db: Session, message: str, current_user: User | None) -> ChatMessageSchema:
    conversation = AIConversation(user_id=current_user.id if current_user else None)
    db.add(conversation)
    db.flush()

    db.add(AIConversationMessage(conversation_id=conversation.id, role=ChatRole.user, content=message))

    reply_text, suggested_actions = _generate_reply(message)

    assistant_message = AIConversationMessage(
        conversation_id=conversation.id,
        role=ChatRole.assistant,
        content=reply_text,
        suggested_actions=[a.model_dump() for a in suggested_actions] if suggested_actions else None,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatMessageSchema(
        id=str(assistant_message.id),
        role=ChatRole.assistant,
        content=reply_text,
        created_at=assistant_message.created_at,
        suggested_actions=suggested_actions,
    )
