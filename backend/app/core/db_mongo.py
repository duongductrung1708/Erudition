"""
MongoDB Database Configuration
Replaces db.py (PostgreSQL version)
"""
from app.core.config import settings
from app.db_context.MongoDbContext import mongo_context
from app.models_mongo import User, UserCreate
from app.services.UserServicesMongo import create_user


# MongoDB connection lazy proxy - only connects when actually accessed
class MongoDBProxy:
    """Proxy for MongoDB database that lazy-loads connection"""
    def __getitem__(self, key):
        return settings.mongo_collection[key]
    
    def __getattr__(self, name):
        return getattr(settings.mongo_collection, name)

mongo_db = MongoDBProxy()

# Neo4j (if still needed) - lazy loaded via settings.neo4j_driver
# Use settings.neo4j_driver directly when needed instead of neo4j_db
# This prevents Neo4j connection from being established at import time


async def init_db() -> None:
    """Initialize database - create first superuser if not exists"""
    from app.services.UserServicesMongo import get_user_by_email
    
    user = await get_user_by_email(email=settings.FIRST_SUPERUSER)
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_admin=True,
        )
        await create_user(user_create=user_in)

