from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-123456789')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Constants
PRICE_PER_BOTTLE = 50  # MXN per bottle

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    address: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str
    phone: str
    address: str
    role: str = "customer"  # customer or admin
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class CouponCreate(BaseModel):
    code: str = Field(min_length=3, max_length=20, description="Código del cupón")
    discount_percentage: int = Field(ge=1, le=100, description="Porcentaje de descuento")
    expiry_date: str
    max_uses: Optional[int] = None  # None = unlimited

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    code: str
    discount_percentage: int
    expiry_date: str
    is_active: bool
    max_uses: Optional[int]
    current_uses: int
    created_at: str

class CouponValidate(BaseModel):
    code: str

class CouponValidateResponse(BaseModel):
    valid: bool
    discount_percentage: int
    message: str

class OrderCreate(BaseModel):
    quantity: int = Field(gt=0, description="Cantidad de garrafones")
    delivery_address: str
    delivery_date: str
    delivery_time: str
    notes: Optional[str] = ""
    coupon_code: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_email: str
    customer_name: str
    customer_phone: str
    quantity: int
    delivery_address: str
    delivery_date: str
    delivery_time: str
    notes: str
    status: str  # pending, in_transit, delivered, cancelled
    coupon_code: Optional[str] = None
    discount_percentage: int = 0
    original_total: float
    final_total: float
    created_at: str

class OrderUpdate(BaseModel):
    status: str

class CustomerInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str
    phone: str
    address: str
    total_orders: int
    created_at: str

# ==================== AUTH UTILITIES ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado"
        )
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "address": user_data.address,
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user_data.email})
    
    user_response = User(
        email=user_dict["email"],
        name=user_dict["name"],
        phone=user_dict["phone"],
        address=user_dict["address"],
        role=user_dict["role"],
        created_at=user_dict["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={"sub": user_data.email})
    
    user_response = User(
        email=user["email"],
        name=user["name"],
        phone=user["phone"],
        address=user["address"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    
    # Calculate price
    original_total = order_data.quantity * PRICE_PER_BOTTLE
    discount_percentage = 0
    final_total = original_total
    coupon_code = None
    
    # Apply coupon if provided
    if order_data.coupon_code:
        coupon = await db.coupons.find_one({"code": order_data.coupon_code.upper()})
        if coupon and coupon["is_active"]:
            # Check expiry
            if datetime.fromisoformat(coupon["expiry_date"]) > datetime.now(timezone.utc):
                # Check max uses
                if coupon["max_uses"] is None or coupon["current_uses"] < coupon["max_uses"]:
                    discount_percentage = coupon["discount_percentage"]
                    final_total = original_total * (1 - discount_percentage / 100)
                    coupon_code = coupon["code"]
                    
                    # Increment coupon usage
                    await db.coupons.update_one(
                        {"code": coupon["code"]},
                        {"$inc": {"current_uses": 1}}
                    )
    
    order_dict = {
        "id": str(uuid.uuid4()),
        "customer_email": current_user["email"],
        "customer_name": current_user["name"],
        "customer_phone": current_user["phone"],
        "quantity": order_data.quantity,
        "delivery_address": order_data.delivery_address,
        "delivery_date": order_data.delivery_date,
        "delivery_time": order_data.delivery_time,
        "notes": order_data.notes or "",
        "status": "pending",
        "coupon_code": coupon_code,
        "discount_percentage": discount_percentage,
        "original_total": original_total,
        "final_total": final_total,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_dict)
    return Order(**order_dict)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] != "admin":
        query["customer_email"] = current_user["email"]
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    # Check permissions
    if current_user["role"] != "admin" and order["customer_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tiene permiso para ver este pedido")
    
    return Order(**order)

@api_router.put("/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str, 
    update_data: OrderUpdate, 
    current_user: dict = Depends(get_current_admin)
):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": update_data.status}}
    )
    
    # If order is marked as delivered, check if customer qualifies for auto coupon
    if update_data.status == "delivered":
        await generate_loyalty_coupon(order["customer_email"])
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return Order(**updated_order)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_admin)):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return {"message": "Pedido eliminado exitosamente"}

# ==================== CUSTOMER ROUTES (Admin only) ====================

@api_router.get("/customers", response_model=List[CustomerInfo])
async def get_customers(current_user: dict = Depends(get_current_admin)):
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password": 0}).to_list(1000)
    
    customers_with_orders = []
    for user in users:
        order_count = await db.orders.count_documents({"customer_email": user["email"]})
        customer_info = CustomerInfo(
            email=user["email"],
            name=user["name"],
            phone=user["phone"],
            address=user["address"],
            total_orders=order_count,
            created_at=user["created_at"]
        )
        customers_with_orders.append(customer_info)
    
    return customers_with_orders

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        total_customers = await db.users.count_documents({"role": "customer"})
        total_orders = await db.orders.count_documents({})
        pending_orders = await db.orders.count_documents({"status": "pending"})
        delivered_orders = await db.orders.count_documents({"status": "delivered"})
        
        return {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "delivered_orders": delivered_orders
        }
    else:
        total_orders = await db.orders.count_documents({"customer_email": current_user["email"]})
        pending_orders = await db.orders.count_documents({
            "customer_email": current_user["email"],
            "status": "pending"
        })
        
        return {
            "total_orders": total_orders,
            "pending_orders": pending_orders
        }

# ==================== COUPON ROUTES ====================

async def generate_loyalty_coupon(customer_email: str):
    """Generate automatic coupon for loyal customers (5+ delivered orders)"""
    delivered_count = await db.orders.count_documents({
        "customer_email": customer_email,
        "status": "delivered"
    })
    
    # Generate coupon at 5, 10, 15, 20... delivered orders
    if delivered_count > 0 and delivered_count % 5 == 0:
        # Check if coupon already exists for this milestone
        coupon_code = f"LOYAL{delivered_count}_{customer_email.split('@')[0].upper()[:5]}"
        existing = await db.coupons.find_one({"code": coupon_code})
        
        if not existing:
            # Create loyalty coupon (20% off, valid for 30 days)
            coupon_dict = {
                "code": coupon_code,
                "discount_percentage": 20,
                "expiry_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                "is_active": True,
                "max_uses": 1,
                "current_uses": 0,
                "customer_email": customer_email,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.coupons.insert_one(coupon_dict)

@api_router.post("/coupons", response_model=Coupon)
async def create_coupon(coupon_data: CouponCreate, current_user: dict = Depends(get_current_admin)):
    # Check if coupon code already exists
    existing = await db.coupons.find_one({"code": coupon_data.code.upper()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de cupón ya existe"
        )
    
    # Parse expiry date and add timezone
    expiry_dt = datetime.fromisoformat(coupon_data.expiry_date).replace(tzinfo=timezone.utc)
    
    coupon_dict = {
        "code": coupon_data.code.upper(),
        "discount_percentage": coupon_data.discount_percentage,
        "expiry_date": expiry_dt.isoformat(),
        "is_active": True,
        "max_uses": coupon_data.max_uses,
        "current_uses": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_dict)
    return Coupon(**coupon_dict)

@api_router.get("/coupons", response_model=List[Coupon])
async def get_coupons(current_user: dict = Depends(get_current_admin)):
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Coupon(**coupon) for coupon in coupons]

@api_router.delete("/coupons/{code}")
async def delete_coupon(code: str, current_user: dict = Depends(get_current_admin)):
    result = await db.coupons.delete_one({"code": code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return {"message": "Cupón eliminado exitosamente"}

@api_router.post("/coupons/validate", response_model=CouponValidateResponse)
async def validate_coupon(coupon_data: CouponValidate, current_user: dict = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"code": coupon_data.code.upper()})
    
    if not coupon:
        return CouponValidateResponse(
            valid=False,
            discount_percentage=0,
            message="Cupón no encontrado"
        )
    
    if not coupon["is_active"]:
        return CouponValidateResponse(
            valid=False,
            discount_percentage=0,
            message="Cupón inactivo"
        )
    
    # Check expiry
    if datetime.fromisoformat(coupon["expiry_date"]) <= datetime.now(timezone.utc):
        return CouponValidateResponse(
            valid=False,
            discount_percentage=0,
            message="Cupón expirado"
        )
    
    # Check max uses
    if coupon["max_uses"] is not None and coupon["current_uses"] >= coupon["max_uses"]:
        return CouponValidateResponse(
            valid=False,
            discount_percentage=0,
            message="Cupón agotado"
        )
    
    # Check if it's a customer-specific coupon
    if "customer_email" in coupon and coupon["customer_email"] != current_user["email"]:
        return CouponValidateResponse(
            valid=False,
            discount_percentage=0,
            message="Este cupón no es válido para tu cuenta"
        )
    
    return CouponValidateResponse(
        valid=True,
        discount_percentage=coupon["discount_percentage"],
        message=f"¡Cupón válido! {coupon['discount_percentage']}% de descuento"
    )

@api_router.get("/coupons/my-coupons", response_model=List[Coupon])
async def get_my_coupons(current_user: dict = Depends(get_current_user)):
    # Get customer-specific coupons that are still valid
    coupons = await db.coupons.find({
        "customer_email": current_user["email"],
        "is_active": True
    }, {"_id": 0}).to_list(1000)
    
    # Filter out expired or fully used coupons
    valid_coupons = []
    for coupon in coupons:
        if datetime.fromisoformat(coupon["expiry_date"]) > datetime.now(timezone.utc):
            if coupon["max_uses"] is None or coupon["current_uses"] < coupon["max_uses"]:
                valid_coupons.append(Coupon(**coupon))
    
    return valid_coupons

# ==================== INIT ADMIN ====================

@app.on_event("startup")
async def create_admin():
    admin = await db.users.find_one({"email": "admin@acqua.com"})
    if not admin:
        admin_data = {
            "email": "admin@acqua.com",
            "password": get_password_hash("admin123"),
            "name": "Administrador ACQUA",
            "phone": "1234567890",
            "address": "Oficina Central",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_data)
        print("Admin user created: admin@acqua.com / admin123")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()