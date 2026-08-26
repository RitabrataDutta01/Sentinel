# Breakpoint — Sentinel

An AI-powered workplace simulation platform that prepares you for high-pressure professional conversations. Built with **VibeForge 1.0** — our hackathon submission.

Sentinel doesn't ask scripted questions. A dynamic **mood engine** (1–10 scale) drives an adversarial AI interviewer that gets skeptical, interrupts, pushes back, and reacts to the quality of every answer you give. After each session you get a full report card, mood timeline, and PDF export.

## Features

- **14 realistic scenarios** across 6 categories — terminations, PR crises, vendor negotiations, security incidents, and more
- **Adaptive mood engine** — the AI's emotional state shifts with your answers (hostile ↔ supportive)
- **Brutal mode** — unlocks aggressive interviewer behavior for tougher practice
- **Live interview** — text or voice input, streaming responses (SSE), filler-word detection, toxicity flagging
- **Report card** — overall score, verdict (STRONG HIRE → NO HIRE), strengths/weaknesses, skill bars, weak-moment rewrites, executive summary, PDF export
- **Candidate workspace** — Dashboard (streak, latest report, history), Sessions, Insights (mood trend, skill analytics), Settings
- **Team workspace** — multi-tenant organizations with `admin`/`hr`/`member` roles, email + in-app invites, and an **Organisation** page (roster/role management, pending invitations, org invite code)
- **Org staff visibility** — active `admin`/`hr` members can expand a teammate in the roster and view their sessions and reports (RLS-scoped)
- **Invite emails** — optional SMTP (Gmail etc.) so invites land in the invitee's inbox; if unconfigured, invites still appear on the invitee's dashboard
- **Owned-data isolation** — Supabase Row Level Security scopes every row to the signed-in user (org staff can read their org's data)
- **Desktop app** — Electron wrapper with native titlebar, custom mood chip, global shortcuts (Cmd+N, Cmd+,, Cmd+B), system tray with "Resume last session"

## Documentation

- [Project Overview](Documents/Overview.md)
- [API Contract](Documents/api_Contract.md)
- [Database Schema](Documents/Database_Schema.md)
- [Design System](Documents/Design_System.md)
- [Development Guide](Documents/Development_guide.md)
- [Demo Script](Documents/Demo_script.md)
- [Prompt Library](Documents/Prompts.md)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand, React Query, Recharts, shadcn-style components |
| Backend | Flask (Python), Groq (GPT-OSS-120B / Llama 3.2-3B), Whisper (transcription), scikit-learn (toxicity model), smtplib (invite email) |
| Database | PostgreSQL via Supabase (RLS) |
| Auth | Supabase Auth (email + password, JWT) |
| PDF | WeasyPrint |
| Desktop | Electron 43, electron-builder (NSIS installer) |

## Environment Setup

Create `backend/.env` with the same keys as `backend/.env.example`:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role key, sb_secret_...>
GROQ_API_KEY=<groq key>
GEMINI_API_KEY=<optional>

# Optional — sends org invite emails. Leave blank to skip emailing
# (invites still show in-app on the invitee's dashboard).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=<app password>
SMTP_FROM=you@gmail.com
```

Create `frontend/.env.local` (copy `frontend/.env.example`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon/publishable key, sb_publishable_...>
VITE_API_BASE_URL=
```

> `VITE_API_BASE_URL` should be **empty** in production (the Flask app serves the built SPA from `backend/static`, so API calls are same-origin). Locally, the Vite dev server proxies `/api` → `http://localhost:5000`, so leave it empty there too.

## Quick Start

```bash
# Backend (http://localhost:5000)
cd backend && uv sync && uv run python run.py

# Frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173, sign up, pick a scenario, and start a session.

- Health check: `GET http://localhost:5000/api/v1/health`
- Swagger UI: `GET http://localhost:5000/apidocs/`

### One-time database step

Apply the RLS migration so users can only see their own data (Supabase Dashboard → SQL Editor → run `supabase/migrations/0001_enable_rls.sql`).

## Desktop App (Electron)

### Development

```bash
cd frontend
npm run electron:dev    # Runs Vite dev server + Electron with hot reload
```

### Production Build (Windows Installer)

The desktop app is built with Electron + electron-builder (NSIS).

```bash
cd frontend
npm run electron:build  # Creates NSIS installer in dist-electron/
```

**Output:** `dist-electron/Sentinel Setup <version>.exe`

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New session |
| `Cmd/Ctrl + ,` | Open Settings |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `F1` | Documentation |
| `Cmd/Ctrl + Shift + U` | Check for updates |

### System Tray

Right-click the tray icon for:
- Show Sentinel
- New Session
- **Resume Last Session**
- View Active Sessions
- Settings
- Quit

### App Icons

- **Light mode:** `icons/sentinel_light_mode_icon.ico` (Windows)
- **Dark mode:** `icons/sentinel_dark_mode_icon.png` (macOS/Linux tray)

## CI/CD Pipeline (GitHub Actions)

The repository includes a workflow (`.github/workflows/build-windows.yml`) that:

1. **Builds frontend** on Ubuntu (Vite production build)
2. **Builds Windows installer** on `windows-latest` runner using electron-builder (NSIS)
3. **Creates GitHub Release** automatically when a `v*` tag is pushed
4. Uploads artifacts for `main` branch pushes (7-day retention)

### Triggering a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

This creates a GitHub Release with the Windows installer attached.

### Manual Build

```bash
# Go to Actions tab → "Build Windows Installer" → Run workflow
```

## Deploying to Render

1. Add a **Web Service** pointing at the repo, root directory `/backend`, build command `./render-build.sh`, start command `gunicorn run:app` (see `backend/Procfile`).
2. Set the env vars from `backend/.env` in the Render service.
3. The build installs Python deps, builds the frontend, and copies it into `backend/static/` — Flask serves both the SPA and the API on one origin.

## Scripts

```bash
cd frontend
npm run lint      # oxlint
npm run build     # production build → dist/
npm run build:all # build frontend + copy electron files
npm run electron:build  # full build + NSIS installer
```

## Project Structure

```
Sentinel/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── routes.py       # API endpoints
│   │   ├── engine.py       # Groq + mood engine
│   │   ├── models.py       # Supabase models
│   │   └── prompts.json    # Scenario definitions
│   └── requirements.txt
├── frontend/                # React + Vite + Electron
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── lib/            # Supabase, API, Electron bridge
│   │   ├── store/          # Zustand stores
│   │   └── desktop/        # Electron integration
│   ├── electron/           # Electron main/preload
│   │   ├── main.js         # Main process
│   │   ├── preload.js      # Preload script
│   │   └── icons/          # App icons
│   └── package.json
├── electron/                # Electron config (copied to frontend/dist at build)
│   ├── main.js
│   ├── preload.js
│   └── icons/
│       ├── icon.ico        # Windows (from icons/sentinel_light_mode_icon.ico)
│       └── icon.png        # macOS/Linux (from icons/sentinel_dark_mode_icon.png)
├── icons/                   # Source icons
│   ├── sentinel_light_mode_icon.ico
│   └── sentinel_dark_mode_icon.png
├── supabase/
│   └── migrations/
├── .github/workflows/       # CI/CD
│   └── build-windows.yml
└── Documents/               # Documentation
```

## License

MIT — see LICENSE for details.