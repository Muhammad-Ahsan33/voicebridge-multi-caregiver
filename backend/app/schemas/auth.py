from pydantic import EmailStr, Field

from app.schemas.common import CamelModel
from app.schemas.patient import PatientOut
from app.schemas.user import UserOut


class RegisterRequest(CamelModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "caregiver"
    # If provided, joins an existing patient (this caregiver will see the
    # same messages/contacts as every other caregiver on that patient).
    # If omitted, a brand new Patient record is created for this caregiver
    # to be the first member of — they can then share its inviteCode with
    # other caregivers so those caregivers can join instead of registering
    # blind and getting an empty second patient record.
    invite_code: str | None = None


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class PatientAccessRequest(CamelModel):
    # Lightweight login for the patient-facing device — no password, since
    # the primary user often can't manage one. Whoever has the invite code
    # (shared by a caregiver) gets full access to that patient's data.
    invite_code: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    patient: PatientOut
    # None for patient-device (invite-code) logins, since there's no
    # individual caregiver identity in that flow.
    user: UserOut | None = None
