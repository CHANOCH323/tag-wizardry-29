"""Cubes router - MOCK list."""
from fastapi import APIRouter, Depends

from server.business.cubes_service import list_cubes
from server.models.schemas import CubeDto
from server.routers.dependencies import get_current_user_id

router = APIRouter(prefix="/cubes", tags=["cubes"])


@router.get("", response_model=list[CubeDto])
async def get_cubes(user_id: str = Depends(get_current_user_id)):
    return await list_cubes()
