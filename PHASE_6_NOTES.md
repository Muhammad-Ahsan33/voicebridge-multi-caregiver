# Phase 6 — WhatsApp (free share-link MVP)

Files changed:
- backend: app/config.py, app/core/storage.py, app/routers/sending.py, app/schemas/send_history.py
- frontend: src/types.ts, src/App.tsx, src/components/SentScreen.tsx

POST /messages/{id}/send now also returns `audioUrl` (audio only, 7-day signed
link) and `whatsappUrl` (wa.me link to the chosen contact with the audio link
pre-filled). The Sent screen has an "Open WhatsApp" button and, on phones, a
"Send audio file instead" button (Web Share API) .

Limits: wa.me cannot attach files, so the recipient gets a link; "sent" means
prepared, not delivered; anyone with the link can listen until it expires; phone
numbers must be international format (+92...); local-dev links are relative and
only work with Supabase storage configured.
