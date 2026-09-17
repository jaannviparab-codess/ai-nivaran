"""Image upload handling: decode a base64 (optionally data-URL prefixed)
image, validate it's a genuine, reasonably-sized image, and persist it under
UPLOAD_DIR so it is served back via the mounted /uploads static route.
"""
from __future__ import annotations

import base64
import binascii
import io
import re
import uuid

from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.errors import ApiException

_DATA_URL_RE = re.compile(r"^data:(?P<mime>[\w/+.-]+);base64,(?P<data>.+)$", re.DOTALL)

_EXT_BY_FORMAT = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
    "GIF": "gif",
    "BMP": "bmp",
}


def _decode_base64_payload(raw: str) -> bytes:
    match = _DATA_URL_RE.match(raw.strip())
    payload = match.group("data") if match else raw.strip()
    try:
        return base64.b64decode(payload, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise ApiException("Uploaded image is not valid base64 data.", status_code=400, code="INVALID_IMAGE") from exc


def get_image_bytes(raw: str) -> bytes:
    """Decode a base64/data-URL image string to raw bytes without saving --
    used by the vision service's demo hashing path and by AI analysis."""
    return _decode_base64_payload(raw)


def save_base64_image(raw: str, subdir: str = "issues") -> str:
    """Decode+validate a base64 (optionally data-URL prefixed) image, save it
    under ``UPLOAD_DIR/subdir``, and return a URL path (e.g.
    "/uploads/issues/xyz.jpg") servable via the static mount in app.main.

    Raises ``ApiException`` (400) if the payload is missing, too large, or not
    a genuine image -- callers get a clean validation error, never a 500.
    """
    if not raw:
        raise ApiException("No image data provided.", status_code=400, code="INVALID_IMAGE")

    image_bytes = _decode_base64_payload(raw)

    if len(image_bytes) == 0:
        raise ApiException("Uploaded image is empty.", status_code=400, code="INVALID_IMAGE")
    if len(image_bytes) > settings.max_upload_size_bytes:
        raise ApiException(
            f"Image exceeds the maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            status_code=400,
            code="IMAGE_TOO_LARGE",
        )

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()  # raises if this isn't a genuine, undamaged image
        # Re-open after verify() (which leaves the handle unusable for further
        # reads) purely to read the detected format for the file extension.
        with Image.open(io.BytesIO(image_bytes)) as img2:
            fmt = (img2.format or "JPEG").upper()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ApiException("Uploaded file is not a valid image.", status_code=400, code="INVALID_IMAGE") from exc

    ext = _EXT_BY_FORMAT.get(fmt, "jpg")
    filename = f"{uuid.uuid4().hex}.{ext}"

    target_dir = settings.upload_dir_path / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / filename).write_bytes(image_bytes)

    return f"/uploads/{subdir}/{filename}"
