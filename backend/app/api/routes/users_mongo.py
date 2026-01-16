"""
Users routes for MongoDB
Replaces users.py (PostgreSQL version)
"""
from fastapi import APIRouter, HTTPException, Request, Query
from typing import Any
from datetime import datetime

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


@router.get("/payment_return")
async def payment_return(
    request: Request,
) -> Any:
    """
    Handle VNPay payment return callback.
    VNPay redirects user here after payment with query params.
    This endpoint validates the payment, updates top-up history, and adds tokens to chatbot.
    """
    from datetime import datetime
    from zoneinfo import ZoneInfo
    from app.utils_package.DataUtils import money_to_tokens
    
    # Get all query params from VNPay callback
    query_params = dict(request.query_params)
    
    # Validate VNPay configuration
    if not settings.vnp_TmnCode or not settings.VNPAY_HASH_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="VNPay configuration is missing. Please contact administrator."
        )
    
    # Validate secure hash
    vnp = vnpay()
    vnp.responseData = query_params.copy()
    
    if not vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
        raise HTTPException(
            status_code=400,
            detail="Invalid payment signature. Payment may be fraudulent."
        )
    
    # Extract payment info from VNPay params
    vnp_TxnRef = query_params.get("vnp_TxnRef")  # This is topup_id
    vnp_ResponseCode = query_params.get("vnp_ResponseCode", "")
    vnp_TransactionStatus = query_params.get("vnp_TransactionStatus", "")
    vnp_Amount = int(query_params.get("vnp_Amount", 0))  # Amount in cents
    vnp_BankCode = query_params.get("vnp_BankCode", "")
    vnp_BankTranNo = query_params.get("vnp_BankTranNo", "")
    vnp_CardType = query_params.get("vnp_CardType", "")
    vnp_TransactionNo = query_params.get("vnp_TransactionNo", "")
    vnp_PayDate = query_params.get("vnp_PayDate", "")
    
    if not vnp_TxnRef:
        raise HTTPException(status_code=400, detail="Missing transaction reference")
    
    # Find top-up history record
    topup_doc = await mongo_context.top_up_histories.find_one({"id": vnp_TxnRef})
    if not topup_doc:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    # Determine payment status
    # vnp_ResponseCode = "00" means success
    # vnp_TransactionStatus = "00" means success
    is_success = vnp_ResponseCode == "00" and vnp_TransactionStatus == "00"
    
    # Parse pay date from VNPay format (YYYYMMDDHHmmss)
    pay_date = None
    if vnp_PayDate and len(vnp_PayDate) == 14:
        try:
            pay_date = datetime.strptime(vnp_PayDate, "%Y%m%d%H%M%S")
            pay_date = pay_date.replace(tzinfo=ZoneInfo("Asia/Ho_Chi_Minh"))
        except Exception:
            pay_date = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    else:
        pay_date = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    
    # Calculate tokens received (amount in VND = vnp_Amount / 100)
    amount_vnd = vnp_Amount // 100
    tokens_received = money_to_tokens(amount_vnd) if is_success else 0
    
    # Update top-up history
    update_data = {
        "status": "success" if is_success else "failed",
        "pay_date": pay_date,
        "transaction_id": vnp_TransactionNo,
        "bank_id": vnp_BankCode,
        "payment_method": vnp_CardType or "VNPay",
        "tokens_received": tokens_received,
        "updated_at": datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")),
    }
    
    await mongo_context.top_up_histories.update_one(
        {"id": vnp_TxnRef},
        {"$set": update_data}
    )
    
    # If payment successful, add tokens to chatbot
    if is_success:
        chatbot_id = topup_doc["chatbot_id"]
        await mongo_context.chatbots.update_one(
            {"id": chatbot_id},
            {"$inc": {"remaining_tokens": tokens_received}}
        )
    
    # Return payment info for frontend
    return {
        "id": topup_doc["id"],
        "user_id": topup_doc["user_id"],
        "chatbot_id": topup_doc["chatbot_id"],
        "amount": amount_vnd,
        "tokens_received": tokens_received,
        "status": update_data["status"],
        "pay_date": pay_date.isoformat() if pay_date else None,
        "transaction_id": vnp_TransactionNo,
        "bank_id": vnp_BankCode,
        "payment_method": update_data["payment_method"],
        "vnp_ResponseCode": vnp_ResponseCode,
        "vnp_TransactionStatus": vnp_TransactionStatus,
        "vnp_BankTranNo": vnp_BankTranNo,
        "vnp_CardType": vnp_CardType,
    }


@router.get("/payment_history")
async def get_payment_history(
    current_user: CurrentUser,
    chatbot_id: str,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
) -> Any:
    """
    Get payment history (top-up history) for a specific chatbot.
    Returns all top-up transactions for the chatbot.
    """
    from zoneinfo import ZoneInfo
    from app.services.ChatbotServicesMongo import ChatbotServicesMongo
    
    # Validate chatbot exists and user has access
    chatbot = await ChatbotServicesMongo.get_chatbot_by_id(chatbot_id=chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    # Check authorization: user must be owner or invited user, or admin
    if not current_user.is_admin:
        if chatbot.owner_id != current_user.id and current_user.id not in chatbot.get("invited_user_ids", []):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view payment history for this chatbot"
            )
    
    # Build query filter
    query_filter = {"chatbot_id": chatbot_id}
    
    # Add date filters if provided
    if created_from or created_to:
        date_filter = {}
        if created_from:
            # Normalize to timezone-aware
            if created_from.tzinfo is None:
                created_from = created_from.replace(tzinfo=ZoneInfo("UTC"))
            else:
                created_from = created_from.astimezone(ZoneInfo("UTC"))
            date_filter["$gte"] = created_from
        if created_to:
            # Normalize to timezone-aware
            if created_to.tzinfo is None:
                created_to = created_to.replace(tzinfo=ZoneInfo("UTC"))
            else:
                created_to = created_to.astimezone(ZoneInfo("UTC"))
            date_filter["$lte"] = created_to
        if date_filter:
            query_filter["created_at"] = date_filter
    
    # Get top-up histories from MongoDB
    cursor = mongo_context.top_up_histories.find(query_filter).sort("created_at", -1)
    
    histories = []
    async for doc in cursor:
        # Convert _id to id if needed
        if "_id" in doc:
            if "id" not in doc or doc.get("id") is None:
                doc["id"] = str(doc["_id"])
            del doc["_id"]
        
        # Convert datetime objects to ISO strings for JSON serialization
        if "created_at" in doc and doc["created_at"]:
            if isinstance(doc["created_at"], datetime):
                doc["created_at"] = doc["created_at"].isoformat()
        if "pay_date" in doc and doc["pay_date"]:
            if isinstance(doc["pay_date"], datetime):
                doc["pay_date"] = doc["pay_date"].isoformat()
        if "updated_at" in doc and doc["updated_at"]:
            if isinstance(doc["updated_at"], datetime):
                doc["updated_at"] = doc["updated_at"].isoformat()
        
        histories.append(doc)
    
    return histories

