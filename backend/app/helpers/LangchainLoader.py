from fastapi import UploadFile
from app.models_mongo import Document as DocumentModel
import io
import fitz
from langchain_core.documents import Document as LCDocument

class LangchainLoader:
    @staticmethod
    async def load(file: UploadFile, document_model: DocumentModel):
        file_content = await file.read()
        file_stream = io.BytesIO(file_content)
        doc = fitz.open(stream=file_stream, filetype="pdf")
        documents = [LCDocument(
            page_content=page.get_text(),
            metadata={
                "page": i
            }) for i, page in enumerate(doc)]
        return documents

