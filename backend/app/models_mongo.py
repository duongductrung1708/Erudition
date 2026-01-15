"""
MongoDB Models - Pydantic models for MongoDB collections
Replaces SQLModel/PostgreSQL models
"""
import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field, EmailStr


# ==================== USER MODELS ====================

class UserBase(BaseModel):
    email: EmailStr = Field(max_length=255)
    is_active: bool = True
    is_chatbot_creator: bool = False
    is_admin: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    is_first_login: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(BaseModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=40)
    is_active: bool | None = None
    is_chatbot_creator: bool | None = None
    is_admin: bool | None = None
    full_name: str | None = Field(default=None, max_length=255)
    is_first_login: bool | None = None


class UserUpdateMe(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=40)


class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    
    # References to other collections
    owned_chatbot_ids: List[str] = Field(default_factory=list)  # List of chatbot IDs owned by user
    invited_chatbot_ids: List[str] = Field(default_factory=list)  # List of chatbot IDs user is invited to
    
    class Config:
        populate_by_name = True
        # Exclude _id from serialization to avoid confusion
        # MongoDB automatically creates _id, but we use id (UUID) as primary key
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "is_chatbot_creator": True,
                "is_admin": False
            }
        }


class UserPublic(UserBase):
    id: str


class UsersPublic(BaseModel):
    data: List[UserPublic]
    count: int


# ==================== CHATBOT MODELS ====================

class ChatbotBase(BaseModel):
    name: str
    organization: str
    description: str
    temperature: float
    guard_rails: str
    quota_limit: int
    window_type: str
    window_size: int
    total_usage_token: int = 0
    remaining_tokens: int = 0
    is_active: bool = True
    is_disabled: bool = False
    is_deleted: bool = False


class ChatbotDTO(BaseModel):
    name: str
    organization: str
    description: str
    temperature: float
    guard_rails: str
    quota_limit: int
    window_type: str
    window_size: int
    is_disabled: bool


class Chatbot(ChatbotBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str  # User ID who owns this chatbot
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    
    # References
    document_ids: List[str] = Field(default_factory=list)
    conversation_ids: List[str] = Field(default_factory=list)
    faq_ids: List[str] = Field(default_factory=list)
    invited_user_ids: List[str] = Field(default_factory=list)  # Users invited to use this chatbot
    
    class Config:
        populate_by_name = True
        # Exclude _id from serialization to avoid confusion
        # MongoDB automatically creates _id, but we use id (UUID) as primary key


class UserChatbotLink(BaseModel):
    """Many-to-many relationship between User and Chatbot"""
    user_id: str
    chatbot_id: str
    usage_count: int = 0
    reset_time: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


# ==================== DOCUMENT MODELS ====================

class DocumentStatus(str, Enum):
    UPLOADING = "Uploading"
    UPLOADED = "Uploaded (waiting for next step)"
    QUEUED = "Queued for Processing"
    PROCESSING = "Processing"
    READY = "Ready"
    FAILED = "Failed"
    QAS_GENERATED = "Questions and answer generated (waiting for next step)"
    DELETING = "Deleting"


class DocumentBase(BaseModel):
    document_title: str
    source_file_path: str
    status: str
    has_qa_data: bool = False
    usage_tokens: int = 0
    latest_modified: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


class DocumentUpload(DocumentBase):
    chunk_size: int
    overlap_size: int


class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chatbot_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


# ==================== CONVERSATION MODELS ====================

class ConversationBase(BaseModel):
    user_id: str
    chatbot_id: str
    first_msg: str | None = None
    is_deleted: bool = False


class ConversationRequest(BaseModel):
    conversation_id: str
    message: str


class Conversation(ConversationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


# ==================== FAQ MODELS ====================

class FrequentlyAskedQuestionBase(BaseModel):
    question: str
    answer: str
    embedding: List[float] | None = None


class FQAsDTO(BaseModel):
    question: str
    answer: str


class FrequentlyAskedQuestion(FrequentlyAskedQuestionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chatbot_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


# ==================== FAVORITE MESSAGE MODELS ====================

class FavoriteMessagesBase(BaseModel):
    chatbot_response_id: str  # MongoDB chatbot_response_id


class FavoriteMessageCreate(FavoriteMessagesBase):
    chatbot_id: str


class FavoriteMessage(FavoriteMessagesBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    chatbot_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


# ==================== TOP UP HISTORY MODELS ====================

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class TopUpHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    chatbot_id: str
    amount: Decimal
    tokens_received: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    pay_date: datetime | None = None
    payment_method: str | None = Field(default=None, max_length=100)
    bank_id: str | None = Field(default=None, max_length=100)
    transaction_id: str | None = Field(default=None, max_length=255)
    status: PaymentStatus = PaymentStatus.PENDING
    note: str | None = Field(default=None, max_length=255)
    checkout_url: str | None = None


class TopUpHistoryDTO(BaseModel):
    amount: float | int  # Accept both float and int
    note: str | None = Field(default=None, max_length=255)
    chatbot_id: str


# ==================== TOKEN BUNDLE MODELS ====================

class TokenBundle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    price: Decimal
    token_amount: int
    name: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")))


class TokenBundleDTO(BaseModel):
    price: Decimal
    token_amount: int
    name: str
    description: str


# ==================== FILTER MODELS ====================

class FilterBase(BaseModel):
    chatbot_id: str
    from_date: datetime | None = Field(None, description="Lọc từ ngày")
    to_date: datetime | None = Field(None, description="Lọc đến ngày")


class FilterWithPaginateRequest(FilterBase):
    filter_email: str | None = Field(None, description="Lọc theo email người dùng")
    skip: int = 0
    limit: int | None = Field(None, description="Số lượng bản ghi tối đa")


class FilterReport(BaseModel):
    chatbot_id: str
    from_date: datetime | None = Field(None, description="Lọc từ ngày")
    to_date: datetime | None = Field(None, description="Lọc đến ngày")


class FilterTopUpHistory(BaseModel):
    chatbot_id: str
    created_from: datetime | None = Field(None, description="Lọc theo thời gian tạo từ ngày")
    created_to: datetime | None = Field(None, description="Lọc theo thời gian tạo đến ngày")


class MessageReportRequest(BaseModel):
    conversation_id: str
    chatbot_response_id: str
    report: str


class UsageTokenByChatbotResponse(BaseModel):
    user_email: str
    usage_tokens: int
    date_time: datetime
    method: str


# ==================== API MODELS ====================

class Message(BaseModel):
    message: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None


class NewPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)

