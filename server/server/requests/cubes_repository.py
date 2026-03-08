"""Cubes MongoDB repository (MOCK data)."""
from server.core.database import get_database
from server.models.schemas import CubeDto

COLLECTION = "cubes"

# Default MOCK cubes as per spec - json-server style
DEFAULT_CUBES = [
    {"_id": "c1", "cube_id": "philosophy", "name": "פילוסופיה"},
    {"_id": "c2", "cube_id": "science", "name": "מדע"},
    {"_id": "c3", "cube_id": "technology", "name": "טכנולוגיה"},
    {"_id": "c4", "cube_id": "history", "name": "היסטוריה"},
    {"_id": "c5", "cube_id": "art", "name": "אמנות"},
    {"_id": "c6", "cube_id": "literature", "name": "ספרות"},
    {"_id": "c7", "cube_id": "economics", "name": "כלכלה"},
    {"_id": "c8", "cube_id": "medicine", "name": "רפואה"},
]


async def ensure_cubes_collection() -> None:
    """Ensure cubes collection exists with MOCK data."""
    db = await get_database()
    count = await db[COLLECTION].count_documents({})
    if count == 0:
        await db[COLLECTION].insert_many(DEFAULT_CUBES)


async def get_all_cubes() -> list[CubeDto]:
    await ensure_cubes_collection()
    db = await get_database()
    cursor = db[COLLECTION].find({}).sort("name", 1)
    items = []
    async for doc in cursor:
        items.append(
            CubeDto(
                id=str(doc["_id"]),
                cube_id=doc["cube_id"],
                name=doc["name"],
            )
        )
    return items
