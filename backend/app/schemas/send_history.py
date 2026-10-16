from datetime import datetime

from app.schemas.common import CamelModel


class SendRequest(CamelModel):
    contact_id: str


class SendHistoryOut(CamelModel):
    id: str
    message_id: str
    contact_id: str
    status: str
    sent_at: datetime


class SendResult(SendHistoryOut):
    # Long-lived signed link to the AUDIO only (never video).
    audio_url: str | None = None
    # Ready-to-open wa.me link addressed to the chosen contact, with the
    # audio link pre-filled as the message text.
    whatsapp_url: str | None = None
