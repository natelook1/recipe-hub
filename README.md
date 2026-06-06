# Recipe Hub

Personal recipe consolidation app. Save, search, and scale recipes from any source. AI extraction powered by Google Gemini 2.5 Flash.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Backend | Node.js + NestJS + TypeScript |
| Database | SQLite (better-sqlite3) |
| AI | Google Gemini 2.5 Flash |
| Infra | Docker Swarm + Traefik + Cloudflare Pages |

## Features

- Manual recipe entry with ingredients, steps, notes, tags, servings
- AI extraction from URL, pasted text, or photo (Gemini 2.5 Flash)
- Unit conversion toggle (metric/imperial) at render time — source values never overwritten
- Servings scaler
- Recipe suggestions feed (RSS sources, scored against your tags)
- Dark mode + custom colour theming (HSL-derived palette from 2 picked colours)
- `x-api-key` auth on all API routes

## Architecture

```
frontend/          React SPA — Cloudflare Pages
backend/           NestJS API — Docker Swarm
  src/
    auth/          Global API key guard (timing-safe compare, Docker secret aware)
    database/      Global better-sqlite3 provider, WAL mode, schema + migrations
    recipes/       CRUD, search, tag filter, servings
    ingredients/   Managed via recipes service
    tags/          Aggregated tag counts
    images/        Multer upload + file serve
    ingest/        Gemini extraction endpoints (url / text / photo / confirm)
    suggestions/   RSS feed scraper + Gemini scoring + Discover feed
    settings/      Per-user unit preference
    gemini/        Gemini 2.5 Flash client, tool-calling loop, unit conversion
    common/        Global exception filter
stack/             Docker Swarm stack definition (sanitized — real domain in swarm repo)
backend-express/   Archived original Express monolith (reference only)
```

## Dev

```powershell
# Backend
cd backend
npm install
$env:API_KEY = "dev-key"
$env:GEMINI_API_KEY = "your-gemini-key"
node dist/main.js          # or: npm run start:dev

# Frontend
cd frontend
npm install
# create frontend/.env.local (see .env.example)
npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for all variables. In production, `GEMINI_API_KEY` and `API_KEY` are read from Docker secrets at `/run/secrets/gemini_api_key` and `/run/secrets/recipe_api_key` respectively, falling back to env vars for local dev.

## Deploy

```powershell
.\release.ps1                  # git push + build + transfer image + stack deploy
.\release.ps1 -Bump patch      # bump version, then full release
.\release.ps1 -BackendOnly     # backend only
.\release.ps1 -FrontendOnly    # git push only (Cloudflare Pages auto-deploys)
```

Build runs locally, image is transferred to the swarm node via `docker save | ssh | docker load`.

## Testing

```powershell
# Local
.\test_endpoints.ps1 -BaseUrl "http://localhost:3000" -ApiKey "dev-key"

# Live
.\test_endpoints.ps1 -BaseUrl "https://your-api-host" -ApiKey "<key>" -SkipGemini
```

## Design Decisions

- **Units stored at source, converted at render** — metric/imperial toggle never mutates the DB
- **Gemini always returns a draft** — user reviews before saving, no auto-save
- **Single SQLite file** — simple, portable, zero ops overhead for personal use
- **NestJS rewrite** — migrated from Express monolith to NestJS modules for portfolio/learning; API contracts and DB schema unchanged
