"""Auth business logic."""
from server.core.security import create_access_token, get_password_hash, verify_password
from server.models.schemas import LoginResponse, ProfileDto, UserDto
from server.requests.user_repository import (
    create_user,
    find_user_by_email,
    find_user_by_username,
)


class AuthError(Exception):
    """Auth-related error."""
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code


async def register_user(
    email: str,
    password: str,
    username: str,
    display_name: str,
) -> LoginResponse:
    existing = await find_user_by_email(email)
    if existing:
        raise AuthError("Email already registered", 400)

    existing_username = await find_user_by_username(username)
    if existing_username:
        raise AuthError("Username already taken", 400)

    hashed = get_password_hash(password)
    doc = await create_user(
        email=email,
        username=username,
        display_name=display_name,
        hashed_password=hashed,
    )

    user_id = doc["_id"]
    token = create_access_token(data={"sub": user_id, "email": email})

    return LoginResponse(
        token=token,
        user=UserDto(id=user_id, email=doc["email"]),
        profile=ProfileDto(
            id=user_id,
            user_id=user_id,
            username=doc["username"],
            display_name=doc["display_name"],
            avatar_url=doc.get("avatar_url"),
            font_size=doc.get("font_size", "medium"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        ),
    )


async def login_user(email: str, password: str) -> LoginResponse:
    doc = await find_user_by_email(email)
    if not doc:
        raise AuthError("Invalid email or password")

    if not verify_password(password, doc["password_hash"]):
        raise AuthError("Invalid email or password")

    user_id = doc["_id"]
    token = create_access_token(data={"sub": user_id, "email": doc["email"]})

    return LoginResponse(
        token=token,
        user=UserDto(id=user_id, email=doc["email"]),
        profile=ProfileDto(
            id=user_id,
            user_id=user_id,
            username=doc["username"],
            display_name=doc["display_name"],
            avatar_url=doc.get("avatar_url"),
            font_size=doc.get("font_size", "medium"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        ),
    )
