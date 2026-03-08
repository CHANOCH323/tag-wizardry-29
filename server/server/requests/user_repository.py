"""User/Profile MongoDB repository."""
from datetime import datetime, timezone
from uuid import uuid4

from server.core.database import get_database
from server.models.schemas import ProfileListItemDto


COLLECTION = "users"


async def create_user(
    *,
    email: str,
    username: str,
    display_name: str,
    hashed_password: str,
) -> dict:
    db = await get_database()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "email": email,
        "username": username,
        "display_name": display_name,
        "password_hash": hashed_password,
        "avatar_url": None,
        "font_size": "medium",
        "created_at": now,
        "updated_at": now,
    }
    await db[COLLECTION].insert_one(doc)
    return doc


async def find_user_by_email(email: str) -> dict | None:
    db = await get_database()
    return await db[COLLECTION].find_one({"email": email})


async def find_user_by_id(user_id: str) -> dict | None:
    db = await get_database()
    return await db[COLLECTION].find_one({"_id": user_id})


async def find_user_by_username(username: str) -> dict | None:
    db = await get_database()
    return await db[COLLECTION].find_one({"username": username})


async def update_user(
    user_id: str,
    *,
    display_name: str | None = None,
    avatar_url: str | None = None,
    font_size: str | None = None,
    password_hash: str | None = None,
) -> dict | None:
    db = await get_database()
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if display_name is not None:
        updates["display_name"] = display_name
    if avatar_url is not None:
        updates["avatar_url"] = avatar_url
    if font_size is not None:
        updates["font_size"] = font_size
    if password_hash is not None:
        updates["password_hash"] = password_hash

    result = await db[COLLECTION].find_one_and_update(
        {"_id": user_id},
        {"$set": updates},
        return_document=True,
    )
    return result


async def get_all_profiles() -> list[ProfileListItemDto]:
    db = await get_database()
    cursor = db[COLLECTION].find({}, {"_id": 1, "display_name": 1, "avatar_url": 1})
    items = []
    async for doc in cursor:
        items.append(
            ProfileListItemDto(
                user_id=doc["_id"],
                display_name=doc.get("display_name", ""),
                avatar_url=doc.get("avatar_url"),
            )
        )
    return items
