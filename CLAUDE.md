# Recipe Hub

Personal recipe consolidation app for daily family use. React 19 + Vite + Tailwind CSS 4.3 frontend, Node.js/Express + SQLite backend, Google Gemini 2.5 Flash for AI extraction (Phase 2).

## Structure

```
frontend/   React app (Cloudflare Pages → recipes.looknet.ca)
backend/    Express API (Docker Swarm → recipes-api.looknet.ca, port 3002)
stack/      Docker Swarm stack definition (also mirrored in C:\dev\swarm\stacks\recipe-hub.yml)
```

## Dev

```powershell
# Backend (from repo root)
cd backend; npm install; $env:API_KEY="dev-key"; $env:GEMINI_API_KEY="your-key"; node server.js

# Frontend (from repo root)
cd frontend; npm install; npm run dev
# Create frontend/.env.local:
#   VITE_API_URL=http://localhost:3000
#   VITE_API_KEY=dev-key
```

## Test

```powershell
# Against local backend:
.\test_endpoints.ps1 -BaseUrl "http://localhost:3000" -ApiKey "dev-key"

# Against live backend:
.\test_endpoints.ps1 -BaseUrl "http://192.168.30.67:3002" -ApiKey "<recipe_api_key secret value>"
```

## Deploy

```powershell
.\release.ps1                  # full: git push + ssh git pull + docker build + stack deploy + service update --force
.\release.ps1 -Bump patch      # bump version in both package.jsons + SettingsPage, then full release
.\release.ps1 -BackendOnly     # git push + SSH backend deploy only
.\release.ps1 -FrontendOnly    # git push only (Cloudflare Pages auto-deploys frontend)
```

Release also auto-syncs `stack/recipe-hub.yml` to `C:\dev\swarm\stacks\recipe-hub.yml` and commits it.

**First-time server setup:**
```bash
ssh administrator@192.168.30.67
git clone https://github.com/natelook1/recipe-hub.git /opt/recipe-hub
mkdir -p /etc/recipe-hub/data/images
docker secret create gemini_api_key -   # paste key, Ctrl+D
docker secret create recipe_api_key -   # paste key, Ctrl+D
```

## Key Files

- `backend/server.js` — entire backend: DB schema, all CRUD, ingest routes, unit conversion, CORS (regex allows *.looknet.ca + *.pages.dev)
- `backend/gemini.js` — Gemini 2.5 Flash: URL fetch+parse, text parse, photo vision, JSON-LD hint extraction
- `frontend/src/lib/units.js` — pure unit conversion module (mirrored in backend server.js)
- `frontend/src/hooks/useTheme.js` — derives full palette from 2 picked colours (primary + secondary) via HSL math, persists to localStorage
- `frontend/src/hooks/useDarkMode.js` — dark mode toggle, defaults to dark, persists to localStorage
- `frontend/src/context/RecipeContext.jsx` — global state: recipes, tags, settings, search
- `frontend/src/components/ingest/AddRecipeSheet.jsx` — 4-tab add flow (Manual active; URL/Text/Photo marked "soon")
- `frontend/src/components/recipes/RecipeDetail.jsx` — full recipe view + unit toggle + servings scaler
- `frontend/src/components/settings/SettingsPage.jsx` — dark mode toggle, colour wheel pickers, unit preference
- `frontend/src/components/settings/ColorWheel.jsx` — pinwheel colour picker (conic-gradient ring + native input[type=color])

## Rules

- Backend is a single `server.js` file. Keep edits surgical — do not split into modules.
- Units are stored in source system and converted at render time. Never store converted values.
- Gemini always returns a draft for user review before saving. Never auto-save AI extractions.
- `tsp` and `tbsp` are never converted (system: 'both') — universally understood.
- All colours use CSS custom properties (`var(--color-*)`) — never hardcode hex in components.
- Theme is derived dynamically by `useTheme` — do not add static colour overrides to index.css.
- Bottom nav active colour = `--color-green` (secondary). Primary accent = buttons, highlights.

## Infra

- Backend API: `recipes-api.looknet.ca` → Traefik → `swarm-mgr-01:3002` — x-api-key auth, no Authentik
- Frontend: `recipes.looknet.ca` → Cloudflare Pages, behind Authentik proxy provider
- Docker secrets: `gemini_api_key`, `recipe_api_key` on swarm-mgr-01
- Data: bind mount `/etc/recipe-hub/data` on swarm-mgr-01 (SQLite DB + uploaded images, not R2)
- CORS: handled in Express (regex), not Traefik — allows all `*.looknet.ca` and `*.pages.dev`

## Roadmap

**Phase 1 (done):** Manual entry. Full CRUD, unit conversion toggle, servings scaler, dark mode, colour theming. Live at recipes.looknet.ca.

**Phase 2 (next):** AI extraction — Gemini 2.5 Flash already wired in `gemini.js`. Enable URL/Text/Photo tabs in `AddRecipeSheet.jsx` (remove `soon: true` flags). Gemini API key is provisioned as Docker secret. Verify key works and test extraction quality.

**Phase 3:** Suggestions feed — n8n workflow scrapes her favourite sources on a schedule, populates a `suggestions` table. Add a "Discover" tab to the UI.
