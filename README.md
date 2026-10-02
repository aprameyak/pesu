# Pesu

Conversational Tamil, Romanized first (பேசு = speak).

Phrase order: Romanized → English → Tamil script → Sarvam TTS (`ta-IN`).

## Setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

http://localhost:3000

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pesu.app | pesu-admin-123 |
| Learner | demo@pesu.app | demo1234 |

```
SARVAM_API_KEY=your_key
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_TTS_SPEAKER=kavitha
SARVAM_TTS_LANGUAGE=ta-IN
```

No key: lessons work; generate audio later from Admin. Password reset has no email sender; dev returns a token in the UI.

## License

MIT
