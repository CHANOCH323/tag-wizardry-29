"""Pydantic schemas for request/response - aligned with API contract."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str
    display_name: str


class UserDto(BaseModel):
    id: str
    email: str


class ProfileDto(BaseModel):
    id: str
    user_id: str
    username: str
    display_name: str
    avatar_url: str | None = None
    font_size: str | None = "medium"
    created_at: datetime
    updated_at: datetime


class ProfileListItemDto(BaseModel):
    user_id: str
    display_name: str
    avatar_url: str | None = None


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    font_size: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserDto
    profile: ProfileDto


class ChangePasswordRequest(BaseModel):
    password: str


# ---- Tags ----
class CubeEntryDto(BaseModel):
    cube_id: str
    cube_name: str
    weight: float


class TagDto(BaseModel):
    id: str
    question: str
    answer_type: Literal["cubes", "free_text"]
    cubes: list[CubeEntryDto] | None = None
    free_text_content: str | None = None
    is_draft: bool = False
    last_editor: str | None = None
    updated_at: datetime
    created_at: datetime
    version_count: int


class SaveTagRequest(BaseModel):
    tag_id: str | None = None
    question: str
    answer_type: Literal["cubes", "free_text"]
    free_text_content: str = ""
    cubes: list[CubeEntryDto] = Field(default_factory=list)
    top_x: int = 5
    total_weight_threshold: float = 80
    is_draft: bool = False


class CubeDto(BaseModel):
    id: str
    cube_id: str
    name: str


class VersionDto(BaseModel):
    id: str
    question: str
    answer_type: Literal["cubes", "free_text"]
    cubes: list[CubeEntryDto] | None = None
    free_text_content: str | None = None
    top_x: int | None = None
    total_weight_threshold: float | None = None
    is_draft: bool = False
    changed_fields: list[str] | None = None
    created_at: datetime
    created_by: str
    editor_name: str | None = None
