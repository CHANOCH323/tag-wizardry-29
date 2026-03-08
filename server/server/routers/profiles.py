"""Profile router."""
from fastapi import APIRouter, Depends, HTTPException

from server.business.profile_service import ProfileError, get_profile, list_profiles, update_profile
from server.models.schemas import ProfileDto, ProfileListItemDto, UpdateProfileRequest
from server.routers.dependencies import get_current_user_id

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileDto)
async def get_current_profile(user_id: str = Depends(get_current_user_id)):
    try:
        return await get_profile(user_id)
    except ProfileError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("", response_model=ProfileDto)
async def patch_profile(
    data: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return await update_profile(user_id, data)
    except ProfileError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


profiles_list_router = APIRouter(prefix="/profiles", tags=["profile"])


@profiles_list_router.get("", response_model=list[ProfileListItemDto])
async def get_all_profiles(user_id: str = Depends(get_current_user_id)):
    return await list_profiles()
