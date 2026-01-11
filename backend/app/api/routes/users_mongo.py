"""
Users routes for MongoDB
Replaces users.py (PostgreSQL version)
"""
from fastapi import APIRouter, HTTPException
from typing import Any

from app.api.deps_mongo import CurrentUser
from app.core.security import verify_password, get_password_hash
from app.models_mongo import (
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdateMe,
)
from app.services.UserServicesMongo import (
    create_user,
    get_user_by_email,
    update_user,
    user_exists,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/signup", response_model=UserPublic)
async def register_chatbot_creator(user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    if await user_exists(email=user_in.email):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )

    user_create = UserCreate.model_validate(user_in)
    user_create.is_chatbot_creator = True
    user_create.is_first_login = False
    user = await create_user(user_create=user_create)
    return user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    *, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """
    if user_in.email:
        existing_user = await get_user_by_email(email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    
    # Create UserUpdate from UserUpdateMe
    from app.models_mongo import UserUpdate
    user_update = UserUpdate(**user_in.model_dump(exclude_unset=True))
    
    updated_user = await update_user(db_user=current_user, user_in=user_update)
    return updated_user


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    *, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    
    from app.models_mongo import UserUpdate
    user_update = UserUpdate(password=body.new_password)
    if current_user.is_first_login:
        user_update.is_first_login = False
    
    await update_user(db_user=current_user, user_in=user_update)
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user

