from app.schemas.common import CamelModel


class PatientOut(CamelModel):
    id: str
    name: str
    invite_code: str  # shown in the caregiver dashboard so they can share it
