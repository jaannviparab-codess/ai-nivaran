"""FastAPI application entrypoint.

Run standalone with:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded

from app.api.routes import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.rate_limit import limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nivaran")

app = FastAPI(
    title=settings.APP_NAME,
    description="Nivaran AI (निवारण AI) civic-issue-reporting platform API.",
    version="1.0.0",
)

# --- Rate limiting (slowapi) -------------------------------------------------
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"message": "Too many requests. Please slow down and try again shortly.", "code": "RATE_LIMITED"},
    )


# --- Standardized error responses -------------------------------------------
register_exception_handlers(app)

# --- CORS --------------------------------------------------------------------
# Never wildcard "*" here: allow_credentials=True requires an explicit origin
# list, which is exactly what CORS_ORIGINS provides.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Uploaded / placeholder images, served back as real reachable URLs -------
settings.upload_dir_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir_path)), name="uploads")

# --- API routes ----------------------------------------------------------------
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["meta"])
def root() -> dict:
    return {"name": settings.APP_NAME, "status": "ok", "environment": settings.ENVIRONMENT, "docs": "/docs"}


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
