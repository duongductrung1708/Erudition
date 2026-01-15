import secrets
import warnings
import os
from typing import Annotated, Any, Literal
from neo4j import AsyncGraphDatabase
from pydantic import (
    AnyUrl,
    BeforeValidator,
    Field,
    HttpUrl,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Try multiple .env file locations
        env_file=[".env", "../.env"],  # Try backend/.env first, then root/.env
        env_ignore_empty=True,
        extra="ignore",
        populate_by_name=True,  # Allow both field name and alias
    )

    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: HttpUrl

    @model_validator(mode="after")
    def _check_google_oauth(self) -> Self:
        if self.ENVIRONMENT != "local":
            if not self.GOOGLE_CLIENT_ID or not self.GOOGLE_CLIENT_SECRET:
                raise ValueError("Google OAuth credentials must be set in non-local environments")
        return self

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = os.getenv("BACKEND_CORS_ORIGINS", [])

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None
    # PostgreSQL removed - using MongoDB only
    MONGO_CONNECTION_URL: str = os.getenv("MONGO_CONNECTION_URL", "")
    MONGO_DATABASE_NAME: str = os.getenv("MONGO_DATABASE_NAME", "")
    NEO4J_URI: str = os.getenv("NEO4J_URI", "")
    NEO4J_USERNAME: str = os.getenv("NEO4J_USERNAME", "")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "")
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "")
    MINIO_REGION: str = os.getenv("MINIO_REGION", "")

    _neo4j_driver: AsyncGraphDatabase | None = None
    
    def get_neo4j_driver(self) -> AsyncGraphDatabase | None:
        """Lazy initialization of Neo4j driver - only creates when actually needed"""
        if self._neo4j_driver is None:
            if not self.NEO4J_URI:
                return None
            try:
                self._neo4j_driver = AsyncGraphDatabase.driver(
                    self.NEO4J_URI,
                    auth=(self.NEO4J_USERNAME, self.NEO4J_PASSWORD),
                    connection_acquisition_timeout=10,  # Reduced from 60
                    max_transaction_retry_time=30,
                    max_connection_lifetime=300,
                    max_connection_pool_size=100
                )
            except Exception as e:
                print(f"[WARNING] Failed to initialize Neo4j driver: {e}")
                return None
        return self._neo4j_driver
    
    @computed_field
    @property
    def neo4j_driver(self) -> AsyncGraphDatabase | None:
        """Property accessor for Neo4j driver - lazy loaded"""
        return self.get_neo4j_driver()

    _mongo_client: AsyncIOMotorClient | None = None
    _mongo_db: AsyncIOMotorDatabase | None = None

    @computed_field
    @property
    def mongo_collection(self) -> AsyncIOMotorDatabase:
        """Lazy initialization of MongoDB connection"""
        if self._mongo_db is None:
            if not self.MONGO_CONNECTION_URL:
                raise ValueError("MONGO_CONNECTION_URL is not set in environment variables")
            # MongoDB Atlas requires SSL/TLS - add SSL options
            import ssl
            # Create client - Motor client creation may trigger DNS resolution
            # but won't actually connect until first operation
            # Use reasonable timeout for client creation
            try:
                # Set a timeout for DNS resolution
                # Note: This is a workaround - Motor doesn't support connect=False
                self._mongo_client = AsyncIOMotorClient(
                    self.MONGO_CONNECTION_URL,
                    uuidRepresentation="standard",
                    tls=True,
                    tlsAllowInvalidCertificates=False,
                    serverSelectionTimeoutMS=10000,  # Allow time for DNS but not too long
                    connectTimeoutMS=10000,
                    socketTimeoutMS=30000,
                    directConnection=False,  # Allow DNS SRV resolution
                    retryWrites=True,
                    retryReads=True,
                )
                self._mongo_db = self._mongo_client[self.MONGO_DATABASE_NAME]
                print("[INFO] MongoDB client created successfully")
            except Exception as e:
                error_msg = str(e)
                # Check if it's a DNS/timeout error
                if "DNS" in error_msg or "timeout" in error_msg.lower() or "resolution" in error_msg.lower():
                    print(f"[WARNING] MongoDB DNS resolution issue: {e}")
                    print("[INFO] This is usually a network/DNS problem.")
                    print("[INFO] Server will start, but database operations may fail.")
                    print("[INFO] Connection will be retried on first database operation.")
                    # Try to create client anyway - it might work on retry
                    # Use more lenient settings
                    try:
                        self._mongo_client = AsyncIOMotorClient(
                            self.MONGO_CONNECTION_URL,
                            uuidRepresentation="standard",
                            tls=True,
                            tlsAllowInvalidCertificates=True,  # More lenient for testing
                            serverSelectionTimeoutMS=5000,
                            connectTimeoutMS=5000,
                            directConnection=True,  # Try direct if SRV fails
                        )
                        self._mongo_db = self._mongo_client[self.MONGO_DATABASE_NAME]
                        print("[INFO] MongoDB client created with fallback settings")
                    except Exception as e2:
                        print(f"[ERROR] MongoDB client creation failed: {e2}")
                        raise RuntimeError(
                            f"MongoDB connection failed. Please check:\n"
                            f"1. Connection string format\n"
                            f"2. Network/DNS connectivity\n"
                            f"3. MongoDB Atlas IP whitelist\n"
                            f"Error: {e}"
                        ) from e2
                else:
                    # Other errors - raise immediately
                    raise RuntimeError(f"MongoDB client creation failed: {e}") from e
        return self._mongo_db

    # PostgreSQL/SQLAlchemy removed - using MongoDB only

    # SMTP Configurations
    SMTP_TLS: bool = bool(os.getenv("SMTP_TLS", True))
    SMTP_SSL: bool = bool(os.getenv("SMTP_SSL", False))
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_HOST: str | None = os.getenv("SMTP_HOST")
    SMTP_USER: str | None = os.getenv("SMTP_USER")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: str | None = os.getenv("EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: str | None = os.getenv("EMAILS_FROM_NAME")

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = int(os.getenv("EMAIL_RESET_TOKEN_EXPIRE_HOURS", 1))

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: str = os.getenv("EMAIL_TEST_USER", "test@example.com")
    FIRST_SUPERUSER: str = os.getenv("FIRST_SUPERUSER", "")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "")

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        # PostgreSQL removed - no POSTGRES_PASSWORD check needed
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self

    VNPAY_HASH_SECRET_KEY: str = ""
    vnp_TmnCode: str = ""
    
    @model_validator(mode="after")
    def _load_vnpay_from_env(self) -> Self:
        """Load VNPay config from environment if not set"""
        if not self.vnp_TmnCode:
            self.vnp_TmnCode = os.getenv("VNP_TMN_CODE", "")
        if not self.VNPAY_HASH_SECRET_KEY:
            self.VNPAY_HASH_SECRET_KEY = os.getenv("VNPAY_HASH_SECRET_KEY", "")
        return self


settings = Settings()
