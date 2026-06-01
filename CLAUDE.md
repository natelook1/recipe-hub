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
.\release.ps1                  # git push + git pull on server + docker build + deploy
.\release.ps1 -Bump patch      # bump version first, then full release
.\release.ps1 -BackendOnly     # git push + SSH deploy backend only
.\release.ps1 -FrontendOnly    # git push only (Cloudflare Pages auto-deploys)
```

**First-time server setup** — clone the repo on `swarm-mgr-01` before first deploy:
```bash
ssh administrator@192.168.30.67
git clone https://github.com/natelook1/recipe-hub.git /opt/recipe-hub
mkdir -p /etc/recipe-hub/data/images
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

- Backend API: `recipes-api.looknet.ca` → `swarm-mgr-01:3002`, x-api-key auth only (no Authentik)
- Frontend: `recipes.looknet.ca` → Cloudflare Pages, behind Authentik proxy provider
- Secrets: `gemini_api_key`, `recipe_api_key` as Docker Swarm secrets
- Data: Docker bind mount at `/etc/recipe-hub/data` (DB + images, not R2)

## Roadmap

**Phase 1 (now):** Manual entry only — `ManualTab` in `AddRecipeSheet.jsx`. URL/text/photo tabs wired but Gemini key not configured yet.

**Phase 2:** AI OCR — enable Gemini 2.5 for photo extraction (recipe cards, cookbooks). Provision `gemini_api_key` Docker secret.

**Phase 3:** Suggestions feed — scraper populates a "Discover" feed from her favourite sources (configured list of sites). Likely an n8n workflow that polls sources and stores results in a `suggestions` table.
