"""
Idempotent seed script — creates one shared Patient record and one demo
caregiver account attached to it, populated with the same 22 messages /
4 contacts already hardcoded in frontend/src/data/mockData.ts.

Run: python seed.py
Prints the invite code — share it to let other caregiver accounts (or the
patient-facing device via POST /auth/patient-access) join this same patient.
"""
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.contact import Contact
from app.models.message import Message
from app.models.patient import Patient
from app.models.send_history import SendHistory  # noqa: F401 (registers relationship target)
from app.models.user import User

DEMO_EMAIL = "demo.caregiver@voicebridge.app"
DEMO_PASSWORD = "changeme123"

MESSAGES = [
    ("How is Ahmed?", "people", "#2D6E8E", "A"),
    ("Call Ahmed", "people", "#2D6E8E", "A"),
    ("Where is Ahmed?", "people", "#2D6E8E", "A"),
    ("Thank Ahmed", "people", "#2D6E8E", "A"),
    ("I need water", "needs", "#5C8A72", "💧"),
    ("I need food", "needs", "#5C8A72", "🍽"),
    ("I need medicine", "needs", "#5C8A72", "💊"),
    ("I am tired", "needs", "#5C8A72", "😴"),
    ("I want to sleep", "needs", "#5C8A72", "🛏"),
    ("I need help", "needs", "#5C8A72", "🤲"),
    ("How are you?", "questions", "#E8A23D", "?"),
    ("Where are you?", "questions", "#E8A23D", "?"),
    ("What are you doing?", "questions", "#E8A23D", "?"),
    ("When are you coming?", "questions", "#E8A23D", "?"),
    ("Call my mother", "actions", "#2D6E8E", "📞"),
    ("Take me home", "actions", "#2D6E8E", "🏠"),
    ("Open the door", "actions", "#2D6E8E", "🚪"),
    ("Turn on the TV", "actions", "#2D6E8E", "📺"),
    ("I need help", "emergency", "#D96459", "🚨"),
    ("Call the doctor", "emergency", "#D96459", "⚕"),
    ("Call an ambulance", "emergency", "#D96459", "🚑"),
    ("I am in pain", "emergency", "#D96459", "⚠"),
]

CONTACTS = [
    ("Mother", "Family", "#2D6E8E", "M", "+923001234567"),
    ("Brother", "Family", "#5C8A72", "B", "+923007654321"),
    ("Ahmed", "Friend", "#E8A23D", "A", "+923009998888"),
    ("Doctor", "Care team", "#D96459", "D", "+923005556666"),
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if user:
            patient = db.query(Patient).filter(Patient.id == user.patient_id).first()
            print("Demo user already exists, reusing it and its patient.")
        else:
            patient = Patient(name="Ahmed's Messages")
            db.add(patient)
            db.commit()
            db.refresh(patient)

            user = User(
                patient_id=patient.id,
                name="Demo Caregiver",
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                role="caregiver",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")

        print(f"Patient: {patient.name}  (id={patient.id})")
        print(f"Invite code: {patient.invite_code}")
        print("  -> other caregivers: POST /auth/register with this as inviteCode")
        print("  -> patient device:   POST /auth/patient-access with this as inviteCode")

        existing_titles = {
            (m.title, m.category_id) for m in db.query(Message).filter(Message.patient_id == patient.id)
        }
        added = 0
        for title, category_id, color, initials in MESSAGES:
            if (title, category_id) in existing_titles:
                continue
            db.add(Message(patient_id=patient.id, title=title, category_id=category_id, thumb_color=color, initials=initials))
            added += 1
        db.commit()
        print(f"Added {added} new messages (skipped {len(MESSAGES) - added} already present).")

        existing_names = {c.name for c in db.query(Contact).filter(Contact.patient_id == patient.id)}
        added = 0
        for name, rel, color, initials, phone in CONTACTS:
            if name in existing_names:
                continue
            db.add(Contact(patient_id=patient.id, name=name, relationship=rel, avatar_color=color, initials=initials, phone=phone))
            added += 1
        db.commit()
        print(f"Added {added} new contacts (skipped {len(CONTACTS) - added} already present).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
