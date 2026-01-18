from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router as api_router
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Deja Vu Real Estate API")

# Setup CORS (Allow frontend)
# In production, set ALLOWED_ORIGINS in .env (e.g., "http://localhost:3000,https://yourdomain.com")
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Deja Vu API is running"}

if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable if available (for production), otherwise default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Only enable reload in development (not in production)
    reload = os.environ.get("ENV") != "production"
    # Reload with exclusions to prevent watching CSV/data files
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=reload,
        reload_excludes=["*.csv", "*.json", "*.log", "__pycache__/*", "*.pyc"]
    )
