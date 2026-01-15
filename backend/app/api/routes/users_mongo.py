"""
Users routes for MongoDB
Replaces users.py (PostgreSQL version)
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Any

from app.api.deps_mongo import CurrentUser
from app.core.security import verify_password, get_password_hash
from app.models_mongo import (
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdateMe,
    TokenBundle,
    TopUpHistory,
    TopUpHistoryDTO,
)
from app.services.UserServicesMongo import (
    create_user,
    get_user_by_email,
    update_user,
    user_exists,
)
from app.db_context.MongoDbContext import mongo_context
from app.core.config import settings
from app.helpers.vnpay import vnpay

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/signup", response_model=UserPublic)
async def register_chatbot_creator(user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    if await user_exists(email=user_in.email):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )

    user_create = UserCreate.model_validate(user_in)
    user_create.is_chatbot_creator = True
    user_create.is_first_login = False
    user = await create_user(user_create=user_create)
    return user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    *, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """
    if user_in.email:
        existing_user = await get_user_by_email(email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    
    # Create UserUpdate from UserUpdateMe
    from app.models_mongo import UserUpdate
    user_update = UserUpdate(**user_in.model_dump(exclude_unset=True))
    
    updated_user = await update_user(db_user=current_user, user_in=user_update)
    return updated_user


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    *, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    
    from app.models_mongo import UserUpdate
    user_update = UserUpdate(password=body.new_password)
    if current_user.is_first_login:
        user_update.is_first_login = False
    
    await update_user(db_user=current_user, user_in=user_update)
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get("/token_bundle", response_model=list[TokenBundle])
async def get_token_bundles(current_user: CurrentUser) -> Any:
    """
    Get all available token bundles (for users to purchase).
    """
    from decimal import Decimal
    
    cursor = mongo_context.token_bundles.find({})
    bundles = []
    async for bundle_doc in cursor:
        if "_id" in bundle_doc:
            if "id" not in bundle_doc or bundle_doc.get("id") is None:
                bundle_doc["id"] = str(bundle_doc["_id"])
            del bundle_doc["_id"]
        
        # Convert float to Decimal for response model (MongoDB stores as float)
        if isinstance(bundle_doc.get("price"), float):
            bundle_doc["price"] = Decimal(str(bundle_doc["price"]))
        
        bundles.append(TokenBundle(**bundle_doc))
    return bundles


@router.post("/create-checkout-session")
async def create_checkout_session(
    payment_data: TopUpHistoryDTO,
    current_user: CurrentUser,
    request: Request
) -> Any:
    """
    Create a checkout session for payment (VNPay).
    """
    import uuid
    from decimal import Decimal
    from datetime import datetime
    from zoneinfo import ZoneInfo
    
    # Validate chatbot exists and user has access
    chatbot = await mongo_context.chatbots.find_one({"id": payment_data.chatbot_id})
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    if chatbot["owner_id"] != current_user.id and current_user.id not in chatbot.get("invited_user_ids", []):
        raise HTTPException(status_code=403, detail="You don't have access to this chatbot")
    
    # Create top-up history record
    topup_id = str(uuid.uuid4())
    topup_dict = {
        "id": topup_id,
        "user_id": current_user.id,
        "chatbot_id": payment_data.chatbot_id,
        "amount": float(payment_data.amount),
        "tokens_received": 0,
        "created_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")),
        "pay_date": None,
        "payment_method": None,
        "bank_id": None,
        "transaction_id": None,
        "status": "pending",
        "note": payment_data.note,
        "checkout_url": None
    }
    
    await mongo_context.top_up_histories.insert_one(topup_dict)
    
    # Validate VNPay configuration
    print(f"[DEBUG] VNP_TMN_CODE: '{settings.vnp_TmnCode}' (length: {len(settings.vnp_TmnCode)})")
    print(f"[DEBUG] VNPAY_HASH_SECRET_KEY: {'*' * len(settings.VNPAY_HASH_SECRET_KEY) if settings.VNPAY_HASH_SECRET_KEY else 'EMPTY'} (length: {len(settings.VNPAY_HASH_SECRET_KEY)})")
    
    if not settings.vnp_TmnCode or not settings.VNPAY_HASH_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail=f"VNPay configuration is missing. VNP_TMN_CODE: {'empty' if not settings.vnp_TmnCode else 'set'}, "
                   f"VNPAY_HASH_SECRET_KEY: {'empty' if not settings.VNPAY_HASH_SECRET_KEY else 'set'}. "
                   f"Please configure in .env file or environment variables."
        )
    
    # Validate ReturnUrl - VNPay requires public URL, not localhost
    # For local development, allow localhost but warn that redirect won't work
    return_url = f"{settings.FRONTEND_HOST}/payment-return"
    if "localhost" in settings.FRONTEND_HOST.lower():
        if settings.ENVIRONMENT == "local":
            # Allow localhost for local development, but note that VNPay redirect won't work
            # User should use ngrok or test on staging/production
            print(f"[WARNING] Using localhost for VNPay ReturnUrl: {return_url}")
            print("[WARNING] VNPay cannot redirect to localhost. Use ngrok for local testing or test on staging/production.")
        else:
            raise HTTPException(
                status_code=400,
                detail=f"VNPay ReturnUrl cannot be localhost in {settings.ENVIRONMENT} environment. "
                       f"Please set FRONTEND_HOST to your public URL (e.g., Vercel URL). Current: {settings.FRONTEND_HOST}"
            )
    
    # Get client IP address
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Check for forwarded IP (if behind proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    # Create VNPay payment URL
    vnp = vnpay()
    vnp.requestData = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': settings.vnp_TmnCode,
        'vnp_Amount': int(payment_data.amount * 100),  # Convert to cents (VNPay uses smallest currency unit)
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': topup_id,
        'vnp_OrderInfo': payment_data.note or f"Top up for chatbot {payment_data.chatbot_id}",
        'vnp_OrderType': 'other',
        'vnp_Locale': 'vn',
        'vnp_ReturnUrl': return_url,
        'vnp_IpAddr': client_ip,
        'vnp_CreateDate': datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime('%Y%m%d%H%M%S'),
    }
    
    # Generate payment URL
    # Note: VNPay requires website registration and approval before use
    # For testing: Use sandbox with test credentials from VNPay
    # For production: Register website at https://www.vnpayment.vn and get approved
    # IMPORTANT: If you see "temporarily down" error, it usually means:
    # 1. Website not approved by VNPay yet - use sandbox URL instead
    # 2. VNPay service is down - check VNPay status page
    # 3. Missing required parameters - check VNPay documentation
    
    # Use sandbox by default unless explicitly in production AND website is approved
    vnpay_payment_url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"  # Sandbox URL
    if settings.ENVIRONMENT == "production":
        # Only use production URL if website is approved by VNPay
        # If you get "temporarily down" error, switch back to sandbox
        vnpay_payment_url = "https://www.vnpayment.vn/paymentv2/vpcpay.html"  # Production URL
    
    try:
        checkout_url = vnp.get_payment_url(vnpay_payment_url, settings.VNPAY_HASH_SECRET_KEY)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate VNPay payment URL: {str(e)}. Please check VNPay configuration."
        )
    
    # Update top-up history with checkout URL
    await mongo_context.top_up_histories.update_one(
        {"id": topup_id},
        {"$set": {"checkout_url": checkout_url}}
    )
    
    return {
        "checkout_url": checkout_url,
        "url": checkout_url,  # Alias for compatibility
        "topup_id": topup_id
    }

