from fastapi import APIRouter

from app.api.routes import (
    login_mongo, users_mongo, chatbots_mongo, faqs_mongo, fav_mongo,
    utils_mongo, documents_mongo, admin_mongo, statistics_mongo, websocket
)
from app.core.config import settings

# Import old routes for backward compatibility (will be removed later)
try:
    from app.api.routes import private
except ImportError:
    private = None

api_router = APIRouter()
# Use MongoDB routes
# IMPORTANT: Include routers in order - more specific routes should be included first
# This ensures FastAPI matches routes correctly
api_router.include_router(login_mongo.router)
api_router.include_router(users_mongo.router)
# Include chatbots_mongo before other routers that might have conflicting patterns
api_router.include_router(chatbots_mongo.router)
api_router.include_router(faqs_mongo.router)
api_router.include_router(fav_mongo.router)
api_router.include_router(documents_mongo.router)
api_router.include_router(admin_mongo.router)
api_router.include_router(utils_mongo.router)
api_router.include_router(statistics_mongo.router)
# Keep websocket for now (usually doesn't need database)
api_router.include_router(websocket.router)


if settings.ENVIRONMENT == "local" and private:
    api_router.include_router(private.router)
