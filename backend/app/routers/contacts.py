from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_patient, get_db
from app.models.contact import Contact
from app.models.patient import Patient
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _get_owned_contact(db: Session, patient: Patient, contact_id: str) -> Contact:
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.patient_id == patient.id).first()
    if not contact:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contact not found")
    return contact


@router.get("", response_model=list[ContactOut])
def list_contacts(db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    return db.query(Contact).filter(Contact.patient_id == patient.id).order_by(Contact.name).all()


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(body: ContactCreate, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    contact = Contact(patient_id=patient.id, **body.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


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
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: str, db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    contact = _get_owned_contact(db, patient, contact_id)
    db.delete(contact)
    db.commit()
