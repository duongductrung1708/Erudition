"""
Conversation Services for MongoDB
Replaces ConversationServices.py (PostgreSQL version)
"""
import uuid
from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo

from bson import ObjectId

from app.db_context.MongoDbContext import mongo_context, mongo_db_context
from app.models_mongo import Conversation


def str_to_uuid(s: str) -> uuid.UUID:
    """Convert string to UUID"""
    try:
        return uuid.UUID(s)
    except ValueError:
        # If invalid UUID format, create a new one (shouldn't happen in production)
        return uuid.uuid4()


class ConversationServicesMongo:

    @staticmethod
    async def create(user_id: str, chatbot_id: str) -> str:
        """Create a new conversation"""
        conversation_dict = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "chatbot_id": chatbot_id,
            "first_msg": None,
            "is_deleted": False,
            "created_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")),
            "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        }
        
        await mongo_context.conversations.insert_one(conversation_dict)
        
        # Update chatbot's conversation_ids
        await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {"$push": {"conversation_ids": conversation_dict["id"]}}
        )
        
        return conversation_dict["id"]

    @staticmethod
    async def delete_by_id(conversation_id: str) -> bool:
        """Soft delete conversation"""
        result = await mongo_context.conversations.update_one(
            {"id": conversation_id},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    async def get_chat_history_by_conversion_id(
        conversation_id: str,
        limit: int = 0
    ) -> List[dict] | None:
        """Get chat history for a conversation"""
        find_conversation = await mongo_context.conversations.find_one({"id": conversation_id})
        if not find_conversation:
            return None
        
        history = await mongo_db_context.get_messages(conversation_id=str_to_uuid(conversation_id), limit=limit)
        return history

    @staticmethod
    async def get_conversations_by_user_id(
        user_id: str,
        chatbot_id: str,
        is_deleted: bool = False
    ) -> List[Conversation]:
        """Get conversations for a user and chatbot"""
        query = {
            "user_id": user_id,
            "chatbot_id": chatbot_id,
            "is_deleted": is_deleted
        }
        
        cursor = mongo_context.conversations.find(query)
        conversations = []
        
        async for conv_doc in cursor:
            # Get first message if not set
            if conv_doc.get("first_msg") is None:
                first_message = await mongo_db_context.get_first_message(
                    conversation_id=str_to_uuid(conv_doc["id"])
                )
                if first_message:
                    await mongo_context.conversations.update_one(
                        {"id": conv_doc["id"]},
                        {"$set": {"first_msg": first_message["content"]}}
                    )
                    conv_doc["first_msg"] = first_message["content"]
            
            if "_id" in conv_doc:
                # Không ghi đè id (UUID) bằng _id (ObjectId)
                if "id" not in conv_doc:
                    conv_doc["id"] = str(conv_doc["_id"])
                del conv_doc["_id"]
            conversations.append(Conversation(**conv_doc))
        
        return conversations

    @staticmethod
    async def get_conversations_by_chatbot_id(chatbot_id: str) -> List[Conversation]:
        """Get all conversations for a chatbot (supports both UUID and ObjectId chatbot_id)"""
        # Try to find by chatbot_id as-is first
        cursor = mongo_context.conversations.find({"chatbot_id": chatbot_id})
        conversations = []
        async for conv_doc in cursor:
            # Lấy first_msg nếu chưa có (giống logic get_conversations_by_user_id)
            if conv_doc.get("first_msg") is None:
                first_message = await mongo_db_context.get_first_message(
                    conversation_id=str_to_uuid(conv_doc["id"])
                )
                if first_message:
                    await mongo_context.conversations.update_one(
                        {"id": conv_doc["id"]},
                        {"$set": {"first_msg": first_message["content"]}}
                    )
                    conv_doc["first_msg"] = first_message["content"]

            # Chỉ xóa _id, giữ nguyên id (UUID) nếu đã có
            if "_id" in conv_doc:
                if "id" not in conv_doc:
                    # Nếu không có id thì dùng _id làm fallback (backward compatibility)
                    conv_doc["id"] = str(conv_doc["_id"])
                del conv_doc["_id"]
            conversations.append(Conversation(**conv_doc))
        return conversations

    @staticmethod
    async def get_conversation_by_id(conversation_id: str) -> Conversation | None:
        """Get conversation by ID (UUID) or _id (ObjectId)"""
        # Thử tìm bằng id (UUID) trước
        conv_doc = await mongo_context.conversations.find_one({"id": conversation_id})
        
        # Nếu không tìm thấy và conversation_id có vẻ là ObjectId, thử tìm bằng _id
        if not conv_doc:
            try:
                obj_id = ObjectId(conversation_id)
                conv_doc = await mongo_context.conversations.find_one({"_id": obj_id})
            except Exception:
                pass
        
        if not conv_doc:
            return None
        
        # Chỉ xóa _id, giữ nguyên id (UUID) nếu đã có
        if "_id" in conv_doc:
            if "id" not in conv_doc:
                # Nếu không có id thì dùng _id làm fallback
                conv_doc["id"] = str(conv_doc["_id"])
            del conv_doc["_id"]
        
        return Conversation(**conv_doc)

