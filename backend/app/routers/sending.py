import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.storage import get_signed_url
from app.deps import get_current_patient, get_db
from app.models.contact import Contact
from app.models.message import Message
from app.models.patient import Patient
from app.models.send_history import SendHistory
from app.schemas.send_history import SendRequest, SendResult

router = APIRouter(tags=["sending"])


def _whatsapp_url(phone: str, text: str) -> str:
    # wa.me wants the number in international format, digits only, no "+".
    digits = re.sub(r"\D", "", phone)
    return f"https://wa.me/{digits}?text={quote(text)}"


@router.post("/messages/{message_id}/send", response_model=SendResult)
def send_message(
    message_id: str,
    body: SendRequest,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    message = db.query(Message).filter(Message.id == message_id, Message.patient_id == patient.id).first()
    if not message:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")

    contact = db.query(Contact).filter(Contact.id == body.contact_id, Contact.patient_id == patient.id).first()
    if not contact:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found")

    # IMPORTANT: only ever resolve and use AUDIO here. message.video_url is
    # never read in this file — video is for the user's own confirmation only.
    audio_url = get_signed_url(settings.audio_bucket, message.audio_url, expires_in=settings.share_link_expiry_seconds)

    whatsapp_url = None
    if audio_url:
        text = f"🔊 {message.title}\nTap to listen: {audio_url}"
        whatsapp_url = _whatsapp_url(contact.phone, text)

    # "sent" means the WhatsApp message was prepared and handed to the user's
    # WhatsApp. (The free wa.me flow gives no delivery receipt.)
    entry = SendHistory(
        patient_id=patient.id,
        message_id=message.id,
        contact_id=contact.id,
        status="sent" if audio_url else "failed",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return SendResult(
        id=entry.id,
        message_id=entry.message_id,
        contact_id=entry.contact_id,
        status=entry.status,
        sent_at=entry.sent_at,
        audio_url=audio_url,
        whatsapp_url=whatsapp_url,
    )
