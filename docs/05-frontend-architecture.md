# Part 05: Frontend Architecture

## Overview

| Property | Value |
|----------|-------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Language | JavaScript (ESM) |
| Styling | Tailwind CSS v4 |
| State | Zustand + React Query |
| Routing | React Router 7 (HashRouter in Electron) |

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DesktopAppShell.jsx    # Electron shell (sidebar, titlebar)
│   │   │   ├── AppShell.jsx           # Browser shell
│   │   │   ├── PageHero.jsx           # Page header component
│   │   │   └── PageShell.jsx          # Page wrapper
│   │   └── ui/                        # shadcn-style primitives
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── input.jsx
│   │       ├── select.jsx
│   │       ├── switch.jsx
│   │       ├── textarea.jsx
│   │       ├── label.jsx
│   │       ├── tooltip.jsx
│   │       ├── separator.jsx
│   │       ├── badge.jsx
│   │       ├── sonner.jsx
│   │       └── scroll-area.jsx
│   ├── pages/
│   │   ├── Landing.jsx                # Marketing landing
│   │   ├── Auth.jsx                   # Sign in / Sign up
│   │   ├── Dashboard.jsx              # Candidate dashboard
│   │   ├── Scenarios.jsx              # Scenario library + config
│   │   ├── Interview.jsx              # Live interview (SSE + voice)
│   │   ├── Report.jsx                 # Report card + PDF
│   │   ├── Dashboard.jsx              # Candidate dashboard
│   │   ├── Sessions.jsx               # Session history
│   │   ├── Insights.jsx               # Analytics
│   │   ├── People.jsx                 # Organisation workspace
│   │   ├── Settings.jsx               # Profile, defaults, theme
│   │   └── Reports.jsx                # Report list
│   ├── lib/
│   │   ├── api.js                     # Axios + fetch (SSE)
│   │   ├── supabase.js                # Supabase client + auth
│   │   ├── electron.js                # Electron bridge
│   │   ├── mood.js                    # Mood color helpers
│   │   ├── verdict.js                 # Verdict styling
│   │   ├── useOrg.js                  # Org cache hook
│   │   ├── useTheme.js                # Theme hook
│   │   └── utils.ts                   # cn() class helper
│   ├── store/
│   │   └── sessionStore.js            # Zustand interview state
│   ├── desktop/
│   │   ├── index.js                   # Desktop init
│   │   ├── menu.js                    # App menu
│   │   ├── tray.js                    # System tray
│   │   ├── shortcuts.js               # Global shortcuts
│   │   └── notification.js            # Notifications
│   ├── App.jsx                        # Root + routing
│   ├── main.jsx                       # Entry point
│   └── index.css                      # Design tokens + Tailwind
├── electron/                          # Electron config (copied at build)
│   ├── main.js
│   ├── preload.js
│   └── icons/
├── package.json
├── vite.config.js
└── electron-builder.config.yml
```

---

## ⚛️ React Architecture

### Entry Point (`main.jsx`)
```jsx
const Router = isElectron() ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Key:** `HashRouter` in Electron (file:// protocol), `BrowserRouter` in browser.

---

### App Root (`App.jsx`)

```jsx
const PROTECTED_ROUTES = [
  '/dashboard', '/setup', '/sessions', '/insights',
  '/scenarios', '/settings', '/people', '/reports',
  '/interview', '/report'
];

function AnimatedRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Health ping to wake Render backend
    checkHealth().catch(() => {});

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... routing logic with <Navigate>, <Suspense>, <AnimatePresence>
}
```

**Key Features:**
- Health ping on startup (wakes Render backend)
- Supabase auth state sync
- Lazy-loaded pages (`React.lazy`)
- Error boundaries per route
- Framer Motion page transitions
- HashRouter in Electron, BrowserRouter in web

---

## 🛣️ Routing

| Route | Page | Auth | Shell |
|-------|------|------|-------|
| `/` | Redirect | — | — |
| `/auth` | Auth | ❌ | None |
| `/dashboard` | Dashboard | ✅ | DesktopAppShell |
| `/scenarios` | Scenarios | ✅ | DesktopAppShell |
| `/interview/:sessionId` | Interview | ✅ | DesktopAppShell |
| `/report/:sessionId` | Report | ✅ | DesktopAppShell |
| `/dashboard` | Dashboard | ✅ | DesktopAppShell |
| `/sessions` | Sessions | ✅ | DesktopAppShell |
| `/insights` | Insights | ✅ | DesktopAppShell |
| `/people` | Organisation | ✅ | DesktopAppShell |
| `/reports` | Reports | ✅ | DesktopAppShell |
| `/settings` | Settings | ✅ | DesktopAppShell |

**Redirects:**
- `/` → `/dashboard` (if auth) or `/auth`
- `/setup` → `/scenarios`
- `/interview` → `/scenarios`
- `*` → `/dashboard` (auth) or `/auth`

---

## 🗂️ State Management

### Zustand Store (`sessionStore.js`)
```javascript
export const useSessionStore = create((set, get) => ({
  sessionId: null,
  setup: null,
  messages: [],
  currentMood: 5,
  moodHistory: [],
  isStreaming: false,
  streamingText: '',
  terminated: false,
  terminationReason: null,
  durationSec: null,

  startSession({ sessionId, setup }) {
    set({ sessionId, setup, messages: [], currentMood: 5, moodHistory: [], terminated: false });
  },

  addUserMessage(content) {
    set(s => ({ messages: [...s.messages, { role: 'user', content }] }));
  },

  beginAiStream() { set({ isStreaming: true, streamingText: '' }); },

  appendAiToken(token) {
    set(s => ({ streamingText: s.streamingText + token }));
  },

  applyMoodUpdate({ new_mood, filler_analysis }) {
    set(s => ({
      currentMood: new_mood,
      moodHistory: [...s.moodHistory, { turnIndex: s.messages.length, mood: new_mood, fillerAnalysis }]
    }));
  },

  finishAiStream() {
    const { streamingText, messages } = get();
    set({ messages: [...messages, { role: 'ai', content: streamingText }], isStreaming: false, streamingText: '' });
  },

  terminateSession(reason, durationSec) {
    set({ terminated: true, terminationReason: reason, durationSec, isStreaming: false });
  },

  reset() { set(initialState); }
}));
```

### React Query
- `useOrg()` - Shared org cache (module-level, multi-instance sync)
- `fetchSessions()`, `fetchMemberSessions()` - Session data
- `getProfile()`, `saveProfile()` - Profile management

---

## 🎨 Component Architecture

### DesktopAppShell (`DesktopAppShell.jsx`)
**Purpose:** Electron-specific shell with native titlebar, sidebar, tray integration.

**Key Features:**
- Native titlebar with traffic lights (macOS) / window controls (Win/Linux)
- Mood chip in titlebar (live mood indicator)
- Collapsible sidebar (64px / 240px)
- Global shortcut listener (`Cmd/Ctrl+B` → toggle sidebar)
- System tray events (`resume-last-session`, etc.)
- Org prompt banner (pending invites)
- Electron IPC listeners for tray/menu shortcuts

**Sidebar Structure:**
```
Workspace
├── Dashboard
├── Scenarios
├── Organisation
├── Sessions
├── Reports
General
├── Settings
└── Theme Toggle
```

### Page Components

| Page | Key Features |
|------|--------------|
| `Landing.jsx` | Animated hero, live demo simulation, scenario chips |
| `Auth.jsx` | Sign in/up, password toggle, theme toggle |
| `Dashboard.jsx` | Stats cards, recent sessions, resume/start CTA |
| `Scenarios.jsx` | Category groups, config modal, brutal mode toggle |
| `Interview.jsx` | SSE stream, voice input, mood bar, filler detection |
| `Report.jsx` | Score rings, skill bars, mood timeline, weak moments, PDF |
| `Sessions.jsx` | Expandable history, filter by scenario |
| `Insights.jsx` | Mood trend chart, skill bars, recurring patterns |
| `People.jsx` | Org roster, role mgmt, invite flow, member sessions |
| `Settings.jsx` | Profile, defaults, theme, sign out |

---

## 🎨 UI Components (shadcn-style)

### Base Components (`components/ui/`)
| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | `variant`, `size`, `asChild` | `cva` variants |
| `Card` | `CardHeader`, `CardContent`, `CardFooter` | Compound |
| `Input` | Standard HTML + `cn()` | Forward ref |
| `Select` | Radix Select | `onValueChange` |
| `Switch` | Radix Switch | `checked`, `onCheckedChange` |
| `Textarea` | Auto-resize | `rows` prop |
| `Label` | `htmlFor` | Required for accessibility |
| `Tooltip` | Radix Tooltip | `content` prop |
| `Separator` | Horizontal/Vertical | `orientation` |
| `Badge` | `variant` | Pill style |
| `ScrollArea` | Radix ScrollArea | Custom scrollbar |
| `Sonner` | Toast | `toast.success/error` |

### Custom Components

| Component | Purpose |
|-----------|---------|
| `PageHero` | Eyebrow + title + subtitle + actions |
| `StatTile` | Stat card (label, value, sub, tone) |
| `ScoreRing` | Animated SVG progress ring |
| `StatTile` | Compact metric card |
| `verdictStyle()` | Verdict badge CSS classes |
| `moodColor()` | Mood → color interpolation |

---

## 🎭 Animations (Framer Motion)

| Pattern | Usage |
|---------|-------|
| `initial={{ opacity: 0, y: 8 }}` | Fade + slide up |
| `animate={{ opacity: 1, y: 0 }}` | Enter animation |
| `exit={{ opacity: 0, height: 0 }}` | Collapse on unmount |
| `transition={{ duration: 0.2 }}` | Standard timing |
| `AnimatePresence` | Mount/unmount animations |
| `motion.div` | Animated wrapper |

**Reduced Motion:** Respected via `prefers-reduced-motion` media query.

---

## 🔌 Electron Integration

### Detection (`lib/electron.js`)
```javascript
const isElectronRenderer = () => 
  typeof window !== 'undefined' && !!window.electronAPI;
```

### Preload Bridge (`electron/preload.js`)
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  showNotification: (title, options) => ipcRenderer.invoke('show-notification', { title, options }),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isAppPackaged: () => ipcRenderer.invoke('is-app-packaged')
});

contextBridge.exposeInMainWorld('electronEvents', {
  onToggleSidebar: (cb) => ipcRenderer.on('toggle-sidebar', cb),
  onResumeLastSession: (cb) => ipcRenderer.on('resume-last-session', cb),
  // ... 15+ event handlers
});
```

### Hooks (`lib/electron.js`)
```javascript
export const isElectron = isElectronRenderer;

export const electron = {
  minimizeWindow: () => electronAPI?.minimizeWindow(),
  // ... window controls
};

export const electronEvents = {
  onToggleSidebar: (cb) => electronEvents.onToggleSidebar(cb),
  // ... event subscriptions
};
```

---

## 🎯 Key Patterns

### 1. Lazy Loading + Error Boundaries
```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));

<Route path="/dashboard" element={
  <ErrorBoundary fallbackMessage="Failed to load dashboard">
    <Dashboard />
  </ErrorBoundary>
} />
```

### 2. Optimistic Updates
```javascript
const reload = useCallback(() => {
  cache = { org: null, membership: null, pendingInvites: [], loading: true };
  emit();
  loadOrg();
}, []);
```

### 3. Shared Cache (useOrg)
```javascript
let cache = { org: null, membership: null, pendingInvites: [], loading: true };
const listeners = new Set();

function emit() { listeners.forEach(l => l(cache)); }
function setCache(next) { cache = { ...cache, ...next }; emit(); }
```

### 4. Guarded API Calls
```javascript
async function loadOrg() {
  const token = await getToken();
  if (!token) { setCache({ org: null, loading: false }); return; }
  // ... fetch org data
}
```

---

## 📱 Responsive Design

| Breakpoint | Sidebar | Layout |
|------------|---------|--------|
| `< 640px` | Hidden (hamburger) | Stacked |
| `640-1024px` | Collapsible (64/240px) | Side-by-side |
| `> 1024px` | Expanded (240px) | Side-by-side |

**CSS:** Tailwind utilities + CSS variables for theming.

---

## ♿ Accessibility

| Feature | Implementation |
|---------|----------------|
| **Semantic HTML** | `<main>`, `<nav>`, `<section>`, `<button>` |
| **ARIA** | `aria-label`, `aria-expanded`, `role` |
| **Focus** | Visible focus rings (`focus-visible:ring`) |
| **Color Contrast** | oklch palette (WCAG AA) |
| **Reduced Motion** | `prefers-reduced-motion` respected |
| **Keyboard** | All interactive elements reachable |

---

*Next: [Backend Architecture →](./06-backend-architecture.md)*