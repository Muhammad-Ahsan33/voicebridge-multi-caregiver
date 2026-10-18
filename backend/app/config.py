from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./voicebridge.db"
    secret_key: str = "change-me-in-.env"
    allowed_origins: str = "http://localhost:5173"
    access_token_expire_minutes: int = 10080  # 7 days

    # Phase 3 — Supabase Storage
    supabase_url: str = ""
    supabase_service_key: str = ""
    video_bucket: str = "videos"
    audio_bucket: str = "audio"
    contact_photo_bucket: str = "contact-photos"
    signed_url_expiry_seconds: int = 3600  # 1 hour
    share_link_expiry_seconds: int = 604800  # 7 days, for links sent via WhatsApp

    # Phase 3 upload limits
    max_video_bytes: int = 25 * 1024 * 1024  # 25 MB
    max_audio_bytes: int = 8 * 1024 * 1024   # 8 MB
    max_contact_photo_bytes: int = 5 * 1024 * 1024  # 5 MB

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def supabase_url_clean(self) -> str:
        
        return self.supabase_url.rstrip("/")


settings = Settings()
