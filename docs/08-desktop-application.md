# Part 08: Desktop Application

## Overview

| Property | Value |
|----------|-------|
| Framework | Electron 43 |
| Packager | electron-builder 26 |
| Installer | NSIS (Windows), AppImage + deb (Linux) |
| Architecture | x64 |
| ASAR | Enabled |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ELECTRON APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     MAIN PROCESS (main.js)                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ BrowserWindow│  │    Menu      │  │    Tray      │              │   │
│  │  │              │  │              │  │              │              │   │
│  │  │ • Width:1200 │  │ • File       │  │ • Show       │              │   │
│  │  │ • Height:800 │  │ • Edit       │  │ • New Session│              │   │
│  │  │ • frame:false│  │ • View       │  │ • Resume     │              │   │
│  │  │ • titleBar   │  │ • Session    │  │ • Sessions   │              │   │
│  │  │   hidden     │  │ • Help       │  │ • Settings   │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐                                │   │
│  │  │ Global       │  │    IPC       │                                │   │
│  │  │ Shortcuts    │  │   Handlers   │                                │   │
│  │  │              │  │              │                                │   │
│  │  │ • Cmd+N      │  │ • minimize   │                                │   │
│  │  │ • Cmd+,      │  │ • maximize   │                                │   │
│  │  │ • Cmd+B      │  │ • close      │                                │   │
│  │  │ • F1         │  │ • save-file  │                                │   │
│  │  │ • Cmd+Shift+U│  │ • notification│                               │   │
│  │  └──────────────┘  └──────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                              contextBridge                                 │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RENDERER PROCESS (React)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │              DESKTOP APPSHELL                                │    │   │
│  │  │  ┌─────────────┐  ┌─────────────────┐  ┌───────────────┐   │    │   │
│  │  │  │   Sidebar   │  │   Titlebar      │  │  Main Content │   │    │   │
│  │  │  │  (64/240px) │  │  (Mood Chip)    │  │  (React App)  │   │    │   │
│  │  │  └─────────────┘  └─────────────────┘  └───────────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
electron/
├── main.js              # Main process
├── preload.js           # Preload script (contextBridge)
└── icons/
    ├── icon.ico         # Windows (from sentinel_light_mode_icon.ico)
    └── icon.png         # macOS/Linux (from sentinel_dark_mode_icon.png)

frontend/
├── src/
│   ├── desktop/
│   │   ├── index.js         # Desktop init
│   │   ├── menu.js          # App menu
│   │   ├── tray.js          # System tray
│   │   ├── shortcuts.js     # Global shortcuts
│   │   └── notification.js  # Notifications
│   ├── lib/
│   │   └── electron.js      # Electron bridge (renderer)
│   └── components/layout/
│       └── DesktopAppShell.jsx  # Main shell component
├── electron/
│   ├── main.js              # Copied at build
│   ├── preload.js           # Copied at build
│   └── icons/               # Copied at build
```

---

## ⚡ Main Process (`electron/main.js`)

### Window Creation
```javascript
function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,                    // Custom titlebar
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      backgroundThrottling: false,
      contentSecurityPolicy: isDev ? 
        "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' http://localhost:* https://mhkxctmbyoswmjbxnxsm.supabase.co;" :
        "default-src 'self'; script-src 'self'; connect-src 'self' https://sentinel-ojdo.onrender.com https://mhkxctmbyoswmjbxnxsm.supabase.co;"
    }
  });

  mainWindow.loadURL(url);
  if (isDev) mainWindow.webContents.openDevTools();
}
```

### Window Controls (IPC)
```javascript
// Window controls
ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});
```

### Global Shortcuts
```javascript
app.whenReady().then(() => {
  globalShortcut.register('CmdOrCtrl+N', () => mainWindow.webContents.send('new-session'));
  globalShortcut.register('CmdOrCtrl+,', () => mainWindow.webContents.send('navigate-settings'));
  globalShortcut.register('CmdOrCtrl+B', () => mainWindow.webContents.send('toggle-sidebar'));
  globalShortcut.register('F1', () => mainWindow.webContents.send('open-documentation'));
  globalShortcut.register('CmdOrCtrl+Shift+U', () => mainWindow.webContents.send('check-updates'));
  globalShortcut.register('CmdOrCtrl+Shift+N', () => mainWindow.webContents.send('new-simulation'));
});
```

### System Tray
```javascript
function createTray() {
  const iconPath = path.join(__dirname, 'icons', 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Sentinel HR Simulation');

  const trayMenu = Menu.buildFromTemplate([
    { label: 'Show Sentinel', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'New Session', click: () => mainWindow.webContents.send('new-session') },
    { label: 'Resume Last Session', click: () => mainWindow.webContents.send('resume-last-session') },
    { label: 'View Active Sessions', click: () => mainWindow.webContents.send('navigate-sessions') },
    { label: 'Settings', click: () => mainWindow.webContents.send('navigate-settings') },
    { type: 'separator' },
    { label: 'Quit Sentinel', click: () => app.quit() }
  ]);

  tray.setContextMenu(trayMenu);
  tray.on('click', () => { mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() });
}
```

---

## 🔌 Preload Script (`electron/preload.js`)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  showNotification: (title, options) => ipcRenderer.invoke('show-notification', { title, options }),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isAppPackaged: () => ipcRenderer.invoke('is-app-packaged')
});

contextBridge.exposeInMainWorld('electronEvents', {
  onNewSession: (cb) => ipcRenderer.on('new-session', cb),
  onNavigateSessions: (cb) => ipcRenderer.on('navigate-sessions', cb),
  onNavigateSettings: (cb) => ipcRenderer.on('navigate-settings', cb),
  onResumeLastSession: (cb) => ipcRenderer.on('resume-last-session', cb),
  onToggleSidebar: (cb) => ipcRenderer.on('toggle-sidebar', cb),
  // ... 15+ event handlers
});
```

---

## 🌉 Renderer Bridge (`frontend/src/lib/electron.js`)

```javascript
const isElectronRenderer = () => 
  typeof window !== 'undefined' && !!window.electronAPI;

let electronAPI = null;
if (isElectronRenderer()) {
  electronAPI = window.electronAPI;
}

export const electron = {
  minimizeWindow: () => electronAPI?.minimizeWindow(),
  maximizeWindow: () => electronAPI?.maximizeWindow(),
  closeWindow: () => electronAPI?.closeWindow(),
  showNotification: async (title, options) => electronAPI?.showNotification({ title, options }),
  getAppVersion: async () => electronAPI?.getAppVersion(),
  isAppPackaged: async () => electronAPI?.isAppPackaged(),
};

export const electronEvents = {
  onNewSession: (cb) => electronAPI?.onNewSession?.(cb) || (() => {}),
  onResumeLastSession: (cb) => electronAPI?.onResumeLastSession?.(cb) || (() => {}),
  onToggleSidebar: (cb) => electronAPI?.onToggleSidebar?.(cb) || (() => {}),
  // ... 15+ handlers
};

export const isElectron = isElectronRenderer;
```

### React Hook
```javascript
export function useElectron() {
  return isElectron();
}
```

---

## 🖥️ Desktop AppShell (`DesktopAppShell.jsx`)

### Structure
```jsx
export default function DesktopAppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { sessionId, setup, currentMood } = useSessionStore();
  const navigate = useNavigate();
  
  // Sync sidebar from Electron
  useEffect(() => {
    const unsub = electronEvents.onToggleSidebar(() => {
      setCollapsed(c => !c);
    });
    return unsub;
  }, []);

  // Electron events
  useEffect(() => {
    if (!isElectron()) return;
    const unsubs = [
      electronEvents.onNewSession(() => navigate('/scenarios')),
      electronEvents.onNavigateSessions(() => navigate('/sessions')),
      electronEvents.onNavigateSettings(() => navigate('/settings')),
      electronEvents.onResumeLastSession(async () => {
        const sessions = await fetchSessions();
        if (sessions.length) {
          navigate(`/interview/${sessions[0].id}`);
        } else {
          navigate('/scenarios');
        }
      }),
      electronEvents.onToggleSidebar(() => setCollapsed(c => !c)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [navigate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Titlebar setup={setup} currentMood={currentMood} sessionId={sessionId} />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Titlebar Component
```jsx
function Titlebar({ setup, currentMood, sessionId }) {
  const mood = sessionId ? currentMood : null;
  const color = mood ? moodColor(mood) : null;
  const label = mood ? moodLabel(mood) : null;

  return (
    <div className="flex h-10 items-center border-b border-sidebar-border bg-sidebar px-4" style={{ WebkitAppRegion: 'drag' }}>
      {/* Traffic lights (macOS) */}
      <div className="flex shrink-0 items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
        {isElectron() && (
          <>
            <button onClick={() => closeWindow()} className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500" title="Close" style={{ WebkitAppRegion: 'no-drag' }} />
            <button onClick={() => minimizeWindow()} className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500" title="Minimize" />
            <button onClick={() => maximizeWindow()} className="h-3 w-3 rounded-full bg-green-500/80 hover:bg-green-500" title="Maximize" />
          </>
        )}
      </div>

      {/* Center: subtitle + mood chip */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <span className="text-[12px] font-medium tracking-wide text-muted">
          workplace conversation simulator
        </span>
        {label && (
          <span className="rounded-[var(--radius)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${color}20`, color }}>
            {label}
          </span>
        )}
      </div>

      {/* Window controls (Windows/Linux) */}
      <div className="flex shrink-0 items-center gap-0.5 w-16" style={{ WebkitAppRegion: 'no-drag' }}>
        {isElectron() && (
          <>
            <button onClick={minimizeWindow} className="rounded p-1 text-muted hover:bg-elevated hover:text-foreground" style={{ WebkitAppRegion: 'no-drag' }}>
              <svg className="h-3 w-3"><line x1="3" y1="7.5" x2="9" y2="7.5" /></svg>
            </button>
            <button onClick={maximizeWindow} className="rounded p-1 text-muted hover:bg-elevated hover:text-foreground" style={{ WebkitAppRegion: 'no-drag' }}>
              <svg className="h-3 w-3"><rect x="2.5" y="2.5" width="7" height="7" rx="0.5" /></svg>
            </button>
            <button onClick={closeWindow} className="rounded p-1 text-muted hover:bg-destructive/20 hover:text-destructive" style={{ WebkitAppRegion: 'no-drag' }}>
              <svg className="h-3 w-3"><line x1="2.5" y1="2.5" x2="9.5" y2="9.5" /><line x1="9.5" y1="2.5" x2="2.5" y2="9.5" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 Global Shortcuts

| Shortcut | Action | Electron | Browser |
|----------|--------|----------|---------|
| `Cmd/Ctrl + N` | New Session | ✅ | ❌ |
| `Cmd/Ctrl + ,` | Settings | ✅ | ❌ |
| `Cmd/Ctrl + B` | Toggle Sidebar | ✅ | ❌ |
| `F1` | Documentation | ✅ | ❌ |
| `Cmd/Ctrl + Shift + U` | Check Updates | ✅ | ❌ |
| `Cmd/Ctrl + Shift + N` | New Simulation | ✅ | ❌ |
| `Cmd/Ctrl + Shift + P` | Pause/Resume | ✅ | ❌ |
| `Cmd/Ctrl + Shift + X` | Stop | ✅ | ❌ |
| `Cmd/Ctrl + Shift + E` | Export Transcript | ✅ | ❌ |

---

## 🔔 System Tray Menu

```
┌─────────────────────┐
│  Show Sentinel      │
│  New Session        │
│  Resume Last Session│  ← Key feature
│  View Active Sessions│
│  Settings           │
├─────────────────────┤
│  Quit Sentinel      │
└─────────────────────┘
```

---

## 🎨 Build Configuration

### `electron-builder.config.yml`
```yaml
appId: com.sentinel.app
productName: Sentinel
copyright: "Copyright © 2025 Sentinel"
executableName: Sentinel

directories:
  output: "../dist-electron"

files:
  - "**/*"
  - "dist/**/*"
  - "dist/*"

asar: true

extraResources:
  - from: "../electron/icons"
    to: "icons"
    filter: ["**/*"]

win:
  target:
    - target: nsis
      arch: [x64]
  icon: "icons/icon.ico"

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Sentinel
  uninstallDisplayName: Sentinel HR Simulator

linux:
  target:
    - AppImage
    - deb
  icon: "icons/icon.png"
  category: Office
  maintainer: Sentinel Team <sentinel@example.com>
  desktopName: Sentinel
```

### Build Script (`package.json`)
```json
"scripts": {
  "build:electron": "node -e \"...copy dist + electron files to dist-electron-build...\"",
  "electron:build": "npm run build:electron && electron-builder --projectDir=dist-electron-build --config electron-builder.config.yml"
}
```

### CI/CD Build
```yaml
# GitHub Actions
build-linux:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci --prefix ./frontend
    - run: npm run build --prefix ./frontend
    - run: |
        sudo apt-get install -y libappindicator3-1 libsecret-1-dev libxss1 libasound2t64
    - run: npm run build:electron && npx electron-builder --linux AppImage deb --projectDir=dist-electron-build
```

---

## 📦 Build Outputs

| Platform | Output | Location |
|----------|--------|----------|
| **Windows** | `Sentinel.exe` (NSIS installer) | `dist-electron/Sentinel Setup <version>.exe` |
| **Linux** | `sentinel` (unpacked) | `dist-electron-build/dist/linux-unpacked/sentinel` |
| **Linux** | `Sentinel-1.0.0.AppImage` | `dist-electron/Sentinel-1.0.0.AppImage` |
| **Linux** | `Sentinel_1.0.0_amd64.deb` | `dist-electron/Sentinel_1.0.0_amd64.deb` |

### Sizes
| Build | Size |
|-------|------|
| Windows (NSIS) | ~225 MB |
| Linux (unpacked) | ~211 MB |
| Linux (AppImage) | ~150 MB |
| Linux (deb) | ~TBD |

---

## 🔧 Development

### Dev Mode
```bash
cd frontend
npm run electron:dev  # Concurrent Vite + Electron with hot reload
```

### Production Build
```bash
cd frontend
npm run electron:build  # Creates NSIS installer + AppImage + deb
```

### Testing Locally
```bash
# Linux
./dist-electron-build/dist/linux-unpacked/sentinel --ozone-platform-hint=auto

# Windows (via Wine)
WINEDEBUG=-all wine dist-electron-build/dist/win-unpacked/Sentinel.exe --disable-gpu
```

---

## ✅ Production Checklist

- [ ] `asar: true` enabled
- [ ] Clean `package.json` (no React deps in Electron build)
- [ ] `executableName: Sentinel`
- [ ] `homepage` in generated `package.json`
- [ ] CSP allows Supabase + API domains
- [ ] `backgroundThrottling: false`
- [ ] `titleBarStyle: 'hidden'` (Windows/Linux)
- [ ] `desktopName: Sentinel` (Linux)
- [ ] App icons (ICO for Win, PNG for Linux)
- [ ] Global shortcuts registered
- [ ] Tray menu with "Resume Last Session"
- [ ] Window controls (min/max/close) via IPC
- [ ] `HashRouter` in Electron, `BrowserRouter` in browser

---

*Next: [CI/CD Pipeline →](./09-ci-cd-pipeline.md)*