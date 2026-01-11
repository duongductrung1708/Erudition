"""
User Services for MongoDB
Replaces UserServices.py (PostgreSQL version)
"""
import secrets
import uuid
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from app.core.security import get_password_hash, verify_password
from app.db_context.MongoDbContext import mongo_context
from app.models_mongo import User, UserCreate, UserUpdate


async def create_user(*, user_create: UserCreate) -> User:
    """Create a new user in MongoDB"""
    user_dict = user_create.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_create.password)
    user_id = str(uuid.uuid4())
    user_dict["id"] = user_id
    user_dict["created_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    user_dict["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    user_dict["owned_chatbot_ids"] = []
    user_dict["invited_chatbot_ids"] = []
    
    # Remove password from dict (already hashed)
    user_dict.pop("password", None)
    
    # Create user document
    await mongo_context.users.insert_one(user_dict)
    
    return User(**user_dict)


async def create_user_google(email: str, full_name: str) -> User:
    """Create user from Google OAuth"""
    random_password = secrets.token_urlsafe(32)
    hashed_password = get_password_hash(random_password)
    
    user_dict = {
        "id": None,  # Will be set after insert
        "email": email,
        "full_name": full_name,
        "is_active": True,
        "is_chatbot_creator": True,
        "is_admin": False,
        "is_first_login": False,
        "hashed_password": hashed_password,
        "created_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")),
        "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")),
        "owned_chatbot_ids": [],
        "invited_chatbot_ids": []
    }
    
    result = await mongo_context.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return User(**user_dict)


async def update_user(*, db_user: User, user_in: UserUpdate) -> User:
    """Update user in MongoDB"""
    update_data = user_in.model_dump(exclude_unset=True, exclude={"password"})
    
    # Handle password update
    if user_in.password:
        update_data["hashed_password"] = get_password_hash(user_in.password)
    
    update_data["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    
    # Update in MongoDB
    await mongo_context.users.update_one(
        {"id": db_user.id},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = await get_user_by_id(user_id=db_user.id)
    return updated_user


async def get_user_by_email(*, email: str) -> User | None:
    """Get user by email from MongoDB"""
    user_doc = await mongo_context.users.find_one({"email": email})
    if not user_doc:
        return None
    
    # Convert MongoDB _id to id if needed
    if "_id" in user_doc and "id" not in user_doc:
        user_doc["id"] = str(user_doc["_id"])
    if "_id" in user_doc:
        del user_doc["_id"]
    
    return User(**user_doc)


async def get_user_by_id(*, user_id: str) -> User | None:
    """Get user by ID from MongoDB"""
    user_doc = await mongo_context.users.find_one({"id": user_id})
    if not user_doc:
        # Try with _id as fallback
        try:
            from bson import ObjectId
            user_doc = await mongo_context.users.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                user_doc["id"] = str(user_doc["_id"])
        except:
            pass
    
    if not user_doc:
        return None
    
    if "_id" in user_doc:
        del user_doc["_id"]
    
    return User(**user_doc)


async def authenticate(*, email: str, password: str) -> User | None:
    """Authenticate user"""
    db_user = await get_user_by_email(email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


async def get_users(skip: int = 0, limit: int = 100) -> list[User]:
    """Get list of users"""
    cursor = mongo_context.users.find().skip(skip).limit(limit)
    users = []
    async for user_doc in cursor:
        if "_id" in user_doc:
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]
        users.append(User(**user_doc))
    return users


async def delete_user(*, user_id: str) -> bool:
    """Delete user by ID"""
    result = await mongo_context.users.delete_one({"id": user_id})
    return result.deleted_count > 0


async def user_exists(*, email: str) -> bool:
    """Check if user exists by email"""
    count = await mongo_context.users.count_documents({"email": email})
    return count > 0

