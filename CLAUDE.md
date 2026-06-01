# Recipe Hub

Personal recipe consolidation app. React 19 + Vite + Tailwind CSS 4.3 frontend, Node.js/Express + SQLite backend, Google Gemini 2.5 for AI extraction.

## Structure

```
frontend/   React app (Cloudflare Pages)
backend/    Express API (Docker Swarm, port 3002)
stack/      Docker Swarm stack definition
```

## Dev

```powershell
# Backend
cd backend && npm install && node server.js
# Set GEMINI_API_KEY and API_KEY env vars or put them in /run/secrets/

# Frontend
cd frontend && npm install && npm run dev
# Set VITE_API_URL=http://localhost:3000 and VITE_API_KEY=dev-key in .env.local
```

## Test

```powershell
# With backend running locally:
.\test_endpoints.ps1 -BaseUrl "http://localhost:3000" -ApiKey "dev-key"
```

## Deploy

```powershell
.\release.ps1              # build + push + deploy
.\release.ps1 -Bump patch  # bump version first
.\release.ps1 -SkipDeploy  # frontend only (Cloudflare Pages auto-deploys on push)
```

## Key Files

- `backend/server.js` — entire backend: DB schema, all CRUD, ingest routes, unit conversion
- `backend/gemini.js` — Gemini 2.5 integration: URL fetch, text parse, photo vision
- `frontend/src/lib/units.js` — pure unit conversion (mirrors backend logic)
- `frontend/src/context/RecipeContext.jsx` — global state
- `frontend/src/components/ingest/AddRecipeSheet.jsx` — the 4-tab add flow
- `frontend/src/components/recipes/RecipeDetail.jsx` — full recipe view + unit toggle + servings scaler

## Rules

- Backend is a single `server.js` file. Keep edits surgical — do not split into modules.
- Units are stored in source system and converted at render time. Never store converted values.
- Gemini always returns a draft for user review before saving. Never auto-save AI extractions.
- `tsp` and `tbsp` are never converted (system: 'both') — universally understood.

## Infra

- Backend: `swarm-mgr-01` (192.168.30.67), port 3002, stack name `recipe-hub`
- Frontend: Cloudflare Pages, auto-deploys on `main` push
- Secrets: `gemini_api_key`, `recipe_api_key` as Docker Swarm secrets
- Data: Docker bind mount at `/etc/recipe-hub/data` (DB + images, not R2)
