from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.deps import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.auth import LoginRequest, PatientAccessRequest, RegisterRequest, TokenResponse
from app.schemas.patient import PatientOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    if body.invite_code:
        patient = db.query(Patient).filter(Patient.invite_code == body.invite_code.upper()).first()
        if not patient:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid invite code")
    else:
        # First caregiver for this patient — create the shared record now.
        patient = Patient(name=f"{body.name}'s patient")
        db.add(patient)
        db.commit()
        db.refresh(patient)

    user = User(
        patient_id=patient.id,
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=patient.id)  # subject is patient_id, not user.id
    return TokenResponse(
        access_token=token,
        patient=PatientOut.model_validate(patient),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

    patient = db.query(Patient).filter(Patient.id == user.patient_id).first()
    token = create_access_token(subject=patient.id)
    return TokenResponse(
        access_token=token,
        patient=PatientOut.model_validate(patient),
        user=UserOut.model_validate(user),
    )


@router.post("/patient-access", response_model=TokenResponse)
def patient_access(body: PatientAccessRequest, db: Session = Depends(get_db)):
    """No-password entry point for the patient-facing device. Any caregiver
    who has shared their invite code grants access this way — this is how
    the patient's own app sees every caregiver's uploaded messages without
    needing an individual caregiver's email/password."""
    patient = db.query(Patient).filter(Patient.invite_code == body.invite_code.upper()).first()
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid invite code")

    token = create_access_token(subject=patient.id)
    return TokenResponse(access_token=token, patient=PatientOut.model_validate(patient), user=None)
