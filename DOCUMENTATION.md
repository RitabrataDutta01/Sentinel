# Sentinel — Complete Project Documentation

**AI-Powered Workplace Simulation Platform**  
**VibeForge 1.0 Hackathon Submission**  
**Version: 1.0.16** | **Status: MVP Complete**

---

## 📚 Documentation Index

| Part | Document | Description |
|------|----------|-------------|
| **01** | [Project Overview](./docs/01-project-overview.md) | Vision, problem, solution, core flow, target users |
| **02** | [Technical Architecture](./docs/02-technical-architecture.md) | Tech stack, system design, data flow, security |
| **03** | [Database Design](./docs/03-database-design.md) | Schema, relationships, RLS policies, migrations |
| **04** | [API Specification](./docs/04-api-specification.md) | Complete REST API + SSE endpoints |
| **05** | [Frontend Architecture](./docs/05-frontend-architecture.md) | React, routing, state management, components |
| **06** | [Backend Architecture](./docs/06-backend-architecture.md) | Flask, AI engine, mood engine, PDF generation |
| **07** | [AI & Mood Engine](./docs/07-ai-mood-engine.md) | Mood scoring, interviewer behavior, evaluation |
| **08** | [Desktop Application](./docs/08-desktop-application.md) | Electron, packaging, distribution |
| **09** | [CI/CD Pipeline](./docs/09-ci-cd-pipeline.md) | GitHub Actions, builds, releases |
| **10** | [Deployment Guide](./docs/10-deployment-guide.md) | Local, Render, Docker, production |
| **11** | [Development Guide](./docs/11-development-guide.md) | Setup, workflow, coding standards |
| **12** | [API Reference](./docs/12-api-reference.md) | Complete endpoint reference |
| **13** | [Design System](./docs/13-design-system.md) | Colors, typography, components, rules |
| **14** | [Testing & QA](./docs/14-testing-qa.md) | Test strategy, manual verification |
| **15** | [Appendices](./docs/15-appendices.md) | Glossary, troubleshooting, FAQ |

---

## 🎯 Quick Start

```bash
# Backend
cd backend && uv sync && uv run python run.py

# Frontend
cd frontend && npm install && npm run dev
```

**URLs:** Frontend: http://localhost:5173 | Backend: http://localhost:5000 | Swagger: http://localhost:5000/apidocs/

---

## 🏗️ Project Structure

```
Sentinel/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── engine.py        # AI engine, mood engine, reports
│   │   ├── models.py        # Supabase models, SessionManager
│   │   ├── routes.py        # API endpoints
│   │   ├── utils.py         # Auth, filler words, spaCy
│   │   ├── emailer.py       # SMTP invite emails
│   │   └── prompts.json     # 14 scenario definitions
│   ├── requirements.txt
│   ├── render-build.sh
│   └── .env
├── frontend/                # React + Vite + Electron
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── lib/             # Supabase, API, Electron bridge
│   │   ├── store/           # Zustand stores
│   │   └── desktop/         # Electron integration
│   ├── electron/            # Electron main/preload
│   └── package.json
├── electron/                # Electron config (copied at build)
├── supabase/migrations/     # RLS + multi-tenant SQL
├── .github/workflows/       # CI/CD
└── Documents/               # This documentation
```

---

## 🚀 Key Features Summary

| Category | Features |
|----------|----------|
| **Simulation** | 14 scenarios, adaptive mood (1-10), brutal mode, SSE streaming |
| **Input** | Text, voice (Whisper), filler-word detection, toxicity flagging |
| **Evaluation** | Score, verdict, skill bars, mood timeline, STAR rewrites, PDF |
| **Workspace** | Dashboard, Sessions, Insights, Settings, Organisation |
| **Team** | Multi-tenant, roles (admin/hr/member), invites, RLS |
| **Desktop** | Electron, native titlebar, tray, global shortcuts |
| **Security** | RLS, JWT auth, service-role backend, CSP |

---

## 📦 Build Artifacts

| Platform | Output | Size |
|----------|--------|------|
| Windows | `Sentinel.exe` (NSIS installer) | ~225 MB |
| Linux | `sentinel` (unpacked) | ~211 MB |
| Linux | `Sentinel-1.0.0.AppImage` | ~150 MB |
| Linux | `sentinel_1.0.0_amd64.deb` | ~TBD |

---

## 🔗 Quick Links

- **Live Demo:** https://sentinel-ojdo.onrender.com
- **GitHub:** https://github.com/RitabrataDutta01/Sentinel
- **API Docs:** https://sentinel-ojdo.onrender.com/apidocs/
- **Health Check:** https://sentinel-ojdo.onrender.com/api/v1/health

---

*Last Updated: 2026-11-20 | Version 1.0.16 | Built for VibeForge 1.0*