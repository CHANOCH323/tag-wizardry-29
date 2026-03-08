"""Profile business logic."""
from server.models.schemas import ProfileDto, ProfileListItemDto, UpdateProfileRequest
from server.requests.user_repository import (
    find_user_by_id,
    get_all_profiles,
    update_user,
)


class ProfileError(Exception):
    def __init__(self, message: str, status_code: int = 404):
        self.message = message
        self.status_code = status_code


async def get_profile(user_id: str) -> ProfileDto:
    doc = await find_user_by_id(user_id)
    if not doc:
        raise ProfileError("Profile not found")

    return ProfileDto(
        id=doc["_id"],
        user_id=doc["_id"],
        username=doc["username"],
        display_name=doc["display_name"],
        avatar_url=doc.get("avatar_url"),
        font_size=doc.get("font_size", "medium"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def update_profile(user_id: str, data: UpdateProfileRequest) -> ProfileDto:
    doc = await update_user(
        user_id,
        display_name=data.display_name,
        avatar_url=data.avatar_url,
        font_size=data.font_size,
    )
    if not doc:
        raise ProfileError("Profile not found")

    return ProfileDto(
        id=doc["_id"],
        user_id=doc["_id"],
        username=doc["username"],
        display_name=doc["display_name"],
        avatar_url=doc.get("avatar_url"),
        font_size=doc.get("font_size", "medium"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def list_profiles() -> list[ProfileListItemDto]:
    return await get_all_profiles()
