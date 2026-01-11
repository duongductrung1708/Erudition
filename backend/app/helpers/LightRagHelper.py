import json
import uuid
from pathlib import Path
from typing import Dict, Any


from app.LightRAG.lightrag import LightRAG
from app.LightRAG.lightrag.kg.shared_storage import initialize_pipeline_status
from app.LightRAG.lightrag.llm.openai import openai_embed, gpt_4o_mini_complete
from app.LightRAG.lightrag.utils import setup_logger


class EruLightRag:
    base_dir = Path(__file__).resolve().parent.parent
    _rag_instances = {}

    def __init__(
            self,
            chatbot_id: uuid.UUID,
            log_level: str = "DEBUG"
    ):
        self.current_chatbot_id = chatbot_id
        chatbot_repo_name = f"{self.current_chatbot_id.__str__()}"
        self.working_dir = str(EruLightRag.base_dir / f"rag_database/{chatbot_repo_name}")
        self.s3_dir = f"{chatbot_repo_name}"
        setup_logger("lightrag", level=f"{log_level}")

    async def init_rag(self):
        if self.current_chatbot_id in self._rag_instances:
            return self._rag_instances[self.current_chatbot_id]
        rag = LightRAG(
            working_dir=self.working_dir,
            embedding_func=openai_embed,
            llm_model_func=gpt_4o_mini_complete,
            vector_storage="ChromaVectorDBStorage",
            graph_storage="NetworkXStorage",
            vector_db_storage_cls_kwargs={
                "local_path": self.working_dir + "/vector_storage",
                "collection_settings": {
                    "hnsw:space": "cosine",
                    "hnsw:construction_ef": 128,
                    "hnsw:search_ef": 128,
                    "hnsw:M": 16,
                    "hnsw:batch_size": 100,
                    "hnsw:sync_threshold": 1000,
                },
            },
        )
        await rag.initialize_storages()
        await initialize_pipeline_status()
        EruLightRag._rag_instances[self.current_chatbot_id] = rag
        return rag

    def get_docs(self, where: Dict = None):
        with open(f"{self.working_dir}/kv_store_doc_status.json", "r", encoding="utf-8") as file:
            data = json.load(file)
            if where is None:
                return data
            filtered_data = {
                doc_id: doc
                for doc_id, doc in data.items()
                if all(doc.get(k) == v for k, v in where.items())
            }
            return filtered_data

    def get_doc_by_id(self, doc_id: str):
        with open(f"{self.working_dir}/kv_store_doc_status.json", "r", encoding="utf-8") as file:
            data = json.load(file)
            if doc_id is None:
                return data
            filtered_data = {
                _id: doc
                for _id, doc in data.items()
                if _id == doc_id
            }
            return filtered_data

    def get_chunk(self, where: Dict = None):
        with open(f"{self.working_dir}/kv_store_text_chunks.json", "r", encoding="utf-8") as file:
            data = json.load(file)
            if where is None:
                return data
            filtered_data = {
                chunk_id: chunk
                for chunk_id, chunk in data.items()
                if all(chunk.get(k) == v for k, v in where.items())
            }
            return filtered_data

    def get_full_doc_storage(self):
        return self.s3_dir + "/full_docs"

    def get_qas_storage(self, document_id: uuid.UUID):
        return self.s3_dir + "/qas/" + str(document_id)

    def get_source_file(self, document_id: Any):
        return self.get_full_doc_storage() + f"/{str(document_id)}.md"