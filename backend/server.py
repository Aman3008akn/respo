from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt # For password hashing

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# New Models for User Management
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    balance: float = 0.0

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class BalanceUpdate(BaseModel):
    amount: float

# Temporary in-memory "database" for users
in_memory_users = {} # {username: UserInDB}

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/register", response_model=User)
async def register_user(user_create: UserCreate):
    if user_create.username in in_memory_users:
        raise HTTPException(status_code=400, detail="Username already registered")
    if any(u.email == user_create.email for u in in_memory_users.values()):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = bcrypt.hashpw(user_create.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_in_db = UserInDB(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        balance=0.0 # Initial balance
    )
    in_memory_users[user_create.username] = user_in_db
    return User(**user_in_db.model_dump())

@api_router.post("/login", response_model=User)
async def login_user(user_login: UserLogin):
    user_in_db = in_memory_users.get(user_login.username)
    if not user_in_db:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not bcrypt.checkpw(user_login.password.encode('utf-8'), user_in_db.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    return User(**user_in_db.model_dump())

@api_router.get("/user/balance/{username}", response_model=User)
async def get_user_balance(username: str):
    user_in_db = in_memory_users.get(username)
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_in_db.model_dump())

@api_router.post("/user/deposit/{username}", response_model=User)
async def deposit_funds(username: str, update: BalanceUpdate):
    user_in_db = in_memory_users.get(username)
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_in_db.balance += update.amount
    return User(**user_in_db.model_dump())

@api_router.post("/user/withdraw/{username}", response_model=User)
async def withdraw_funds(username: str, update: BalanceUpdate):
    user_in_db = in_memory_users.get(username)
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in_db.balance < update.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    user_in_db.balance -= update.amount
    return User(**user_in_db.model_dump())

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
