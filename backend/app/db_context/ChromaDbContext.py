import uuid
from pathlib import Path

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from chromadb.config import Settings
import os
from dotenv import load_dotenv

load_dotenv()
class ChromaDbContext:
    base_dir = Path(__file__).resolve().parent.parent
    def __init__(
            self,
            chatbot_id: uuid.UUID,
            persist_directory: str = str(base_dir / "chroma_db"),
            embedding_function = OpenAIEmbeddings(
                api_key=os.getenv("OPENAI_API_KEY"),
                model="text-embedding-3-large"
            )
    ):
        client_settings = Settings(anonymized_telemetry=False)
        self.collection = Chroma(
            collection_name=f"chatbot_{str(chatbot_id)}",
            embedding_function=embedding_function,
            persist_directory=persist_directory,
            client_settings=client_settings,
            collection_metadata={"hnsw:space": "cosine"}
        )


