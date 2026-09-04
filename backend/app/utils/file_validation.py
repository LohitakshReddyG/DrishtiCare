"""Shared upload validation for retinal fundus images."""

from fastapi import HTTPException, UploadFile

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png")
MAX_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB


def _has_allowed_extension(filename: str) -> bool:
    if not filename:
        return False
    return filename.lower().endswith(ALLOWED_EXTENSIONS)


async def read_validated_image_bytes(file: UploadFile) -> bytes:
    """Validate image type/size and return raw bytes."""
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES and not _has_allowed_extension(file.filename or ""):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPG or PNG image (max 15 MB).",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 15 MB.",
        )

    return contents
