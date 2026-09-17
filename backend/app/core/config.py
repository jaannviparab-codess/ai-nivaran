"""Application configuration.

All configuration is read from environment variables (optionally via a local
``.env`` file) using pydantic-settings. Nothing is ever hard-coded here -- see
the root ``.env.example`` for the documented list of variables. Every field
below has a safe, demo-friendly default so the API can boot with zero
external configuration.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (this file lives at backend/app/core/config.py)
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # -- General ---------------------------------------------------------
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Nivaran AI"

    # -- Security ---------------------------------------------------------
    SECRET_KEY: str = "replace-with-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # -- Database -----------------------------------------------------------
    DATABASE_URL: str = "postgresql+psycopg://nivaran:nivaran@localhost:5432/nivaran_ai"
    POSTGRES_USER: str = "nivaran"
    POSTGRES_PASSWORD: str = "nivaran"
    POSTGRES_DB: str = "nivaran_ai"

    # -- Redis / Celery -----------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"

    # -- CORS -----------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:3000"

    # -- File uploads ---------------------------------------------------------
    MAX_UPLOAD_SIZE_MB: int = 8
    UPLOAD_DIR: str = "./uploads"

    # -- AI provider abstraction ----------------------------------------------
    AI_PROVIDER: str = "demo"  # demo | openai | anthropic
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    VISION_PROVIDER: str = "demo"  # demo | openai
    SPEECH_PROVIDER: str = "demo"  # demo | openai

    # OpenAI model names (only used when AI_PROVIDER/VISION_PROVIDER=openai)
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_VISION_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Anthropic model name (only used when AI_PROVIDER=anthropic)
    ANTHROPIC_CHAT_MODEL: str = "claude-3-5-haiku-latest"

    # -- Priority engine weights (should sum to ~1.0) --------------------------
    PRIORITY_WEIGHT_SEVERITY: float = 0.30
    PRIORITY_WEIGHT_SAFETY: float = 0.25
    PRIORITY_WEIGHT_AFFECTED: float = 0.20
    PRIORITY_WEIGHT_DURATION: float = 0.15
    PRIORITY_WEIGHT_LOCATION: float = 0.10

    # -- Duplicate detection --------------------------------------------------
    # New, genuinely-needed settings not in the original .env.example (appended there too).
    DUPLICATE_RADIUS_METERS: float = 350.0
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.20
    REOPEN_CONFIRMATION_THRESHOLD: int = 3

    # -- Automation (Celery beat) ----------------------------------------------
    FOLLOWUP_INACTIVITY_DAYS: int = 7
    ESCALATION_INACTIVITY_DAYS: int = 14

    # -- Rate limiting ----------------------------------------------------------
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def upload_dir_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            path = (BASE_DIR / path).resolve()
        return path

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
