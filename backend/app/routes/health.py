from fastapi import APIRouter
from app.core.config import settings
from app.services.ai_service import ai_service

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "ai_configured": ai_service.is_configured(),
        "model": settings.GEMINI_MODEL,
        "api_version": "v1.0.0"
    }

