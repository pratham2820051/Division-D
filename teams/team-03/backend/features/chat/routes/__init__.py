"""Chat API routers."""

from fastapi import APIRouter

from features.chat.routes.chat_routes import router as chat_router
from features.chat.routes.diagnosis import router as diagnosis_router

router = APIRouter()

router.include_router(chat_router)
router.include_router(diagnosis_router)

__all__ = ["router", "chat_router", "diagnosis_router"]