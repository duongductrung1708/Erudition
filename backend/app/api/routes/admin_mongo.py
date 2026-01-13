"""
Admin routes for MongoDB
Replaces admin.py (PostgreSQL version)
"""
import uuid
from datetime import datetime
from typing import Any, List
from zoneinfo import ZoneInfo

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
    TokenBundle,
    TokenBundleDTO,
)
from app.services.UserServicesMongo import (
    get_users,
    get_user_by_id,
    update_user,
    delete_user,
    get_user_by_email,
)
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.db_context.MongoDbContext import mongo_context

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


@router.post(
    "/activate_chatbot",
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


@router.post(
    "/deactivate_chatbot",
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


@router.delete(
    "/delete_chatbot",
    dependencies=[Depends(get_current_active_admin)]
)
async def delete_chatbot_admin(chatbot_id: str) -> Message:
    """
    Delete chatbot (admin only)
    """
    success = await ChatbotServicesMongo.delete_chatbot_by_id(chatbot_id=chatbot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return Message(message="Chatbot deleted successfully")


# ==================== TOKEN BUNDLE ROUTES ====================

@router.get(
    "/token_bundle",
    dependencies=[Depends(get_current_active_admin)],
    response_model=List[TokenBundle]
)
async def get_token_bundles() -> Any:
    """
    Get all token bundles (admin only)
    """
    from decimal import Decimal
    
    cursor = mongo_context.token_bundles.find({})
    bundles = []
    async for bundle_doc in cursor:
        if "_id" in bundle_doc:
            if "id" not in bundle_doc or bundle_doc.get("id") is None:
                bundle_doc["id"] = str(bundle_doc["_id"])
            del bundle_doc["_id"]
        
        # Convert float to Decimal for response model (MongoDB stores as float)
        if isinstance(bundle_doc.get("price"), float):
            bundle_doc["price"] = Decimal(str(bundle_doc["price"]))
        
        bundles.append(TokenBundle(**bundle_doc))
    return bundles


@router.post(
    "/create_token_bundle",
    dependencies=[Depends(get_current_active_admin)],
    response_model=TokenBundle
)
async def create_token_bundle(bundle: TokenBundleDTO) -> Any:
    """
    Create a new token bundle (admin only)
    """
    from decimal import Decimal
    
    bundle_dict = bundle.model_dump()
    # Convert Decimal to float for MongoDB compatibility
    if isinstance(bundle_dict.get("price"), Decimal):
        bundle_dict["price"] = float(bundle_dict["price"])
    
    bundle_id = str(uuid.uuid4())
    bundle_dict["id"] = bundle_id
    bundle_dict["created_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    bundle_dict["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    
    await mongo_context.token_bundles.insert_one(bundle_dict)
    
    # Convert back to Decimal for response model
    if isinstance(bundle_dict.get("price"), float):
        bundle_dict["price"] = Decimal(str(bundle_dict["price"]))
    
    return TokenBundle(**bundle_dict)


@router.put(
    "/token_bundle/{bundle_id}",
    dependencies=[Depends(get_current_active_admin)],
    response_model=TokenBundle
)
async def update_token_bundle(bundle_id: str, bundle: TokenBundleDTO) -> Any:
    """
    Update a token bundle (admin only)
    """
    from decimal import Decimal
    
    bundle_doc = await mongo_context.token_bundles.find_one({"id": bundle_id})
    if not bundle_doc:
        # Try with _id as fallback
        try:
            from bson import ObjectId
            bundle_doc = await mongo_context.token_bundles.find_one({"_id": ObjectId(bundle_id)})
            if bundle_doc:
                bundle_doc["id"] = str(bundle_doc["_id"])
        except:
            pass
    
    if not bundle_doc:
        raise HTTPException(status_code=404, detail="Token bundle not found")
    
    update_data = bundle.model_dump()
    # Convert Decimal to float for MongoDB compatibility
    if isinstance(update_data.get("price"), Decimal):
        update_data["price"] = float(update_data["price"])
    
    update_data["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    
    await mongo_context.token_bundles.update_one(
        {"id": bundle_id},
        {"$set": update_data}
    )
    
    # Fetch updated bundle
    updated_bundle = await mongo_context.token_bundles.find_one({"id": bundle_id})
    if "_id" in updated_bundle:
        if "id" not in updated_bundle or updated_bundle.get("id") is None:
            updated_bundle["id"] = str(updated_bundle["_id"])
        del updated_bundle["_id"]
    
    # Convert float back to Decimal for response model
    if isinstance(updated_bundle.get("price"), float):
        updated_bundle["price"] = Decimal(str(updated_bundle["price"]))
    
    return TokenBundle(**updated_bundle)


@router.delete(
    "/token_bundle/{bundle_id}",
    dependencies=[Depends(get_current_active_admin)]
)
async def delete_token_bundle(bundle_id: str) -> Message:
    """
    Delete a token bundle (admin only)
    """
    bundle_doc = await mongo_context.token_bundles.find_one({"id": bundle_id})
    if not bundle_doc:
        # Try with _id as fallback
        try:
            from bson import ObjectId
            bundle_doc = await mongo_context.token_bundles.find_one({"_id": ObjectId(bundle_id)})
        except:
            pass
    
    if not bundle_doc:
        raise HTTPException(status_code=404, detail="Token bundle not found")
    
    result = await mongo_context.token_bundles.delete_one({"id": bundle_id})
    if result.deleted_count == 0:
        # Try with _id
        try:
            from bson import ObjectId
            result = await mongo_context.token_bundles.delete_one({"_id": ObjectId(bundle_id)})
        except:
            pass
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Token bundle not found")
    
    return Message(message="Token bundle deleted successfully")

