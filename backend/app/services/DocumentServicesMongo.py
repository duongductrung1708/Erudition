"""
Document Services for MongoDB
Replaces DocumentServices.py (PostgreSQL version)
"""
import uuid
from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo

from app.db_context.MongoDbContext import mongo_context
from app.models_mongo import Document, DocumentStatus


class DocumentServicesMongo:

    @staticmethod
    async def get_documents_by_chatbot_id(chatbot_id: str) -> List[Document]:
        """Get all documents for a chatbot (supports both UUID and ObjectId chatbot_id)"""
        # Try to find by chatbot_id as-is first
        cursor = mongo_context.documents.find({"chatbot_id": chatbot_id})
        documents = []
        async for doc in cursor:
            # Preserve the app-level id (UUID) if present; only fall back to _id when missing.
            if "_id" in doc:
                if not doc.get("id"):
                    doc["id"] = str(doc["_id"])
                del doc["_id"]
            documents.append(Document(**doc))
        return documents

    @staticmethod
    async def get_document_by_id(document_id: str) -> Document | None:
        """Get document by ID (supports both UUID and MongoDB ObjectId)"""
        from bson import ObjectId
        
        # Try to find by UUID id first
        doc = await mongo_context.documents.find_one({"id": document_id})
        
        # If not found and document_id looks like ObjectId, try finding by _id
        if not doc:
            try:
                obj_id = ObjectId(document_id)
                doc = await mongo_context.documents.find_one({"_id": obj_id})
                if doc and "id" not in doc:
                    # If document doesn't have UUID id, use _id as id
                    doc["id"] = str(doc["_id"])
            except Exception:
                # document_id is not a valid ObjectId, return None
                pass
        
        if not doc:
            return None
        
        # Ensure id field exists
        if "id" not in doc or doc.get("id") is None:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
        
        # Remove _id to avoid conflicts
        if "_id" in doc:
            del doc["_id"]
        
        return Document(**doc)

    @staticmethod
    async def create_document(document: Document) -> Document:
        """Create a new document"""
        doc_dict = document.model_dump()
        doc_dict["id"] = str(uuid.uuid4())
        doc_dict["created_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        doc_dict["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        
        await mongo_context.documents.insert_one(doc_dict)
        
        # Update chatbot's document_ids
        await mongo_context.chatbots.update_one(
            {"id": document.chatbot_id},
            {"$push": {"document_ids": doc_dict["id"]}}
        )
        
        return Document(**doc_dict)

    @staticmethod
    async def update_document(document_id: str, update_data: dict) -> Document:
        """Update document"""
        update_data["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
        await mongo_context.documents.update_one(
            {"id": document_id},
            {"$set": update_data}
        )
        return await DocumentServicesMongo.get_document_by_id(document_id=document_id)

    @staticmethod
    async def delete_document_by_id(document_id: str) -> bool:
        """Delete document"""
        from bson import ObjectId

        doc = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not doc:
            return False
        
        # Remove from chatbot's document_ids (try both the provided id and the doc.id)
        await mongo_context.chatbots.update_one(
            {"id": doc.chatbot_id},
            {"$pull": {"document_ids": {"$in": [document_id, doc.id]}}}
        )
        
        # Delete document:
        # - Some records use app-level UUID `id`
        # - Some legacy records may only have Mongo `_id`
        # Try multiple selectors to guarantee deletion.
        selectors: list[dict] = [{"id": document_id}, {"id": doc.id}]

        for selector in selectors:
            result = await mongo_context.documents.delete_one(selector)
            if result.deleted_count > 0:
                return True

        # Fall back to Mongo ObjectId deletion (both `document_id` and `doc.id` may be ObjectId strings)
        obj_ids: list[ObjectId] = []
        for candidate in (document_id, doc.id):
            try:
                obj_ids.append(ObjectId(candidate))
            except Exception:
                continue

        for obj_id in obj_ids:
            result = await mongo_context.documents.delete_one({"_id": obj_id})
            if result.deleted_count > 0:
                return True

        return False

    @staticmethod
    async def update_document_status(document_id: str, status: str) -> bool:
        """Update document status"""
        result = await mongo_context.documents.update_one(
            {"id": document_id},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
                }
            }
        )
        return result.modified_count > 0

