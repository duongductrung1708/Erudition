"""
Favorite Message Services for MongoDB
Replaces FavMsgServices.py (PostgreSQL version)
"""
import uuid
from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo

from app.db_context.MongoDbContext import mongo_context, mongo_db_context
from app.models_mongo import FavoriteMessage, FavoriteMessageCreate


class FavMsgServicesMongo:

    @staticmethod
    async def get_user_favorite_messages(
        user_id: str,
        chatbot_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> dict:
        """Get user's favorite messages"""
        # Get favorite messages
        cursor = mongo_context.favorite_messages.find({
            "user_id": user_id,
            "chatbot_id": chatbot_id
        }).skip(skip).limit(limit).sort("created_at", -1)
        
        favorites = []
        async for fav_doc in cursor:
            if "_id" in fav_doc:
                if "id" not in fav_doc:
                    fav_doc["id"] = str(fav_doc["_id"])
                del fav_doc["_id"]
            favorites.append(FavoriteMessage(**fav_doc))
        
        # Get message details from MongoDB conversations
        message_ids = [fav.chatbot_response_id for fav in favorites]
        messages = []
        if message_ids:
            try:
                messages = await mongo_db_context.get_messages_by_ids(message_ids)
            except Exception:
                # If get_messages_by_ids doesn't exist or fails, return empty
                messages = []
        
        return {
            "favorites": [fav.model_dump() for fav in favorites],
            "messages": messages,
            "count": len(favorites)
        }

    @staticmethod
    async def add_favorite(
        user_id: str,
        chatbot_id: str,
        message_id: str
    ) -> FavoriteMessage:
        """Add a message to favorites"""
        # Check if already favorited
        existing = await mongo_context.favorite_messages.find_one({
            "user_id": user_id,
            "chatbot_id": chatbot_id,
            "chatbot_response_id": message_id
        })
        
        if existing:
            if "_id" in existing:
                existing["id"] = str(existing["_id"])
                del existing["_id"]
            return FavoriteMessage(**existing)
        
        # Create new favorite
        fav_dict = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "chatbot_id": chatbot_id,
            "chatbot_response_id": message_id,
            "created_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        }
        
        await mongo_context.favorite_messages.insert_one(fav_dict)
        return FavoriteMessage(**fav_dict)

    @staticmethod
    async def delete_favorite_by_id(favorite_id: str) -> bool:
        """Delete favorite by ID"""
        result = await mongo_context.favorite_messages.delete_one({"id": favorite_id})
        return result.deleted_count > 0

    @staticmethod
    async def get_favorite_by_id(favorite_id: str) -> FavoriteMessage | None:
        """Get favorite by ID"""
        fav_doc = await mongo_context.favorite_messages.find_one({"id": favorite_id})
        if not fav_doc:
            return None
        
        if "_id" in fav_doc:
            fav_doc["id"] = str(fav_doc["_id"])
            del fav_doc["_id"]
        
        return FavoriteMessage(**fav_doc)

    @staticmethod
    async def get_favorites_by_message_id(message_response_id: str) -> List[FavoriteMessage]:
        """Get all favorites for a message"""
        cursor = mongo_context.favorite_messages.find({"chatbot_response_id": message_response_id})
        favorites = []
        async for fav_doc in cursor:
            if "_id" in fav_doc:
                fav_doc["id"] = str(fav_doc["_id"])
                del fav_doc["_id"]
            favorites.append(FavoriteMessage(**fav_doc))
        return favorites

