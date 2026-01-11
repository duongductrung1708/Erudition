import asyncio
import uuid

from app.services.DocumentServices import DocumentServices

document_id = uuid.UUID("5d34c11d-a339-4ef6-b71c-f2d3c0b0b961")

async def main():
    res = await DocumentServices.ai_reformat_table(document_id=document_id)
    print(res)
asyncio.run(main())