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
        """Get all documents for a chatbot"""
        cursor = mongo_context.documents.find({"chatbot_id": chatbot_id})
        documents = []
        async for doc in cursor:
            if "_id" in doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
            documents.append(Document(**doc))
        return documents

    @staticmethod
    async def get_document_by_id(document_id: str) -> Document | None:
        """Get document by ID"""
        doc = await mongo_context.documents.find_one({"id": document_id})
        if not doc:
            return None
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
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
        doc = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not doc:
            return False
        
        # Remove from chatbot's document_ids
        await mongo_context.chatbots.update_one(
            {"id": doc.chatbot_id},
            {"$pull": {"document_ids": document_id}}
        )
        
        # Delete document
        result = await mongo_context.documents.delete_one({"id": document_id})
        return result.deleted_count > 0

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

