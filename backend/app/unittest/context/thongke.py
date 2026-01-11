from collections import Counter
import asyncio
import uuid

from sqlmodel import Session

from app.core.db import engine
from app.db_context.MongoDbContext import mongo_db_context
from app.services.ConversationServices import ConversationServices


async def get_all_message(chatbot_id: uuid.UUID):
    with Session(engine) as session:
        conversations = ConversationServices.get_conversations_by_chatbot_id(
            session=session, chatbot_id=chatbot_id
        )
    if not conversations:
        return []

    chat_histories = await mongo_db_context.get_chat_history_paginated(
        conversations=conversations
    )
    return chat_histories


def calculate_report_ratio(chat_histories):
    report_counts = Counter(entry.get("report", "empty") for entry in chat_histories)
    total_reports = sum(report_counts.values())

    report_ratios = {
        report: round((count / total_reports) * 100, 2) for report, count in report_counts.items()
    }
    return report_ratios


async def main():
    chatbot_id = uuid.UUID("cd0b12b4-a3b7-4fd5-9ce5-28e2a8b1211a")
    chat_histories = await get_all_message(chatbot_id)
    report_ratios = calculate_report_ratio(chat_histories)
    print(report_ratios)


if __name__ == "__main__":
    asyncio.run(main())