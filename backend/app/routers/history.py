from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_current_patient, get_db
from app.models.patient import Patient
from app.models.send_history import SendHistory
from app.schemas.send_history import SendHistoryOut

router = APIRouter(tags=["history"])


@router.get("/send-history", response_model=list[SendHistoryOut])
def list_send_history(db: Session = Depends(get_db), patient: Patient = Depends(get_current_patient)):
    return (
        db.query(SendHistory)
        .filter(SendHistory.patient_id == patient.id)
        .order_by(SendHistory.sent_at.desc())
        .all()
    )
