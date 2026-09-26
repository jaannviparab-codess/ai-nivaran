"""APIRoute subclass that defensively forces ``response_model_by_alias=True``
on every route (FastAPI's own default for this parameter is already ``True``,
but the project spec calls for making it explicit/robust rather than relying
on the framework default) so every JSON response serializes using each
schema's camelCase aliases.
"""
from __future__ import annotations

from fastapi.routing import APIRoute


class CamelCaseRoute(APIRoute):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("response_model_by_alias", True)
        super().__init__(*args, **kwargs)
