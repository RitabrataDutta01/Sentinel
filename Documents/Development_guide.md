# Development Guide

## Folder Structure

```
Breakpoint/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── engine.py        # LLM interaction, mood engine, report generation
│   │   ├── models.py        # Supabase client + SessionManager
│   │   ├── routes.py        # API route definitions (Flask blueprint)
│   │   ├── utils.py         # Auth decorators, filler word analysis
│   │   ├── emailer.py       # SMTP invite emails (stdlib smtplib)
│   │   ├── prompts.json     # Scenario prompt templates (14 scenarios)
│   │   └── templates/       # HTML templates for PDF export
│   ├── run.py               # Application entry point
│   ├── pyproject.toml       # Python dependencies (uv) + uv.lock
│   ├── requirements.txt     # Dependency mirror
│   ├── Aptfile              # System deps for WeasyPrint on Render
│   ├── Procfile             # Render start command (gunicorn)
│   ├── render-build.sh      # Render build: deps + frontend build + static copy
│   ├── toxicity_model.pkl   # ML toxicity classifier (scikit-learn)
│   └── .env                 # Environment variables (gitignored)
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # AppShell (sidebar shell), PageShell
│   │   │   └── ui/          # shadcn-style primitives (button, card, input…)
│   │   ├── lib/             # api.js, supabase.js, mood.js, utils.ts, useOrg.js
│   │   ├── pages/           # Landing, Auth, Dashboard, Sessions, Insights,
│   │   │                    #   Scenarios, People, Settings, Interview, Report
│   │   ├── store/           # sessionStore.js (Zustand)
│   │   ├── App.jsx          # App root with routing
│   │   └── main.jsx         # Entry point
│   ├── .env.local           # Frontend env vars (gitignored)
│   ├── .env.example         # Frontend env template
│   └── package.json
├── supabase/
│   └── migrations/
│       ├── 0001_enable_rls.sql          # Owner-scoped RLS policies
│       └── 0002_multi_tenant_orgs.sql   # Organizations + org-scoped policies
├── Documents/               # Project documentation
└── README.md
```

---

## Environment Variables

**Backend** (`backend/.env` — copy `backend/.env.example`):

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_KEY` | Service-role key (`sb_secret_...`) — bypasses RLS |
| `GROQ_API_KEY` | Groq API key |
| `GEMINI_API_KEY` | Optional / reserved |
| `SMTP_HOST` | SMTP server host (e.g. `smtp.gmail.com`) — blank disables emails |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password / app password |
| `SMTP_FROM` | From address (defaults to `SMTP_USER`) |

**Frontend** (`frontend/.env.local` — copy `frontend/.env.example`):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) |
| `VITE_API_BASE_URL` | Empty — Vite proxies `/api` → `localhost:5000` |

> The backend uses the **service-role key** (bypasses RLS); the frontend uses the
> **publishable key + the signed-in user's JWT** (subject to RLS). Never commit
> either file.

---

## One-time Database Setup

Run `supabase/migrations/0001_enable_rls.sql` and `0002_multi_tenant_orgs.sql`
once in Supabase Dashboard → SQL Editor. 0001 enables Row Level Security and
creates owner-scoped policies; 0002 adds `organizations`/`org_members` and
org-scoped policies so HR/admins can read their org's data. Both are
idempotent — safe to re-run.

---

## Running Locally

### Backend (http://localhost:5000)
```bash
cd backend
uv sync
uv run python run.py
```

### Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` → `http://localhost:5000`, so `VITE_API_BASE_URL` stays empty.
Verify the backend with `GET http://localhost:5000/api/v1/health` (→ `{"status":"online"}`)
and browse Swagger at `http://localhost:5000/apidocs/`.

### Manual test flow
1. `/auth` → create an account (email + password)
2. `/people` (Organisation) → create an organization (or join with a code); invite a second account to test roles — when SMTP is set, check the invitee's inbox for the invite email, and the pending-invite banner on their dashboard
3. As an active `admin`/`hr`, expand a teammate's row in the Organisation roster to view their sessions/reports
4. `/scenarios` → pick a scenario, optionally enable brutal mode, start
5. `/interview/:sessionId` → send text or voice messages; watch the mood shift
6. `/report/:sessionId` → end session, view the report card, export PDF
7. `/dashboard`, `/sessions`, `/insights`, `/settings` → review history and analytics

---

## Lint & Build

```bash
cd frontend
npm run lint   # oxlint
npm run build  # production build → dist/
```

Backend sanity check: `python3 -m py_compile app/*.py` (from `backend/`).

---

## Deploying to Render

1. Create a **Web Service** from the repo, root directory `/backend`.
2. Build command: `./render-build.sh`
3. Start command: `gunicorn run:app` (also defined in `backend/Procfile`).
4. Set the `backend/.env` variables in the Render service.
5. `render-build.sh` installs Python deps (`uv sync`), builds the frontend
   (`npm ci && npm run build --prefix ../frontend`), and copies the output into
   `backend/static/`. Flask serves the SPA and API on the same origin, so no CORS
   config and an empty `VITE_API_BASE_URL` work in production.

---

## Git Flow

- `main` — production-ready code
- `feature/*` — feature branches

Never push directly to main.

## Commit Style

```
feat:    New feature
fix:     Bug fix
refactor: Code restructuring
style:   CSS/styling changes
docs:    Documentation
```

## Coding Rules

- Keep components reusable.
- Keep functions small.
- Avoid duplicated logic.
- Comment only when necessary.
- Never hardcode secrets.

## Code Review Checklist

- Responsive layout
- Error handling
- Loading states
- Accessibility
- Mobile tested
