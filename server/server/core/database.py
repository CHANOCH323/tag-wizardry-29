"""MongoDB connection and database access."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from server.core.config import get_settings


_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    global _client, _db
    if _db is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongodb_url)
        _db = _client[settings.mongodb_db_name]
    return _db


async def close_database() -> None:
    """Close MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
