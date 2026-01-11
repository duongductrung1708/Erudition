import uuid

from sqlmodel import Session

from app.models import Chatbot, ChatbotDTO, User
from app.services.ChatbotServices import ChatbotServices
from app.unittest.utils.utils import random_lower_string as random_string, random_email


def test_create_chatbot(db: Session) -> None:
    name = random_string()
    owner_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Thêm giá trị cho các trường cần thiết
    organization = random_string()
    description = "This is a test chatbot."  # Mô tả hợp lệ cho chatbot

    chatbot_in = Chatbot(
        name=name,
        owner_id=owner_id,
        organization=organization,
        description=description,
        temperature=0.7,  # Giá trị mặc định cho trường temperature
        guard_rails="None",  # Giá trị mặc định cho guard_rails
        quota_limit=100,  # Giá trị mặc định cho quota_limit
        window_type="rolling",  # Giá trị mặc định cho window_type
        window_size=30  # Giá trị mặc định cho window_size
    )
    chatbot = ChatbotServices.create_chatbot(session=db, new_chatbot=chatbot_in)

    # Kiểm tra các thuộc tính
    assert chatbot.name == name
    assert chatbot.owner_id == owner_id
    assert chatbot.organization == organization
    assert chatbot.description == description  # Kiểm tra trường description
    assert hasattr(chatbot, "id")


def test_update_chatbot(db: Session) -> None:
    name = random_string()
    owner_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    organization = random_string()
    description = "This is a test chatbot."  # Mô tả hợp lệ cho chatbot
    chatbot_in = Chatbot(
        name=name,
        owner_id=owner_id,
        organization=organization,
        description=description,
        temperature=0.7,  # Giá trị mặc định cho trường temperature
        guard_rails="None",  # Giá trị mặc định cho guard_rails
        quota_limit=100,  # Giá trị mặc định cho quota_limit
        window_type="rolling",  # Giá trị mặc định cho window_type
        window_size=30  # Giá trị mặc định cho window_size
    )
    chatbot = ChatbotServices.create_chatbot(session=db, new_chatbot=chatbot_in)
    updated_name = random_string()
    chatbot.name = updated_name
    updated_chatbot = ChatbotServices.update_chatbot(session=db, chatbot_id=chatbot.id, chatbot_data=chatbot)
    assert updated_chatbot.name == updated_name
    assert updated_chatbot.id == chatbot.id


def test_get_chatbots_by_owner_id(db: Session) -> None:
    owner_id = uuid.uuid4()
    chatbot1 = ChatbotServices.create_chatbot(
        session=db,
        new_chatbot=Chatbot(
            name=random_string(),
            owner_id=owner_id,
            organization=random_string(),
            description="This is a test chatbot 1.",
            temperature=0.7,  # Giá trị mặc định cho trường temperature
            guard_rails="None",  # Giá trị mặc định cho guard_rails
            quota_limit=100,  # Giá trị mặc định cho quota_limit
            window_type="rolling",  # Giá trị mặc định cho window_type
            window_size=30  # Giá trị mặc định cho window_size
        )
    )
    chatbot2 = ChatbotServices.create_chatbot(
        session=db,
        new_chatbot=Chatbot(
            name=random_string(),
            owner_id=owner_id,
            organization=random_string(),
            description="This is a test chatbot 2.",
            temperature=0.7,  # Giá trị mặc định cho trường temperature
            guard_rails="None",  # Giá trị mặc định cho guard_rails
            quota_limit=100,  # Giá trị mặc định cho quota_limit
            window_type="rolling",  # Giá trị mặc định cho window_type
            window_size=30  # Giá trị mặc định cho window_size
        )
    )
    chatbots = ChatbotServices.get_chatbots_by_owner_id(session=db, owner_id=owner_id)
    assert len(chatbots) == 2
    assert chatbot1 in chatbots
    assert chatbot2 in chatbots


def test_delete_chatbot_by_id(db: Session) -> None:
    import uuid

    owner_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    chatbot_in = Chatbot(
        name=random_string(),
        owner_id=owner_id,
        organization=random_string(),  # Gán giá trị hợp lệ
        description="This is a test chatbot for delete.",
        temperature=0.7,  # Giá trị mặc định cho trường temperature
        guard_rails="None",  # Giá trị mặc định cho guard_rails
        quota_limit=100,  # Giá trị mặc định cho quota_limit
        window_type="rolling",  # Giá trị mặc định cho window_type
        window_size=30  # Giá trị mặc định cho window_size
    )
    chatbot = ChatbotServices.create_chatbot(session=db, new_chatbot=chatbot_in)
    assert chatbot is not None  # Đảm bảo đối tượng chatbot được tạo thành công

    delete_result = ChatbotServices.delete_chatbot_by_id(session=db, chatbot_id=chatbot.id)
    assert delete_result
    chatbot_after_deletion = ChatbotServices.get_chatbot_by_id(session=db, chatbot_id=chatbot.id)
    assert chatbot_after_deletion.is_deleted


import uuid
from hashlib import sha256

def test_add_user_to_chatbot(db: Session) -> None:
    owner_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    chatbot_in = Chatbot(
        name=random_string(),
        owner_id=owner_id,
        organization=random_string(),  # Gán giá trị hợp lệ
        description="This is a test chatbot for inviting user.",
        temperature=0.7,  # Giá trị mặc định cho trường temperature
        guard_rails="None",  # Giá trị mặc định cho guard_rails
        quota_limit=100,  # Giá trị mặc định cho quota_limit
        window_type="rolling",  # Giá trị mặc định cho window_type
        window_size=30  # Giá trị mặc định cho window_size
    )
    chatbot = ChatbotServices.create_chatbot(session=db, new_chatbot=chatbot_in)

    # Tạo hashed_password (giả sử sử dụng hàm băm SHA-256)
    password = "secure_password"
    hashed_password = sha256(password.encode("utf-8")).hexdigest()

    # Tạo đối tượng user với hashed_password
    user = User(
        id=uuid.uuid4(),
        email=random_email(),
        full_name="Test Invited User",
        hashed_password=hashed_password  # Cung cấp hashed_password hợp lệ
    )
    db.add(user)
    db.commit()

    # Thêm người dùng vào chatbot
    result = ChatbotServices.add_user_to_chatbot(
        session=db, chatbot_id=chatbot.id, user=user
    )
    assert result
    assert user in chatbot.chatbot_users  # Kiểm tra quan hệ Many-to-Many
