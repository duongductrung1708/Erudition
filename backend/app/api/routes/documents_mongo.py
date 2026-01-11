"""
Document routes for MongoDB
Replaces documents.py (PostgreSQL version)
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, BackgroundTasks, Request
from langchain_core.documents import Document

from app.api.deps_mongo import CurrentUser
from app.models_mongo import DocumentStatus
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.DocumentServicesMongo import DocumentServicesMongo
from app.services.DocumentServices import DocumentServices  # Keep for file processing logic

router = APIRouter(prefix="/document", tags=["Document"])


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
    """LightRAG upload endpoint"""
    payload = await request.json()
    items = payload.get("payload", [])
    use_gen_qa = items.get("use_gen_qa", False)
    doc_id = items.get("id")
    
    # TODO: Update DocumentServices.background_process_and_upload to use MongoDB
    # For now, return placeholder
    return {"message": "Document upload in progress. We will notify you once it's complete."}


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
    # TODO: Update DocumentServices.load_and_convert_to_markdown_text to use MongoDB document
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
    document_id: str
):
    """Get original content of a document"""
    # TODO: Update DocumentServices.get_document_origin_content to accept string ID
    try:
        doc_uuid = uuid.UUID(document_id)
        return await DocumentServices.get_document_origin_content(doc_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")


@router.post("/ai-reconstruct-tables-of-a-document")
async def reconstruct_tables(
    current_user: CurrentUser,
    document_id: str,
    instruction: str | None = ""
):
    """AI reconstruct tables in a document"""
    # TODO: Update DocumentServices.ai_reformat_table to accept string ID
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
    # TODO: Update DocumentServices.update_origin_content to accept string ID
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
    background_tasks: BackgroundTasks
):
    """Delete a document"""
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    if chatbot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this chatbot")
    
    # Add background task to delete document (may involve LightRAG cleanup)
    background_tasks.add_task(DocumentServicesMongo.delete_document_by_id, document_id)
    return {"status": "deleting", "document_id": document_id}

