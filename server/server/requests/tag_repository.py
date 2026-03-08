"""Tag and TagVersion MongoDB repository."""
from datetime import datetime, timezone
from uuid import uuid4

from server.core.database import get_database

TAGS_COLLECTION = "tags"
VERSIONS_COLLECTION = "tag_versions"


async def create_tag() -> dict:
    db = await get_database()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "created_at": now,
        "updated_at": now,
        "is_deleted": False,
    }
    await db[TAGS_COLLECTION].insert_one(doc)
    return doc


async def find_tag_by_id(tag_id: str, include_deleted: bool = False) -> dict | None:
    db = await get_database()
    q = {"_id": tag_id}
    if not include_deleted:
        q["is_deleted"] = False
    return await db[TAGS_COLLECTION].find_one(q)


async def soft_delete_tag(tag_id: str) -> bool:
    db = await get_database()
    result = await db[TAGS_COLLECTION].update_one(
        {"_id": tag_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
    )
    return result.modified_count > 0


async def update_tag_updated_at(tag_id: str) -> None:
    db = await get_database()
    await db[TAGS_COLLECTION].update_one(
        {"_id": tag_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}},
    )


async def list_tags() -> list[dict]:
    db = await get_database()
    cursor = db[TAGS_COLLECTION].find({"is_deleted": False}).sort("updated_at", -1)
    return [doc async for doc in cursor]


async def create_tag_version(
    *,
    tag_id: str,
    created_by: str,
    question: str,
    answer_type: str,
    free_text_content: str | None,
    cubes: list | None,
    top_x: int | None,
    total_weight_threshold: float | None,
    is_draft: bool,
    changed_fields: list[str],
) -> dict:
    db = await get_database()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid4()),
        "tag_id": tag_id,
        "created_by": created_by,
        "question": question,
        "answer_type": answer_type,
        "free_text_content": free_text_content,
        "cubes": cubes,
        "top_x": top_x,
        "total_weight_threshold": total_weight_threshold,
        "is_draft": is_draft,
        "changed_fields": changed_fields,
        "created_at": now,
    }
    await db[VERSIONS_COLLECTION].insert_one(doc)
    return doc


async def get_versions_by_tag(tag_id: str) -> list[dict]:
    db = await get_database()
    cursor = (
        db[VERSIONS_COLLECTION]
        .find({"tag_id": tag_id})
        .sort("created_at", -1)
    )
    return [doc async for doc in cursor]


async def get_latest_version(tag_id: str) -> dict | None:
    db = await get_database()
    return await db[VERSIONS_COLLECTION].find_one(
        {"tag_id": tag_id},
        sort=[("created_at", -1)],
    )
