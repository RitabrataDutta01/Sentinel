# Part 10: Deployment Guide

## Overview

| Environment | Method |
|-------------|--------|
| **Local Development** | Vite dev + Flask |
| **Production (Web)** | Render (Flask + static SPA) |
| **Desktop** | Electron (NSIS, AppImage, deb) |
| **Docker** | Optional (see below) |

---

## 🏠 Local Development

### Prerequisites
- Node 20+
- Python 3.10+
- uv (Python package manager)
- Supabase project
- Groq API key

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
uv sync
cp .env.example .env
# Edit .env with your credentials
uv run python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with Supabase credentials
npm run dev
```

### Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger UI | http://localhost:5000/apidocs/ |
| Health | http://localhost:5000/api/v1/health |

---

## 🌐 Production Deployment (Render)

### Architecture
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

### Render Setup

1. **Create Web Service**
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `./render-build.sh`
   - Start Command: `gunicorn run:app`

2. **Environment Variables** (in Render dashboard)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=sb_secret_xxx
GROQ_API_KEY=gsk_xxx
GEMINI_API_KEY=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

3. **Deploy** - Render auto-deploys on push to main

### Render Build Script (`backend/render-build.sh`)
```bash
#!/usr/bin/env bash
set -e

echo "Installing Python dependencies..."
uv sync

echo "Building frontend..."
npm ci --prefix ../frontend
npm run build --prefix ../frontend

echo "Copying frontend build..."
mkdir -p static
cp -r ../frontend/dist/* static/
```

---

## 🐳 Docker Deployment (Optional)

### Dockerfile
```dockerfile
# Backend
FROM python:3.10-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
RUN pip install gunicorn

# Install system deps for WeasyPrint
RUN apt-get update && apt-get install -y \
    libcairo2 libpango-1.0-0 libgdk-pixbuf2.0-0 libffi-dev \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 5000
CMD ["gunicorn", "run:app"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - backend/.env
    volumes:
      - ./backend:/app
    command: gunicorn run:app --bind 0.0.0.0:5000

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
```

### Frontend Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
```

---

## 🖥️ Desktop Distribution

### Windows (NSIS Installer)
```bash
cd frontend
npm run electron:build
# Output: dist-electron/Sentinel Setup <version>.exe
```

### Linux (AppImage + deb)
```bash
cd frontend
npm run build:electron
npx electron-builder --linux AppImage deb --projectDir=dist-electron-build
# Output: dist-electron/Sentinel-<version>.AppImage + .deb
```

### Manual Install (Linux)
```bash
# AppImage
chmod +x Sentinel-1.0.0.AppImage
./Sentinel-1.0.0.AppImage

# Debian/Ubuntu
sudo dpkg -i sentinel_1.0.0_amd64.deb
# If dependencies missing:
sudo apt-get install -f
```

---

## 🔧 Environment Configuration

### Backend (`.env`)
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=sb_secret_xxx

# AI
GROQ_API_KEY=gsk_xxx
GEMINI_API_KEY=xxx

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Flask
FLASK_DEBUG=False
```

### Frontend (`.env.local` / `.env.production`)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_API_BASE_URL=  # Empty = same origin
```

### Production Frontend (`.env.production`)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_API_BASE_URL=https://your-render-url.onrender.com
```

---

## 🗄️ Database Setup (Supabase)

### 1. Create Project
1. Go to https://supabase.com
2. New Project → Select region
3. Save credentials

### 2. Run Migrations
```sql
-- In Supabase Dashboard → SQL Editor:

-- 1. Run 0001_enable_rls.sql
-- 2. Run 0002_multi_tenant_orgs.sql
```

### 3. Verify RLS
```sql
-- Check RLS enabled
SELECT * FROM pg_tables WHERE schemaname = 'public' AND rowsecurity;

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## 🔐 Security Checklist

| Item | Status |
|------|--------|
| `.env` files in `.gitignore` | ✅ |
| Service role key only on backend | ✅ |
| Anon key only on frontend | ✅ |
| RLS enabled on all tables | ✅ |
| CSP headers configured | ✅ |
| HTTPS enforced (Render) | ✅ |
| Secrets in env vars (not code) | ✅ |

---

## 📊 Monitoring & Health

### Health Endpoint
```bash
curl https://your-app.onrender.com/api/v1/health
# {"status":"online","services":{"database":true,"groq_api":true}}
```

### Logs
- **Render**: Dashboard → Logs
- **Docker**: `docker logs -f <container>`
- **Local**: Terminal output

---

## 🔄 CI/CD Integration

### Auto-Deploy on Push
```yaml
# Render auto-deploys on push to main
# GitHub Actions builds Electron apps on tag push
```

### Manual Deploy
```bash
# Render Dashboard → Manual Deploy
# Or: git push origin main
```

---

## 📦 Backup Strategy

| Data | Method |
|------|--------|
| Database | Supabase automatic backups (daily) |
| Code | GitHub (git history) |
| Uploads | Not applicable (no file uploads) |

---

## 📈 Scaling Considerations

| Component | Current | Scale Path |
|-----------|---------|------------|
| Backend | Single Flask process | Gunicorn workers, multiple instances |
| Database | Supabase (managed) | Auto-scales |
| Frontend | Static files | CDN (Cloudflare) |
| AI | Groq API | Rate-limited, async queue for scale |

---

*Next: [Development Guide →](./11-development-guide.md)*