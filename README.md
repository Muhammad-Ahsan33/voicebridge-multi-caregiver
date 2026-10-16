# VoiceBridge

A visual + audio communication platform for people who cannot speak and cannot
reliably read text, but can understand spoken messages. A caregiver records a
short video + audio clip for each message. The user taps a card, watches the
video to confirm it's the message they mean, hears the audio, picks a
recipient, and the **audio only** is sent via WhatsApp.

## Build phases

- [x] **Phase 1 — Frontend UI (hardcoded data)**
- [x] **Phase 2 — Backend (FastAPI + PostgreSQL/Supabase)**
- [x] **Phase 3 — Real media upload/playback (Supabase Storage)** — this delivery
- [ ] Phase 4 — Caregiver dashboard (auth, manage messages & contacts) — spec handed off
- [x] **Phase 5 — Frontend wired to the real API + send flow** — this delivery
- [ ] Phase 6 — WhatsApp integration (share-intent MVP, then Cloud API)

## Phase 1 — what's included

```
frontend/
  src/
    types.ts              domain model (Message, Contact, Category, Screen)
    data/mockData.ts       hardcoded messages/contacts (stand-in for the API)
    components/
      Avatar.tsx            fallback thumbnail before a real video exists
      CategoryTabs.tsx       People / Needs / Questions / Actions / Emergency
      CardGrid.tsx            responsive grid of communication cards
      MessageCard.tsx          the core card (video, breathing play affordance)
      ProgressSteps.tsx        1-2-3 stepper for the send flow
      PreviewScreen.tsx        step 1: watch + hear the message, confirm
      ContactPicker.tsx        step 2: choose who to tell
      ConfirmSend.tsx          step 3: final "send this?" confirmation
      SentScreen.tsx            success screen
    App.tsx                 screen state machine: home → preview → contacts
                              → confirm → sent
```

### Design decisions (why it looks the way it does)

- **Typeface: Atkinson Hyperlegible** everywhere — the typeface the Braille
  Institute designed specifically for readers with low vision, cognitive
  disabilities, or aphasia. Chosen because the audience is exactly the
  people this font was built for.
- **No red/green pairing** — some users may also have colour-vision
  differences, so status colours use blue (primary), sage green (success),
  amber (call to action), and coral only for Emergency.
- **Huge tap targets, one obvious action per screen** — every screen after
  Home has exactly one primary button.
- **The video is never sent** — `App.tsx`'s `onSend` only ever carries
  `message.audioUrl` forward (enforced again for real in Phase 2's
  `/messages/{id}/send` endpoint, which will not accept a video payload).
- Cards currently show a coloured avatar placeholder instead of a video,
  because no real recordings exist yet — this is also literally the
  intended empty state before a caregiver uploads a clip (`Message.videoUrl`
  is optional and `MessageCard` / `PreviewScreen` already handle both cases).

## Running Phase 1

```bash
cd frontend
npm install
npm run dev
```

Then open the printed local URL. Everything works with no backend and no
API keys — `src/data/mockData.ts` stands in for the database until Phase 2.
