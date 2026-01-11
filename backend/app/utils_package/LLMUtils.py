import json
import os
import random
import uuid

import requests

from app.LightRAG.lightrag.utils import tokens_need_and_delta_tokens
from app.db_context.MongoDbContext import MongoDbContext
from app.helpers.LlmHelper import LLMHelper
from app.models_mongo import Document as DocumentModel, Chatbot
from app.prompts import PROMPTS
from app.services.DocumentServicesMongo import DocumentServicesMongo
from app.utils_package.DataUtils import process_if_not_enough_token, add_usage_tokens_to_chatbot


class LLMUtils:
    def __init__(self, llm_helper: LLMHelper):
        self.llm_helper = llm_helper

    @staticmethod
    def count_tokens(user_input: str, provider: str = "gemini", model="gemini-2.0-flash-lite"):
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:countTokens?key={os.getenv('GOOGLE_API_KEY')}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": user_input}
                        ]
                    }
                ]
            }
            headers = {
                'Content-Type': 'application/json'
            }
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            return response.json()["totalTokens"]


    async def rewrite_prompt(self, prompt: str, conversation_id: uuid.UUID, chatbot: Chatbot, session):
        mongo_db = MongoDbContext()
        history = await mongo_db.get_messages(conversation_id=conversation_id, limit=3)
        instruction = PROMPTS["prompt_rewriting"]
        history_text = ""
        for msg_item in history:
            if msg_item["sender"] == "user":
                history_text += f"Người dùng: {msg_item['content']}"
            if msg_item["sender"] == "chatbot":
                history_text += f"Chatbot: {msg_item['content']}"
            history_text += "\n"
        if not history:
            history_text = "Không có lịch sử hội thoại."
        token_need, delta_token = tokens_need_and_delta_tokens(chatbot, (prompt + instruction + history_text))
        if delta_token < 0: await process_if_not_enough_token(delta_token, "REWRITING QUERY", chatbot.id)
        res = await self.llm_helper.generate_response(
            prompt=prompt,
            instruction=instruction,
            args={
                "history_text":history_text
            }
        )

        await add_usage_tokens_to_chatbot(chatbot, session, token_need, action="REWRITING QUERY")
        return {
            "data": res.content,
            "total_tokens": token_need
        }

    async def classify_prompt(self, prompt: str, session=None, chatbot_id: str | uuid.UUID = None):
        """Classify prompt - MongoDB version"""
        chatbot_id_str = str(chatbot_id) if isinstance(chatbot_id, uuid.UUID) else chatbot_id
        docs = await DocumentServicesMongo.get_documents_by_chatbot_id(chatbot_id=chatbot_id_str)
        if not docs:
            return None
        instruction = PROMPTS["prompt_classifying"]
        titles_text = ""
        for doc in docs:
            titles_text += f"{doc.id}###dhcongminh###{doc.document_title}\n"
        if not docs: titles_text = "Không có dữ liệu"

        res = await self.llm_helper.generate_response(
            prompt= prompt,
            instruction=instruction,
            args={
                "titles": titles_text,
                "titles_count": len(docs),
            }
        )
        return {
            "data": res.content,
            "total_tokens": res.usage_metadata["total_tokens"] if "total_tokens" in res.usage_metadata else 0
        }

    async def entity_extraction(self, data: str, chunk_index: int, document_id: str):
        prompt = PROMPTS["entity_extraction"]
        res = await self.llm_helper.generate_response(
            prompt=prompt,
            args={
                "language" : "VIETNAMESE",
                "examples" : PROMPTS["entity_extraction_examples"],
                "entity_types" : PROMPTS["DEFAULT_ENTITY_TYPES"],
                "tuple_delimiter" : PROMPTS["DEFAULT_TUPLE_DELIMITER"],
                "record_delimiter" : PROMPTS["DEFAULT_RECORD_DELIMITER"],
                "completion_delimiter" : PROMPTS["DEFAULT_COMPLETION_DELIMITER"],
                "input_text": data
            },
        )
        print(res)
        return {
            "data": res.content,
            "total_tokens": res.usage_metadata["total_tokens"] if "total_tokens" in res.usage_metadata else 0,
            "chunk_index": chunk_index,
            "document_id": document_id
        }


    async def keyword_extraction(self, user_input: str, history_str: str):
        prompt = PROMPTS["keywords_extraction"]
        res = await self.llm_helper.generate_response(
            prompt=prompt,
            args={
                "examples": "\n".join(PROMPTS["keywords_extraction_examples"]),
                "language": "VIETNAMESE",
                "history": history_str,
                "query": user_input
            },
        )
        return {
            "data": res.content,
            "total_tokens": res.usage_metadata["total_tokens"] if  "total_tokens" in res.usage_metadata else 0
        }

    async def summarize_entity_descriptions(self, entity_name: str, description: str):
        prompt = PROMPTS["summarize_entity_descriptions"]
        res = await self.llm_helper.generate_response(
            prompt=prompt,
            args={
                "language": "VIETNAMESE",
                "entity_name": entity_name,
                "description_list": description
            },
        )
        return {
            "data": res.content,
            "total_tokens": res.usage_metadata["total_tokens"] if "total_tokens" in res.usage_metadata else 0
        }

    async def get_rag_response(
            self,
            user_query: str,
            chatbot_model: Chatbot,
            history_context: str,
            kg_context: str,
            vector_context: str,
            chatbot_guard_rails_as_string:str,
            history_lc_message_model = None
    ):
        prompt = PROMPTS["mix_rag_response"]
        async for chunk in self.llm_helper.generate_stream_response(
            prompt=prompt,
            chat_history=history_lc_message_model,
            args={
                "chatbot_name": chatbot_model.name,
                "chatbot_organization": chatbot_model.organization,
                "chatbot_description": chatbot_model.description,
                "history_context": history_context,
                "kg_context": kg_context,
                "vector_context": vector_context,
                "chatbot_guard_rails": chatbot_guard_rails_as_string,
                "user_query": user_query
            }
        ):
            yield chunk

    async def intent_classifier(self, user_input, history, chatbot, session):
        """
        Phân loại câu hỏi của người dùng thành các intent cụ thể.
        """

        prompt = PROMPTS["intent_classification"]
        tokens_need, delta_token = tokens_need_and_delta_tokens(chatbot, prompt + user_input + history)
        if delta_token < 0: await process_if_not_enough_token(delta_token, "INTENT CLASSIFYING", chatbot.id)
        res = await self.llm_helper.generate_response(
            prompt=prompt,
            args={
                "user_input": user_input,
                "history_text": history
            },
        )
        await add_usage_tokens_to_chatbot(chatbot, session, tokens_need, action="INTENT CLASSIFYING")
        try:
            data = json.loads(res.content.strip("'").replace("```json\n", "").replace("\n```", ""))
        except json.JSONDecodeError:
            data = {"intent": "unknown", "score": 0.0, "suggestion": "Could not process input"}
        return {
            "data": data,
            "total_tokens": tokens_need
        }

    async def intend_classification_result(self, user_input, history, chatbot: Chatbot, session):
        """
        Handles user input based on classified intent.

        Parameters:
            - llm: The language model instance.
            - question: User's input to be processed.

        Returns:
            - A string response based on the intent.
        """

        classification = await self.intent_classifier(user_input, history, chatbot, session)
        intent = classification["data"].get("intent", "unknown")
        score = classification["data"].get("score", 0.0)
        suggestion = classification["data"].get("suggestion", "")
        ts = classification["total_tokens"]

        if intent in ["question"]:
            return {
                "type": "question",
                "content": user_input,
                "total_tokens": ts,
                "intend": intent
            }

        elif intent in ["statement", "exclamation"]:
            return {
                "type": "statement",
                "content": user_input,
                "total_tokens": ts,
                "intend": intent
            }

        elif intent == "greeting":
            return {
                "type": "response",
                "content": random.choice([
                    "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
                    "Chào bạn! Bạn đang cần hỗ trợ điều gì?",
                    "Hello! Bạn có câu hỏi gì không?"
                ]),
                "total_tokens": ts,
                "intend": intent
            }

        elif intent == "unclear":
            return {
                "type": "response",
                "content": f"Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể làm rõ hơn không?",
                "total_tokens": ts,
                "intend": intent
            }
        elif intent == "nonsense":
            return {
                "type": "response",
                "content": "Có vẻ như câu hỏi của bạn không có ý nghĩa. Bạn có thể nhập một câu hỏi cụ thể hơn không?",
                "total_tokens": ts,
                "intend": intent
            }
        else:
            return {
                "type": "response",
                "content": "Tôi không chắc chắn về nội dung này. Bạn có thể thử diễn đạt lại không?",
                "total_tokens": ts,
                "intend": intent
            }