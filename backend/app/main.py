from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import users, records, leetcode, notion, github, review
from app.database import engine
from app import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AlgoAssistant API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(records.router)
app.include_router(leetcode.router)
app.include_router(notion.router)
app.include_router(github.router)
app.include_router(review.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AlgoAssistant API"} 