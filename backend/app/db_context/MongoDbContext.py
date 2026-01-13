"""
MongoDB Context - Centralized MongoDB collections access
Replaces SQLModel/SQLAlchemy engine
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings


class MongoDBContext:
    """Centralized MongoDB collections access"""
    
    def __init__(self):
        self._db: AsyncIOMotorDatabase | None = None
    
    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get MongoDB database instance"""
        if self._db is None:
            self._db = settings.mongo_collection
        return self._db
    
    # Collection getters
    @property
    def users(self):
        """Users collection"""
        return self.db["users"]
    
    @property
    def chatbots(self):
        """Chatbots collection"""
        return self.db["chatbots"]
    
    @property
    def documents(self):
        """Documents collection"""
        return self.db["documents"]
    
    @property
    def conversations(self):
        """Conversations collection (for metadata)"""
        return self.db["conversations"]
    
    @property
    def faqs(self):
        """FAQs collection"""
        return self.db["faqs"]
    
    @property
    def favorite_messages(self):
        """Favorite messages collection"""
        return self.db["favorite_messages"]
    
    @property
    def top_up_histories(self):
        """Top up histories collection"""
        return self.db["top_up_histories"]
    
    @property
    def token_bundles(self):
        """Token bundles collection"""
        return self.db["token_bundles"]
    
    @property
    def user_chatbot_links(self):
        """User-Chatbot many-to-many links"""
        return self.db["user_chatbot_links"]


# Global instance
mongo_context = MongoDBContext()


# ==================== OLD MongoDbContext CLASS FOR CONVERSATION HISTORY ====================
# This class is kept for backward compatibility with conversation history methods
import uuid
from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo


class MongoDbContext:
    """MongoDB Context for conversation history management"""
    
    def __init__(self):
        self._collection = None
    
    @property
    def collection(self):
        """Lazy load MongoDB collection - only connects when actually needed"""
        if self._collection is None:
            self._collection = settings.mongo_collection["conversations"]
        return self._collection

    async def insert_to_history(
            self,
            conversation_id: uuid.UUID,
            user_email: str,
            user_message: str,
            chatbot_message: str,
            source: str,
            usage_tokens: int,
            rewrite_question,
            response_time,
            user_intend
    ):
        messages = [
            {
                "user_query_id": str(uuid.uuid4()),
                "sender": "user",
                "user_email": user_email,
                "content": user_message,
                "rewrite_question": rewrite_question,
                "intend": user_intend,
                "date_time": datetime.now()
            },
            {
                "chatbot_response_id": str(uuid.uuid4()),
                "sender": "chatbot",
                "content": chatbot_message,
                "source": source,
                "usage_tokens": usage_tokens,
                "response_time": response_time,
            }
        ]
        await self.collection.update_one(
            {"conversation_id": str(conversation_id)},
            {"$push": {"history": {"$each": messages}}},
            upsert=True
        )

    async def get_messages(self, conversation_id: uuid.UUID, limit=0):
        """Get messages from conversation history"""
        projection = {"history": {"$slice": -limit}} if limit > 0 else {}
        conversation_in_mongo = await self.collection.find_one(
            {"conversation_id": str(conversation_id)},
            projection
        )
        history = []
        if conversation_in_mongo and "history" in conversation_in_mongo:
            for item in conversation_in_mongo["history"]:
                if item.get("sender") == "user":
                    history.append(item)
                if item.get("sender") == "chatbot":
                    history.append({
                        "sender": "chatbot",
                        "content": item["content"]
                    })
        return history

    async def get_chat_history_paginated(self, conversations, skip: int = 0, limit: int = None,
                                         filter_email: str = None,
                                         from_date: datetime = None, to_date: datetime = None):
        try:
            conversation_ids = [str(convo.id) for convo in conversations]
            chat_histories = []

            query = {
                "conversation_id": {"$in": conversation_ids}
            }

            history_conditions = {}

            if from_date:
                history_conditions.setdefault("date_time", {})["$gte"] = from_date
            if to_date:
                history_conditions.setdefault("date_time", {})["$lte"] = to_date
            if filter_email:
                history_conditions["user_email"] = filter_email

            if history_conditions:
                query["history"] = {"$elemMatch": history_conditions}

            async for chat in self.collection.find(query):
                history = chat.get("history", [])
                last_user_message = None

                for message in history:
                    if message["sender"] == "user":
                        last_user_message = {
                            "user_query_id": message.get("user_query_id"),
                            "user_email": message.get("user_email", ""),
                            "user_query": message["content"],
                            "conversation_id": chat.get("conversation_id", ""),
                            "rewrite_query": message.get("rewrite_question", ""),
                            "response": "",
                            "usage_tokens": "",
                            "response_time": "",
                            "date_time": message.get("date_time", None),
                        }
                        chat_histories.append(last_user_message)

                    elif message["sender"] == "chatbot" and last_user_message:
                        last_user_message.update({
                            "chatbot_response_id": message.get("chatbot_response_id"),
                            "response": message["content"],
                            "usage_tokens": message.get("usage_tokens", ""),
                            "response_time": message.get("response_time", ""),
                            "report": message.get("report", "")
                        })

            chat_histories.sort(key=lambda x: x.get("date_time"), reverse=True)

            if limit:
                chat_histories = chat_histories[skip:skip + limit]
            else:
                chat_histories = chat_histories[skip:]

            return chat_histories

        except Exception as e:
            print(f"Error retrieving MongoDB: {str(e)}")
            return []

    async def report_message(self, conversation_id: uuid.UUID, chatbot_response_id: str, report: str):
        """Update report for a chatbot message"""
        try:
            result = await self.collection.update_one(
                {
                    "conversation_id": str(conversation_id),
                    "history": {
                        "$elemMatch": {
                            "chatbot_response_id": chatbot_response_id,
                            "sender": "chatbot"
                        }
                    }
                },
                {
                    "$set": {"history.$[elem].report": report}
                },
                array_filters=[{"elem.chatbot_response_id": chatbot_response_id}]
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error reporting message response: {str(e)}")
            return False

    async def get_total_usage_tokens_by_conversation(self, conversation_id: str):
        """Calculate total usage tokens for a conversation"""
        try:
            conversation_in_mongo = await self.collection.find_one(
                {"conversation_id": conversation_id}
            )

            if not conversation_in_mongo or "history" not in conversation_in_mongo:
                return 0

            total_usage_tokens = sum(
                message.get("usage_tokens", 0)
                for message in conversation_in_mongo["history"]
                if message.get("sender") == "chatbot"
            )

            return total_usage_tokens

        except Exception as e:
            print(f"Error calculating total usage tokens for conversation {conversation_id}: {str(e)}")
            return 0

    async def get_first_message(self, conversation_id: uuid.UUID):
        """Get first message from conversation"""
        try:
            conversation = await self.collection.find_one(
                {"conversation_id": str(conversation_id)},
                {"history": {"$slice": 1}}
            )

            if conversation and "history" in conversation and conversation["history"]:
                return conversation["history"][0]

            return None

        except Exception as e:
            print(f"Error retrieving first message: {str(e)}")
            return None

    async def get_messages_by_ids(self, message_ids: List[str]) -> List[dict]:
        """Get messages by their IDs"""
        try:
            cursor = self.collection.find({
                "history.chatbot_response_id": {"$in": message_ids}
            })

            results = []

            async for doc in cursor:
                history = doc.get("history", [])
                conversation_id = doc.get("conversation_id", "")
                last_user_msg = None

                for idx, msg in enumerate(history):
                    if msg.get("sender") == "user":
                        last_user_msg = msg
                    elif msg.get("sender") == "chatbot" and msg.get("chatbot_response_id") in message_ids:
                        if last_user_msg:
                            results.append({
                                "user_query_id": last_user_msg.get("user_query_id"),
                                "user_email": last_user_msg.get("user_email", ""),
                                "user_query": last_user_msg.get("content"),
                                "conversation_id": conversation_id,
                                "rewrite_query": last_user_msg.get("rewrite_question", ""),
                                "response": msg.get("content", ""),
                                "usage_tokens": msg.get("usage_tokens", ""),
                                "response_time": msg.get("response_time", ""),
                                "date_time": last_user_msg.get("date_time"),
                                "chatbot_response_id": msg.get("chatbot_response_id"),
                                "report": msg.get("report", "")
                            })
                        last_user_msg = None

            return results

        except Exception as e:
            print(f"Error retrieving messages by IDs: {str(e)}")
            return []


# Global instance for conversation history
mongo_db_context = MongoDbContext()
