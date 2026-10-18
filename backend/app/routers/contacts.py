from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.storage import build_object_path, delete_file, get_signed_url, upload_file
from app.deps import get_current_patient, get_db
from app.models.contact import Contact
from app.models.patient import Patient
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])

ALLOWED_CONTACT_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _get_owned_contact(db: Session, patient: Patient, contact_id: str) -> Contact:
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.patient_id == patient.id).first()
    if not contact:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found")
    return contact


def _to_out(contact: Contact) -> ContactOut:
    data = {column.name: getattr(contact, column.name) for column in Contact.__table__.columns}
    data["avatar_url"] = get_signed_url(settings.contact_photo_bucket, contact.avatar_url)
    return ContactOut(**data)


@router.get("", response_model=list[ContactOut])
def list_contacts(db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    contacts = db.query(Contact).filter(Contact.patient_id == patient.id).order_by(Contact.name).all()
    return [_to_out(contact) for contact in contacts]


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(body: ContactCreate, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    contact = Contact(patient_id=patient.id, **body.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return _to_out(contact)


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    body: ContactUpdate,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    contact = _get_owned_contact(db, patient, contact_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return _to_out(contact)


@router.post("/{contact_id}/upload-avatar", response_model=ContactOut)
async def upload_contact_avatar(
    contact_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    contact = _get_owned_contact(db, patient, contact_id)
    content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
    if content_type not in ALLOWED_CONTACT_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported contact photo type: {file.content_type}. "
            f"Supported types: {', '.join(sorted(ALLOWED_CONTACT_PHOTO_TYPES))}",
        )

    content = await file.read(settings.max_contact_photo_bytes + 1)
    if len(content) > settings.max_contact_photo_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Contact photo exceeds the {settings.max_contact_photo_bytes // (1024 * 1024)}MB limit",
        )
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded contact photo is empty")

    path = build_object_path(patient.id, f"contacts/{contact.id}", content_type)
    old_path = contact.avatar_url
    stored_path = upload_file(settings.contact_photo_bucket, path, content, content_type)
    contact.avatar_url = stored_path
    db.commit()
    db.refresh(contact)
    if old_path and old_path != stored_path:
        delete_file(settings.contact_photo_bucket, old_path)
    return _to_out(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: str, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    contact = _get_owned_contact(db, patient, contact_id)
    delete_file(settings.contact_photo_bucket, contact.avatar_url)
    db.delete(contact)
    db.commit()
