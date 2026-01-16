"""
Chatbot routes for MongoDB
Replaces chatbots.py (PostgreSQL version)
"""
import json
import time
import uuid
import uuid as uuid_lib
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps_mongo import (
    CurrentUser,
    get_current_active_chatbot_creator,
)
from app.core.config import settings
from app.models_mongo import ChatbotDTO, Chatbot, ConversationRequest, MessageReportRequest
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.ConversationServicesMongo import ConversationServicesMongo
from app.services.UserServicesMongo import get_user_by_id
from app.services.DocumentServicesMongo import DocumentServicesMongo
from app.services.FAQServicesMongo import get_faqs_by_chatbot_id

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

# IMPORTANT: Put specific routes with /{chatbot_id}/... BEFORE generic /{chatbot_id} routes
# Routes are matched in order, so more specific routes should be defined first
# FastAPI matches routes in order, so more specific routes must come first

@router.get("/{chatbot_id}/conversations")
async def get_conversations_by_chatbot(
    chatbot_id: str,
    current_user: CurrentUser
):
    """Get all conversations for a chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    if not current_user.is_admin:
        if chatbot.is_deleted:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
            raise HTTPException(status_code=403, detail="You are not authorized to view this chatbot")
    
    conversations = await ConversationServicesMongo.get_conversations_by_chatbot_id(chatbot_id=chatbot_id)
    # Filter out deleted conversations for non-admin users
    if not current_user.is_admin:
        conversations = [conv for conv in conversations if not conv.is_deleted]
    
    return [conv.model_dump() for conv in conversations]


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_by_id(
    conversation_id: str,
    current_user: CurrentUser,
):
    """Soft delete a single conversation (set is_deleted=True)."""
    # Lấy conversation để kiểm tra quyền
    conversation = await ConversationServicesMongo.get_conversation_by_id(
        conversation_id=conversation_id
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Lấy chatbot để kiểm tra quyền sở hữu
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(
        chatbot_id=conversation.chatbot_id
    )
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    # Quyền xóa:
    # - admin
    # - chủ chatbot
    # - chủ conversation
    if not current_user.is_admin:
        if chatbot.is_deleted:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        if (
            conversation.user_id != current_user.id
            and chatbot.owner_id != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to delete this conversation",
            )

    # Soft delete conversation
    deleted = await ConversationServicesMongo.delete_by_id(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=500, detail="Failed to delete conversation"
        )

    return {"detail": "Conversation deleted successfully"}


@router.get("/get_source_of_chatbot_response")
async def get_source_of_chatbot_response(
    chatbot_id: str,
    conversation_id: str,
    chatbot_response_id: str,
    current_user: CurrentUser,
):
    """
    Lấy thông tin source (tài liệu tham chiếu) của một chatbot response cụ thể.
    Dùng cho popup 'Source' trên frontend.
    """
    from app.db_context.MongoDbContext import mongo_db_context

    # Xác thực conversation & quyền truy cập (dùng service đã chuẩn hóa id/_id)
    conversation = await ConversationServicesMongo.get_conversation_by_id(
        conversation_id=conversation_id
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.chatbot_id != chatbot_id:
        raise HTTPException(
            status_code=400,
            detail="Conversation does not belong to this chatbot",
        )

    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    if not current_user.is_admin:
        # user phải là chủ chatbot hoặc chủ conversation hoặc được mời
        if (
            conversation.user_id != current_user.id
            and chatbot.owner_id != current_user.id
            and current_user.id not in chatbot.invited_user_ids
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this source information",
            )

    # Lấy toàn bộ history để tìm đúng chatbot_response_id
    history = await ConversationServicesMongo.get_chat_history_by_conversion_id(
        conversation_id=conversation.id,
        limit=0,
    ) or []

    target_msg: dict[str, Any] | None = None
    for msg in history:
        if (
            msg.get("sender") == "chatbot"
            and msg.get("chatbot_response_id") == chatbot_response_id
        ):
            target_msg = msg
            break

    if target_msg is None:
        raise HTTPException(
            status_code=404,
            detail="Chatbot response not found in conversation history",
        )

    # Trả về thông tin source, để frontend hiển thị
    # Cấu trúc đơn giản: content + source string, và meta
    return {
        "chatbot_id": chatbot_id,
        "conversation_id": conversation.id,
        "chatbot_response_id": chatbot_response_id,
        "content": target_msg.get("content", ""),
        "source": target_msg.get("source", ""),
        "usage_tokens": target_msg.get("usage_tokens", 0),
        "response_time": target_msg.get("response_time", 0),
    }


@router.post("/messages/report")
async def report_message(
    payload: MessageReportRequest,
    current_user: CurrentUser,
):
    """
    Report một câu trả lời của chatbot (lưu nội dung report vào history).
    Frontend gọi khi user bấm 'Report' trên 1 message.
    """
    from app.db_context.MongoDbContext import mongo_db_context

    # Xác thực conversation & quyền truy cập
    conversation = await ConversationServicesMongo.get_conversation_by_id(
        conversation_id=payload.conversation_id
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(
        chatbot_id=conversation.chatbot_id
    )
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    if not current_user.is_admin:
        if (
            conversation.user_id != current_user.id
            and chatbot.owner_id != current_user.id
            and current_user.id not in chatbot.invited_user_ids
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to report this message",
            )

    # Lấy document history của conversation
    import uuid as uuid_lib

    conv_uuid = uuid_lib.UUID(conversation.id)
    doc = await mongo_db_context.collection.find_one(
        {"conversation_id": str(conv_uuid)}
    )
    if not doc or "history" not in doc:
        raise HTTPException(
            status_code=404,
            detail="No history found for this conversation",
        )

    history = doc["history"]
    updated = False
    for msg in history:
        if (
            msg.get("sender") == "chatbot"
            and msg.get("chatbot_response_id") == payload.chatbot_response_id
        ):
            msg["report"] = payload.report
            updated = True
            break

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Chatbot response not found in history",
        )

    # Ghi lại toàn bộ history (đơn giản, dễ hiểu)
    await mongo_db_context.collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"history": history}},
    )

    return {"detail": "Message reported successfully"}

@router.get("/conversations/{conversation_id}")
async def get_chat_history_by_conversation(
    conversation_id: str,
    current_user: CurrentUser
):
    """Get chat history for a specific conversation"""
    # Get conversation (hỗ trợ cả UUID và ObjectId)
    conversation = await ConversationServicesMongo.get_conversation_by_id(conversation_id=conversation_id)
    
    # Nếu không tìm thấy conversation, vẫn trả về history rỗng (không 404)
    # để frontend không bị lỗi khi conversation vừa được tạo
    if conversation is None:
        return {
            "conversation_id": conversation_id,
            "history": [],
        }
    
    # Get chatbot to check authorization
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=conversation.chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    if not current_user.is_admin:
        if chatbot.is_deleted:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        # Check if user owns the conversation or has access to the chatbot
        if conversation.user_id != current_user.id and chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
            raise HTTPException(status_code=403, detail="You are not authorized to view this conversation")
    
    # Get chat history - dùng conversation.id (UUID) đã được normalize
    history = await ConversationServicesMongo.get_chat_history_by_conversion_id(
        conversation_id=conversation.id,  # Dùng UUID đã được normalize
        limit=0  # 0 means get all messages
    )
    
    return {
        "conversation_id": conversation.id,  # Trả về UUID đã normalize
        "history": history or [],
    }


@router.get("/details/{chatbot_id}")
async def get_chatbot_detail_by_id(current_user: CurrentUser, chatbot_id: str):
    """Get chatbot details"""
    print(f"[DEBUG] get_chatbot_detail_by_id called with chatbot_id: {chatbot_id}")
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
    # Filter out documents that don't exist (cleanup orphaned document_ids)
    valid_documents = []
    valid_document_ids = []
    for doc in documents:
        # Verify document actually exists in database
        doc_check = await DocumentServicesMongo.get_document_by_id(document_id=doc.id)
        if doc_check:
            valid_documents.append(doc)
            valid_document_ids.append(doc.id)
    
    # Clean up chatbot's document_ids if there are orphaned references
    if len(valid_document_ids) != len(chatbot.document_ids):
        from app.db_context.MongoDbContext import mongo_context
        await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {"$set": {"document_ids": valid_document_ids}}
        )
    
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
        "documents": [doc.model_dump() for doc in valid_documents],
        "conversations": [conv.model_dump() for conv in conversations if not conv.is_deleted or current_user.is_admin],
        "chatbot_creator": {
            "id": owner.id if owner else chatbot.owner_id,
            "email": owner.email if owner else "",
            "full_name": owner.full_name if owner else ""
        },
        "chatbot_users": invited_users
    }
    return response


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


@router.post("/{chatbot_id}/lightrag_query")
async def lightrag_query(
    chatbot_id: str,
    chat_request: ConversationRequest,
    current_user: CurrentUser,
):
    """LightRAG query endpoint with streaming response"""
    print(f"[DEBUG] lightrag_query endpoint called for chatbot_id: {chatbot_id}")
    # Lazy imports to avoid blocking on pandas issues
    from app.LightRAG.lightrag.base import QueryParam
    from app.db_context.MongoDbContext import mongo_db_context
    from app.helpers.LightRagHelper import EruLightRag
    
    # Validate chatbot
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if chatbot is None or chatbot.is_deleted:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if not chatbot.is_active:
        raise HTTPException(status_code=403, detail="Chatbot is not active")
    
    # Check user access
    if not current_user.is_admin:
        if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
            raise HTTPException(status_code=403, detail="You don't have access to this chatbot")
    
    # Check token balance before processing query
    if chatbot.remaining_tokens == 0:
        raise HTTPException(
            status_code=409,
            detail="Token balance is 0. Please top up to continue chatting."
        )
    
    # Validate conversation if it exists. Lần chat đầu tiên có thể chưa có conversation trong DB.
    conversation = await ConversationServicesMongo.get_conversation_by_id(
        conversation_id=chat_request.conversation_id
    )
    if conversation:
        if conversation.chatbot_id != chatbot_id:
            raise HTTPException(
                status_code=400,
                detail="Conversation does not belong to this chatbot",
            )
        if conversation.user_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this conversation",
            )

    # Nếu không có conversation trong DB -> tạo mới
    effective_conversation_id = (
        conversation.id if conversation else await ConversationServicesMongo.create(
            user_id=current_user.id, chatbot_id=chatbot_id
        )
    )

    # Small-talk fallback: câu chào đơn giản thì không gọi RAG (tránh [no-context])
    cleaned_message = (chat_request.message or "").strip()
    lowered = cleaned_message.lower()
    greetings = {
        "hi",
        "hello",
        "hey",
        "yo",
        "xin chào",
        "chào",
        "chao",
        "helo",
    }
    if lowered in greetings:
        async def greet_stream():
            chatbot_response_id = str(uuid_lib.uuid4())
            content = "Chào bạn! Bạn cần mình hỗ trợ gì?"
            payload = {
                "conversation_id": effective_conversation_id,
                "chatbot_response_id": chatbot_response_id,
                "content": content,
            }
            yield f"{json.dumps(payload)}\n"

            # Lưu history
            try:
                await mongo_db_context.insert_to_history(
                    conversation_id=uuid_lib.UUID(effective_conversation_id),
                    user_email=current_user.email,
                    user_message=cleaned_message,
                    chatbot_message=content,
                    source="",
                    usage_tokens=0,
                    rewrite_question=None,
                    response_time=0,
                    user_intend=None
                )
            except Exception as e:
                print(f"[WARNING] Failed to save conversation history: {e}")

            yield f"{json.dumps({'done': True, 'conversation_id': effective_conversation_id, 'chatbot_response_id': chatbot_response_id})}\n"

        return StreamingResponse(
            greet_stream(),
            media_type="application/x-ndjson",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    
    # Get conversation history for context
    history_messages = await ConversationServicesMongo.get_chat_history_by_conversion_id(
        conversation_id=effective_conversation_id,
        limit=chatbot.window_size if hasattr(chatbot, 'window_size') else 10
    )
    
    # Convert history to LightRAG format
    conversation_history = []
    if history_messages:
        window_size = chatbot.window_size if hasattr(chatbot, 'window_size') else 10
        # Get last N messages
        for msg in history_messages[-window_size:]:
            if msg.get("sender") == "user":
                conversation_history.append({
                    "role": "user",
                    "content": msg.get("content", "")
                })
            elif msg.get("sender") == "chatbot":
                conversation_history.append({
                    "role": "assistant",
                    "content": msg.get("content", "")
                })
    
    # Initialize LightRAG
    try:
        rag_helper = EruLightRag(chatbot_id=uuid_lib.UUID(chatbot_id), log_level="INFO")
        rag = await rag_helper.init_rag()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize LightRAG: {str(e)}")
    
    # Create QueryParam
    query_mode = getattr(chatbot, 'query_mode', 'hybrid')  # Default to hybrid if not set
    query_param = QueryParam(
        mode=query_mode,
        stream=True,
        conversation_history=conversation_history,
        history_turns=chatbot.window_size if hasattr(chatbot, 'window_size') else 3,
        response_type="Multiple Paragraphs",
        chatbot_model=chatbot,
        guardrails=chatbot.guard_rails if hasattr(chatbot, 'guard_rails') else ""
    )
    
    # Stream response
    async def stream_generator():
        start_time = time.time()
        full_response = ""
        chatbot_response_id = str(uuid_lib.uuid4())
        source = ""
        usage_tokens = 0
        
        try:
            result = await rag.aquery(chat_request.message, param=query_param)

            # LightRAG trả về dict: {"response": <str|async_iter>, "source": ..., "usage_tokens": ...}
            if isinstance(result, dict):
                source = result.get("source", "") or ""
                usage_tokens = int(result.get("usage_tokens") or 0)
                response = result.get("response")
            else:
                response = result

            # Frontend đang parse raw JSON chunks (không parse SSE "data:")
            # nên trả về NDJSON: mỗi object 1 dòng.
            if isinstance(response, str):
                full_response = response
                payload = {
                    "conversation_id": effective_conversation_id,
                    "chatbot_response_id": chatbot_response_id,
                    "content": response,
                }
                yield f"{json.dumps(payload)}\n"
            else:
                async for chunk in response:
                    if not chunk:
                        continue
                    full_response += chunk
                    payload = {
                        "conversation_id": effective_conversation_id,
                        "chatbot_response_id": chatbot_response_id,
                        "content": chunk,
                    }
                    yield f"{json.dumps(payload)}\n"
            
            # Calculate response time
            response_time = time.time() - start_time
            
            # Deduct tokens from chatbot if usage_tokens > 0
            if usage_tokens > 0:
                try:
                    from app.services.ChatbotServicesMongo import ChatbotServicesMongo
                    await ChatbotServicesMongo.add_usage_tokens(
                        chatbot_id=chatbot_id,
                        tokens=usage_tokens,
                        action="CHAT MESSAGE"
                    )
                except Exception as e:
                    print(f"[WARNING] Failed to deduct tokens: {e}")
            
            # Save conversation history
            try:
                await mongo_db_context.insert_to_history(
                    conversation_id=uuid_lib.UUID(effective_conversation_id),
                    user_email=current_user.email,
                    user_message=chat_request.message,
                    chatbot_message=full_response,
                    source=source,
                    usage_tokens=usage_tokens,
                    rewrite_question=None,
                    response_time=response_time,
                    user_intend=None
                )
            except Exception as e:
                print(f"[WARNING] Failed to save conversation history: {e}")
            
            # Send final message
            yield f"{json.dumps({'done': True, 'conversation_id': effective_conversation_id, 'chatbot_response_id': chatbot_response_id})}\n"
            
        except Exception as e:
            print(f"[ERROR] LightRAG query error: {e}")
            yield f"{json.dumps({'error': str(e)})}\n"
            return
    
    return StreamingResponse(
        stream_generator(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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

