import uuid

from app.services.ChatbotServices import ChatbotServices

user_id = "ff95cc45-100f-4be4-8af6-982e3fd14cb4"
chatbot_id = "0e2a115a-0d73-477d-b593-4e020e56fd53"
ChatbotServices.is_exceed_quota_limit(
    uuid.UUID(user_id), uuid.UUID(chatbot_id)
)