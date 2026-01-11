import os
import sys
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session

from app.core.config import settings
from app.main import app
from app.unittest.utils.user import authentication_token_from_email
from app.unittest.utils.utils import get_superuser_token_headers

DATABASE_URL = (
    f"postgresql+psycopg://{settings.POSTGRES_USER}:"
    f"{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:"
    f"{settings.POSTGRES_PORT}/test"
)
# Kết nối trực tiếp tới database hiện tại
engine = create_engine(DATABASE_URL)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))


@pytest.fixture(scope="module")
def db():
    """
    Khởi tạo session kết nối trực tiếp đến database đang sử dụng.
    """
    with Session(engine) as session:
        yield session  # Yield session để sử dụng trong test


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """
    Tạo fixture TestClient để gửi request đến API.
    """
    with TestClient(app) as c:
        yield c



@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    """
    Tạo header chứa token của superuser.
    """
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    """
    Tạo header chứa token của user bình thường.
    """
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )