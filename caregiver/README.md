# VoiceBridge Caregiver Dashboard — Phase 4

A second, sibling Vite app (not part of `frontend/`) for the caregiver who
manages messages and contacts against the same backend from Phases 2–3.

## Setup

```bash
cd caregiver
npm install
cp .env.example .env
# Edit .env if your backend isn't on http://localhost:8000
npm run dev
```

Runs on **http://localhost:5174** (deliberately a different port than
`frontend/`'s 5173, so both apps can run side by side).

### ⚠️ One backend change you need to make

Your Phase 2 backend's `ALLOWED_ORIGINS` only listed `http://localhost:5173`
(the patient-facing app). Add this dashboard's origin too, in
`backend/.env`:

```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

Restart `uvicorn` after changing this — without it, every request from this
app will fail CORS with no obvious error message.

## Logging in

Use the demo caregiver account seeded in Phase 2:
`caregiver@voicebridge.demo` / `ChangeMe123!` (or whatever you changed it
to in `seed.py`).

## What's implemented

- **Auth**: login → JWT stored in `localStorage`, attached to every
  request. Any 401 anywhere clears the token and redirects to `/login`
  centrally (`src/api/client.ts`) — not duplicated per-page.
- **Dashboard**: Messages / Contacts tabs as real tables, category filter
  chips, a "has audio ✓ / missing audio ⚠" indicator per message (a
  message with no audio can't actually be sent to a patient's contact),
  and Edit/Delete per row with a confirm dialog before deleting.
- **Message form**: title/category/color fields save first via
  `POST`/`PUT /messages`; the two `RecorderWidget`s underneath stay
  disabled until the message has an id, matching the backend's real
  constraint that upload endpoints need an existing `message_id`.
- **RecorderWidget**: record live (`MediaRecorder`, camera preview for
  video, an 8s video cap, and no audio duration cap) or upload an existing
  file; visual uploads can be either a video or an image. Both flows end
  in a prereview-with-Re-record/Use-this step before it ever calls the
  upload API. Client-side validates against the exact mime types and size
  limits enforced server-side (`backend/app/routers/messages.py`), so a
  caregiver gets an immediate, specific error instead of waiting on a
  round trip to be told the file's no good. Camera/mic denial falls back
  cleanly to the file-upload option with a plain-language explanation.
- **Contact form**: name/relationship/phone (loose E.164 check), avatar
  color/fallback initials, and optional JPEG/PNG/WebP contact photo upload
  (up to 5MB). The selected photo previews in the form and replaces initials
  in the contact list; initials remain as a fallback if the image can't load.

## Design notes

Reuses Phase 1's exact color tokens and font (`tailwind.config.js` and
`Atkinson Hyperlegible` copied over) so the two apps read as one product —
but per the spec, this is a normal admin-density UI (tables, inline
labels, smaller text), not the "one giant tap target per screen" pattern
from the patient-facing app. That pattern was built for a low-vision/
low-literacy user; a caregiver managing 20+ messages needs a scannable
table instead.

## Multi-caregiver / shared-patient update

The backend changed from "each caregiver owns private data" to "many
caregivers share one patient's data," scoped by `patient_id` instead of
`user_id`. This app was updated to match:

- **Registration is now a real page** (`/register`), not just Swagger.
  Has an optional **invite code** field: leave it blank to create a brand
  new patient (this caregiver becomes its first member), or paste another
  caregiver's invite code to join their existing shared data instead.
- **Login page** now also offers "Sign in with invite code instead" — a
  no-password entry using just the invite code
  (`POST /auth/patient-access`), for a shared device.
- **Password fields have a show/hide toggle** (the eye icon) on both
  login and register, so you can confirm what you typed before submitting.
- **Dashboard** now shows a "Share access" card at the top: the patient's
  name (click to rename) and the invite code (click to copy) to hand to
  other caregivers.

**⚠️ Assumption flagged**: the exact JSON shape of `GET`/`PUT /patients/me`
and the body shape for `POST /auth/register`'s `inviteCode` /
`POST /auth/patient-access` weren't provided, so `src/api/patients.ts` and
`src/api/auth.ts` assume the same camelCase convention as every other
endpoint (`{ id, name, inviteCode }` for `Patient`). If your real backend
uses different field names, update those two files — everything else
(the UI, the dashboard card) is built against the `Patient` type in
`src/types.ts`, so a field-name fix there is the only change needed.

## Known gaps / things to double check against your real setup

- `src/types.ts` was copied **verbatim** from the file you provided — it's
  the source of truth and should stay in lockstep with `frontend/src/types.ts`
  manually (there's no shared package between the two apps by design, per
  the spec).
- Token storage is `localStorage`, per the spec's guidance that this is an
  acceptable default for a caregiver's own device. If this will ever run
  on a shared/public machine, switch `TOKEN_KEY`/`USER_KEY` reads and
  writes in `src/api/client.ts` and `src/context/AuthContext.tsx` to
  `sessionStorage` instead — same API, just swap the storage object.
- No self-registration screen was built (optional per spec, not blocking).
  Create additional caregiver accounts via the backend's `/docs` Swagger
  UI (`POST /auth/register`) for now.

## Verified

- `npx tsc -b` — clean, no type errors.
- `npm run build` — production build succeeds.
