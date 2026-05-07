import asyncio
import json
import os
import uuid
from datetime import datetime
from io import BytesIO

from fastapi import UploadFile
from langchain_core.documents import Document as LCDocument

from app.LightRAG.lightrag.base import DocStatus
from app.LightRAG.lightrag.utils import logger, tokens_need_and_delta_tokens
from app.api.routes.websocket import manager as ws_mng
from app.helpers.DocumentHelper import DocumentHelper
from app.helpers.LightRagHelper import EruLightRag
from app.helpers.LlmHelper import LLMHelper
from app.models_mongo import Document as DocumentModel, DocumentStatus, FQAsDTO
from app.services.DocumentServicesMongo import DocumentServicesMongo
from app.prompts import PROMPTS
from app.services.FAQServicesMongo import create_faq
from app.services.StorageService import StorageService
from app.utils import compute_mdhash_id
from app.utils_package.DataUtils import DataUtils, extract_markdown_table, get_header_level, get_split_data, \
    add_usage_tokens_to_chatbot, add_usage_tokens_for_document, process_if_not_enough_token, parse_faq_from_ai_response
from pathlib import Path


class DocumentServices:
    @staticmethod
    async def get_uploaded_documents_by_date(
            chatbot_id: str,
            from_date: datetime,
            to_date: datetime
    ):
        """Get documents by date range - MongoDB version"""
        documents = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id)
        # Filter by date
        filtered = []
        for doc in documents:
            if from_date and doc.latest_modified < from_date:
                continue
            if to_date and doc.latest_modified > to_date:
                continue
            filtered.append(doc)
        return filtered

    @staticmethod
    async def get_document_total_usage_token_by_date(
            chatbot_id: str,
            from_date: datetime,
            to_date: datetime
    ) -> int:
        """Get total usage tokens by date - MongoDB version"""
        documents = await DocumentServices.get_uploaded_documents_by_date(
            chatbot_id=chatbot_id,
            from_date=from_date,
            to_date=to_date
        )
        return sum(doc.usage_tokens for doc in documents)

    @staticmethod
    async def load_and_convert_to_markdown_text(document: DocumentModel, file_content, filename):
        """Load and convert file to markdown - MongoDB version"""
        await ws_mng.send_status(document.chatbot_id, "info", f"{document.document_title} uploading")
        try:
            await DocumentServicesMongo.update_document_status(
                document_id=document.id, status=DocumentStatus.PROCESSING
            )
            stream = BytesIO(file_content)
            file = UploadFile(filename=filename, file=stream)
            import asyncio

            # Default to docling (higher quality). Allow override via env.
            # If docling runs out of memory (common on 512MB instances), retry with a lightweight loader.
            loader_method = os.getenv("DOCUMENT_LOADER_METHOD", "docling").lower().strip()
            if loader_method not in {"docling", "langchain"}:
                loader_method = "docling"

            async def _load(method: str):
                return await asyncio.wait_for(
                    DocumentHelper.load(file=file, document_model=document, loader_method=method),
                    timeout=180,
                )

            try:
                documents = await _load(loader_method)
            except (MemoryError, RuntimeError) as e:
                # Best-effort fallback for OOM-like failures.
                msg = str(e).lower()
                if loader_method == "docling" and ("memory" in msg or "oom" in msg):
                    await ws_mng.send_status(
                        document.chatbot_id,
                        "warning",
                        f"Docling ran out of memory; retrying with lightweight PDF loader for '{document.document_title}'.",
                        document_id=document.id,
                        document_title=document.document_title,
                    )
                    documents = await _load("langchain")
                else:
                    raise
            except Exception as e:
                # Some docling failures show up as generic exceptions but include OOM signals.
                msg = str(e).lower()
                if loader_method == "docling" and ("memory" in msg or "oom" in msg):
                    await ws_mng.send_status(
                        document.chatbot_id,
                        "warning",
                        f"Docling ran out of memory; retrying with lightweight PDF loader for '{document.document_title}'.",
                        document_id=document.id,
                        document_title=document.document_title,
                    )
                    documents = await _load("langchain")
                else:
                    raise

            result = documents[0].page_content
            await asyncio.wait_for(
                DocumentServices.save_file_to_server(document.id, result, document.chatbot_id),
                timeout=60,
            )
            # Update status in MongoDB
            await DocumentServicesMongo.update_document_status(document_id=document.id, status=DocumentStatus.UPLOADED)
            await ws_mng.send_status(document.chatbot_id, "success", f"{document.document_title} upload successfully", document_id=document.id, document_title=document.document_title)
        except asyncio.TimeoutError:
            logger.error("Error while uploading document: timeout")
            await DocumentServicesMongo.update_document_status(
                document_id=document.id, status=DocumentStatus.FAILED
            )
            await ws_mng.send_status(
                document.chatbot_id,
                "error",
                f"Upload failed for '{document.document_title}': processing timed out",
                document_id=document.id,
                document_title=document.document_title,
            )
        except Exception as e:
            logger.error(f"Error while uploading document: {e}")
            await DocumentServicesMongo.update_document_status(document_id=document.id, status=DocumentStatus.FAILED)
            # Surface the real reason to the UI via websocket
            await ws_mng.send_status(
                document.chatbot_id,
                "error",
                f"Upload failed for '{document.document_title}': {str(e)}",
                document_id=document.id,
                document_title=document.document_title,
            )

    @staticmethod
    async def load_and_convert_to_markdown_from_path(
        document: DocumentModel, temp_path: str, filename: str
    ):
        """
        Read bytes from a temp file path then run the standard conversion pipeline.
        This lets the API return quickly on deploys (reduces proxy timeouts).
        """
        path = Path(temp_path)
        try:
            file_content = await asyncio.to_thread(path.read_bytes)
            await DocumentServices.load_and_convert_to_markdown_text(
                document, file_content, filename
            )
        finally:
            try:
                if path.exists():
                    await asyncio.to_thread(path.unlink)
            except Exception:
                pass

    @staticmethod
    async def get_document_origin_content(document_id: str):
        """Get document original content - MongoDB version"""
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if db_obj is None:
            raise ValueError(f"Document not found with id: {document_id}")
        file_path = EruLightRag(chatbot_id=db_obj.chatbot_id).get_full_doc_storage() + f"/{db_obj.id}.md"
        try:
            # async with aiofiles.open(file_path, mode='r', encoding='utf-8') as f:
            #     content = await f.read()
            # return content
            content_bytes = await StorageService.download_bytes(file_path)
            return content_bytes.decode("utf-8")
        except PermissionError as e:
            logger.error(f"Permission error while downloading document: {e}")
            await ws_mng.send_status(db_obj.chatbot_id, "error", "Storage access permission denied. Please contact administrator.")
            raise ValueError(f"Storage access denied: {str(e)}")
        except FileNotFoundError:
            logger.error(f"File not found at path: {file_path}")
            await ws_mng.send_status(db_obj.chatbot_id, "error", "Document file not found in storage.")
            raise ValueError(f"Document file not found at path: {file_path}")
        except Exception as e:
            logger.error(f"Error while downloading document: {e}")
            await ws_mng.send_status(db_obj.chatbot_id, "error", "An error occurred while accessing document storage.")
            raise ValueError(f"Failed to retrieve document content: {str(e)}")

    @staticmethod
    async def update_origin_content(document_id: str, markdown_text: str):
        """Update document original content - MongoDB version"""
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if db_obj is None:
            raise ValueError(f"Document not found with id: {document_id}")
        file_path = EruLightRag(chatbot_id=db_obj.chatbot_id).get_full_doc_storage() + f"/{db_obj.id}.md"
        await StorageService.upload_bytes(markdown_text.encode("utf-8"), file_path)
        # Update latest_modified in MongoDB
        await DocumentServicesMongo.update_document(
            document_id=document_id,
            update_data={"latest_modified": datetime.now()}
        )
        return db_obj

    @staticmethod
    async def ai_reformat_table(document_id: str, instruction: str):
        """AI reformat table - MongoDB version"""
        markdown_text = await DocumentServices.get_document_origin_content(document_id)
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not db_obj:
            raise ValueError(f"Document not found with id: {document_id}")
        
        if instruction.strip() == "" or instruction is None:
            instruction = "The above table is retrieved but it's maybe incorrect. Make it show clearly and make the information correctly. If the table information make sense, return it. Just return table, not anything else\n"
        table_extracted_data = extract_markdown_table(markdown_text)
        content_without_table = table_extracted_data["text"]
        tables = table_extracted_data["tables"]
        await ws_mng.send_status(db_obj.chatbot_id, status="info",
                                 detail=f"Extracted {len(tables)} tables in the content.")
        llmhelper = LLMHelper(llm_provider="openai", model_name="gpt-4o-mini", temperature=0)
        result = content_without_table
        # Get chatbot for token calculation
        from app.services.ChatbotServicesMongo import ChatbotServicesMongo
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=db_obj.chatbot_id)
        if not chatbot:
            raise ValueError(f"Chatbot not found with id: {db_obj.chatbot_id}")
        
        for idx, table in enumerate(tables):
            p = f"{table}\n\nInstruction:\n{instruction}"
            needs, delta = tokens_need_and_delta_tokens(chatbot=chatbot, prompt=p)
            if delta < 0:
                try:
                    await process_if_not_enough_token(delta_token=delta, message="RECONSTRUCT TABLE",
                                                      chatbot_id=db_obj.chatbot_id)
                except Exception:
                    result = result.replace("<<<TABLE>>>", table, 1)
            else:
                res = await llmhelper.generate_response(prompt=p)
                # Update tokens in MongoDB
                await ChatbotServicesMongo.add_usage_tokens(chatbot_id=db_obj.chatbot_id, tokens=needs, action="UPLOAD DOCUMENT: RECONSTRUCT TABLE")
                await DocumentServicesMongo.update_document(document_id=document_id, update_data={"usage_tokens": db_obj.usage_tokens + needs})
                result = result.replace("<<<TABLE>>>", res.content, 1)
                await ws_mng.send_status(db_obj.chatbot_id, status="info",
                                         detail=f"Re-constructed {idx + 1}/{len(tables)} tables in the content.")
        await ws_mng.send_status(db_obj.chatbot_id, status="response", detail=f"{result}")
        await DocumentServicesMongo.update_document(document_id=document_id, update_data={"latest_modified": datetime.now()})
        return result

    @staticmethod
    async def process_save_document(
            data,
            chatbot_id,
            document_title,
            use_gen_qa: bool = False,
            document_id: str = ""
    ):
        """Process and save document - MongoDB version"""
        await ws_mng.send_status(chatbot_id, "info", f"Initiating analysis for '{document_title}'...")
        await DocumentServicesMongo.update_document_status(document_id=document_id, status=DocumentStatus.QUEUED)
        print(f"-------+ START INDEX {document_title} +-------")
        print(f"---| Params |--- ")
        print(f"auto-faq: {use_gen_qa} ")
        print(f"+--------------+ \n")
        if use_gen_qa:
            await ws_mng.send_status(chatbot_id, "info", f"AI is generating questions and answers for {document_title}")
        await DocumentServices.update_origin_content(document_id, data)
        print("Markdown content is saved")
        table_extracted_data = extract_markdown_table(data)
        content_without_table = table_extracted_data["text"]
        tables = table_extracted_data["tables"]
        statements = content_without_table.split("\n\n")
        result = []
        header_stack = []
        current_content = []
        print(f"Extracted {len(tables)} tables")
        for idx, text in enumerate(statements):
            current_header_level = get_header_level(text)
            if current_header_level > 0:  # Nếu là header
                # Nếu có header trước đó nhưng không có content, ta vẫn lưu lại header cũ
                if current_content or header_stack:
                    if not current_content and get_header_level(header_stack[-1]) >= current_header_level:
                        result.append(get_split_data("\n\n".join(header_stack[:-1]), header_stack[-1]))
                    elif current_content:
                        result.append(get_split_data("\n\n".join(header_stack), "\n".join(current_content)))
                    current_content = []
                # Cập nhật header stack
                while header_stack and get_header_level(header_stack[-1]) >= current_header_level:
                    header_stack.pop()
                header_stack.append(text)
            else:  # Nếu không phải header, thêm vào content
                current_content.append(text)
            print(f"Header detecting: {idx + 1}/{len(statements)}", end="\r")
        # Xử lý nội dung còn lại
        if header_stack:
            result.append(
                get_split_data("\n\n".join(header_stack), "\n".join(current_content if current_content else "")))
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not db_obj:
            raise ValueError(f"Document not found with id: {document_id}")
        # Get chatbot
        from app.services.ChatbotServicesMongo import ChatbotServicesMongo
        chatbot_model = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if not chatbot_model:
            raise ValueError(f"Chatbot not found with id: {chatbot_id}")
        docs = [
            LCDocument(
                page_content=item["content"],
                metadata={
                    "header": item["header"]
                }
            )
            for item in result
        ] if result else [LCDocument(page_content=content_without_table)]
        print(f"Got {len(docs)} child content(s) with header linked")
        splits = DocumentHelper.split(
            documents=docs,
            db_obj=db_obj,
            chunk_size=1024,
            overlap_size=0
        )
        print(f"Split document into {len(splits)} chunks")
        await ws_mng.send_status(chatbot_model.id, "info",
                                 f"{db_obj.document_title} is split into {len(splits)} chunks.")
        table_index = 0
        for idx, item in enumerate(splits):
            if "<<<TABLE>>>" in item.page_content:
                item.page_content = item.page_content.replace("<<<TABLE>>>", tables[table_index])
                table_index += 1
            print(f"Table processing: {idx + 1}/{len(splits)}", end="\r")
        if use_gen_qa:
            faqs, len_processed_docs = await DocumentServices.auto_generate_faqs(splits, chatbot_model, db_obj)
            print(f"Got {len(faqs)} FAQs")
            if len_processed_docs == 0:
                await ws_mng.send_status(chatbot_model.id, "error",
                                         f"AI generates questions and answers for {db_obj.document_title} failed")
            else:
                print(f"FAQs generated from {len(splits) - len_processed_docs}/{len(splits)} chunks")
                if len_processed_docs < len(splits):
                    await ws_mng.send_status(chatbot_model.id, "warn",
                                             f"Not enough tokens to process all of the content. Missing {len(splits) - len_processed_docs}/{len(splits)} chunks.")
                await ws_mng.send_status(chatbot_model.id, "success",
                                     f"AI generates questions and answers for {db_obj.document_title} completed")
                await ws_mng.send_status(chatbot_model.id, "info",
                                         f"Starting add FAQs for {chatbot_model.name}")
                for index, faq in enumerate(faqs):
                    if "question" in faq and "answer" in faq:
                        faqdto = FQAsDTO(
                            question=faq["question"],
                            answer=faq["answer"]
                        )
                        await create_faq(chatbot_id=chatbot_id, faq=faqdto)
                        await ws_mng.send_status(chatbot_model.id, "process",
                                                 f"{index + 1}/{len(faqs)}")
                    print(f"Added FAQs: {index + 1}/{len(faqs)}")
        await DocumentServicesMongo.update_document(document_id=document_id, update_data={"latest_modified": datetime.now()})
        for item in splits:
            temp = item.page_content
            item.page_content = item.metadata.get("header", "") + "\n\n" + temp
        print(f"Pre-process document Done.")
        return db_obj, splits

    @staticmethod
    async def auto_generate_faqs(docs, chatbot_model, db_obj):
        # working_dir = EruLightRag(chatbot_id).working_dir + "/qas/" + str(db_obj.id)
        qas_data = []
        processed_docs = 0
        for idx, doc in enumerate(docs):
            content_for_gen = doc.metadata.get("header", "") + doc.page_content
            llm_helper = LLMHelper(llm_provider="openai", model_name="gpt-4o-mini", temperature=0)
            needs, delta = tokens_need_and_delta_tokens(chatbot_model,
                                                        PROMPTS["generate_qa_from_chunks"] + content_for_gen)
            if delta < 0:
                try:
                    await process_if_not_enough_token(delta_token=delta, message="AI GEN QA",
                                                      chatbot_id=db_obj.chatbot_id)
                except Exception as e:
                    print(f"Not enough token to process chunk {idx + 1}/{len(docs)}")
                    break
            qa_item = await llm_helper.generate_response(
                prompt=PROMPTS["generate_qa_from_chunks"],
                args={
                    "content": content_for_gen
                }
            )
            # Update tokens in MongoDB
            from app.services.ChatbotServicesMongo import ChatbotServicesMongo
            await ChatbotServicesMongo.add_usage_tokens(chatbot_id=chatbot_model.id, tokens=needs, action="UPLOAD DOCUMENT: AI GEN QA")
            await DocumentServicesMongo.update_document(document_id=db_obj.id, update_data={"usage_tokens": db_obj.usage_tokens + needs})
            qas_data.extend(parse_faq_from_ai_response(qa_item.content))
            processed_docs += 1
            print(f"Process FAQs generate: {idx + 1}/{len(docs)}", end="\r")

        return qas_data, processed_docs

    @staticmethod
    async def background_process_and_upload(
            data,
            chatbot_id,
            document_title,
            use_gen_qa,
            document_id
    ):
        """Background process and upload - MongoDB version"""
        db_obj, splits = await DocumentServices.process_save_document(
            data=data,
            chatbot_id=chatbot_id,
            document_title=document_title,
            use_gen_qa=use_gen_qa,
            document_id=document_id
        )
        await DocumentServices.lightrag_upload(db_obj, splits)

    @staticmethod
    async def get_qas_of_a_document(document_id: str):
        """Get QAs of a document - MongoDB version"""
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not db_obj: raise Exception(f"Not found Document with id {str(document_id)}")
        # working_dir = EruLightRag(db_obj.chatbot_id).working_dir + "/qas/" + str(db_obj.id)
        # json_file_path = os.path.join(working_dir, "aqs_data.json")
        # if not os.path.exists(json_file_path):
        #     raise Exception(f"File {json_file_path} not found")
        # with open(json_file_path, "r", encoding="utf-8") as json_file:
        #     aqs_data = json.load(json_file)
        s3_key = f"{db_obj.chatbot_id}/qas/{db_obj.id}/aqs_data.json"
        data_bytes = await StorageService.download_bytes(s3_key)
        aqs_data = json.loads(data_bytes.decode("utf-8"))

        return aqs_data

    @staticmethod
    async def save_qas_of_a_document(document_id: str, data):
        """Save QAs of a document - MongoDB version"""
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not db_obj: raise Exception(f"Not found Document with id {str(document_id)}")
        # working_dir = EruLightRag(db_obj.chatbot_id).get_qas_storage(document_id)
        # json_file_path = os.path.join(working_dir, "aqs_data.json")
        # if not os.path.exists(json_file_path):
        #     raise Exception(f"File {json_file_path} not found")
        try:
            # with open(json_file_path, "w", encoding="utf-8") as json_file:
            #     json.dump(data, json_file, ensure_ascii=False, indent=4)
            s3_key = f"{db_obj.chatbot_id}/qas/{db_obj.id}/aqs_data.json"
            await StorageService.upload_bytes(json.dumps(data, ensure_ascii=False, indent=4).encode("utf-8"), s3_key)
            await DocumentServicesMongo.update_document(document_id=document_id, update_data={"latest_modified": datetime.now()})
            return data, db_obj
        except Exception as e:
            raise Exception(f"Failed to save data: {str(e)}")

    @staticmethod
    async def delete_qas_of_a_document(document_id: str):
        """Delete QAs of a document - MongoDB version"""
        db_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not db_obj:
            raise Exception(f"Not found Document with id {str(document_id)}")
        if db_obj.status != DocumentStatus.QAS_GENERATED:
            raise Exception(f"QA data cannot be deleted: either missing or already finalized.")
        # working_dir = EruLightRag(db_obj.chatbot_id).get_qas_storage(document_id)
        # json_file_path = os.path.join(working_dir, "aqs_data.json")

        # if not os.path.exists(json_file_path):
        #     raise Exception(f"File {json_file_path} not found")
        try:
            # os.remove(json_file_path)
            s3_key = f"{db_obj.chatbot_id}/qas/{db_obj.id}/aqs_data.json"
            await StorageService.delete_object(s3_key)
            await DocumentServicesMongo.update_document(document_id=document_id, update_data={"has_qa_data": False, "status": DocumentStatus.UPLOADED, "latest_modified": datetime.now()})
            return {"message": f"Deleted QAs data for document {str(document_id)} successfully."}
        except Exception as e:
            raise Exception(f"Failed to delete file: {str(e)}")

    @staticmethod
    async def save_file_to_server(document_id: str, markdown_text: str, chatbot_id: str):
        # with Session(engine) as session:
        #     db_obj = postgres_context.get_by_id(session, DocumentModel, record_id=document_id)
        # if not db_obj: raise Exception(f"Not found Document with id {str(document_id)}")
        # working_dir = EruLightRag(db_obj.chatbot_id).get_full_doc_storage()
        # os.makedirs(working_dir, exist_ok=True)
        # file_name = db_obj.id.__str__() + ".md"
        # file_path = os.path.join(working_dir, file_name)
        # with open(file_path, "w", encoding="utf-8") as f:
        #     f.write(markdown_text)
        s3_key = f"{chatbot_id}/full_docs/{document_id}.md"
        await StorageService.upload_bytes(markdown_text.encode("utf-8"), s3_key)

    @staticmethod
    async def lightrag_upload(db_obj: DocumentModel, splits: list[LCDocument]):
        """LightRAG upload - MongoDB version"""
        print(f"Starting to index document")
        try:
            await ws_mng.send_status(db_obj.chatbot_id, "info", f"Preparing to process {db_obj.document_title}")
            rag_of_chatbot = EruLightRag(chatbot_id=db_obj.chatbot_id, log_level="DEBUG")
            rag = await rag_of_chatbot.init_rag()
            if len(splits) > 0:
                sep_key = "<SEP>_secret_key_<SEP/>"
                content_to_index = str(sep_key).join([doc.page_content for doc in splits])
                await rag.apipeline_enqueue_documents(
                    input=content_to_index,
                    db_obj=db_obj,
                    file_paths=str(db_obj.id)
                )
                await rag.apipeline_process_enqueue_documents(
                    split_by_character_only=True,
                    split_by_character=str(sep_key),
                    db_obj=db_obj
                )
                doc_enqueued = rag_of_chatbot.get_docs(where={"db_obj_id": str(db_obj.id)})
                status = ""
                for k, v in doc_enqueued.items():
                    status = v.get("status", "")
                    break
                if status == DocStatus.PENDING:
                    await DocumentServicesMongo.update_document_status(document_id=db_obj.id, status=DocumentStatus.QUEUED)
                elif status == DocStatus.FAILED:
                    raise Exception("Lightrag process failed")
                elif status == "":
                    # If status is empty, document was not enqueued properly
                    await DocumentServicesMongo.update_document_status(document_id=db_obj.id, status=DocumentStatus.FAILED)
                    await ws_mng.send_status(db_obj.chatbot_id, "error",
                                              f"{db_obj.document_title} failed to index. Please try again.")
        except Exception as e:
            print(f"Error in lightrag_upload: {e}")
            # Update status to FAILED instead of deleting
            await DocumentServicesMongo.update_document_status(document_id=db_obj.id, status=DocumentStatus.FAILED)
            await ws_mng.send_status(db_obj.chatbot_id, "error",
                                      f"{db_obj.document_title} upload failed. You can try to re-index or delete it manually.")

    @staticmethod
    async def get_documents_by_chatbot_id(chatbot_id: str) -> list[DocumentModel]:
        """Get documents by chatbot ID - MongoDB version"""
        return await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id)

    # @staticmethod
    # async def delete_document_by_id(document_id: uuid.UUID, delete_in_posgres: bool = True):
    #     with Session(engine) as session:
    #         postgres_context.update(session, DocumentModel, document_id, status=DocumentStatus.DELETING)
    #         deleting_docs = [postgres_context.get_by_id(session, DocumentModel, document_id).model_dump()]
    #         if len(deleting_docs) == 0:
    #             logger.info("Skip delete record in postgres DB")
    #         chatbot_id = deleting_docs[0]["chatbot_id"] if "chatbot_id" in deleting_docs[0] else None
    #         rag_instance = EruLightRag(chatbot_id)
    #         deleting_doc = deleting_docs[0]
    #         if delete_in_posgres:
    #             await ws_mng.send_status(chatbot_id=deleting_doc["chatbot_id"], status="info",
    #                                      detail=f"{deleting_docs[0]['document_title']} is deleting.")
    #         if deleting_doc["has_qa_data"]:
    #             qa_dir = rag_instance.get_qas_storage(document_id=deleting_doc["id"])
    #             if os.path.exists(qa_dir):
    #                 shutil.rmtree(qa_dir)
    #         full_doc_filename = rag_instance.get_full_doc_storage() + "/" + str(deleting_doc["id"]) + ".md"
    #         if os.path.exists(full_doc_filename):
    #             os.remove(full_doc_filename)
    #         try:
    #             docs_in_doc_status_storage = rag_instance.get_docs(where={"db_obj_id": str(document_id)})
    #             if len(docs_in_doc_status_storage) == 1:
    #                 full_doc_id = next(iter(docs_in_doc_status_storage))
    #                 if deleting_doc.get("status", "") == DocumentStatus.DELETING:
    #                     rag = await rag_instance.init_rag()
    #                     await rag.adelete_by_doc_id(doc_id=full_doc_id)
    #             else: logger.error(f"Expected exactly 1 document with id {str(document_id)}, but got multiple or none.")
    #         except FileNotFoundError as e:
    #             logger.warning(f"File not found: {rag_instance.working_dir}\\kv_store_doc_status.json")
    #         if delete_in_posgres:
    #             await ws_mng.send_status(chatbot_id=deleting_doc["chatbot_id"], status="success",
    #                                      detail=f"{deleting_docs[0]['document_title']} is deleted.")
    #             deleting_docs = postgres_context.delete_by_fields(session, DocumentModel, id=document_id)
    #         logger.info(f"Delete document {deleting_docs[0]['document_title']} completed.")

    @staticmethod
    async def delete_document_by_id(document_id: str, delete_in_posgres: bool = True):
        """Delete document by ID - MongoDB version"""
        await DocumentServicesMongo.update_document_status(document_id=document_id, status=DocumentStatus.DELETING)
        deleting_doc_obj = await DocumentServicesMongo.get_document_by_id(document_id=document_id)
        if not deleting_doc_obj:
            logger.info("Skip delete record in MongoDB")
            return
        deleting_doc = deleting_doc_obj.model_dump()
        chatbot_id = deleting_doc["chatbot_id"]

        rag_instance = EruLightRag(chatbot_id)
        # 1. Thông báo trạng thái xóa
        if delete_in_posgres:
            await ws_mng.send_status(
                chatbot_id=deleting_doc["chatbot_id"],
                status="info",
                detail=f"{deleting_doc['document_title']} is deleting."
            )
        # 2. Xóa QAs (folder QAs) trên MinIO
        if deleting_doc["has_qa_data"]:
            # QAs prefix: "chatbot/{chatbot_id}/qas/{document_id}/"
            qa_prefix = f"{chatbot_id}/qas/{document_id}/"
            await StorageService.delete_objects_by_prefix(qa_prefix)
        # 3. Xóa file markdown chính (full_docs)
        full_md_key = f"{chatbot_id}/full_docs/{document_id}.md"
        await StorageService.delete_object(full_md_key)
        # 4. Xóa vector/entry trong vector DB (phần này giữ như cũ)
        try:
            docs_in_doc_status_storage = rag_instance.get_docs(where={"db_obj_id": str(document_id)})
            if len(docs_in_doc_status_storage) == 1:
                full_doc_id = next(iter(docs_in_doc_status_storage))
                if deleting_doc.get("status", "") == DocumentStatus.DELETING:
                    rag = await rag_instance.init_rag()
                    await rag.adelete_by_doc_id(doc_id=full_doc_id)
            elif len(docs_in_doc_status_storage) > 1:
                logger.info(f"Expected exactly 1 document with id {str(document_id)}, but got multiple")
                logger.info(f"Deleting multiple duplicated documents with id {str(document_id)}")
                for doc_id in docs_in_doc_status_storage:
                    rag = await rag_instance.init_rag()
                    if deleting_doc.get("status", "") == DocumentStatus.DELETING:
                        await rag.adelete_by_doc_id(doc_id=doc_id)
            else:
                raise ValueError(f"Expected exactly 1 document with id {str(document_id)}, but got none")
        except FileNotFoundError as e:
            if deleting_doc["status"] == "Ready":
                logger.warning(e)
        except ValueError as e:
            logger.error(e)
        # 5. Xóa DB (MongoDB)
        if delete_in_posgres:
            await ws_mng.send_status(
                chatbot_id=deleting_doc["chatbot_id"],
                status="success",
                detail=f"{deleting_doc['document_title']} is deleted."
            )
            await DocumentServicesMongo.delete_document_by_id(document_id=document_id)
            logger.info(f"Delete document {deleting_doc['document_title']} completed.")


def get_doc_from_excel(db_obj):
    import pandas as pd
    from langchain_core.documents import Document
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    df = pd.read_excel("C:\\Users\\ACER\\Downloads\\nghị định 168.xlsx", engine="openpyxl")
    num_columns = len(df.columns)
    data_in_columns = [df.iloc[:, i].tolist() for i in range(num_columns)]
    for col_index in range(num_columns - 1):
        previous_value = None
        for row_index in range(len(data_in_columns[col_index])):
            current_value = data_in_columns[col_index][row_index]
            if pd.isna(current_value):  # Nếu là NaN
                # Gán giá trị trước đó (nếu có)
                data_in_columns[col_index][row_index] = previous_value
            else:
                previous_value = current_value
    contents = data_in_columns[-1]
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1024,
        chunk_overlap=0
    )
    docs = []
    for row_index in range(len(contents)):
        header = ""
        for col_index in range(0, num_columns - 1):
            cell_value = data_in_columns[col_index][row_index]
            if pd.notna(cell_value):
                header += f"{cell_value}\n "
        if pd.isna(contents[row_index]):
            page_content = header.strip()
        else:
            page_content = contents[row_index]
        docs.append(Document(
            page_content=page_content,
            metadata={
                "header": header if not pd.isna(contents[row_index]) else ""
            }
        ))
    split_docs = splitter.split_documents(documents=docs)
    index = 0
    for doc in split_docs:
        doc.page_content = DataUtils.clean_text(doc.page_content)
        doc.metadata["chunk_index"] = index
        doc.metadata["tag"] = "content"
        doc.metadata["document_id"] = str(db_obj.id)
        doc.id = compute_mdhash_id(prefix="doc-", content=(str(db_obj.chatbot_id) + doc.page_content + str(index)))
        index = index + 1
    return split_docs
