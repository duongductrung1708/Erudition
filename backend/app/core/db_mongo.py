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

# Neo4j (if still needed)
neo4j_db = settings.neo4j_driver


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

