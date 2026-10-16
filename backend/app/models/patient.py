import secrets
import string
from datetime import datetime, timezone

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.user import gen_uuid


def generate_invite_code() -> str:
    # Short, human-typeable code a caregiver can read aloud/text to another
    # caregiver — e.g. "7K9QX2LM". Excludes ambiguous chars (0/O, 1/I/L).
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(8))


class Patient(Base):
    """The shared record multiple caregiver accounts attach to. All
    messages/contacts/send_history belong to a Patient, not to an
    individual caregiver User — so any caregiver who joins via the
    invite_code sees and edits the same shared data, and the patient-facing
    app (logged in via the same invite code) sees everything every
    caregiver has added."""
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False, default="My Messages")
    invite_code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False, default=generate_invite_code)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
