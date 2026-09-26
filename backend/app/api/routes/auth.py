"""Auth endpoints: register, login, me.

Note: this module deliberately does NOT use ``from __future__ import
annotations``. slowapi's ``@limiter.limit(...)`` decorator wraps each endpoint
in a function whose ``__globals__`` point at slowapi's own module, not this
one; combined with postponed (string) annotations, FastAPI would then try to
resolve annotations like ``RegisterRequest`` against the wrong globals and
fail with an unresolved ForwardRef (surfacing as the parameter silently being
treated as a query param instead of a request body). Keeping real, eagerly
evaluated annotations here (Python 3.10+ ``X | None`` syntax works fine
without the future import) sidesteps that interaction entirely.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.camel_route import CamelCaseRoute
from app.api.deps import get_current_user
from app.core.errors import ApiException
from app.core.rate_limit import limiter, rate_limit_default
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import AuthResponse, LoginRequest, RegisterRequest, UserSchema

router = APIRouter(prefix="/auth", tags=["auth"], route_class=CamelCaseRoute)


def _user_to_schema(user: User) -> UserSchema:
    return UserSchema(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        created_at=user.created_at,
    )


def _issue_token_response(user: User) -> AuthResponse:
    token = create_access_token(subject=str(user.id))
    return AuthResponse(user=_user_to_schema(user), access_token=token)


@router.post("/register", response_model=AuthResponse)
@limiter.limit(rate_limit_default())
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower()
    existing = db.execute(select(User).where(User.email == email)).scalars().first()
    if existing:
        raise ApiException(
            "An account with this email already exists.",
            status_code=409,
            code="EMAIL_TAKEN",
            field_errors={"email": "This email is already registered."},
        )

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_token_response(user)


@router.post("/login", response_model=AuthResponse)
@limiter.limit(rate_limit_default())
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.execute(select(User).where(User.email == payload.email.lower())).scalars().first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise ApiException("Incorrect email or password.", status_code=401, code="INVALID_CREDENTIALS")
    if not user.is_active:
        raise ApiException("This account has been deactivated.", status_code=403, code="ACCOUNT_DISABLED")
    return _issue_token_response(user)


@router.get("/me", response_model=UserSchema)
def me(current_user: User = Depends(get_current_user)) -> UserSchema:
    return _user_to_schema(current_user)
