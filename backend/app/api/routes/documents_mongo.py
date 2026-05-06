"""
Document routes for MongoDB
Replaces documents.py (PostgreSQL version)
"""
import sys
import uuid
from datetime import datetime

print("[DOCUMENTS_MONGO] Starting imports...")
sys.stdout.flush()

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, BackgroundTasks, Request, Query
print("[DOCUMENTS_MONGO] FastAPI imported")
sys.stdout.flush()

from langchain_core.documents import Document
print("[DOCUMENTS_MONGO] langchain_core imported")
sys.stdout.flush()

from app.api.deps_mongo import CurrentUser
print("[DOCUMENTS_MONGO] deps_mongo imported")
sys.stdout.flush()

from app.models_mongo import DocumentStatus
print("[DOCUMENTS_MONGO] models_mongo imported")
sys.stdout.flush()

from app.services.ChatbotServicesMongo import ChatbotServicesMongo
print("[DOCUMENTS_MONGO] ChatbotServicesMongo imported")
sys.stdout.flush()

from app.services.DocumentServicesMongo import DocumentServicesMongo
print("[DOCUMENTS_MONGO] DocumentServicesMongo imported")
sys.stdout.flush()

# Lazy import DocumentServices to avoid blocking on import
# from app.services.DocumentServices import DocumentServices  # Keep for file processing logic

router = APIRouter(prefix="/document", tags=["Document"])
print("[DOCUMENTS_MONGO] Module initialization complete")
sys.stdout.flush()


@router.get("/get_aqs_data")
async def get_aqs_data(document_id: str):
    """Get Q&A data of a document"""
    # TODO: Implement get_qas_of_a_document for MongoDB
    # For now, return placeholder
    return {"message": "Q&A data endpoint - to be implemented"}


@router.post("/save_aqs_data")
async def save_aqs_data(document_id: str, request: Request):
    """Save Q&A data of a document"""
    payload = await request.json()
    items = payload.get("payload", [])
    # TODO: Implement save_qas_of_a_document for MongoDB
    return {"message": "Q&A data saved - to be implemented"}


@router.delete("/delete_aqs_data")
async def delete_aqs_data(document_id: str):
    """Delete Q&A data of a document"""
    # TODO: Implement delete_qas_of_a_document for MongoDB
    return {"message": "Q&A data deleted - to be implemented"}


@router.post("/index_aqs_data")
async def index_aqs_data(
    document_id: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Index Q&A data"""
    await DocumentServicesMongo.update_document_status(document_id=document_id, status="Processing")
    payload = await request.json()
    items = payload.get("payload", [])
    
    # TODO: Implement save_qas_of_a_document and lightrag_upload for MongoDB
    # For now, return placeholder
    return {"message": "Document upload in progress. We will notify you once it's complete."}


@router.post("/{chatbot_id}/lightrag_upload")
async def lightrag_process(
    chatbot_id: str,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    request: Request
):
    """LightRAG upload endpoint - Process and index document"""
    from app.services.DocumentServices import DocumentServices
    from app.services.ChatbotServicesMongo import ChatbotServicesMongo
    
    # Validate chatbot exists and user has access
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    if chatbot.owner_id != current_user.id and current_user.id not in chatbot.get("invited_user_ids", []):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to process documents for this chatbot"
        )
    
    # Parse request payload
    # Frontend sends: JSON.stringify({ payload: { data, title, use_gen_qa, id } })
    payload = await request.json()
    items = payload.get("payload", {})
    
    # Extract fields from payload
    use_gen_qa = items.get("use_gen_qa", False)
    doc_id = items.get("id")
    document_data = items.get("data", "")
    document_title = items.get("title", "")
    
    if not doc_id:
        raise HTTPException(status_code=400, detail="Document ID is required")
    
    if not document_data:
        raise HTTPException(status_code=400, detail="Document data is required")
    
    # Get document from database
    document = await DocumentServicesMongo.get_document_by_id(document_id=doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document.chatbot_id != chatbot_id:
        raise HTTPException(
            status_code=400,
            detail="Document does not belong to this chatbot"
        )
    
    # Check if chatbot has enough tokens
    if chatbot.remaining_tokens == 0:
        raise HTTPException(
            status_code=409,
            detail="Token balance is 0, cannot index document"
        )
    
    # Add background task to process and index document
    background_tasks.add_task(
        DocumentServices.background_process_and_upload,
        data=document_data,
        chatbot_id=chatbot_id,
        document_title=document_title or document.document_title,
        use_gen_qa=use_gen_qa,
        document_id=doc_id
    )
    
    return {
        "message": "Document indexing started. Processing will continue in background.",
        "document_id": doc_id
    }


@router.post("/{chatbot_id}/document-load-to-markdown")
async def upload_document(
    chatbot_id: str,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload document and convert to markdown"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    # Check authorization: user must be owner or invited user
    if chatbot.owner_id != current_user.id and current_user.id not in chatbot.get("invited_user_ids", []):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to upload documents to this chatbot"
        )
    
    if chatbot.remaining_tokens == 0:
        raise HTTPException(status_code=409, detail="Token balance is 0, can not upload!")
    
    # Create document in MongoDB
    from app.models_mongo import Document as DocumentModel
    document = DocumentModel(
        document_title=title,
        source_file_path="",
        chatbot_id=chatbot_id,
        status=DocumentStatus.UPLOADING,
        has_qa_data=False,
        usage_tokens=0
    )
    
    db_document = await DocumentServicesMongo.create_document(document=document)
    
    file_content = await file.read()
    # Add background task to process file
    # Lazy import to avoid blocking on module import
    from app.services.DocumentServices import DocumentServices
    background_tasks.add_task(
        DocumentServices.load_and_convert_to_markdown_text,
        db_document,
        file_content,
        file.filename
    )
    
    return {
        "message": "Document upload in progress. We will notify you once it's complete.",
        "document_id": db_document.id
    }


@router.get("/get-original-content")
async def get_original_content(
    current_user: CurrentUser,
    document_id: str = Query(..., description="Document ID (UUID or MongoDB ObjectId)")
):
    """Get original content of a document"""
    # Lazy import to avoid blocking on module import
    from app.services.DocumentServices import DocumentServices
    from app.services.DocumentServicesMongo import DocumentServicesMongo
    
    # Check if document exists and user has access
    document = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check authorization: user must have access to the chatbot
    from app.services.ChatbotServicesMongo import ChatbotServicesMongo
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=document.chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    if chatbot.owner_id != current_user.id and current_user.id not in chatbot.get("invited_user_ids", []) and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view this document"
        )
    
    # Call service method with string ID (it will handle both UUID and ObjectId)
    try:
        return await DocumentServices.get_document_origin_content(document_id)
    except ValueError as e:
        # Handle storage access errors and file not found errors
        error_msg = str(e)
        if "Storage access denied" in error_msg or "Permission" in error_msg:
            raise HTTPException(
                status_code=403,
                detail=f"Storage access denied. Please check AWS S3 permissions. {error_msg}"
            )
        elif "not found" in error_msg.lower():
            raise HTTPException(
                status_code=404,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve document content: {error_msg}"
            )


@router.post("/ai-reconstruct-tables-of-a-document")
async def reconstruct_tables(
    current_user: CurrentUser,
    document_id: str,
    instruction: str | None = ""
):
    """AI reconstruct tables in a document"""
    # Lazy import to avoid blocking on module import
    from app.services.DocumentServices import DocumentServices
    try:
        doc_uuid = uuid.UUID(document_id)
        res = await DocumentServices.ai_reformat_table(doc_uuid, instruction)
        return res
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")


@router.put("/update-original-content")
async def update_original_content(
    current_user: CurrentUser,
    document_id: str,
    request: Request
):
    """Update original content of a document"""
    payload = await request.json()
    items = payload.get("payload", [])
    data = items.get("data", "")
    if not data:
        raise HTTPException(status_code=400, detail="No markdown data provided")
    # Lazy import to avoid blocking on module import
    from app.services.DocumentServices import DocumentServices
    try:
        doc_uuid = uuid.UUID(document_id)
        return await DocumentServices.update_origin_content(doc_uuid, str(data))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")


@router.put("/update-doc-title")
async def update_title(
    current_user: CurrentUser,
    document_id: str,
    title: str
):
    """Update document title"""
    await DocumentServicesMongo.update_document(
        document_id=document_id,
        update_data={
            "document_title": title,
            "latest_modified": datetime.now()
        }
    )
    return title


@router.get("/{chatbot_id}/documents")
async def get_all_documents(
    chatbot_id: str,
    current_user: CurrentUser,
):
    """Get all documents for a chatbot"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
        raise HTTPException(status_code=403, detail="You are not authorized to view this chatbot's documents")
    
    documents = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id)
    return [doc.model_dump() for doc in documents]


@router.delete("/{chatbot_id}/documents/delete/")
async def delete_document(
    chatbot_id: str,
    document_id: str,
    current_user: CurrentUser,
):
    """Delete a document"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this chatbot")
    
    # Mark as deleting (best-effort) so UI can reflect state
    await DocumentServicesMongo.update_document_status(
        document_id=document_id, status=DocumentStatus.DELETING
    )

    deleted = await DocumentServicesMongo.delete_document_by_id(document_id=document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found or could not be deleted")

    return {"status": "deleted", "document_id": document_id}

