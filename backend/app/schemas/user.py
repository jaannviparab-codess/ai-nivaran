from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.models.enums import UserRole
from app.schemas.base import CamelModel


class UserSchema(CamelModel):
    id: str
    email: EmailStr
    display_name: str
    role: UserRole
    created_at: datetime


class AuthResponse(CamelModel):
    user: UserSchema
    access_token: str


class RegisterRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
