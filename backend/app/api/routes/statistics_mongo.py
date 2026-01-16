"""
Statistics routes for MongoDB
Replaces statistics.py (PostgreSQL version)
"""
import asyncio
from collections import Counter, defaultdict
from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Body, Query

from app.api.deps_mongo import (
    CurrentUser,
    get_current_active_admin,
)
from app.db_context.MongoDbContext import mongo_db_context
from app.models_mongo import FilterWithPaginateRequest, FilterReport, FilterBase, UsageTokenByChatbotResponse
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.ConversationServicesMongo import ConversationServicesMongo
from app.services.DocumentServicesMongo import DocumentServicesMongo
from app.services.UserServicesMongo import get_user_by_id

router = APIRouter(tags=["statistics"], prefix="/statistics")


@router.get(
    "/get_chatbots_usage_tokens",
    dependencies=[Depends(get_current_active_admin)]
)
async def get_chatbots_usage_tokens(from_date: datetime, to_date: datetime):
    """
    Get usage tokens of all chatbots by date
    """
    from app.db_context.MongoDbContext import mongo_context
    
    # Get all chatbots
    cursor = mongo_context.chatbots.find({"is_deleted": False})
    chatbots = []
    async for chatbot_doc in cursor:
        if "_id" in chatbot_doc:
            chatbot_doc["id"] = str(chatbot_doc["_id"])
            del chatbot_doc["_id"]
        from app.models_mongo import Chatbot
        chatbots.append(Chatbot(**chatbot_doc))
    
    # Normalize datetime filters to timezone-aware (UTC)
    if from_date.tzinfo is None:
        from_date = from_date.replace(tzinfo=ZoneInfo("UTC"))
    else:
        from_date = from_date.astimezone(ZoneInfo("UTC"))
    if to_date.tzinfo is None:
        to_date = to_date.replace(tzinfo=ZoneInfo("UTC"))
    else:
        to_date = to_date.astimezone(ZoneInfo("UTC"))
    
    async def process_chatbot(chatbot):
        chat_tokens = 0
        documents_tokens = 0
        
        # Get documents - use document_ids from chatbot if available
        documents = []
        if chatbot.document_ids:
            for doc_id in chatbot.document_ids:
                doc = await DocumentServicesMongo.get_document_by_id(document_id=doc_id)
                if doc:
                    documents.append(doc)
        else:
            # Fallback: query by chatbot_id
            documents = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot.id)
        
        # Calculate document tokens within date range
        for doc in documents:
            doc_date = doc.latest_modified
            if doc_date.tzinfo is None:
                doc_date = doc_date.replace(tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
            doc_date_utc = doc_date.astimezone(ZoneInfo("UTC"))
            
            # Filter by date if provided
            if from_date and doc_date_utc < from_date:
                continue
            if to_date and doc_date_utc > to_date:
                continue
            
            documents_tokens += doc.usage_tokens or 0
        
        # Get conversations - use conversation_ids from chatbot if available
        conversations = []
        if chatbot.conversation_ids:
            for conv_id in chatbot.conversation_ids:
                conv = await ConversationServicesMongo.get_conversation_by_id(conversation_id=conv_id)
                if conv and not conv.is_deleted:
                    conversations.append(conv)
        else:
            # Fallback: query by chatbot_id
            conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot.id)
        
        # Calculate chat tokens from messages within date range
        if conversations:
            messages = await mongo_db_context.get_chat_history_paginated(
                conversations=conversations,
                from_date=from_date,
                to_date=to_date,
            )
            
            for message in messages:
                usage_tokens = message.get("usage_tokens", 0)
                if usage_tokens and usage_tokens > 0:
                    chat_tokens += usage_tokens
        
        return {
            "id": chatbot.id,
            "name": chatbot.name,
            "organization": chatbot.organization,
            "chat_tokens": chat_tokens,
            "documents_tokens": documents_tokens,
            "total_usage_tokens": chat_tokens + documents_tokens,
        }
    
    response = await asyncio.gather(*[process_chatbot(chatbot) for chatbot in chatbots])
    return response


@router.get(
    "/get_usage_token_by_chatbot"
)
async def get_usage_token_by_chatbot(
    current_user: CurrentUser,
    chatbot_id: str = Query(..., description="Chatbot ID"),
    from_date: datetime | None = Query(None, description="Filter from date"),
    to_date: datetime | None = Query(None, description="Filter to date")
) -> List[UsageTokenByChatbotResponse]:
    """Get usage tokens by chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot does not exist")
    if chatbot.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chatbot")
    
    response: List[UsageTokenByChatbotResponse] = []
    
    # Normalize datetime filters to timezone-aware (UTC)
    if from_date:
        if from_date.tzinfo is None:
            # If naive, assume UTC
            from_date = from_date.replace(tzinfo=ZoneInfo("UTC"))
        else:
            # Convert to UTC
            from_date = from_date.astimezone(ZoneInfo("UTC"))
    if to_date:
        if to_date.tzinfo is None:
            # If naive, assume UTC
            to_date = to_date.replace(tzinfo=ZoneInfo("UTC"))
        else:
            # Convert to UTC
            to_date = to_date.astimezone(ZoneInfo("UTC"))
    
    # Get documents - use document_ids from chatbot if available, otherwise query by chatbot_id
    documents = []
    if chatbot.document_ids:
        for doc_id in chatbot.document_ids:
            doc = await DocumentServicesMongo.get_document_by_id(document_id=doc_id)
            if doc:
                documents.append(doc)
    else:
        # Fallback: query by chatbot_id
        documents = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id)
    owner = await get_user_by_id(user_id=chatbot.owner_id)
    owner_email = owner.email if owner else ""
    
    for doc in documents:
        # Normalize doc.latest_modified to timezone-aware (UTC) for comparison
        doc_date = doc.latest_modified
        if doc_date.tzinfo is None:
            # If naive, assume it's in Asia/Ho_Chi_Minh timezone (default for models)
            doc_date = doc_date.replace(tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
        # Convert to UTC for comparison
        doc_date_utc = doc_date.astimezone(ZoneInfo("UTC"))
        
        # Filter by date if provided
        if from_date and doc_date_utc < from_date:
            continue
        if to_date and doc_date_utc > to_date:
            continue
        
        response.append(UsageTokenByChatbotResponse(
            user_email=owner_email,
            usage_tokens=doc.usage_tokens,
            date_time=doc.latest_modified,
            method="document"
        ))
    
    # Get conversations - use conversation_ids from chatbot if available, otherwise query by chatbot_id
    conversations = []
    if chatbot.conversation_ids:
        for conv_id in chatbot.conversation_ids:
            conv = await ConversationServicesMongo.get_conversation_by_id(conversation_id=conv_id)
            if conv:
                conversations.append(conv)
        else:
            # Fallback: query by chatbot_id
            conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot_id)
    if conversations:
        # Convert to list of conversation IDs for mongo_db_context
        conversation_ids = [conv.id for conv in conversations]
        
        # Get chat histories
        messages = await mongo_db_context.get_chat_history_paginated(
            conversations=conversations,
            from_date=from_date,
            to_date=to_date,
        )
        
        for message in messages:
            # Only include messages with usage_tokens > 0
            usage_tokens = message.get("usage_tokens", 0)
            user_email_in_msg = message.get("user_email", owner_email)
            if usage_tokens and usage_tokens > 0:
                response.append(UsageTokenByChatbotResponse(
                    user_email=user_email_in_msg,
                    usage_tokens=usage_tokens,
                    date_time=message.get("date_time", datetime.now()),
                    method="message"
                ))
    
    response.sort(key=lambda x: x.date_time, reverse=True)
    return response


@router.post("/chat-history-me", response_model=List[dict])
async def filter_chat_history_me(
    current_user: CurrentUser,
    filter_params: FilterBase = Body(...)
):
    """Get chat history for current user"""
    try:
        chatbot_id = filter_params.chatbot_id
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot does not exist")
        
        skip = 0
        limit = None
        filter_email = current_user.email
        from_date = getattr(filter_params, "from_date", None)
        to_date = getattr(filter_params, "to_date", None)
        
        conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot_id)
        if not conversations:
            return []
        
        chat_histories = await mongo_db_context.get_chat_history_paginated(
            conversations=conversations,
            skip=skip,
            limit=limit,
            filter_email=filter_email,
            from_date=from_date,
            to_date=to_date
        )
        return chat_histories
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/chat-history-by-chatbot", response_model=List[dict])
async def filter_chat_history_by_chatbot(
    current_user: CurrentUser,
    filter_params: FilterWithPaginateRequest = Body(...)
):
    """Get chat history by chatbot with filters"""
    try:
        chatbot_id = filter_params.chatbot_id
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot does not exist")
        
        # Check authorization: owner, admin, or invited user
        if not current_user.is_admin:
            if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
                raise HTTPException(status_code=403, detail="Unauthorized access to this chatbot")
        
        skip = getattr(filter_params, "skip", 0)
        limit = getattr(filter_params, "limit", None)
        filter_email = getattr(filter_params, "filter_email", None)
        from_date = getattr(filter_params, "from_date", None)
        to_date = getattr(filter_params, "to_date", None)
        
        # Get conversations - use conversation_ids from chatbot if available, otherwise query by chatbot_id
        conversations = []
        if chatbot.conversation_ids:
            for conv_id in chatbot.conversation_ids:
                conv = await ConversationServicesMongo.get_conversation_by_id(conversation_id=conv_id)
                if conv and not conv.is_deleted:
                    conversations.append(conv)
        else:
            # Fallback: query by chatbot_id
            conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot_id)
        
        # If user is invited (not owner), only show their own conversations
        if not current_user.is_admin and chatbot.owner_id != current_user.id and current_user.id in chatbot.invited_user_ids:
            conversations = [conv for conv in conversations if conv.user_id == current_user.id]
            # Also filter by current user's email if filter_email is not set
            if not filter_email:
                filter_email = current_user.email
        
        if not conversations:
            return []
        
        chat_histories = await mongo_db_context.get_chat_history_paginated(
            conversations=conversations,
            skip=skip,
            limit=limit,
            filter_email=filter_email,
            from_date=from_date,
            to_date=to_date
        )
        return chat_histories
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/rate_of_response_report")
async def get_rate_report(
    current_user: CurrentUser,
    chatbot_id: str = Query(..., description="Chatbot ID"),
    from_date: datetime | None = Query(None, description="Filter from date"),
    to_date: datetime | None = Query(None, description="Filter to date")
):
    """Get rate of response report"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail=f"User {current_user.email} is not allowed to get information.")
    
    # TODO: Implement get_all_message for MongoDB
    # For now, get from conversations
    conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot_id)
    chat_histories = await mongo_db_context.get_chat_history_paginated(
        conversations=conversations,
        from_date=from_date,
        to_date=to_date,
    )
    
    def calculate_report_ratio(chs):
        report_counts = Counter(entry.get("report", "empty") for entry in chs)
        total_reports = sum(report_counts.values())
        if total_reports == 0:
            return {}
        rr = defaultdict(float)
        for report, count in report_counts.items():
            if report.strip() == "":
                report = "un-report"
            rr[report] = round((count / total_reports) * 100, 2)
        return rr
    
    report_ratios = calculate_report_ratio(chat_histories)
    if not report_ratios:
        return {
            "has_report": False,
            "detail": None
        }
    return {
        "has_report": True,
        "detail": report_ratios
    }


@router.get("/documents_of_chatbot")
async def get_documents_of_a_chatbot(
    current_user: CurrentUser,
    filter_params: FilterBase = Depends()
):
    """Get documents of a chatbot"""
    chatbot_id = filter_params.chatbot_id
    latest_modified_from = filter_params.from_date
    latest_modified_to = filter_params.to_date
    
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail=f"User {current_user.email} is not allowed to get information.")
    
    documents = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id)
    
    # Filter by date if provided
    if latest_modified_from or latest_modified_to:
        filtered_docs = []
        for doc in documents:
            if latest_modified_from and doc.latest_modified < latest_modified_from:
                continue
            if latest_modified_to and doc.latest_modified > latest_modified_to:
                continue
            filtered_docs.append(doc)
        documents = filtered_docs
    
    if not documents:
        return {
            "has_documents": False,
            "detail": None
        }
    
    return {
        "has_documents": True,
        "detail": [doc.model_dump() for doc in documents]
    }

