from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, reflections

app = FastAPI()

# Configure CORS
origins = [
    "https://high-low-buffalo-proj.onrender.com",
    "http://localhost:5137",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(reflections.router, prefix="/api/v1/reflections", tags=["reflections"])
