"""RuralVet AI — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from features.chat.routes import router as chat_router
from features.chat.routes.diagnosis import router as diagnosis_router
from features.confidence_scoring.routes import router as confidence_router
from features.memory.routes import router as memory_router
from features.prompts.routes import router as prompts_router
from features.rag.routes import router as rag_router
from features.sms_alerts.routes import router as alerts_router
from features.translation.routes import router as translation_router
from features.triage.routes import router as triage_router
from features.voice.routes import router as voice_router

app = FastAPI(title="RuralVet AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Developer B routers
app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(diagnosis_router, prefix="/api/v1", tags=["diagnosis"])
app.include_router(memory_router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(voice_router, prefix="/api/v1/voice", tags=["voice"])
app.include_router(translation_router, prefix="/api/v1/translation", tags=["translation"])
app.include_router(alerts_router, prefix="/api/v1/alerts", tags=["alerts"])

# Developer A routers
app.include_router(rag_router, prefix="/api/v1/rag", tags=["rag"])
app.include_router(triage_router, prefix="/api/v1/triage", tags=["triage"])
app.include_router(confidence_router, prefix="/api/v1/confidence", tags=["confidence"])
app.include_router(prompts_router, prefix="/api/v1/prompts", tags=["prompts"])


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
