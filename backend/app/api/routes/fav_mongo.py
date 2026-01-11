"""
Favorite message routes for MongoDB
Replaces fav.py (PostgreSQL version)
"""
from fastapi import APIRouter, HTTPException, Query
from zoneinfo import ZoneInfo

from app.api.deps_mongo import CurrentUser
from app.models_mongo import FavoriteMessageCreate
from app.services.ChatbotServicesMongo import ChatbotServicesMongo
from app.services.FavMsgServicesMongo import FavMsgServicesMongo

router = APIRouter(prefix="/favorite", tags=["Favorite"])


@router.get("/")
async def get_my_fav_by_chatbot(
    chatbot_id: str,
    current_user: CurrentUser,
    search_keyword: str = Query(
        default=None,
        description="Search by user query or chatbot response"
    ),
    limit: int = 10,
    skip: int = 0,
    sort_by: str = Query(
        default="favorite_at",
        enum=["favorite_at", "date_time"],
        description="Sort by 'favorite_at' (default) or 'date_time'"
    ),
):
    """Get user's favorite messages for a chatbot"""
    try:
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
        if chatbot is None or chatbot.is_deleted:
            raise HTTPException(status_code=404, detail="Not found")
        if not chatbot.is_active:
            raise HTTPException(status_code=403, detail="Chatbot is not active")
        if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
            raise HTTPException(status_code=403, detail="You are unauthorized.")
        
        result = await FavMsgServicesMongo.get_user_favorite_messages(
            user_id=current_user.id,
            chatbot_id=chatbot_id,
            skip=skip,
            limit=limit
        )
        
        # TODO: Implement search_keyword and sort_by filtering
        # For now, return basic result
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/create")
async def create_fav(
    fav: FavoriteMessageCreate,
    current_user: CurrentUser,
):
    """Add a message to favorites"""
    try:
        chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=fav.chatbot_id)
        if chatbot is None or chatbot.is_deleted:
            raise HTTPException(status_code=404, detail="Not found")
        if not chatbot.is_active:
            raise HTTPException(status_code=403, detail="Chatbot is not active")
        if chatbot.owner_id != current_user.id and current_user.id not in chatbot.invited_user_ids:
            raise HTTPException(status_code=403, detail="You are unauthorized.")
        
        new_fav = await FavMsgServicesMongo.add_favorite(
            user_id=current_user.id,
            chatbot_id=fav.chatbot_id,
            message_id=fav.chatbot_response_id
        )
        new_fav.created_at = new_fav.created_at.astimezone(ZoneInfo("Asia/Ho_Chi_Minh"))
        return new_fav
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/delete_by_id")
async def delete_fav_by_id(fav_id: str, current_user: CurrentUser):
    """Delete favorite by ID"""
    try:
        fav = await FavMsgServicesMongo.get_favorite_by_id(favorite_id=fav_id)
        if not fav:
            raise HTTPException(404, "Favorite message does not exist.")
        if current_user.id != fav.user_id:
            raise HTTPException(403, "You are unauthorized.")
        
        await FavMsgServicesMongo.delete_favorite_by_id(favorite_id=fav_id)
        return {"detail": "Favorite message deleted."}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/delete_by_message_id")
async def delete_fav_by_message_id(
    chatbot_response_id: str,
    current_user: CurrentUser,
):
    """Delete favorite by message ID"""
    try:
        favorites = await FavMsgServicesMongo.get_favorites_by_message_id(
            message_response_id=chatbot_response_id
        )
        
        if not favorites:
            raise HTTPException(404, "Favorite message does not exist.")
        
        # Find favorite of current user
        target_fav = next((f for f in favorites if f.user_id == current_user.id), None)
        if not target_fav:
            raise HTTPException(403, "You are unauthorized.")
        
        await FavMsgServicesMongo.delete_favorite_by_id(favorite_id=target_fav.id)
        return {"detail": "Favorite message deleted."}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

