"""File upload router - local storage."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile

from server.core.config import get_settings
from server.routers.dependencies import get_current_user_id

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    bucket: str = Form(...),
    path: str = Form(...),
    user_id: str = Depends(get_current_user_id),
):
    settings = get_settings()
    upload_path = Path(settings.upload_dir) / bucket / path
    upload_path.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "file").suffix or ".bin"
    filename = f"{uuid.uuid4()}{ext}"
    dest = upload_path / filename
    dest.write_bytes(await file.read())

    url = f"{settings.upload_base_url}/{bucket}/{path}/{filename}"
    return {"url": url}
