"""
Dependencies for MongoDB
Replaces deps.py (PostgreSQL version)
"""
from typing import Annotated, Type

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.core import security
from app.core.config import settings
from app.models_mongo import TokenPayload, User
from app.services.UserServicesMongo import get_user_by_id

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]


async def get_current_user(token: TokenDep) -> Type[User]:
    """Get current user from JWT token (MongoDB version)"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    if not token_data.sub:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await get_user_by_id(user_id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_chatbot_creator(current_user: CurrentUser) -> User:
    """Require chatbot creator role"""
    if not current_user.is_chatbot_creator:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


async def get_current_active_admin(current_user: CurrentUser) -> User:
    """Require admin role"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

