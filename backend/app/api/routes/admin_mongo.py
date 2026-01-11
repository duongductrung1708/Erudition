"""
Admin routes for MongoDB
Replaces admin.py (PostgreSQL version)
"""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps_mongo import (
    CurrentUser,
    get_current_active_admin,
)
from app.models_mongo import (
    Message,
    UserPublic,
    UsersPublic,
    UserUpdate,
)
from app.services.UserServicesMongo import (
    get_users,
    get_user_by_id,
    update_user,
    delete_user,
    get_user_by_email,
)
from app.services.ChatbotServicesMongo import ChatbotServicesMongo

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get(
    "/get_users",
    dependencies=[Depends(get_current_active_admin)],
    response_model=UsersPublic,
)
async def get_users_route(skip: int = 0, limit: int = 999) -> Any:
    """
    Retrieve users.
    """
    users = await get_users(skip=skip, limit=limit)
    count = len(users)  # TODO: Implement count_documents for accurate count
    
    return UsersPublic(data=[UserPublic(**user.model_dump()) for user in users], count=count)


@router.get(
    "/get_user/{user_id}",
    dependencies=[Depends(get_current_active_admin)],
    response_model=UserPublic
)
async def read_user_by_id(
    user_id: str, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = await get_user_by_id(user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    return user


@router.patch(
    "/update_user/{user_id}",
    dependencies=[Depends(get_current_active_admin)],
    response_model=UserPublic,
)
async def update_user_route(
    *,
    user_id: str,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """
    db_user = await get_user_by_id(user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = await get_user_by_email(email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    updated_user = await update_user(db_user=db_user, user_in=user_in)
    return updated_user


@router.delete(
    "/delete_user/{user_id}",
    dependencies=[Depends(get_current_active_admin)]
)
async def delete_user_route(
    current_user: CurrentUser, user_id: str
) -> Message:
    """
    Delete a user.
    """
    user = await get_user_by_id(user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Users are not allowed to delete themselves"
        )
    
    await delete_user(user_id=user_id)
    return Message(message="User deleted successfully")


@router.get(
    "/get_chatbots",
    dependencies=[Depends(get_current_active_admin)]
)
async def get_all_chatbots() -> Any:
    """
    Get all chatbots (admin only)
    """
    # Get all chatbots from all users
    from app.db_context.MongoDbContext import mongo_context
    
    cursor = mongo_context.chatbots.find({"is_deleted": False})
    chatbots = []
    async for chatbot_doc in cursor:
        if "_id" in chatbot_doc:
            chatbot_doc["id"] = str(chatbot_doc["_id"])
            del chatbot_doc["_id"]
        from app.models_mongo import Chatbot
        chatbots.append(Chatbot(**chatbot_doc))
    
    return chatbots


@router.get(
    "/get_chatbot/{chatbot_id}",
    dependencies=[Depends(get_current_active_admin)]
)
async def get_chatbot_by_id_admin(chatbot_id: str) -> Any:
    """
    Get chatbot by ID (admin only)
    """
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot


@router.patch(
    "/activate_chatbot/{chatbot_id}",
    dependencies=[Depends(get_current_active_admin)]
)
async def activate_chatbot_admin(chatbot_id: str) -> Message:
    """
    Activate chatbot (admin only)
    """
    success = await ChatbotServicesMongo.activate_chatbot_by_id(chatbot_id=chatbot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return Message(message="Chatbot activated successfully")


@router.patch(
    "/deactivate_chatbot/{chatbot_id}",
    dependencies=[Depends(get_current_active_admin)]
)
async def deactivate_chatbot_admin(chatbot_id: str) -> Message:
    """
    Deactivate chatbot (admin only)
    """
    success = await ChatbotServicesMongo.deactivate_chatbot_by_id(chatbot_id=chatbot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return Message(message="Chatbot deactivated successfully")

