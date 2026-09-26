"""Shared Pydantic base so every schema serializes to/from camelCase JSON
while Python code everywhere else stays snake_case.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class CamelRequestModel(CamelModel):
    """Same as CamelModel; kept as a distinct alias for request-only schemas
    so it's obvious at a glance which schemas are inbound vs outbound."""
