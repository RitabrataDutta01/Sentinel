# Part 11: Development Guide

## Overview

| Property | Value |
|----------|-------|
| Primary Branch | `main` |
| Feature Branches | `feature/*` |
| Commit Style | Conventional Commits |

---

## 🚀 Getting Started

### Prerequisites
- **Node**: 20+
- **Python**: 3.10+
- **uv**: `pip install uv`
- **Git**: 2.30+

### First-Time Setup
```bash
# Clone
git clone https://github.com/RitabrataDutta01/Sentinel.git
cd Sentinel

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
uv sync
cp .env.example .env
# Edit .env with credentials

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# Start both
cd ../backend && source .venv/bin/activate && uv run python run.py
# In another terminal:
cd ../frontend && npm run dev
```

---

## 🔄 Development Workflow

### Branch Strategy
```
main (protected)
  │
  ├── feature/user-auth-improvements
  │
  ├── feature/electron-tray-fix
  │
  └── fix/mood-engine-edge-case
```

### Commit Convention
```
feat:    New feature
fix:     Bug fix
refactor: Code restructuring
style:   CSS/formatting
docs:    Documentation
chore:   Maintenance
```

**Examples:**
```
feat: add brutal mode toggle to scenario config
fix: prevent org API calls when not authenticated
refactor: extract mood color logic to shared hook
docs: update API spec for new org endpoints
```

### Pull Request Process
1. Create feature branch from `main`
2. Develop with small, focused commits
3. Run lint: `npm run lint` (frontend), `python -m py_compile app/*.py` (backend)
4. Test locally (manual verification)
5. Open PR with description
5. CI passes → merge to `main`

---

## 🛠️ Common Commands

### Frontend
```bash
cd frontend

npm run dev          # Dev server (port 5173)
npm run build        # Production build
npm run build:electron  # Build + copy Electron files
npm run electron:dev    # Dev with Electron
npm run electron:build  # Production Electron build
npm run lint           # Oxlint
npm run preview        # Preview production build
```

### Backend
```bash
cd backend
source .venv/bin/activate

uv run python run.py          # Dev server
uv sync                       # Sync dependencies
uv add <package>              # Add dependency
uv remove <package>           # Remove dependency
python -m py_compile app/*.py # Syntax check
```

### Electron
```bash
cd frontend
npm run electron:dev          # Dev with hot reload
npm run electron:build        # Production build (all platforms)
npx electron-builder --win --dir  # Windows only
npx electron-builder --linux AppImage deb  # Linux only
```

---

## 🧪 Testing

### Manual Testing Checklist

| Feature | Test Case |
|---------|-----------|
| Auth | Sign up → login → logout → session persist |
| Scenarios | Select → config → start → interview → report |
| Voice | Record → transcribe → response |
| Mood | Mood shifts visible in timeline |
| Report | Generate → PDF export |
| Org | Create → invite → accept → view member sessions |
| Desktop | Install → launch → tray → shortcuts |

### Automated Checks
```bash
# Frontend
npm run lint          # Oxlint
npm run build         # TypeScript + Vite build

# Backend
python -m py_compile app/*.py
uv run pytest  # (if tests added)
```

---

## 🐛 Debugging

### Frontend
```bash
# DevTools
F12 (browser) or Ctrl+Shift+I (Electron)

# Network tab
# Watch SSE stream in Network tab

# React DevTools
# Components, Profiler tabs
```

### Backend
```bash
# Logs
tail -f backend/flask.log

# Debug mode
export FLASK_DEBUG=True
uv run python run.py

# Python debugger
import pdb; pdb.set_trace()
```

### Electron
```bash
# Main process logs
# Terminal running `npm run electron:dev`

# Renderer logs
# Ctrl+Shift+I in Electron window

# Main process debugging
# VS Code: attach to Electron main process
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `ERR_FILE_NOT_FOUND` (Electron) | Check `main.js` loads `file://${__dirname}/index.html` |
| CSP errors | Check `contentSecurityPolicy` in `main.js` |
| 401 on API | Check `Authorization: Bearer` header |
| CORS errors | Check `CORS(app, resources={r"/api/*": {"origins": "*"}})` |
| spaCy model missing | `python -m spacy download en_core_web_sm` |
| Toxicity model missing | Check `toxicity_model.pkl` in backend root |

---

## 📝 Code Style

### JavaScript/React
- **ESLint**: Oxlint (fast)
- **Prettier**: Not used (oxlint handles formatting)
- **Imports**: Absolute from `@/` alias
- **Components**: PascalCase, hooks camelCase

```javascript
// Good
import { useSessionStore } from '@/store/sessionStore';
import { Button } from '@/components/ui/button';

function Interview({ sessionId }) {
  const { messages } = useSessionStore();
  // ...
}
```

### Python
- **Formatter**: Black (if used) / PEP 8
- **Type Hints**: Preferred
- **Docstrings**: Google style for public functions

```python
def calculate_confidence(text: str) -> int:
    """Calculate confidence score from text.
    
    Args:
        text: User's spoken/text response.
        
    Returns:
        Confidence score 0-100.
    """
    doc = _get_nlp()(text.lower())
    # ...
```

---

## 📁 File Organization

### Frontend Components
```
src/components/
├── layout/           # Shell components
│   ├── DesktopAppShell.jsx
│   ├── PageHero.jsx
│   └── PageShell.jsx
├── ui/               # Primitive components
│   ├── button.jsx
│   ├── card.jsx
│   └── ...
└── ...
```

### Pages
```
src/pages/
├── Auth.jsx
├── Dashboard.jsx
├── Interview.jsx
├── Report.jsx
├── Scenarios.jsx
├── Sessions.jsx
├── Insights.jsx
├── People.jsx
├── Settings.jsx
├── Reports.jsx
└── Landing.jsx
```

### Backend
```
backend/app/
├── __init__.py      # create_app()
├── routes.py        # API endpoints
├── engine.py        # AI logic
├── models.py        # Supabase models
├── utils.py         # Helpers
├── emailer.py       # SMTP
├── prompts.json     # Scenarios
└── templates/       # PDF templates
```

---

## 🔄 Git Workflow

### Standard Flow
```bash
# 1. Start feature
git checkout main
git pull
git checkout -b feature/your-feature

# 2. Work
git add .
git commit -m "feat: add new feature"

# 3. Push & PR
git push origin feature/your-feature
# Open PR on GitHub

# 4. After review
git checkout main
git pull
git branch -d feature/your-feature
```

### Release Process
```bash
# Tag release
git tag v1.0.16
git push origin v1.0.16

# GitHub Actions builds & creates release
```

---

## 📋 Code Review Checklist

- [ ] No hardcoded secrets
- [ ] No `console.log` / `print` in production code
- [ ] Error handling on all async operations
- [ ] Loading states for async UI
- [ ] Accessibility (ARIA, semantic HTML)
- [ ] Responsive design (mobile tested)
- [ ] Type hints (Python) / JSDoc (JS)
- [ ] No commented-out code
- [ ] No unused imports

---

*Next: [API Reference →](./12-api-reference.md)*