from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "high_low_buffalo"

class Database:
    client: Optional[AsyncIOMotorClient] = None

db = Database()

async def get_database():
    return db.client[DB_NAME]