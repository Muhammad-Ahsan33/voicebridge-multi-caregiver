# Phase 5 — Frontend wired to the real backend

## What changed from Phase 1

- `src/data/mockData.ts` is no longer imported for messages/contacts —
  only `categories` is still used from it (categories are a fixed product
  taxonomy, not user data, so there's no backend endpoint for them).
- New `src/api/` — typed fetch wrappers matching your actual backend
  responses exactly (`auth.ts`, `messages.ts`, `contacts.ts`, `sending.ts`,
  `client.ts`). Built directly from your uploaded router/schema files, not
  guessed from the original spec.
- New `src/context/AuthContext.tsx` + `src/components/LoginGate.tsx` — a
  caregiver signs in once per device with email/password
  (`POST /auth/login`); the token is stored in `localStorage` and reused
  on reload. A small, deliberately unobtrusive sign-out icon sits in the
  top-right of the Home screen (not meant to be noticed/used by the
  primary user — it's there for a caregiver to switch accounts on a
  shared device).
- `App.tsx` now fetches real messages + contacts on load
  (`LoadingScreen` / `ErrorScreen` cover those states), and the send flow
  in `ConfirmSend` calls the real `POST /messages/{id}/send`.
- **Important behavior**: if a message has no audio recorded yet, the
  backend still returns `200` but with `status: "failed"` (per your
  `sending.py`) rather than throwing. The frontend now checks for that
  specifically and shows "This message doesn't have a recording yet. Ask
  a caregiver to add one." instead of silently pretending it sent.

## Setup

```bash
cd frontend
cp .env.example .env      # points at http://localhost:8000 by default —
                           # change VITE_API_BASE_URL if your backend runs elsewhere
npm install
npm run dev
```

Sign in with your seeded demo account: `demo.caregiver@voicebridge.app` /
`changeme123` (or any real account you've registered).

## Known limitation

There's no "which patient" concept — this assumes one caregiver account
== one patient's message set, matching Phase 2's schema (messages/contacts
belong directly to `user_id`). If you need multiple patients per
caregiver later, that's a backend schema change (a `patients` table),
not just a frontend one.
