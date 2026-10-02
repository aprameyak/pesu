# Pesu — conversational Tamil, Romanized first

**Pesu** (பேசு — “speak”) teaches everyday spoken Tamil without requiring the Tamil alphabet first.

Hierarchy in every lesson:

1. **Romanized Tamil** (primary)
2. **English meaning**
3. **Tamil script** (secondary / smaller)
4. **Audio** via Sarvam AI Bulbul v3 (`ta-IN`), cached server-side

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite locally (swap `DATABASE_URL` for PostgreSQL in production)
- NextAuth (credentials + guest; OAuth-ready Account model)
- Sarvam TTS behind `TamilSpeechService` (API key never shipped to the browser)

## Quick start

```bash
cd pesu
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

| Role   | Email           | Password        |
|--------|-----------------|-----------------|
| Admin  | admin@pesu.app  | pesu-admin-123  |
| Learner| demo@pesu.app   | demo1234        |

### Sarvam audio

Set in `.env`:

```
SARVAM_API_KEY=your_key
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_TTS_SPEAKER=kavitha
SARVAM_TTS_LANGUAGE=ta-IN
```

Without a key, lessons still work; audio buttons stay pending until you generate from **Admin → Generate audio**.

Audio is generated once from **Tamil script**, stored under `storage/audio` + `public/audio/cache`, and reused. Learners can play **Slow / Normal** via browser `playbackRate` (no duplicate TTS files).

## What’s in the MVP

- Auth: signup, login, logout, guest, password reset tokens
- Onboarding + heritage placement
- Course path with Unit 1 **Survival Tamil** (5 polished lessons, many exercise types)
- Phrase UI: Romanized → English → script → speaker
- Centralized romanization/normalization layer
- Multi-dimension mastery + review queue
- XP, streaks, daily goal, achievements
- Admin curriculum overview, publish / needs-review, audio generate/regenerate
- Analytics event hooks

Units 2–10 are scaffolded as path placeholders for content expansion.

## Product rule

Never turn this into “learn to read Tamil.” Script is passive exposure. Success looks like answering **Saaptiya?** with **Innum illa.**
