from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_current_patient, get_db
from app.models.patient import Patient
from app.schemas.common import CamelModel
from app.schemas.patient import PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


class PatientUpdate(CamelModel):
    name: str | None = None


@router.get("/me", response_model=PatientOut)
def get_my_patient(patient: Patient = Depends(get_current_patient)):
    """Returns the patient record + inviteCode — the caregiver dashboard
    should show this prominently so other caregivers (or the patient's own
    device) can be given access."""
    return patient


@router.put("/me", response_model=PatientOut)
def update_my_patient(
    body: PatientUpdate,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    if body.name is not None:
        patient.name = body.name
    db.commit()
    db.refresh(patient)
    return patient
