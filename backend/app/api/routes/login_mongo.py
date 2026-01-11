"""
Login routes for MongoDB
Replaces login.py (PostgreSQL version)
"""
import json
from datetime import timedelta
from typing import Annotated, Any, Literal

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from starlette.config import Config

from app.api.deps_mongo import CurrentUser, get_current_active_chatbot_creator
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models_mongo import Token, UserPublic, Message, NewPassword
from app.services.UserServicesMongo import (
    authenticate,
    create_user_google,
    get_user_by_email,
    update_user,
)
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    verify_password_reset_token,
    send_email,
)

router = APIRouter(tags=["login"])
oauth = OAuth(Config(environ=settings.model_dump()))
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/login/google")
async def login_google(request: Request):
    redirect_uri = str(settings.GOOGLE_REDIRECT_URI)
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/login/google/callback")
async def login_google_callback(request: Request, response: Response):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.userinfo(token=token)

    if not user_info or not user_info.get("email"):
        raise HTTPException(status_code=400, detail="Google login failed")

    user = await get_user_by_email(email=user_info["email"])
    if not user:
        # Auto-create user if not exist
        email = user_info["email"]
        name = user_info.get("name")
        user = await create_user_google(email=email, full_name=name)
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    html_content = f"""
        <html>
          <body>
            <script>
              window.opener.postMessage({json.dumps(jsonable_encoder(token))}, "{settings.FRONTEND_HOST}");
              window.close();
            </script>
          </body>
        </html>
        """
    return HTMLResponse(content=html_content)


@router.post("/login/access-token")
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await authenticate(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/user/select-role")
async def select_role(current_user: CurrentUser, role: Literal["owner", "user"]):
    from app.models_mongo import UserUpdate
    
    if role == "owner":
        user_update = UserUpdate(is_chatbot_creator=True)
    elif role == "user":
        user_update = UserUpdate(is_chatbot_creator=False)
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    await update_user(db_user=current_user, user_in=user_update)
    return {"message": "Role selected: " + role}


@router.post("/login/test-token", response_model=UserPublic)
async def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
async def recover_password(email: str) -> Message:
    """
    Password Recovery
    """
    user = await get_user_by_email(email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
async def reset_password(body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = await get_user_by_email(email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    from app.models_mongo import UserUpdate
    user_update = UserUpdate(password=body.new_password)
    await update_user(db_user=user, user_in=user_update)
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_chatbot_creator)],
    response_class=HTMLResponse,
)
async def recover_password_html_content(email: str) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = await get_user_by_email(email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )

