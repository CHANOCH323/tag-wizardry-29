"""Tags business logic."""
from server.core.database import get_database
from server.models.schemas import (
    CubeEntryDto,
    SaveTagRequest,
    TagDto,
    VersionDto,
)
from server.requests.tag_repository import (
    append_version,
    create_tag,
    find_tag_by_id,
    get_latest_version_doc,
    get_versions_list,
    list_tags,
    soft_delete_tag,
)
from server.requests.user_repository import find_user_by_id


class TagsError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


def _to_cube_entries(cubes: list | None) -> list[CubeEntryDto] | None:
    if not cubes:
        return None
    return [
        CubeEntryDto(
            cube_id=c.get("cube_id", ""),
            cube_name=c.get("cube_name", ""),
            weight=c.get("weight", 0),
        )
        for c in cubes
    ]


def _version_to_dto(v: dict, editor_name: str | None) -> VersionDto:
    return VersionDto(
        id=v.get("id", v.get("_id", "")),
        question=v["question"],
        answer_type=v["answer_type"],
        cubes=_to_cube_entries(v.get("cubes")),
        free_text_content=v.get("free_text_content"),
        top_x=v.get("top_x"),
        total_weight_threshold=v.get("total_weight_threshold"),
        is_draft=v.get("is_draft", False),
        changed_fields=v.get("changed_fields"),
        created_at=v["created_at"],
        created_by=v["created_by"],
        editor_name=editor_name,
    )


async def _get_editor_name(user_id: str) -> str | None:
    user = await find_user_by_id(user_id)
    return user.get("display_name") if user else None


async def list_tags_with_latest() -> list[TagDto]:
    tags = await list_tags()
    result = []
    for tag in tags:
        versions = tag.get("versions", [])
        if not versions:
            continue
        latest = versions[0]
        editor_name = await _get_editor_name(latest["created_by"])
        result.append(
            TagDto(
                id=tag["_id"],
                question=latest["question"],
                answer_type=latest["answer_type"],
                cubes=_to_cube_entries(latest.get("cubes")),
                free_text_content=latest.get("free_text_content"),
                is_draft=latest.get("is_draft", False),
                last_editor=editor_name,
                updated_at=tag["updated_at"],
                created_at=tag["created_at"],
                version_count=len(versions),
            )
        )
    return result


def _cubes_diff(a: list | None, b: list[CubeEntryDto]) -> bool:
    if not a and not b:
        return False
    if not a or not b:
        return True
    a_list = [(c.get("cube_id"), c.get("cube_name"), c.get("weight", 0)) for c in a]
    b_list = [(c.cube_id, c.cube_name, c.weight) for c in b]
    return a_list != b_list


async def save_tag(user_id: str, req: SaveTagRequest) -> tuple[bool, str]:
    if not req.is_draft:
        if not req.question or not req.question.strip():
            raise TagsError("Question is required when not draft")
        if req.answer_type == "cubes":
            if not req.cubes:
                raise TagsError("At least one cube is required for cubes type")
            total = sum(c.weight for c in req.cubes)
            if abs(total - 100) > 0.01:
                raise TagsError("Cube weights must sum to 100%")
        elif req.answer_type == "free_text":
            if not (req.free_text_content or "").strip():
                raise TagsError("Free text content is required for free_text type")

    tag_id = req.tag_id
    changed_fields: list[str] = []

    if tag_id:
        tag = await find_tag_by_id(tag_id)
        if not tag:
            raise TagsError("Tag not found", 404)
        versions = tag.get("versions", [])
        prev = versions[0] if versions else None
        if prev:
            if prev["question"] != req.question:
                changed_fields.append("question")
            if (
                prev["answer_type"] != req.answer_type
                or _cubes_diff(prev.get("cubes"), req.cubes)
                or (prev.get("free_text_content") or "") != (req.free_text_content or "")
            ):
                changed_fields.append("answer")
        else:
            changed_fields = ["question", "answer"]
    else:
        tag = await create_tag()
        tag_id = tag["_id"]
        changed_fields = ["question", "answer"]

    cubes_data = None
    if req.answer_type == "cubes" and req.cubes:
        cubes_data = [c.model_dump() for c in req.cubes]

    await append_version(
        tag_id=tag_id,
        created_by=user_id,
        question=req.question,
        answer_type=req.answer_type,
        free_text_content=req.free_text_content if req.answer_type == "free_text" else None,
        cubes=cubes_data,
        top_x=req.top_x if req.answer_type == "cubes" else None,
        total_weight_threshold=req.total_weight_threshold if req.answer_type == "cubes" else None,
        is_draft=req.is_draft,
        changed_fields=changed_fields,
    )

    return True, tag_id


async def delete_tag(tag_id: str) -> bool:
    tag = await find_tag_by_id(tag_id)
    if not tag:
        raise TagsError("Tag not found", 404)
    return await soft_delete_tag(tag_id)


async def get_tag_versions(tag_id: str) -> list[VersionDto]:
    tag = await find_tag_by_id(tag_id)
    if not tag:
        raise TagsError("Tag not found", 404)

    versions = await get_versions_list(tag_id)
    result = []
    for v in versions:
        editor_name = await _get_editor_name(v["created_by"])
        result.append(_version_to_dto(v, editor_name))
    return result


async def get_latest_tag_version(tag_id: str) -> VersionDto:
    tag = await find_tag_by_id(tag_id)
    if not tag:
        raise TagsError("Tag not found", 404)

    v = await get_latest_version_doc(tag_id)
    if not v:
        raise TagsError("No versions found", 404)

    editor_name = await _get_editor_name(v["created_by"])
    return _version_to_dto(v, editor_name)
