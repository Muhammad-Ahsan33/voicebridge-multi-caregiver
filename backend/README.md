# VoiceBridge Backend

FastAPI + SQLAlchemy backend implementing Phase 2 (auth, messages, contacts,
send-history CRUD) and Phase 3 (real video/audio upload + storage).

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

By default `.env` points `DATABASE_URL` at a local SQLite file, so you can
run everything below with zero external setup. When you're ready to point
at Supabase, edit `.env`:

```
DATABASE_URL=postgresql://postgres:<password>@<project>.supabase.co:5432/postgres
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service role key, NOT the anon key>
```

Create two **private** buckets in Supabase Storage named `videos` and
`audio` (or whatever you set `VIDEO_BUCKET`/`AUDIO_BUCKET` to). Private,
not public — the app mints short-lived signed URLs on every read instead
of exposing permanent public links, since this app can carry sensitive
personal/medical content.

## Run

```bash
python seed.py                      # creates demo.caregiver@voicebridge.app / changeme123
                                     # with the 22 messages + 4 contacts from Phase 1's mock data
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for interactive Swagger UI — every
endpoint from the Phase 2 spec is there, plus the two Phase 3 upload
endpoints.

## What Phase 3 added on top of Phase 2

- `POST /messages/{id}/upload-video` and `POST /messages/{id}/upload-audio`
  — multipart file upload, validated by content-type and size
  (`MAX_VIDEO_BYTES` / `MAX_AUDIO_BYTES` in `.env`, defaults 25MB / 8MB).
- `app/core/storage.py` — storage abstraction. Uses real Supabase Storage
  when `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` are set; otherwise falls back
  to the local filesystem (`backend/local_storage/`, served at
  `/local-media/...`) so you can develop without a Supabase project.
- **Signed URLs, not public URLs.** The DB only ever stores the storage
  *path*. Every read (`GET /messages`, `GET /messages/{id}`, and after any
  upload) mints a fresh signed URL with a 1-hour expiry
  (`SIGNED_URL_EXPIRY_SECONDS`). A leaked link stops working after an hour.
- Re-uploading replaces the previous file rather than accumulating orphans
  (`delete_file` is called before each new `upload_file`).
- **The video/audio separation is enforced in code, not just convention:**
  `routers/sending.py`'s `send_message()` only ever calls
  `get_signed_url(settings.audio_bucket, message.audio_url)` —
  `message.video_url` is never referenced in that file at all.

## Known gaps / next steps

- No real Alembic migrations yet (empty `alembic/` dir was removed for
  this delivery to avoid shipping broken scaffolding) — `Base.metadata.create_all()`
  runs on every startup instead, which is fine for now but should be
  replaced with proper migrations before this handles real user data at scale.
- No audio/video duration limits, only file-size limits — add via
  `ffprobe` if caregivers start uploading oddly long clips.
- No rate limiting on uploads.

## Tested (Phase 3 smoke test, all passing)

register → login → list messages/contacts (camelCase shapes match
`frontend/src/types.ts`) → upload video → upload audio → download the
uploaded file back and diff it byte-for-byte against the original →
reject a non-video file with 415 → send a message → read send history →
confirm a second account gets 404 on the first account's data.
