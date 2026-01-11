import uuid

from app.services.ConversationServices import ConversationServices
from app.unittest.data.exceed_quota_limit import chatbot_id


async def main():
    conversation_id = uuid.UUID("3cdb425b-0541-45e9-a223-f708292ff38e")
    response_id = uuid.UUID("515ec0de-6f96-49b0-ab84-f2e82f7c1954")
    chatbot_id = uuid.UUID("2afa5803-7a8a-4c88-878c-62568bab5c58")

    source = await ConversationServices.get_source_text_by_response_id(chatbot_id, conversation_id, response_id)
    print("✅ Source found:")
    print(source)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())