import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import db, MONGODB_URI, AsyncIOMotorClient
from .routers import auth, users

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not MONGODB_URI:
        print("Warning: MONGODB_URI not set in environment variables.")
    else:
        db.client = AsyncIOMotorClient(MONGODB_URI)
        print("Connected to MongoDB")
    
    yield
    
    # Shutdown
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")

app = FastAPI(title="High-Low-Buffalo Backend", lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

@app.get("/api/v1/healthz")
async def health_check():
    if not db.client:
        return {"status": "error", "db": "disconnected"}
    
    try:
        # Ping the database to ensure connection is active
        await db.client.admin.command('ping')
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": "error", "details": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)