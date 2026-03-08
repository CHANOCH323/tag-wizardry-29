"""Auth router - login, register, logout, password."""
from fastapi import APIRouter, Depends, HTTPException

from server.business.auth_service import AuthError, login_user, register_user
from server.core.security import get_password_hash
from server.models.schemas import ChangePasswordRequest, LoginRequest, LoginResponse, RegisterRequest
from server.routers.dependencies import get_current_user_id
from server.requests.user_repository import update_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    try:
        return await login_user(req.email, req.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest):
    try:
        return await register_user(
            email=req.email,
            password=req.password,
            username=req.username,
            display_name=req.display_name,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/logout")
async def logout():
    return {"success": True}


@router.put("/password")
async def change_password(
    body: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
):
    hashed = get_password_hash(body.password)
    await update_user(user_id, password_hash=hashed)
    return {"success": True}
