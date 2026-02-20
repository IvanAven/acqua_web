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

class OrderCreate(BaseModel):
    quantity: int = Field(gt=0, description="Cantidad de garrafones")
    delivery_address: str
    delivery_date: str
    delivery_time: str
    notes: Optional[str] = ""

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