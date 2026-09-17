# निवारण AI — Nivaran AI

**समस्या नोंदवा, निवारणाचा मागोवा घ्या.**
*Report a problem. Track the resolution.*

Nivaran AI is an AI-assisted civic reporting platform. Citizens report public infrastructure problems — potholes, garbage, broken streetlights, water leakage, and more — with a photo, a description or voice note, and a location pin. AI classifies the issue, estimates severity, checks for duplicate reports nearby, and produces a transparent 0–100 priority score. Every report is then tracked publicly through a resolution timeline, with before/after photo evidence once it's fixed.

This is a demo/portfolio build: it runs completely on its own with **no external API keys**, using a clearly-labeled Demo Mode with realistic simulated data. Every AI capability is built behind a provider abstraction so a real LLM/vision/speech provider can be plugged in later without changing any calling code.

> Nivaran AI never claims a report has been submitted to a real government authority. All AI outputs are labeled as estimates/suggestions, never as verified fact or an official decision.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts, Leaflet/react-leaflet |
| Backend | Python, FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL |
| Background jobs | Celery + Redis (automation: follow-ups, escalation, auto-reopen) |
| AI services | Provider-abstracted (LLM / vision / embeddings / speech) with a safe DEMO mode |
| Maps | Leaflet + OpenStreetMap tiles by default — no map API key required. Configurable via `NEXT_PUBLIC_MAP_PROVIDER`. |
| Infra | Docker Compose (Postgres, Redis, backend, Celery worker/beat, frontend) |

## Project structure

```
ai_automation/
├── frontend/                 Next.js app (see frontend/src/app for routes)
│   └── src/
│       ├── app/               pages: /, /report, /map, /issues/[id], /track,
│       │                       /community, /analytics, /assistant, /login,
│       │                       /register, /forgot-password
│       ├── components/        ui/, layout/, home/, issues/, map/, report/,
│       │                       charts/, ai/, common/, auth/
│       └── lib/                types.ts, api.ts (demo + real API client),
│                                mock-data.ts, constants.ts, hooks/
├── backend/                   FastAPI app (models, schemas, routes, AI services,
│                                Celery tasks, Alembic migrations)
├── docker-compose.yml         Full stack: postgres, redis, backend, celery
│                                worker/beat, frontend
├── .env.example                Every configurable setting, documented
└── README.md
```

## Demo Mode (default — no setup required)

The frontend runs entirely on its own, with a built-in mock dataset (`frontend/src/lib/mock-data.ts`) standing in for a live API. This is controlled by `NEXT_PUBLIC_DEMO_MODE`, which defaults to `true`. In this mode:

- AI analysis (category, severity, priority score, root-cause suggestion, duplicate detection) runs through a deterministic, keyword-based simulation in the browser — fast, and clearly labeled **"Demo Mode"** everywhere it appears.
- All photos shown for the seeded sample issues are locally-generated placeholder graphics (not real photos), so the app never needs internet access or a real image host.
- A black demo-mode banner at the top of every page reminds visitors that reports and AI results are simulated.

This is the fastest way to see the whole product:

```bash
cd frontend
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:3000` — Next.js will pick the next free port if that one's busy, e.g. `3001`).

## Running the full stack (real backend + database)

To exercise the real FastAPI backend, PostgreSQL, Redis and Celery automation instead of the in-browser simulation, use Docker Compose.

> Requires Docker Desktop to be installed **and running**. If `docker compose up` fails with a connection error to the Docker daemon, start Docker Desktop first.

1. Copy the environment template and adjust values as needed:
   ```bash
   cp .env.example .env
   ```
   Leave `AI_PROVIDER`, `VISION_PROVIDER` and `SPEECH_PROVIDER` set to `demo` (the default) to keep AI responses simulated but now generated **server-side**; set them to `openai` and supply `OPENAI_API_KEY` to use a real provider — the code falls back to demo output automatically if a real call fails.
   Set `NEXT_PUBLIC_DEMO_MODE=false` so the frontend actually calls the backend instead of using its local mock data.

2. Start everything:
   ```bash
   docker compose up --build
   ```
   This brings up Postgres, Redis, the FastAPI backend (after running Alembic migrations), a Celery worker, Celery beat (for the follow-up/escalation/auto-reopen automation), and the Next.js frontend.

3. Open `http://localhost:3000` for the app and `http://localhost:8000/docs` for the interactive API docs (Swagger UI).

4. Seed the database with a realistic demo dataset (15 issues across Pune wards + two demo accounts) so the app isn't empty on first run:
   ```bash
   docker compose exec backend python -m app.db.seed
   ```
   This also creates two ready-to-use logins:
   | Role | Email | Password |
   |---|---|---|
   | Admin | `admin@nivaran.ai` | `NivaranAdmin@123` |
   | Moderator | `moderator@nivaran.ai` | `NivaranMod@123` |

   Change or remove these before deploying anywhere beyond your own machine.

### Running the backend without Docker

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Config is read from backend/.env (falls back to safe demo defaults if absent).
cp ../.env.example .env          # Windows: copy ..\.env.example .env
# Then make sure PostgreSQL and Redis are running locally and DATABASE_URL /
# REDIS_URL in backend/.env point at them.

alembic upgrade head
python -m app.db.seed            # optional, populates 15 demo issues + admin/moderator logins

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive API docs, or `http://localhost:8000/health` for a quick liveness check.

In a separate terminal, to run the automation workers:

```bash
celery -A app.celery_app worker --loglevel=info
celery -A app.celery_app beat --loglevel=info
```

## Environment variables

See [`.env.example`](.env.example) for the full, documented list. Highlights:

- **Nothing is hard-coded.** Every secret and provider key is read from the environment.
- If `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` is left blank, the corresponding AI capability automatically runs in **DEMO mode** — the app stays fully functional, and demo output is always labeled as such, never presented as a real verified result.
- `NEXT_PUBLIC_MAP_PROVIDER` defaults to `osm` (OpenStreetMap via Leaflet, no key needed). Set it to `mapbox` or `google` and supply a token to use a different tile provider.
- Priority-score weights (`PRIORITY_WEIGHT_*`) and automation thresholds (`FOLLOWUP_INACTIVITY_DAYS`, `ESCALATION_INACTIVITY_DAYS`, `REOPEN_CONFIRMATION_THRESHOLD`) are all configurable without touching code.

## What's implemented

- Fully animated, responsive landing page (hero, AI pipeline animation, capability grid, live map preview, animated stats, before/after showcase, community teaser, assistant intro, CTA).
- Report flow: photo upload/camera capture, voice reporting (Web Speech API, Marathi/Hindi/English), draggable-pin location picker with geolocation, AI scanning animation, AI analysis + priority score + duplicate-detection results, tracking-ID confirmation screen.
- Public issue map with category/severity/status/search filters and a heatmap view.
- Issue details page: AI analysis, priority breakdown, citizen confirmations, resolution timeline, before/after comparison slider, citizen verification of a fix.
- Track-by-ID page, Community hub (trending issues, most-reported areas, AI-generated "what to fix first" insight), public Analytics dashboard with charts.
- Floating AI assistant (and a dedicated `/assistant` page) that explains reporting, tracking and priority scoring.
- Login / Register / Forgot-password UI with client-side validation.
- Accessible by default: skip-to-content link, focus states, `prefers-reduced-motion` support, labeled form controls.
- FastAPI backend: SQLAlchemy models, Alembic migrations, JWT auth, rate limiting, file-upload validation, an AI service abstraction (LLM/vision/embeddings/speech) with automatic demo-mode fallback, a transparent priority engine, duplicate detection, and Celery-based automation (follow-ups, escalation, auto-reopen on repeated "not fixed" confirmations).

## Known limitations

- AI outputs (category, severity, root cause, priority score) are simulated/deterministic in demo mode and, even with a real provider configured, are estimates — never official decisions. This is intentional and clearly labeled throughout the UI.
- There's no real government-authority integration; a "report submitted" confirmation never implies the report reached a municipal system.
- Comment threads (`IssueComment` in the data model) exist on the backend but don't yet have dedicated frontend UI beyond citizen confirmations.
- The backend was built and verified with an extensive automated test pass (register/login/RBAC, issue creation, AI analysis, duplicate merging, confirmations, moderator status transitions, citizen verification, auto-reopen after repeated "not fixed" confirmations, image upload validation, and a full Alembic migration up/down cycle) against a real database engine, plus a clean production import of the app with Postgres-pointing settings. It has **not** been exercised end-to-end against a live Postgres + Redis + Docker Compose stack in this environment, since Docker Desktop wasn't running here — `docker compose up --build` is expected to work but hasn't been observed running by this build process. Please report any issues you hit when you first bring it up.
