import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    # Stored as String(36) rather than a Postgres-only UUID type so the
    # same models work against Postgres (production/Supabase) and SQLite
    # (local dev / quick smoke tests) without a dialect-specific column type.
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    # Every caregiver account belongs to exactly one shared Patient record.
    # Multiple caregivers can share the same patient_id (by registering
    # with an invite code) so they all see the same messages/contacts.
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="caregiver")  # caregiver | patient
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient")
