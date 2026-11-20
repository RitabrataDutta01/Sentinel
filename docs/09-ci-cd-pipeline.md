# Part 09: CI/CD Pipeline

## Overview

| Property | Value |
|----------|-------|
| Platform | GitHub Actions |
| Trigger | Push to main, tags `v*`, manual dispatch |
| Environments | Windows (NSIS), Linux (AppImage + deb) |
| Artifacts | 7-day retention |

---

## 🔄 Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GITHUB ACTIONS WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                  │
│  │    build-windows    │         │    build-linux      │                  │
│  │   (windows-latest)  │         │   (ubuntu-latest)   │                  │
│  └──────────┬──────────┘         └──────────┬──────────┘                  │
│             │                               │                              │
│             └───────────────┬───────────────┘                              │
│                             ▼                                              │
│                  ┌─────────────────────┐                                  │
│                  │       release       │  (on tag v*)                     │
│                  │   (ubuntu-latest)   │                                  │
│                  └──────────┬──────────┘                                  │
│                             ▼                                            │
│                    ┌─────────────────┐                                   │
│                    │  GitHub Release │  (exe + AppImage + deb)           │
│                    └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Workflow File (`.github/workflows/build-electron.yml`)

```yaml
name: Build Electron Apps

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build frontend
        working-directory: ./frontend
        run: npm run build

      - name: Build Electron app (Windows)
        working-directory: ./frontend
        run: npm run electron:build

      - name: Upload Windows installer
        uses: actions/upload-artifact@v4
        with:
          name: sentinel-windows-installer
          path: |
            frontend/dist-electron/*.exe
            frontend/dist-electron/*.msi
          retention-days: 7

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build frontend
        working-directory: ./frontend
        run: npm run build

      - name: Install Linux dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libappindicator3-1 libsecret-1-dev libxss1 libasound2t64

      - name: Build Electron app (Linux)
        working-directory: ./frontend
        run: |
          npm run build:electron
          npx electron-builder --linux AppImage deb --projectDir=dist-electron-build --config electron-builder.config.yml

      - name: Upload Linux artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sentinel-linux
          path: |
            frontend/dist-electron/*.AppImage
            frontend/dist-electron/*.deb
          retention-days: 7

  release:
    needs: [build-windows, build-linux]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Download Windows installer
        uses: actions/download-artifact@v4
        with:
          name: sentinel-windows-installer
          path: ./dist-electron

      - name: Download Linux artifacts
        uses: actions/download-artifact@v4
        with:
          name: sentinel-linux
          path: ./dist-electron

      - name: Get version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF_NAME#v}" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: Sentinel ${{ steps.version.outputs.VERSION }}
          body: |
            ## Sentinel HR Simulator - Release ${{ steps.version.outputs.VERSION }}

            ### Windows
            1. Download `Sentinel-Setup-${{ steps.version.outputs.VERSION }}.exe`
            2. Run the installer
            3. Follow the setup wizard

            ### Linux
            - **AppImage**: Download `Sentinel-${{ steps.version.outputs.VERSION }}.AppImage`, make executable (`chmod +x`), and run
            - **Debian/Ubuntu**: Download `sentinel_${{ steps.version.outputs.VERSION }}_amd64.deb` and install with `sudo dpkg -i`

            ### Changes
            See [CHANGELOG.md](https://github.com/${{ github.repository }}/blob/main/CHANGELOG.md) for details.
          draft: false
          prerelease: false
          files: |
            ./dist-electron/*.exe
            ./dist-electron/*.AppImage
            ./dist-electron/*.deb
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🔧 Job Details

### build-windows
| Step | Description |
|------|-------------|
| Checkout | Clone repo |
| Setup Node | Node 20, npm cache |
| Install deps | `npm ci` in `./frontend` |
| Build frontend | `npm run build` (Vite production) |
| Build Electron | `npm run electron:build` (NSIS) |
| Upload | `frontend/dist-electron/*.exe` |

**Output:** `Sentinel-Setup-<version>.exe` (~225 MB)

---

### build-linux
| Step | Description |
|------|-------------|
| Checkout | Clone repo |
| Setup Node | Node 20, npm cache |
| Install deps | `npm ci` in `./frontend` |
| Build frontend | `npm run build` |
| System deps | `libappindicator3-1 libsecret-1-dev libxss1 libasound2t64` |
| Build Electron | `npm run build:electron` + `electron-builder --linux AppImage deb` |
| Upload | `frontend/dist-electron/*.AppImage`, `*.deb` |

**Output:**
- `Sentinel-<version>.AppImage` (~150 MB)
- `sentinel_<version>_amd64.deb`

---

### release
| Step | Description |
|------|-------------|
| Needs | `build-windows`, `build-linux` |
| Trigger | Tag push (`v*`) |
| Download | Both artifacts |
| Create Release | `softprops/action-gh-release@v2` |
| Assets | `.exe`, `.AppImage`, `.deb` |

---

## 🏷️ Release Process

### Triggering a Release
```bash
git tag v1.0.16
git push origin v1.0.16
```

### Manual Dispatch
1. GitHub → Actions → "Build Electron Apps"
2. "Run workflow" → Select branch/tag

---

## 📦 Artifact Structure

### Windows
```
dist-electron/
├── Sentinel-Setup-1.0.16.exe     # NSIS installer (~225 MB)
```

### Linux
```
dist-electron/
├── Sentinel-1.0.16.AppImage      # Portable (~150 MB)
├── sentinel_1.0.16_amd64.deb     # Debian package
```

---

## 🔐 Secrets Required

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Auto-provided for releases |
| (none else) | All builds self-contained |

---

## 🚀 Build Outputs Summary

| Platform | Format | Size | Install Method |
|--------|--------|------|----------------|
| Windows | `.exe` (NSIS) | ~225 MB | Run installer |
| Linux | `.AppImage` | ~150 MB | `chmod +x && ./Sentinel.AppImage` |
| Linux | `.deb` | TBD | `sudo dpkg -i sentinel.deb` |

---

## 🔧 Build Commands

### Local Build
```bash
cd frontend

# Full build (both platforms)
npm run build:electron
npx electron-builder --win --linux --projectDir=dist-electron-build

# Windows only
npm run build:electron && npx electron-builder --win --dir --projectDir=dist-electron-build

# Linux only
npm run build:electron && npx electron-builder --linux AppImage deb --projectDir=dist-electron-build
```

---

## ⚡ Performance

| Metric | Windows | Linux |
|--------|---------|-------|
| Build Time | ~5 min | ~6 min |
| Artifact Size | 225 MB | 150 MB (AppImage) |
| Parallel Jobs | 2 (win + linux) | - |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `libgconf-2-4` not found | Use `libasound2t64` on Ubuntu 26.04+ |
| `homepage` missing for deb | Add `homepage` to generated `package.json` |
| `desktopName` warning | Add `desktopName: Sentinel` to Linux config |
| Icons not found | Fix `extraResources` path: `from: "../electron/icons"` |

---

*Next: [Deployment Guide →](./10-deployment-guide.md)*