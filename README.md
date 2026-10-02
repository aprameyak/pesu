# Pesu

Conversational Tamil, Romanized first. Pesu (பேசு) means “speak.”

Each phrase shows, in order: Romanized Tamil, English meaning, Tamil script (smaller), then audio from Sarvam Bulbul v3 (`ta-IN`), cached on the server.

## Stack

Next.js, TypeScript, Tailwind, Prisma + SQLite, NextAuth (credentials + guest), Sarvam TTS via `TamilSpeechService`

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Seed accounts (local only)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pesu.app | pesu-admin-123 |
| Learner | demo@pesu.app | demo1234 |

### Sarvam

```
SARVAM_API_KEY=your_key
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_TTS_SPEAKER=kavitha
SARVAM_TTS_LANGUAGE=ta-IN
```

Without a key, lessons work; generate audio later from Admin. Audio is built once from Tamil script and stored under `storage/audio` and `public/audio/cache`. Slow/normal playback uses `playbackRate`.

Password reset does not send email. In development the reset token is returned in the UI.

## Features

- Auth (signup, login, guest, reset tokens)
- Onboarding and heritage placement
- Unit 1 Survival Tamil (5 lessons)
- Romanization helpers, mastery, review queue
- XP, streaks, daily goal, achievements
- Admin: publish, needs-review, audio generate/regenerate

## License

MIT
