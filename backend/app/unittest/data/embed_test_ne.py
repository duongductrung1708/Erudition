import asyncio
import uuid

from app.LightRAG.lightrag.utils import encode_string_by_tiktoken
from app.utils_package.DataUtils import get_markdown_text_of_doc


async def main():
    chatbot_id = uuid.UUID("e31690c0-bc72-4954-b3f1-a38d8e055e05")
    document_id = uuid.UUID("c2905474-3dff-4a56-afaa-3a9d89dc5c3a")
    ct = (await get_markdown_text_of_doc(chatbot_id, document_id))
    print(len(encode_string_by_tiktoken(ct)))

asyncio.run(main())