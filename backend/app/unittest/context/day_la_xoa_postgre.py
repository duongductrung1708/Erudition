import asyncio
import uuid

from sqlmodel import Session

from app.core.db import engine, mongo_db
from app.db_context.PostgreSqlContext import postgres_context
from app.models import Conversation


def get_all_conversations():
    with Session(engine) as session:
        return postgres_context.get_all(session, Conversation, 0)
async def sync_mongo_data(conversation_id: uuid.UUID):
    try:
        conversations_collection = mongo_db["conversations"]
        chat_history = await conversations_collection.find_one({"conversation_id": str(conversation_id)})
        chat_history["_id"] = str(chat_history["_id"])
        return chat_history
    except Exception as e:
        print(f"\nError: {e}\nId delete in postgres: {conversation_id.__str__()}\n\n")
        with Session(engine) as session:
            postgres_context.delete(session, Conversation, conversation_id)


async def process_sync():
    conversations = get_all_conversations()
    for i, c in enumerate(conversations):
        print(f"{i + 1}/{len(conversations)}")
        await sync_mongo_data(c.id)

asyncio.run(process_sync())