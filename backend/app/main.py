import sentry_sdk
import uvicorn
from starlette.middleware.sessions import SessionMiddleware
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.core.db_mongo import init_db


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

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


@app.on_event("startup")
async def startup_event():
    """Initialize MongoDB on startup"""
    try:
        await init_db()
        print("[INFO] MongoDB initialized successfully")
    except Exception as e:
        print(f"[WARNING] MongoDB initialization failed: {e}")
        print("[INFO] Continuing anyway - first superuser will be created on first request")


if __name__ == "__main__":
    uvicorn.run("main:app", port=8000)