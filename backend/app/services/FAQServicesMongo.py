"""
FAQ Services for MongoDB
Replaces FAQServices.py (PostgreSQL version)
"""
import uuid
from datetime import datetime
from typing import List, Tuple
from zoneinfo import ZoneInfo

from app.db_context.MongoDbContext import mongo_context
from app.helpers.LlmHelper import LLMHelper
from app.models_mongo import FrequentlyAskedQuestion, FQAsDTO
from app.utils_package.DataUtils import normalize


async def get_faqs_by_chatbot_id(chatbot_id: str) -> List[FrequentlyAskedQuestion]:
    """Get all FAQs for a chatbot"""
    cursor = mongo_context.faqs.find({"chatbot_id": chatbot_id})
    faqs = []
    async for faq_doc in cursor:
        if "_id" in faq_doc:
            faq_doc["id"] = str(faq_doc["_id"])
            del faq_doc["_id"]
        faqs.append(FrequentlyAskedQuestion(**faq_doc))
    return faqs


async def create_faq(chatbot_id: str, faq: FQAsDTO) -> FrequentlyAskedQuestion:
    """Create a new FAQ"""
    embedding = normalize(await LLMHelper.embed(faq.question))
    
    faq_dict = faq.model_dump()
    faq_dict["id"] = str(uuid.uuid4())
    faq_dict["chatbot_id"] = chatbot_id
    faq_dict["embedding"] = embedding
    faq_dict["created_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    faq_dict["updated_at"] = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    
    await mongo_context.faqs.insert_one(faq_dict)
    
    # Update chatbot's faq_ids
    await mongo_context.chatbots.update_one(
        {"id": chatbot_id},
        {"$push": {"faq_ids": faq_dict["id"]}}
    )
    
    # Return without embedding for API response
    faq_dict["embedding"] = []
    return FrequentlyAskedQuestion(**faq_dict)


async def update_faq(faq_id: str, faq: FQAsDTO) -> FrequentlyAskedQuestion:
    """Update FAQ"""
    find_faq = await mongo_context.faqs.find_one({"id": faq_id})
    if not find_faq:
        raise ValueError("FAQ not found")
    
    updated = {
        "question": faq.question,
        "answer": faq.answer,
        "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    }
    
    # Update embedding if question changed
    if faq.question.strip() != find_faq.get("question", ""):
        updated["embedding"] = normalize(await LLMHelper.embed(faq.question))
    
    await mongo_context.faqs.update_one(
        {"id": faq_id},
        {"$set": updated}
    )
    
    # Return updated FAQ without embedding
    updated_faq = await mongo_context.faqs.find_one({"id": faq_id})
    if "_id" in updated_faq:
        updated_faq["id"] = str(updated_faq["_id"])
        del updated_faq["_id"]
    updated_faq["embedding"] = []
    return FrequentlyAskedQuestion(**updated_faq)


async def delete_faq(faq_id: str) -> bool:
    """Delete FAQ"""
    find_faq = await mongo_context.faqs.find_one({"id": faq_id})
    if not find_faq:
        raise ValueError("FAQ not found")
    
    chatbot_id = find_faq.get("chatbot_id")
    
    # Remove from chatbot's faq_ids
    if chatbot_id:
        await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {"$pull": {"faq_ids": faq_id}}
        )
    
    # Delete FAQ
    result = await mongo_context.faqs.delete_one({"id": faq_id})
    return result.deleted_count > 0


async def similarity_search(query: str, chatbot_id: str, min_score: float = 0.7) -> List[FQAsDTO]:
    """Search similar FAQs using cosine similarity"""
    faqs_with_distance = await _search_similar_faqs(query, chatbot_id)
    result = []
    for faq, similarity in faqs_with_distance:
        if similarity >= min_score:
            result.append(faq)
    return result


async def _search_similar_faqs(query: str, chatbot_id: str, top_k: int = 5) -> List[Tuple[FQAsDTO, float]]:
    """Search similar FAQs using embedding similarity"""
    import numpy as np
    
    # Create embedding from query
    query_embedding = normalize(await LLMHelper.embed(query))
    if not query_embedding:
        raise ValueError("Embedding không được tạo.")
    
    # Get all FAQs for chatbot
    cursor = mongo_context.faqs.find({"chatbot_id": chatbot_id})
    faqs_with_similarity = []
    
    async for faq_doc in cursor:
        if not faq_doc.get("embedding"):
            continue
        
        faq_embedding = faq_doc["embedding"]
        
        # Calculate cosine similarity
        query_vec = np.array(query_embedding)
        faq_vec = np.array(faq_embedding)
        
        # Cosine similarity
        similarity = np.dot(query_vec, faq_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(faq_vec))
        
        faq_dto = FQAsDTO(
            question=faq_doc["question"],
            answer=faq_doc["answer"]
        )
        faqs_with_similarity.append((faq_dto, float(similarity)))
    
    # Sort by similarity descending and return top_k
    faqs_with_similarity.sort(key=lambda x: x[1], reverse=True)
    return faqs_with_similarity[:top_k]

