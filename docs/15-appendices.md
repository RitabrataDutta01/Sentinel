# Part 15: Appendices

## A. Glossary

| Term | Definition |
|------|------------|
| **AppImage** | Portable Linux executable format |
| **asar** | Electron archive format (like ZIP) |
| **CSP** | Content Security Policy |
| **deb** | Debian package format |
| **Electron** | Framework for desktop apps with web tech |
| **Groq** | Fast LLM inference API provider |
| **HashRouter** | React Router using URL hash (`#/route`) |
| **JWT** | JSON Web Token |
| **NSIS** | Nullsoft Scriptable Install System (Windows installer) |
| **oklch** | Perceptual color space (Lightness, Chroma, Hue) |
| **RLS** | Row Level Security (PostgreSQL) |
| **SSE** | Server-Sent Events |
| **STAR** | Situation, Task, Action, Result (interview framework) |
| **Supabase** | PostgreSQL + Auth + Realtime platform |
| **Tailwind** | Utility-first CSS framework |
| **Vite** | Fast frontend build tool |
| **Whisper** | OpenAI speech recognition model |
| **Zustand** | Lightweight React state management |

---

## B. File Paths Reference

### Backend
```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── routes.py            # API endpoints
│   ├── engine.py            # AI engine, mood, reports
│   ├── models.py            # Supabase models
│   ├── utils.py             # Auth, spaCy, fillers
│   ├── emailer.py           # SMTP emails
│   ├── prompts.json         # 14 scenarios
│   └── templates/
│       └── report_template.html
├── run.py                   # Entry point
├── requirements.txt
├── render-build.sh
├── Procfile
├── Aptfile
├── toxicity_model.pkl
└── .env
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # Shell components
│   │   └── ui/              # Primitives
│   ├── pages/               # Route pages
│   ├── lib/                 # Utilities
│   ├── store/               # Zustand
│   ├── desktop/             # Electron integration
│   ├── App.jsx              # Root + routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Design tokens
├── electron/                # Electron config
│   ├── main.js
│   ├── preload.js
│   └── icons/
├── package.json
├── vite.config.js
├── electron-builder.config.yml
└── .env.local
```

### Electron Build Output
```
frontend/dist-electron-build/
├── dist/
│   ├── linux-unpacked/      # Linux unpacked
│   │   └── sentinel         # Binary
│   ├── win-unpacked/        # Windows unpacked
│   │   └── Sentinel.exe     # Binary
│   ├── Sentinel-1.0.0.AppImage
│   ├── sentinel_1.0.0_amd64.deb
│   └── Sentinel Setup 1.0.0.exe
```

---

## C. Environment Variables

### Backend (`.env`)
```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=sb_secret_xxx
GROQ_API_KEY=gsk_xxx

# Optional
GEMINI_API_KEY=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx@gmail.com
SMTP_PASSWORD=app-password
SMTP_FROM=xxx@gmail.com
FLASK_DEBUG=False
```

### Frontend (`.env.local` / `.env.production`)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_API_BASE_URL=              # Empty = same origin
# Production:
# VITE_API_BASE_URL=https://your-app.onrender.com
```

---

## D. Useful Commands

### Development
```bash
# Backend
cd backend && source .venv/bin/activate && uv run python run.py

# Frontend
cd frontend && npm run dev

# Electron Dev
cd frontend && npm run electron:dev
```

### Build
```bash
# Frontend production
cd frontend && npm run build

# Electron
cd frontend
npm run build:electron
npx electron-builder --win --dir --projectDir=dist-electron-build
npx electron-builder --linux AppImage deb --projectDir=dist-electron-build
```

### Database
```bash
# Apply migrations (Supabase Dashboard → SQL Editor)
# 1. supabase/migrations/0001_enable_rls.sql
# 2. supabase/migrations/0002_multi_tenant_orgs.sql
```

### Docker
```bash
docker-compose up -d
docker-compose logs -f
```

---

## E. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ERR_FILE_NOT_FOUND` (Electron) | Check `main.js` loads `file://${__dirname}/index.html` |
| CSP errors | Verify `contentSecurityPolicy` in `main.js` |
| 401 Unauthorized | Check `Authorization: Bearer <token>` header |
| CORS errors | Check `CORS(app, resources={r"/api/*": {"origins": "*"}})` |
| spaCy model missing | `python -m spacy download en_core_web_sm` |
| Toxicity model missing | Check `toxicity_model.pkl` in backend root |
| `libgconf-2-4` not found (Linux) | Use `libasound2t64` on Ubuntu 26.04+ |
| `homepage` missing for deb | Add `homepage` to generated `package.json` |
| `desktopName` warning | Add `desktopName: Sentinel` to Linux config |
| Icons not found | Fix `extraResources` path: `from: "../electron/icons"` |

### Port Conflicts
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## F. API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/health` | ❌ | Health check |
| POST | `/api/v1/auth/signup` | ❌ | Register |
| POST | `/api/v1/auth/login` | ❌ | Login |
| GET | `/api/v1/scenarios` | ✅ | List scenarios |
| POST | `/api/v1/start` | ✅ | Start session |
| POST | `/api/v1/chat` | ✅ | SSE chat |
| POST | `/api/v1/chat/audio` | ✅ | Audio turn |
| POST | `/api/v1/evaluate` | ✅ | Generate report |
| GET | `/api/v1/export/:id` | ✅ | PDF export |
| GET | `/api/v1/orgs/me` | ✅ | My org |
| POST | `/api/v1/orgs` | ✅ | Create org |
| POST | `/api/v1/orgs/{id}/invite` | ✅ (admin) | Invite member |

---

## G. Scenario Reference

| Scenario | Category | AI Role |
|----------|----------|---------|
| Firing an Employee | HR_and_Interviews | Underperforming employee |
| Defending Technical Architecture | Leadership_and_Management | Skeptical staff engineer |
| Handling a PR Crisis | External_Stakeholders | Aggressive journalist |
| Mediating a Team Dispute | Team_Dynamics | Stubborn team member |
| Negotiating a Vendor Contract | External_Stakeholders | Uncompromising sales rep |
| Pushing Back on Scope Creep | Leadership_and_Management | Skeptical project manager |
| Managing Security Incident | Compliance_and_Ethics | Security analyst |
| Resolving Customer Escalation | Customer_Escalations | Impatient support rep |
| Handling Employee Feedback | HR_and_Interviews | Unprofessional employee |
| Defending Business Decision | Leadership_and_Management | Critical business analyst |
| Handling Media Interview | External_Stakeholders | Defensive PR officer |
| Managing Difficult Stakeholder | External_Stakeholders | Headstrong vendor/partner |
| Dealing with Office Politics | Team_Dynamics | Cunning politician |
| Handling Regulatory Compliance | Compliance_and_Ethics | Meticulous compliance officer |

---

## H. Verdicts by Category

| Category | Best → Worst |
|----------|--------------|
| HR_and_Interviews | STRONG HIRE, HIRE, LEANING NO HIRE, NO HIRE |
| Customer_Escalations | FULLY RESOLVED, RESOLVED, PARTIALLY RESOLVED, UNRESOLVED |
| Leadership_and_Management | STRONG LEADERSHIP, SOUND LEADERSHIP, UNCERTAIN LEADERSHIP, WEAK LEADERSHIP |
| External_Stakeholders | STRONG ALIGNMENT, ALIGNED, PARTIAL ALIGNMENT, MISALIGNED |
| Team_Dynamics | STRONG RESOLUTION, RESOLVED, PARTIAL RESOLUTION, UNRESOLVED |
| Compliance_and_Ethics | FULLY COMPLIANT, COMPLIANT, PARTIALLY COMPLIANT, NON-COMPLIANT |

---

## I. Mood Scale

| Mood | Label | Behavior |
|------|-------|----------|
| 1 | Hostile | Combative, interrupts |
| 2 | Hostile | Very angry, skeptical |
| 3 | Frustrated | Defensive |
| 4 | Frustrated | Annoyed, impatient |
| 5 | Guarded | Neutral, guarded |
| 6 | Guarded | Slightly receptive |
| 7 | Engaged | Calming, willing to listen |
| 8 | Engaged | Agreeable, professional |
| 9 | Impressed | Collaborative, impressed |
| 10 | Impressed | Supportive, relieved |

---

## J. Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New Session |
| `Cmd/Ctrl + ,` | Settings |
| `Cmd/Ctrl + B` | Toggle Sidebar |
| `F1` | Documentation |
| `Cmd/Ctrl + Shift + U` | Check Updates |
| `Cmd/Ctrl + Shift + N` | New Simulation |
| `Cmd/Ctrl + Shift + P` | Pause/Resume |
| `Cmd/Ctrl + Shift + X` | Stop |
| `Cmd/Ctrl + Shift + E` | Export Transcript |

---

## K. Links

| Resource | URL |
|----------|-----|
| **GitHub** | https://github.com/RitabrataDutta01/Sentinel |
| **Live Demo** | https://sentinel-ojdo.onrender.com |
| **API Docs** | https://sentinel-ojdo.onrender.com/apidocs/ |
| **Health Check** | https://sentinel-ojdo.onrender.com/api/v1/health |
| **Supabase** | https://supabase.com/dashboard |
| **Groq Console** | https://console.groq.com |
| **Render Dashboard** | https://dashboard.render.com |

---

## L. License

MIT License — see LICENSE file for details.

---

*Documentation Version: 1.0.16 | Last Updated: 2026-11-20*