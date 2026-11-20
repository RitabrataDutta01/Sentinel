# Part 14: Testing & QA

## Overview

| Aspect | Approach |
|--------|----------|
| **Unit Tests** | Manual (planned: Vitest + pytest) |
| **Integration** | Manual E2E |
| **E2E** | Manual scenarios |
| **Lint** | Oxlint (JS), py_compile (Python) |
| **Type Check** | Not yet (planned: TypeScript) |

---

## 🧪 Test Strategy

### Test Pyramid
```
        ┌─────────────┐
        │   E2E (2)   │  Manual scenarios
        ├─────────────┤
        │ Integration │  Manual API + UI
        ├─────────────┤
        │   Unit (5)  │  Planned: Vitest + pytest
        └─────────────┘
```

### Current Coverage
| Layer | Status | Tool |
|-------|--------|------|
| Linting | ✅ | Oxlint, py_compile |
| Type Safety | ⚠️ | JSDoc only |
| Unit Tests | ❌ | Planned |
| Integration | ⚠️ | Manual |
| E2E | ⚠️ | Manual scenarios |

---

## 🎯 Test Scenarios

### Authentication
| Scenario | Steps | Expected |
|----------|-------|----------|
| Sign Up | Email + password → submit | Account created, redirected to dashboard |
| Login | Valid credentials | JWT stored, redirect to dashboard |
| Login (Invalid) | Wrong password | Error toast, stay on auth |
| Session Persist | Refresh page | User stays logged in |
| Logout | Click logout | Redirect to auth, session cleared |

### Scenarios
| Scenario | Steps | Expected |
|----------|-------|----------|
| Select Scenario | Click scenario → config modal | Modal opens with options |
| Brutal Mode | Toggle on → start | Aggressive interviewer |
| Custom Context | Enter text → start | Context used in interview |
| Start Session | Click begin | Redirect to `/interview/:id` |

### Live Interview
| Scenario | Steps | Expected |
|----------|-------|----------|
| Text Input | Type message → send | SSE stream, mood updates |
| Voice Input | Click mic → speak → stop | Transcript + AI response |
| Mood Shifts | Give bad/good answers | Mood bar moves (1-10) |
| Filler Detection | Say "um, like, so" | Filler badge increments |
| Toxicity | Abusive language | Toast warning, flagged |
| End Session | Click "end session" | Redirect to report |

### Report
| Scenario | Steps | Expected |
|----------|-------|----------|
| View Report | End session → auto redirect | Score, verdict, skills, timeline |
| PDF Export | Click "Export PDF" | Downloads PDF |
| Weak Moments | Expand weak moment | STAR rewrite shown |
| Skills | View skill bars | 5 bars with scores |

### Org Workspace
| Scenario | Steps | Expected |
|----------|-------|----------|
| Create Org | Click "Create" → name | Org created, user = admin |
| Invite Member | Email + role → send | Invite appears in pending |
| Accept Invite | Log in as invitee → accept | Org visible, role assigned |
| View Member | Admin expands row | Member's sessions + reports |
| Role Change | Admin changes role | Role updated, permissions change |

### Desktop App
| Scenario | Steps | Expected |
|----------|-------|----------|
| Install | Run `.exe` / `.AppImage` | Installs to Applications |
| Launch | Click icon | Window opens, loads app |
| Titlebar | Mood chip visible | Mood updates live |
| Tray | Right-click tray | Menu with actions |
| Shortcuts | `Cmd+N` / `Cmd+B` | Actions trigger |
| Resume Session | Tray → Resume | Opens last session |

---

## 🔧 Automated Checks

### Frontend
```bash
# Lint
npm run lint          # Oxlint

# Build
npm run build         # Vite production build

# Type check (manual)
npx tsc --noEmit      # If TypeScript added
```

### Backend
```bash
# Syntax check
python -m py_compile app/*.py

# Lint (if ruff added)
ruff check .

# Type check (if mypy added)
mypy app/
```

### CI Pipeline
```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci --prefix frontend
      - run: npm run lint --prefix frontend
      
  backend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.10' }
      - run: pip install uv
      - run: uv sync --directory backend
      - run: python -m py_compile backend/app/*.py
```

---

## 🐛 Bug Triage

### Severity Levels
| Level | SLA | Examples |
|-------|-----|----------|
| **Critical** | < 4 hrs | Data loss, security, crash |
| **High** | < 24 hrs | Major feature broken |
| **Medium** | < 72 hrs | Minor bug, workaround exists |
| **Low** | Next sprint | Cosmetic, minor UX |

### Bug Report Template
```markdown
## Bug Report

**Severity:** [Critical/High/Medium/Low]
**Environment:** [Local/Staging/Production]
**Browser/OS:** [Chrome 120/Windows 11]

**Steps to Reproduce:**
1. Go to...
2. Click...
3. Observe...

**Expected:** ...
**Actual:** ...

**Logs/Screenshots:** ...
```

---

## 📊 QA Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Critical Bugs | 0 | 0 |
| High Bugs | < 3 | 0 |
| Release Blockers | 0 | 0 |
| Test Coverage | > 80% | 0% (planned) |
| Build Success | 100% | 100% |

---

## 🚀 Release QA

### Pre-Release Checklist
- [ ] All critical/high bugs fixed
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `python -m py_compile` passes
- [ ] Manual smoke test (all 14 scenarios)
- [ ] Desktop app launches (Win/Linux)
- [ ] PDF export works
- [ ] Voice input works
- [ ] Org invites work
- [ ] PDF export generates valid PDF
- [ ] Health endpoint returns 200

### Release Process
```bash
# 1. Final testing
git checkout main && git pull

# 2. Tag release
git tag v1.0.16
git push origin v1.0.16

# 3. GitHub Actions builds & releases
# 4. Verify release artifacts
# 5. Update CHANGELOG.md
```

---

*Next: [Appendices →](./15-appendices.md)*