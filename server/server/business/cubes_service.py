"""Cubes business logic - MOCK list."""
from server.models.schemas import CubeDto
from server.requests.cubes_repository import get_all_cubes


async def list_cubes() -> list[CubeDto]:
    return await get_all_cubes()
