"""
Chatbot routes for MongoDB
Replaces chatbots.py (PostgreSQL version)
"""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps_mongo import (
    CurrentUser,
    get_current_active_chatbot_creator,
)
from app.core.config import settings
from app.models_mongo import ChatbotDTO, Chatbot, ConversationRequest
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.ConversationServicesMongo import ConversationServicesMongo
from app.services.UserServicesMongo import get_user_by_id
from app.services.DocumentServicesMongo import DocumentServicesMongo
from app.services.FAQServicesMongo import get_faqs_by_chatbot_id

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


@router.get("/get_chatbots_by_owner", dependencies=[Depends(get_current_active_chatbot_creator)])
async def get_list_chatbot_by_chatbot_owner(current_user: CurrentUser):
    """Get chatbots owned by current user"""
    chatbots = await ChatbotServicesMongo.get_chatbots_by_owner_id(owner_id=current_user.id)
    return chatbots


@router.get("/get_chatbots_by_chatbot_user")
async def get_list_chatbot_by_chatbot_user(current_user: CurrentUser):
    """Get chatbots where user is invited"""
    chatbots = await ChatbotServicesMongo.get_chatbots_by_chatbot_user_id(current_user_id=current_user.id)
    return chatbots


@router.post("/", dependencies=[Depends(get_current_active_chatbot_creator)])
async def create_new_chatbot(chatbot_create: ChatbotDTO, current_user: CurrentUser):
    """Create a new chatbot"""
    # Check if chatbot with same name and organization exists
    existing_chatbots = await ChatbotServicesMongo.get_chatbots_by_owner_id(owner_id=current_user.id)
    for chatbot in existing_chatbots:
        if chatbot.name == chatbot_create.name and chatbot.organization == chatbot_create.organization:
            raise HTTPException(
                status_code=409,
                detail=f"Chatbot with name {chatbot_create.name} and organization {chatbot_create.organization} already exists"
            )
    
    new_chatbot = Chatbot(
        owner_id=current_user.id,
        **chatbot_create.model_dump()
    )
    return await ChatbotServicesMongo.create_chatbot(new_chatbot=new_chatbot)


@router.put("/{chatbot_id}")
async def update_chatbot(chatbot_id: str, chatbot_data: ChatbotDTO, current_user: CurrentUser):
    """Update chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of the chatbot")
    
    # Check if name/organization changed and conflicts with existing
    if chatbot.name != chatbot_data.name or chatbot.organization != chatbot_data.organization:
        existing_chatbots = await ChatbotServicesMongo.get_chatbots_by_owner_id(owner_id=current_user.id)
        for existing in existing_chatbots:
            if existing.id != chatbot_id and existing.name == chatbot_data.name and existing.organization == chatbot_data.organization:
                raise HTTPException(
                    status_code=409,
                    detail=f"Chatbot with name {chatbot_data.name} and organization {chatbot_data.organization} already exists"
                )
    
    return await ChatbotServicesMongo.update_chatbot(chatbot_id=chatbot_id, chatbot_data=chatbot_data)


@router.delete("/{chatbot_id}")
async def delete_chatbot(current_user: CurrentUser, chatbot_id: str):
    """Delete chatbot (soft delete)"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if not chatbot.is_active:
        raise HTTPException(status_code=403, detail="Chatbot is not active")
    if chatbot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of the chatbot")
    
    await ChatbotServicesMongo.delete_chatbot_by_id(chatbot_id=chatbot_id)
    return {"detail": "Chatbot deleted successfully"}


@router.get("/{chatbot_id}/get")
async def get_chatbot_detail_by_id(current_user: CurrentUser, chatbot_id: str):
    """Get chatbot details"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    if not current_user.is_admin:
        if chatbot.is_deleted:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        if not chatbot.is_active:
            raise HTTPException(status_code=403, detail="Chatbot is not active")
        if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
            raise HTTPException(status_code=403, detail="You are not authorized to view this chatbot")
    
    # Get related data
    owner = await get_user_by_id(user_id=chatbot.owner_id)
    faqs = await get_faqs_by_chatbot_id(chatbot_id=chatbot_id)
    documents = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id)
    conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot_id)
    
    # Get invited users
    invited_users = []
    for user_id in chatbot.invited_user_ids:
        user = await get_user_by_id(user_id=user_id)
        if user:
            invited_users.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_chatbot_creator": user.is_chatbot_creator,
                "is_admin": user.is_admin,
            })
    
    response = {
        **chatbot.model_dump(),
        "faqs": [{"id": faq.id, "answer": faq.answer, "question": faq.question} for faq in faqs],
        "documents": [doc.model_dump() for doc in documents],
        "conversations": [conv.model_dump() for conv in conversations if not conv.is_deleted or current_user.is_admin],
        "chatbot_creator": {
            "id": owner.id if owner else chatbot.owner_id,
            "email": owner.email if owner else "",
            "full_name": owner.full_name if owner else ""
        },
        "chatbot_users": invited_users
    }
    return response


@router.post("/{chatbot_id}/lightrag_query")
async def lightrag_query(
    chatbot_id: str,
    chat_request: ConversationRequest,
    current_user: CurrentUser,
):
    """LightRAG query endpoint - Note: This needs to be updated to use MongoDB services"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if not chatbot.is_active:
        raise HTTPException(status_code=403, detail="Chatbot is not active")
    
    # TODO: Update ChatbotServices.lightrag_query to use MongoDB
    # For now, return a placeholder
    raise HTTPException(status_code=501, detail="LightRAG query not yet migrated to MongoDB")


@router.post("/{chatbot_id}/invite_user")
async def invite_user_to_chatbot(
    chatbot_id: str,
    user_email: str,
    current_user: CurrentUser,
):
    """Invite user to chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of the chatbot")
    
    from app.services.UserServicesMongo import get_user_by_email
    user = await get_user_by_email(email=user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_chatbot = await ChatbotServicesMongo.add_user_to_chatbot(
        user_id=user.id,
        chatbot_id=chatbot_id
    )
    return {"detail": "User invited successfully", "chatbot": updated_chatbot}


@router.delete("/{chatbot_id}/remove_user")
async def remove_user_from_chatbot(
    chatbot_id: str,
    user_id: str,
    current_user: CurrentUser,
):
    """Remove user from chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of the chatbot")
    
    await ChatbotServicesMongo.remove_user_from_chatbot(
        user_id=user_id,
        chatbot_id=chatbot_id
    )
    return {"detail": "User removed successfully"}

