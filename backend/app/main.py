from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.storage import LOCAL_STORAGE_ROOT, USE_SUPABASE
from app.database import Base, engine
from app.models import contact, message, patient, send_history, user  # noqa: F401 (ensures models are registered)
from app.routers import auth, contacts, history, messages, patients, sending

app = FastAPI(title="VoiceBridge API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(contacts.router)
app.include_router(messages.router)
app.include_router(sending.router)
app.include_router(history.router)

# Local-dev-only media serving (see app/core/storage.py). Never mounted
# behavior relevant in production — production uses real Supabase signed URLs.
if not USE_SUPABASE:
    LOCAL_STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
    app.mount("/local-media", StaticFiles(directory=str(LOCAL_STORAGE_ROOT)), name="local-media")


@app.on_event("startup")
def on_startup() -> None:
    # Convenience for local/dev only. In production, use Alembic migrations
    # (`alembic upgrade head`) instead of relying on this.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
