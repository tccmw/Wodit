# Wodit

Wodit is a monorepo for a personalized weather styling experience that turns raw forecasts into:

- a subjective temperature score based on user sensitivity and feedback
- an outfit recommendation driven by weather conditions
- a music mood recommendation that matches the outfit theme

## Structure

```text
apps/
  web/       Next.js MVP client
  server/    NestJS-style API scaffold
packages/
  types/     shared TypeScript contracts
  utils/     recommendation engine and helpers
```

## Quick start

```bash
pnpm install
pnpm dev
```

## MVP scope

- local preference storage for sensitivity and feedback offset
- subjective temperature calculation
- rule-based outfit recommendations
- weather-reactive interface theme
- server-side module layout ready for API integration

## Next steps

1. Connect `apps/web` to browser geolocation and OpenWeatherMap.
2. Persist onboarding, feedback, and auth in PostgreSQL with Prisma.
3. Add Spotify playlist search based on `musicMood`.
