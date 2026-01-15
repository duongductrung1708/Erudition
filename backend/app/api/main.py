import sys
print("[API_MAIN] File started executing")
sys.stdout.flush()

from fastapi import APIRouter
print("[API_MAIN] FastAPI imported")
sys.stdout.flush()

print("[API_MAIN] Starting router imports...")
sys.stdout.flush()

from app.core.config import settings
print("[API_MAIN] Settings imported")
sys.stdout.flush()

print("[API_MAIN] Importing login_mongo...")
sys.stdout.flush()
from app.api.routes import login_mongo
print("[API_MAIN] login_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing users_mongo...")
sys.stdout.flush()
from app.api.routes import users_mongo
print("[API_MAIN] users_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing chatbots_mongo...")
sys.stdout.flush()
from app.api.routes import chatbots_mongo
print("[API_MAIN] chatbots_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing faqs_mongo...")
sys.stdout.flush()
from app.api.routes import faqs_mongo
print("[API_MAIN] faqs_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing fav_mongo...")
sys.stdout.flush()
from app.api.routes import fav_mongo
print("[API_MAIN] fav_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing utils_mongo...")
sys.stdout.flush()
from app.api.routes import utils_mongo
print("[API_MAIN] utils_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing documents_mongo...")
sys.stdout.flush()
from app.api.routes import documents_mongo
print("[API_MAIN] documents_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing admin_mongo...")
sys.stdout.flush()
from app.api.routes import admin_mongo
print("[API_MAIN] admin_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing statistics_mongo...")
sys.stdout.flush()
from app.api.routes import statistics_mongo
print("[API_MAIN] statistics_mongo imported")
sys.stdout.flush()

print("[API_MAIN] Importing websocket...")
sys.stdout.flush()
from app.api.routes import websocket
print("[API_MAIN] websocket imported")
sys.stdout.flush()

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
