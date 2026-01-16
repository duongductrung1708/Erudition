"""
Chatbot Services for MongoDB
Replaces ChatbotServices.py (PostgreSQL version)
"""
import uuid
from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo

from app.db_context.MongoDbContext import mongo_context
from app.models_mongo import Chatbot, ChatbotDTO, UserChatbotLink


class ChatbotServicesMongo:

    @staticmethod
    async def create_chatbot(new_chatbot: Chatbot) -> Chatbot:
        """Create a new chatbot"""
        chatbot_dict = new_chatbot.model_dump()
        chatbot_id = str(uuid.uuid4())
        chatbot_dict["id"] = chatbot_id
        chatbot_dict["created_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        chatbot_dict["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        chatbot_dict["document_ids"] = []
        chatbot_dict["conversation_ids"] = []
        chatbot_dict["faq_ids"] = []
        chatbot_dict["invited_user_ids"] = []
        
        await mongo_context.chatbots.insert_one(chatbot_dict)
        
        # Update user's owned_chatbot_ids
        await mongo_context.users.update_one(
            {"id": new_chatbot.owner_id},
            {"$push": {"owned_chatbot_ids": chatbot_id}}
        )
        
        # Fetch the created chatbot to ensure we return the correct format
        # This ensures _id is removed and only id (UUID) is returned
        return await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)

    @staticmethod
    async def update_chatbot(chatbot_id: str, chatbot_data: ChatbotDTO) -> Chatbot:
        """Update chatbot"""
        update_data = chatbot_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        
        await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {"$set": update_data}
        )
        
        return await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)

    @staticmethod
    async def get_chatbots_by_owner_id(owner_id: str) -> List[Chatbot]:
        """Get all chatbots owned by a user"""
        cursor = mongo_context.chatbots.find({
            "owner_id": owner_id,
            "is_deleted": False
        })
        chatbots = []
        async for chatbot_doc in cursor:
            # Only convert _id to id if id doesn't exist
            # Don't overwrite existing id (UUID) with _id (ObjectId)
            if "id" not in chatbot_doc or chatbot_doc.get("id") is None:
                if "_id" in chatbot_doc:
                    chatbot_doc["id"] = str(chatbot_doc["_id"])
            
            # Remove _id to avoid conflicts
            if "_id" in chatbot_doc:
                del chatbot_doc["_id"]
            chatbots.append(Chatbot(**chatbot_doc))
        return chatbots

    @staticmethod
    async def get_chatbots_by_chatbot_user_id(current_user_id: str) -> List[Chatbot]:
        """Get chatbots where user is invited"""
        # Get user-chatbot links
        cursor = mongo_context.user_chatbot_links.find({"user_id": current_user_id})
        chatbot_ids = []
        async for link in cursor:
            chatbot_ids.append(link["chatbot_id"])
        
        if not chatbot_ids:
            return []
        
        # Get chatbots
        cursor = mongo_context.chatbots.find({
            "id": {"$in": chatbot_ids},
            "is_deleted": False
        })
        chatbots = []
        async for chatbot_doc in cursor:
            # Only convert _id to id if id doesn't exist
            # Don't overwrite existing id (UUID) with _id (ObjectId)
            if "id" not in chatbot_doc or chatbot_doc.get("id") is None:
                if "_id" in chatbot_doc:
                    chatbot_doc["id"] = str(chatbot_doc["_id"])
            
            # Remove _id to avoid conflicts
            if "_id" in chatbot_doc:
                del chatbot_doc["_id"]
            chatbots.append(Chatbot(**chatbot_doc))
        return chatbots

    @staticmethod
    async def get_chatbot_by_id(chatbot_id: str) -> Chatbot | None:
        """Get chatbot by ID (supports both UUID and MongoDB ObjectId)"""
        chatbot_doc = await mongo_context.chatbots.find_one({"id": chatbot_id})
        if not chatbot_doc:
            # Try finding by _id if not found by UUID-like id
            try:
                from bson import ObjectId
                obj_id = ObjectId(chatbot_id)
                chatbot_doc = await mongo_context.chatbots.find_one({"_id": obj_id})
                if chatbot_doc and "id" not in chatbot_doc:
                    # If doc found by _id but missing UUID id, assign it
                    chatbot_doc["id"] = str(chatbot_doc["_id"])
            except Exception:
                pass
        
        if not chatbot_doc:
            return None
        
        # Only convert _id to id if id doesn't exist
        # Don't overwrite existing id (UUID) with _id (ObjectId)
        if "id" not in chatbot_doc or chatbot_doc.get("id") is None:
            if "_id" in chatbot_doc:
                chatbot_doc["id"] = str(chatbot_doc["_id"])
        
        # Remove _id to avoid conflicts
        if "_id" in chatbot_doc:
            del chatbot_doc["_id"]
        
        return Chatbot(**chatbot_doc)

    @staticmethod
    async def delete_chatbot_by_id(chatbot_id: str) -> bool:
        """Soft delete chatbot"""
        result = await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {"$set": {"is_deleted": True, "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))}}
        )
        return result.modified_count > 0

    @staticmethod
    async def add_user_to_chatbot(user_id: str, chatbot_id: str) -> Chatbot:
        """Add user to chatbot (invite user)"""
        # Check if link already exists
        existing_link = await mongo_context.user_chatbot_links.find_one({
            "user_id": user_id,
            "chatbot_id": chatbot_id
        })
        
        if not existing_link:
            # Create user-chatbot link
            link_dict = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "chatbot_id": chatbot_id,
                "usage_count": 0,
                "reset_time": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
            }
            await mongo_context.user_chatbot_links.insert_one(link_dict)
            
            # Update chatbot's invited_user_ids
            await mongo_context.chatbots.update_one(
                {"id": chatbot_id},
                {"$push": {"invited_user_ids": user_id}}
            )
            
            # Update user's invited_chatbot_ids
            await mongo_context.users.update_one(
                {"id": user_id},
                {"$push": {"invited_chatbot_ids": chatbot_id}}
            )
        
        return await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)

    @staticmethod
    async def remove_user_from_chatbot(user_id: str, chatbot_id: str) -> bool:
        """Remove user from chatbot"""
        # Delete link
        result = await mongo_context.user_chatbot_links.delete_one({
            "user_id": user_id,
            "chatbot_id": chatbot_id
        })
        
        if result.deleted_count > 0:
            # Update chatbot's invited_user_ids
            await mongo_context.chatbots.update_one(
                {"id": chatbot_id},
                {"$pull": {"invited_user_ids": user_id}}
            )
            
            # Update user's invited_chatbot_ids
            await mongo_context.users.update_one(
                {"id": user_id},
                {"$pull": {"invited_chatbot_ids": chatbot_id}}
            )
        
        return result.deleted_count > 0

    @staticmethod
    async def add_tokens_balance(chatbot_id: str, tokens_to_add: int) -> bool:
        """Add tokens to chatbot balance"""
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot:
            return False
        
        new_remaining = chatbot.remaining_tokens + tokens_to_add
        result = await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {
                "$set": {
                    "remaining_tokens": new_remaining,
                    "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    async def subtract_tokens(chatbot_id: str, tokens_to_subtract: int) -> bool:
        """Subtract tokens from chatbot balance"""
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot:
            return False
        
        new_remaining = max(0, chatbot.remaining_tokens - tokens_to_subtract)
        new_total = chatbot.total_usage_token + tokens_to_subtract
        
        result = await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {
                "$set": {
                    "remaining_tokens": new_remaining,
                    "total_usage_token": new_total,
                    "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    async def activate_chatbot_by_id(chatbot_id: str) -> bool:
        """Activate chatbot"""
        result = await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {
                "$set": {
                    "is_active": True,
                    "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    async def deactivate_chatbot_by_id(chatbot_id: str) -> bool:
        """Deactivate chatbot"""
        result = await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    async def is_exceed_quota_limit(chatbot_id: str) -> bool:
        """Check if chatbot exceeds quota limit"""
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot:
            return True
        return chatbot.total_usage_token >= chatbot.quota_limit

    @staticmethod
    async def is_chatbot_document_ready(chatbot_id: str) -> bool:
        """Check if chatbot has ready documents"""
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot or not chatbot.document_ids:
            return False
        
        # Check if any document is READY
        ready_docs = await mongo_context.documents.count_documents({
            "id": {"$in": chatbot.document_ids},
            "status": "Ready"
        })
        return ready_docs > 0

    @staticmethod
    async def add_usage_tokens(chatbot_id: str, tokens: int, action: str = "") -> bool:
        """Add usage tokens and subtract from remaining tokens"""
        return await ChatbotServicesMongo.subtract_tokens(chatbot_id=chatbot_id, tokens_to_subtract=tokens)

