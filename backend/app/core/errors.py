"""Standardized error handling.

Every error response returned by the API matches the frontend's ``ApiError``
shape:  ``{ message, code?, fieldErrors? }``.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("nivaran")


class ApiException(Exception):
    """Raised anywhere in the app to produce a clean {message, code} response."""

    def __init__(self, message: str, status_code: int = 400, code: str | None = None, field_errors: dict[str, str] | None = None):
        self.message = message
        self.status_code = status_code
        self.code = code or "ERROR"
        self.field_errors = field_errors
        super().__init__(message)


class NotFoundError(ApiException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND, code=code)


class UnauthorizedError(ApiException):
    def __init__(self, message: str = "Authentication required", code: str = "UNAUTHORIZED"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED, code=code)


class ForbiddenError(ApiException):
    def __init__(self, message: str = "You do not have permission to perform this action", code: str = "FORBIDDEN"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN, code=code)


class ConflictError(ApiException):
    def __init__(self, message: str = "Conflict", code: str = "CONFLICT"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, code=code)


def _error_body(message: str, code: str | None = None, field_errors: dict[str, Any] | None = None) -> dict[str, Any]:
    body: dict[str, Any] = {"message": message}
    if code:
        body["code"] = code
    if field_errors:
        body["fieldErrors"] = field_errors
    return body


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiException)
    async def api_exception_handler(request: Request, exc: ApiException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.message, exc.code, exc.field_errors),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(detail, code=f"HTTP_{exc.status_code}"),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        field_errors: dict[str, str] = {}
        for err in exc.errors():
            loc = [str(part) for part in err.get("loc", []) if part not in ("body", "query", "path")]
            field_name = ".".join(loc) or "body"
            field_errors[field_name] = err.get("msg", "Invalid value")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_body("Validation failed", code="VALIDATION_ERROR", field_errors=field_errors),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body("Internal server error", code="INTERNAL_ERROR"),
        )
