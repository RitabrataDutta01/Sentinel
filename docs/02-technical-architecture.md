# Part 02: Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SENTINEL ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     HTTPS/WSS      ┌──────────────┐     Internal      ┌──────────────┐
│  │   FRONTEND   │ ◄─────────────────► │   BACKEND    │ ◄───────────────► │  SUPABASE    │
│  │  (React/Vite)│                    │   (Flask)    │                    │  (PostgreSQL)│
│  │              │                    │              │                    │              │
│  │ • React 19   │                    │ • Flask 3.1  │                    │ • PostgreSQL │
│  │ • Vite 8     │                    │ • Groq SDK   │                    │ • Auth       │
│  │ • Tailwind 4 │                    │ • spaCy      │                    │ • RLS        │
│  │ • Zustand    │                    │ • scikit-learn│                   │ • Storage    │
│  │ • React Query│                    │ • Whisper    │                    │ • Realtime   │
│  │ • HashRouter │                    │ • WeasyPrint │                    │              │
│  │ (Electron)   │                    │ • smtplib    │                    │              │
│  └──────────────┘                    └──────────────┘                    └──────────────┘
│         │                                    │                                    │
│         │ HTTPS                              │ HTTPS                              │
│         ▼                                    ▼                                    ▼
│  ┌─────────────────────────────────────────────────────────────────────────────┐
│  │                         EXTERNAL SERVICES                                   │
│  ├──────────────────┬──────────────────┬──────────────────┬──────────────────┤
│  │      GROQ        │     SUPABASE     │    WHISPER       │      SMTP        │
│  │  (LLM API)       │   (Auth/DB)      │  (Transcription) │    (Emails)      │
│  │ llama-3.3-70b    │   Auth + RLS     │   whisper-large  │   Gmail/SES      │
│  │ llama-3.1-8b     │   Postgres       │   v3             │   App Passwords  │
│  └──────────────────┴──────────────────┴──────────────────┴──────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

### Frontend
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | React | 19 | UI Framework |
| Build Tool | Vite | 8 | Build & Dev Server |
| Styling | Tailwind CSS | 4 | Utility-first CSS |
| Animations | Framer Motion | 13 | Animations |
| State | Zustand | 5 | Lightweight State |
| Data Fetching | React Query | 5 | Server State |
| Charts | Recharts | 3 | Visualizations |
| Routing | React Router | 7 | SPA Routing |
| UI Primitives | Radix UI | 2 | Accessible Components |
| Icons | Lucide React | 1.33 | Icons |

### Backend
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Flask | 3.1 | Web Framework |
| LLM | Groq SDK | Latest | LLM Inference |
| Transcription | Whisper | large-v3 | Speech-to-Text |
| NLP | spaCy | 3.8 | NLP / Filler Detection |
| ML | scikit-learn | 1.5 | Toxicity Classification |
| PDF | WeasyPrint | 69 | PDF Generation |
| Email | smtplib | Stdlib | SMTP Emails |

### Infrastructure
| Layer | Technology | Purpose |
|-------|------------|---------|
| Database | Supabase (PostgreSQL) | Auth + Data + RLS |
| Auth | Supabase Auth | JWT + RLS |
| CI/CD | GitHub Actions | Build & Deploy |
| Hosting | Render | Production Hosting |
| Desktop | Electron 43 | Cross-platform App |

---

## 🔄 Data Flow

### 1. Session Initialization
```
User → Frontend → POST /api/v1/start → Backend
                                    → Supabase (create session)
                                    ← session_id
Frontend ← session_id
```

### 2. Chat Turn (SSE Stream)
```
User → Frontend → POST /api/v1/chat (SSE)
                              → Backend
                              → Groq (mood shift scoring)
                              → Groq (interviewer response, streaming)
                              → Frontend (chunks)
                              → Backend (mood update)
                              → Supabase (mood + history)
```

### 3. Audio Turn
```
User → Frontend (MediaRecorder) → POST /api/v1/chat/audio
                              → Backend
                              → Whisper (transcribe)
                              → Groq (response)
                              → Supabase (update)
                              ← Full response + mood
```

### 4. Evaluation
```
User → Frontend → POST /api/v1/evaluate
                              → Backend
                              → Groq (evaluation prompt)
                              → Supabase (save report)
                              ← Full report JSON
```

### 5. PDF Export
```
User → Frontend → GET /api/v1/export/:id
                              → Backend
                              → WeasyPrint (HTML → PDF)
                              ← PDF Stream
```

---

## 🔐 Security Architecture

### Authentication Flow
```
User → Frontend (Supabase Auth) → JWT
                                → Backend (Authorization: Bearer <JWT>)
                                → Supabase (validate JWT)
                                → g.user_id (Flask g object)
```

### Row Level Security (Supabase)
```
┌────────────────────────────────────────────────────────────┐
│                    ROW LEVEL SECURITY                        │
├────────────────────────────────────────────────────────────┤
│  profiles:  auth.uid() = id                                 │
│  sessions:  auth.uid() = user_id                            │
│  orgs:      user_in_org(org_id)                             │
│  org_members: own row OR active member of org               │
└────────────────────────────────────────────────────────────┘
```

### Key Security Decisions
| Decision | Rationale |
|----------|-----------|
| **Service-role key on backend** | Bypasses RLS for server writes; frontend never has it |
| **Frontend uses anon key + JWT** | Subject to RLS; user can only access own data |
| **Backend validates JWT** | Every protected route requires valid JWT |
| **CSP strict** | `script-src 'self'` (no `unsafe-inline` in prod) |
| **CORS** | Configured per environment |

---

## 📦 Deployment Architecture

### Production (Render)
```
┌─────────────────────────────────────────────────────────────┐
│                      RENDER WEB SERVICE                      │
├─────────────────────────────────────────────────────────────┤
│  Build: ./render-build.sh                                    │
│  1. uv sync (Python deps)                                    │
│  2. npm ci && npm run build (frontend)                       │
│  3. cp -r ../frontend/dist/* static/                         │
│                                                               │
│  Start: gunicorn run:app                                     │
│                                                               │
│  Serves:                                                      │
│  - SPA: static/* (index.html fallback)                       │
│  - API: /api/v1/*                                             │
│  - Swagger: /apidocs/                                        │
└─────────────────────────────────────────────────────────────┘
```

### Development
```
Frontend (Vite)          Backend (Flask)
    :5173                     :5000
       │                        │
       │◄── /api proxy ────────►│
       │                        │
   HMR + React            Flask Debug
```

### Desktop (Electron)
```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APP                              │
├─────────────────────────────────────────────────────────────┤
│  Main Process (main.js)          Renderer Process           │
│  - BrowserWindow                 - React App (HashRouter)   │
│  - Native Menu                   - Context Bridge (preload) │
│  - Tray                          - electronAPI              │
│  - Global Shortcuts              - electronEvents           │
│  - IPC Handlers                  - window.electronAPI       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Characteristics

| Metric | Target | Actual |
|--------|--------|--------|
| **Frontend Bundle (main)** | < 500 KB | 31 KB (9 KB gz) |
| **Vendor Chunks** | < 250 KB each | 5 chunks, max 240 KB |
| **Sourcemaps** | Disabled (prod) | Disabled |
| **Electron ASAR** | Enabled | Enabled |
| **Backend Cold Start** | < 10s | ~8s (with lazy loading) |
| **Health Check** | < 500ms | ~200ms |
| **SSE Latency** | < 100ms | ~50ms |

---

## 🔧 Configuration Management

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Local** | `.env.local` (Vite proxy) | `.env` (localhost:5000) |
| **Production** | `.env.production` (empty API) | `.env` (Render URL) |
| **Electron** | `.env.production` (Render URL) | Same as backend |

### Key Environment Variables
```bash
# Backend
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=sb_secret_xxx
GROQ_API_KEY=gsk_xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASSWORD=xxx

# Frontend
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_API_BASE_URL=  # Empty = same origin
```

---

## 🔄 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │  build-windows  │    │   build-linux   │                    │
│  │  (windows-latest)│    │  (ubuntu-latest)│                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                             │
│           └──────────┬───────────┘                             │
│                      ▼                                         │
│            ┌─────────────────┐                                │
│            │     release     │  (on tag v*)                   │
│            │  (ubuntu-latest)│                                │
│            └────────┬────────┘                                │
│                     ▼                                        │
│          ┌─────────────────┐                                 │
│          │  GitHub Release │  (exe + AppImage + deb)        │
│          └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

---

*Next: [Database Design →](./03-database-design.md)*