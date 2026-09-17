"""AI assistant chat endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.camel_route import CamelCaseRoute
from app.api.deps import get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.schemas.assistant import ChatMessage, ChatRequest
from app.services.assistant_service import handle_chat_message

router = APIRouter(prefix="/assistant", tags=["assistant"], route_class=CamelCaseRoute)


@router.post("/chat", response_model=ChatMessage)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> ChatMessage:
    return handle_chat_message(db, payload.message, current_user)
