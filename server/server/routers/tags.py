"""Tags router."""
from fastapi import APIRouter, Depends, HTTPException

from server.business.tags_service import TagsError, delete_tag, get_latest_tag_version, get_tag_versions, list_tags_with_latest, save_tag
from server.models.schemas import SaveTagRequest, TagDto, VersionDto
from server.routers.dependencies import get_current_user_id

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagDto])
async def get_tags(user_id: str = Depends(get_current_user_id)):
    return await list_tags_with_latest()


@router.post("")
async def create_or_update_tag(
    req: SaveTagRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        success, tag_id = await save_tag(user_id, req)
        return {"success": success, "tag_id": tag_id}
    except TagsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{tag_id}")
async def soft_delete_tag(
    tag_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        await delete_tag(tag_id)
        return {"success": True}
    except TagsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{tag_id}/versions", response_model=list[VersionDto])
async def get_versions(
    tag_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return await get_tag_versions(tag_id)
    except TagsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{tag_id}/latest", response_model=VersionDto)
async def get_latest_version(
    tag_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return await get_latest_tag_version(tag_id)
    except TagsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
