from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_max_tokens: int = 1024
    groq_temperature: float = 0.3
    use_groq_extraction: bool = False

    chroma_persist_dir: str = "./vector_store/chroma"
    chroma_collection: str = "ruralvet_livestock"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    database_url: str = "sqlite:///./database/ruralvet.db"

    whisper_model: str = "base"
    whisper_device: str = "cpu"
    voice_stt_provider: str = "sarvam"  # auto | sarvam (Sarvam-only) | whisper | mock
    sarvam_api_key: str = ""
    sarvam_stt_model: str = "saaras:v3"
    sarvam_stt_mode: str = "transcribe"
    sarvam_stt_timeout_seconds: float = 25.0
    tts_engine: str = "edge-tts"
    voice_tts_provider: str = "auto"  # auto | edge-tts | mock
    tts_voice: str = "hi-IN-SwaraNeural"

    translation_provider: str = "auto"  # auto | groq | libretranslate | mock
    libretranslate_url: str = "https://libretranslate.com"
    libretranslate_api_key: str = ""

    default_language: str = "en"
    supported_languages: str = "en,hi,mr,kn,ta,te"

    sms_provider: str = "console"
    whatsapp_enabled: bool = False
    vet_whatsapp_phone: str = ""

    session_ttl_hours: int = 24
    max_context_messages: int = 20

    enable_voice: bool = True
    enable_rag: bool = True
    enable_alerts: bool = True


settings = Settings()
