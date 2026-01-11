import io
import json
import os
import uuid
from datetime import datetime
from io import BytesIO
import re
from pathlib import Path

import aiofiles
import fitz
import numpy as np
from fastapi import UploadFile
from langchain_core.documents import Document
from starlette.exceptions import HTTPException

from app.api.routes.websocket import manager
from app.services.StorageService import StorageService
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.DocumentServicesMongo import DocumentServicesMongo

base_dir = Path(__file__).resolve().parent.parent


def split_law_text(text):
    # Tiền xử lý: loại bỏ khoảng trắng dư thừa đầu/cuối và normalize newline
    text = text.strip()

    # Bước 1: Tách theo chương, mục, điều
    # Sử dụng regex có nhận diện không phân biệt hoa thường
    pattern_section = re.compile(r"(?i)(chương\s+[ivxlcdm]+\s*[:.]?|mục\s+\d+\s*|điều\s+\d+\.\s*)")

    # Thêm ngắt dòng trước các tiêu đề này để tách dễ dàng hơn
    text = re.sub(pattern_section, r"\n\1", text)

    # Bước 2: Tách theo khoản (số đầu dòng, ví dụ: 1., 2., 3.)
    pattern_clause = re.compile(r"(\n|\A)\s*(\d+)\.\s+")
    text = re.sub(pattern_clause, r"\nKhoản \2. ", text)

    # Bước 3: Tách theo điểm (a), b), c))
    pattern_point = re.compile(r"(\n|\A|\s)([a-z])\)\s+")
    text = re.sub(pattern_point, r"\nĐiểm \2) ", text)

    # Bước 4: Tách theo dấu chấm câu hoặc xuống dòng bất kỳ (giữ nguyên dấu câu)
    sentences = re.split(r'\n+', text)

    # Loại bỏ các chuỗi rỗng, strip khoảng trắng mỗi câu/đoạn
    sentences = [s.strip() for s in sentences if s.strip()]

    return sentences


# async def get_markdown_text_of_doc(chatbot_id: uuid.UUID, document_id: uuid.UUID):
#     filename = f"{base_dir}/rag_database/{chatbot_id.__str__()}" + f"/full_docs/{document_id.__str__()}.md"
#     try:
#         async with aiofiles.open(filename, mode='r', encoding='utf-8') as f:
#             content = await f.read()
#         return content
#     except FileNotFoundError:
#         raise FileNotFoundError(f"Markdown file not found at path: {filename}")


async def get_markdown_text_of_doc(chatbot_id: uuid.UUID, document_id: uuid.UUID) -> str:
    key = f"{str(chatbot_id)}/full_docs/{str(document_id)}.md"
    try:
        content_bytes = await StorageService.download_bytes(key)
        content = content_bytes.decode("utf-8")
        return content
    except FileNotFoundError:
        raise FileNotFoundError(f"Markdown file not found at storage key: {key}")
    except Exception as e:
        raise RuntimeError(f"Error while downloading markdown document: {e}")

def parse_faq_from_ai_response(text):
    faqs = []
    faq_items = re.findall(r"<<FAQ_ITEM>>(.*?)<</FAQ_ITEM>>", text, re.DOTALL)
    for item in faq_items:
        question_match = re.search(r"<QUESTION>(.*?)</QUESTION>", item, re.DOTALL)
        answer_match = re.search(r"<ANSWER>(.*?)</ANSWER>", item, re.DOTALL)
        if question_match and answer_match:
            question = question_match.group(1).strip()
            answer = answer_match.group(1).strip()
            faqs.append({
                "question": question,
                "answer": answer
            })
    return faqs

async def add_usage_tokens_to_chatbot(chatbot, session=None, usage_tokens=0, action: str = ""):
    """Add usage tokens to chatbot - MongoDB version"""
    # session parameter kept for backward compatibility but not used
    chatbot_id = chatbot.id if hasattr(chatbot, 'id') else str(chatbot)
    await ChatbotServicesMongo.add_usage_tokens(chatbot_id=chatbot_id, tokens=usage_tokens, action=action)


async def process_if_not_enough_token(delta_token, message, chatbot_id):
    await manager.send_status(chatbot_id, "error", os.getenv("MESSAGE_OF_NOT_ENOUGH_TOKEN"))
    raise HTTPException(status_code=403, detail=f"Not enough token id: [{message}], need: {-delta_token} tokens")


def build_instruction(prompt_template, args: dict) -> str:
    sys_prompt_temp = prompt_template
    sys_prompt = sys_prompt_temp.format(
        **args
    )
    print(f"Debug: Instruction built:\n{sys_prompt}\n\n")
    return sys_prompt


# def get_qa_data_text_of_doc(chatbot_id: uuid.UUID, document_id: uuid.UUID):
#     filename = f"{base_dir}/rag_database/{chatbot_id.__str__()}" + f"/qas/{document_id.__str__()}/aqs_data.json"
#     file_path = Path(filename)
#     if not file_path.exists():
#         raise ValueError(f"Document has no qa data, file not found with path {file_path}; id: {document_id.__str__()}")
#     with open(file_path, "r", encoding="utf-8") as f:
#         data = json.load(f)
#     result = ""
#     for item in data:
#         header = item.get("header", "").strip()
#         content = item.get("content", "").strip()
#         result += f"{header}\n{content}\n\n"
#
#     return result.strip()


async def get_qa_data_text_of_doc(chatbot_id: uuid.UUID, document_id: uuid.UUID) -> str:
    key = f"{str(chatbot_id)}/qas/{str(document_id)}/aqs_data.json"
    try:
        content_bytes = await StorageService.download_bytes(key)
        data = json.loads(content_bytes.decode("utf-8"))
        result = ""
        for item in data:
            header = item.get("header", "").strip()
            content = item.get("content", "").strip()
            result += f"{header}\n{content}\n\n"
        return result.strip()
    except FileNotFoundError:
        raise ValueError(f"Document has no QA data, file not found with storage key: {key}")
    except Exception as e:
        raise RuntimeError(f"Error while downloading QA data document: {e}")


def money_to_tokens(amount_vnd: int) -> int:
    """
    Quy đổi tiền sang token với tỉ lệ:
    1 VND = 100000 tokens
    """
    RATE = int(os.getenv("TOKEN_MONEY_RATE", "100000"))  # fallback mặc định là 100000
    return amount_vnd * RATE


def tokens_to_money(tokens: int) -> int:
    """
    Quy đổi token sang tiền với tỉ lệ:
    100000 tokens = 1 VND
    """
    RATE = int(os.getenv("TOKEN_MONEY_RATE", "100000"))
    return tokens // RATE


async def add_usage_tokens_for_document(session, document_id: str | uuid.UUID, tokens_add: int):
    """Add usage tokens for document - MongoDB version"""
    # session parameter kept for backward compatibility but not used
    document_id_str = str(document_id) if isinstance(document_id, uuid.UUID) else document_id
    doc = await DocumentServicesMongo.get_document_by_id(document_id=document_id_str)
    if not doc:
        raise ValueError(f"Document not found with id {document_id_str}")
    await DocumentServicesMongo.update_document(
        document_id=document_id_str,
        update_data={"usage_tokens": doc.usage_tokens + tokens_add, "latest_modified": datetime.now()}
    )
    return doc.usage_tokens + tokens_add


def normalize(vec: list[float] | np.ndarray) -> list[float]:
    vec = np.array(vec)
    norm = np.linalg.norm(vec)
    return (vec / norm).tolist() if norm != 0 else vec.tolist()


from PyPDF2 import PdfMerger, PdfReader


def merge_all_pages_from_single_pdf(input_pdf_path, output_path="merged_all_pages.pdf"):
    reader = PdfReader(input_pdf_path)
    merger = PdfMerger()
    for i in range(len(reader.pages)):
        merger.append(input_pdf_path, pages=(i, i + 1))
    merger.write(output_path)
    merger.close()
    return output_path


def extract_markdown_table(text):
    regex_table = r"(?:\|[^\n]*\|\r?\n)+\|?(?:[-:]+(?:\|[-:]+)+)\|\r?\n(?:\|[^\n]*\|(?:\r?\n|$))*"
    # Dùng re.finditer() để tìm tất cả bảng Markdown
    tables = [match.group(0) for match in re.finditer(regex_table, text)]

    # Thay thế bảng bằng placeholder
    placeholder = "\n<<<TABLE>>>\n"
    text_without_tables = re.sub(regex_table, placeholder, text)
    return {
        "text": text_without_tables,
        "tables": tables
    }


def get_header_level(text):
    regex = r"^(#+)\s"
    match = re.match(regex, text)
    if match:
        num_hashes = len(match.group(1))
        return num_hashes
    return 0


def get_split_data(header, content):
    return {
        "header": header,
        "content": content
    }


class DataUtils:
    @staticmethod
    async def file_to_binary_stream(file: UploadFile):
        file_content = await file.read()
        buf = BytesIO(file_content)
        return buf

    @staticmethod
    async def get_langchain_document_from_file(file: UploadFile) -> list[Document]:
        file_content = await file.read()
        file_stream = io.BytesIO(file_content)
        doc = fitz.open(stream=file_stream, filetype="pdf")
        documents = [Document(page_content=page.get_text(), metadata={"page": i}) for i, page in enumerate(doc)]
        return documents

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean text by removing null bytes (0x00) and whitespace"""
        return text.strip().replace("\x00", "")

    @staticmethod
    def split_document(text, text_type) -> list[str]:
        """
        Tách văn bản quy phạm pháp luật theo chương, mục, điều, khoản, điểm, dòng.
        """
        match text_type:
            case "phap_luat":
                return split_law_text(text)
            case _:
                raise ValueError(f"Unsupported text type: {text_type}")
