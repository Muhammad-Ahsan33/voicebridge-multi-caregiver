from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.storage import build_object_path, delete_file, get_signed_url, upload_file
from app.deps import get_current_patient, get_db
from app.models.message import Message
from app.models.patient import Patient
from app.schemas.message import MessageCreate, MessageOut, MessageUpdate

router = APIRouter(prefix="/messages", tags=["messages"])

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg"}


def _to_out(message: Message) -> MessageOut:
    data = {column.name: getattr(message, column.name) for column in Message.__table__.columns}
    for key, value in data.items():
        if value is not None and hasattr(value, "hex"):
            data[key] = str(value)
    data["videoUrl"] = get_signed_url(settings.video_bucket, message.video_url)
    data["audioUrl"] = get_signed_url(settings.audio_bucket, message.audio_url)
    return MessageOut(**data)


def _get_owned_message(db: Session, patient: Patient, message_id: str) -> Message:
    message = db.query(Message).filter(Message.id == message_id, Message.patient_id == patient.id).first()
    if not message:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    return message


@router.get("", response_model=list[MessageOut])
def list_messages(
    category: str | None = None,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    q = db.query(Message).filter(Message.patient_id == patient.id)
    if category:
        q = q.filter(Message.category_id == category)
    return [_to_out(m) for m in q.order_by(Message.created_at).all()]


@router.get("/{message_id}", response_model=MessageOut)
def get_message(message_id: str, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    return _to_out(_get_owned_message(db, patient, message_id))


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def create_message(body: MessageCreate, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    message = Message(patient_id=patient.id, **body.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)
    return _to_out(message)


@router.put("/{message_id}", response_model=MessageOut)
def update_message(
    message_id: str,
    body: MessageUpdate,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    message = _get_owned_message(db, patient, message_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(message, field, value)
    db.commit()
    db.refresh(message)
    return _to_out(message)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: str, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    message = _get_owned_message(db, patient, message_id)
    delete_file(settings.video_bucket, message.video_url)
    delete_file(settings.audio_bucket, message.audio_url)
    db.delete(message)
    db.commit()


async def _read_and_validate(file: UploadFile, allowed_types: set[str], max_bytes: int, kind: str) -> bytes:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in allowed_types:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported {kind} type: {file.content_type}")
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"{kind.capitalize()} file exceeds the {max_bytes // (1024*1024)}MB limit")
    if len(content) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Uploaded {kind} file is empty")
    return content


@router.post("/{message_id}/upload-video", response_model=MessageOut)
async def upload_video(
    message_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    message = _get_owned_message(db, patient, message_id)
    content = await _read_and_validate(file, ALLOWED_VIDEO_TYPES, settings.max_video_bytes, "video")
    delete_file(settings.video_bucket, message.video_url)
    path = build_object_path(patient.id, message.id, file.content_type)
    stored_path = upload_file(settings.video_bucket, path, content, file.content_type)
    message.video_url = stored_path
    db.commit()
    db.refresh(message)
    return _to_out(message)


@router.post("/{message_id}/upload-audio", response_model=MessageOut)
async def upload_audio(
    message_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    message = _get_owned_message(db, patient, message_id)
    content = await _read_and_validate(file, ALLOWED_AUDIO_TYPES, settings.max_audio_bytes, "audio")
    delete_file(settings.audio_bucket, message.audio_url)
    path = build_object_path(patient.id, message.id, file.content_type)
    stored_path = upload_file(settings.audio_bucket, path, content, file.content_type)
    message.audio_url = stored_path
    db.commit()
    db.refresh(message)
    return _to_out(message)
