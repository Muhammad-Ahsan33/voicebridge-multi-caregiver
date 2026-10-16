from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import SessionLocal
from app.models.patient import Patient

bearer_scheme = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_patient(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Patient:
    """Resolves the JWT to a Patient — the shared record all data is scoped
    to. The token's subject is always a patient_id, regardless of whether
    it was issued via caregiver login (/auth/login) or a patient-device
    invite-code login (/auth/patient-access) — both grant identical access
    to the same shared data, which is the whole point of the invite-code
    model: any caregiver, or the patient's own device, sees everything."""
    patient_id = decode_access_token(credentials.credentials)
    if not patient_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Patient not found")
    return patient
