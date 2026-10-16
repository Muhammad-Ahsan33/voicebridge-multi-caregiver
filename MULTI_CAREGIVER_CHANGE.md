# Multi-caregiver / shared-patient schema change

## Why
Originally every caregiver account owned its own private messages/contacts
(`user_id` on every table). That breaks the real use case: multiple family
members acting as caregivers for the same patient, all needing to see and
add to the same shared set of messages — and the patient-facing device
needing to see everything any caregiver has added, without knowing any
individual caregiver's login.

## What changed
- New `patients` table — the shared record. Has a short `invite_code`
  (e.g. `7K9QX2LM`).
- `users.patient_id` — every caregiver account belongs to one patient.
  Multiple caregiver accounts can share the same `patient_id`.
- `messages.user_id` / `contacts.user_id` / `send_history.user_id` →
  `patient_id`. All data is now scoped to the shared patient, not an
  individual caregiver.
- **JWT subject is now `patient_id`**, not `user.id` — this is what makes
  scoping automatic everywhere (`get_current_patient` in `deps.py`).
- `POST /auth/register` now accepts an optional `inviteCode`:
  - Provided → joins that existing patient.
  - Omitted → creates a brand new patient (this caregiver is its first member).
- New `POST /auth/patient-access` — no-password entry using just the
  invite code, for the patient-facing device (or any caregiver who'd
  rather not remember a password on a shared device).
- New `GET /patients/me` / `PUT /patients/me` — lets the caregiver
  dashboard show and rename the shared patient, and surface the invite
  code to share with other caregivers.

## Tested (all passing)
Caregiver A (seeded demo account) → gets invite code → Caregiver B
registers with that code → B sees the same 22 messages as A → B adds a
new contact → A immediately sees it too → patient device logs in with
just the invite code (no password) and sees everything → a totally
unrelated new registration (no invite code) sees zero of this patient's
data.

## ⚠️ Action needed on your side

1. **This is a breaking schema change** — `user_id` columns became
   `patient_id`, and a new `patients` table was added. Since there are no
   real Alembic migrations yet (noted as a known gap since Phase 3), the
   simplest path given this is still early/seed data:
   - **Drop your existing tables** in Supabase (or just delete/recreate
     the database), then run `python seed.py` again — it now creates the
     `patients` table too via `Base.metadata.create_all()`.
   - If you have real uploaded recordings you don't want to lose, tell me
     and I'll write a one-off data migration script instead of a fresh start.
2. **Re-run `seed.py`** — it now prints the invite code. Save it.
3. **Phase 4 caregiver dashboard** (built in your other session) needs a
   small matching update: show `GET /patients/me`'s `inviteCode`
   somewhere visible (e.g. a "Share access" section), and `register`
   should have an optional "have an invite code?" field. I don't have
   that dashboard's code, so this part needs to be applied there directly
   — happy to write it if you share those files.
