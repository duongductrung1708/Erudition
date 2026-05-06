import sentry_sdk
import uvicorn
from starlette.middleware.sessions import SessionMiddleware
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from multiple possible locations
env_paths = [
    Path(__file__).parent.parent / ".env",  # backend/.env
    Path(__file__).parent.parent.parent / ".env",  # root/.env
]
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        print(f"[MAIN] Loaded .env from: {env_path}")
        break
else:
    print("[MAIN] No .env file found, using environment variables only")

print("[MAIN] Starting imports...")
from app.core.config import settings
print("[MAIN] Settings imported")
from app.core.db_mongo import init_db
print("[MAIN] db_mongo imported")
from app.api.main import api_router
print("[MAIN] api_router imported")


def custom_generate_unique_id(route: APIRoute) -> str:
    """Generate unique ID for OpenAPI operation"""
    if route.tags and len(route.tags) > 0:
        return f"{route.tags[0]}-{route.name}"
    return route.name


print("[MAIN] Creating FastAPI app...")
if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    print("[MAIN] Initializing Sentry...")
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)
    print("[MAIN] Sentry initialized")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)
print("[MAIN] FastAPI app created")

# Thêm SessionMiddleware
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Set all CORS enabled origins
# Always add CORS middleware to allow frontend requests
cors_origins = settings.all_cors_origins
print(f"[DEBUG] CORS Origins: {cors_origins}")  # Debug log
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
print("[MAIN] Routers included")


@app.get("/health-check", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring/load balancer"""
    return {"status": "healthy", "service": settings.PROJECT_NAME}


print("[MAIN] Module initialization complete")


@app.on_event("startup")
async def startup_event():
    """Initialize MongoDB on startup - non-blocking"""
    import asyncio
    
    async def init_db_async():
        """Initialize database asynchronously with timeout"""
        try:
            # Set a timeout for init_db to prevent hanging
            await asyncio.wait_for(init_db(), timeout=10.0)
            print("[INFO] MongoDB initialized successfully")
            # Cleanup stuck documents (best-effort)
            try:
                from app.services.DocumentServicesMongo import DocumentServicesMongo

                cleaned = await DocumentServicesMongo.mark_stuck_documents_failed(
                    older_than_minutes=10
                )
                if cleaned:
                    print(f"[INFO] Marked {cleaned} stuck documents as Failed")
            except Exception as e:
                print(f"[WARNING] Failed to cleanup stuck documents: {e}")
        except asyncio.TimeoutError:
            print("[WARNING] MongoDB initialization timed out after 10 seconds")
            print("[INFO] Continuing anyway - connection will be established on first request")
        except Exception as e:
            print(f"[WARNING] MongoDB initialization failed: {e}")
            print("[INFO] Continuing anyway - first superuser will be created on first request")
    
    # Run init_db in background to not block server startup
    asyncio.create_task(init_db_async())


if __name__ == "__main__":
    uvicorn.run("main:app", port=8000)