"""
FAQ routes for MongoDB
Replaces faqs.py (PostgreSQL version)
"""
from fastapi import APIRouter, HTTPException

from app.api.deps_mongo import CurrentUser
from app.models_mongo import FQAsDTO
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.FAQServicesMongo import create_faq, delete_faq, update_faq, get_faqs_by_chatbot_id

router = APIRouter(prefix="/faqs", tags=["FAQs"])


@router.get("/")
async def get_faqs(chatbot_id: str, current_user: CurrentUser):
    """Get all FAQs for a chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if not chatbot.is_active:
        raise HTTPException(status_code=403, detail="Chatbot is not active")
    
    faqs = await get_faqs_by_chatbot_id(chatbot_id=chatbot_id)
    # Remove embedding from response
    for faq in faqs:
        faq.embedding = None
    return faqs


@router.post("/create")
async def create_faq_route(
    chatbot_id: str,
    faq: FQAsDTO,
    current_user: CurrentUser,
):
    """Create a new FAQ"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if not chatbot.is_active:
        raise HTTPException(status_code=403, detail="Chatbot is not active")
    if chatbot.remaining_tokens == 0:
        raise HTTPException(status_code=409, detail="Token balance is 0, can not add FAQ")
    
    created_faq = await create_faq(chatbot_id=chatbot_id, faq=faq)
    return created_faq


@router.put("/update")
async def update_faq_route(
    faq_id: str,
    faq_update: FQAsDTO,
    current_user: CurrentUser,
):
    """Update FAQ"""
    updated_faq = await update_faq(faq_id=faq_id, faq=faq_update)
    return updated_faq


@router.delete("/delete")
async def delete_faq_route(
    faq_id: str,
    current_user: CurrentUser,
):
    """Delete FAQ"""
    try:
        await delete_faq(faq_id=faq_id)
        return {"detail": "FAQ deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the FAQ: {str(e)}")

