import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  LineChart,
  Swords,
  Settings as SettingsIcon,
  Users,
  FileText,
} from 'lucide-react'
import { useOrg } from '../../lib/useOrg'
import { joinOrg } from '../../lib/api'
import { cn } from '../../lib/utils'
import { isElectron } from '../../desktop/index.js'
import { electronEvents, electron } from '../../lib/electron.js'
import { useSessionStore } from '../../store/sessionStore'
import { fetchSessions } from '../../lib/supabase'
import { useTheme } from '../../lib/useTheme'
import { Sun, Moon } from 'lucide-react'

/* ── Navigation groups ─────────────────────────────────────────── */

const workspaceNav = [
  { to: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { to: '/scenarios', label: 'scenarios', icon: Swords },
  { to: '/people', label: 'organisation', icon: Users },
  { to: '/sessions', label: 'sessions', icon: History },
  { to: '/reports', label: 'reports', icon: FileText },
]

const bottomNav = [
  { to: '/settings', label: 'settings', icon: SettingsIcon },
]

/* ── Mood helpers ──────────────────────────────────────────────── */

function moodColor(mood) {
  if (mood <= 3) return '#A85042'
  if (mood <= 5) return '#B8935B'
  if (mood <= 7) return '#9C8F7D'
  if (mood <= 9) return '#C97C4F'
  return '#7EBF8E'
}

function moodLabel(mood) {
  if (mood <= 2) return 'hostile'
  if (mood <= 4) return 'frustrated'
  if (mood <= 6) return 'guarded'
  if (mood <= 8) return 'engaged'
  return 'impressed'
}

/* ── Sidebar ───────────────────────────────────────────────────── */

function SidebarLink({ to, label, icon: Icon, isActive }) {
  return (
    <NavLink
      to={to}
      className={({ isActive: navActive }) =>
        cn(
          'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150',
          (navActive || isActive)
            ? 'bg-accent/15 text-foreground'
            : 'text-muted hover:text-foreground hover:bg-elevated',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

function Sidebar({ collapsed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const isSessionsActive = location.pathname.startsWith('/sessions')
  const isReportsActive = location.pathname.startsWith('/report')

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 shrink-0 h-full',
        collapsed ? 'w-14' : 'w-52',
      )}
    >
      {/* App mark */}
      <div className={cn('flex items-center gap-2 px-3 pt-4 pb-2', collapsed && 'justify-center')}>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">
          S
        </div>
        {!collapsed && (
          <div className="leading-none">
            <p className="text-[13px] font-semibold text-foreground">Sentinel</p>
          </div>
        )}
      </div>

      {/* Workspace section */}
      <div className="mt-4 flex-1 px-2 min-h-0">
        {!collapsed && (
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            workspace
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {workspaceNav.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              isActive={
                (item.to === '/sessions' && isSessionsActive) ||
                (item.to === '/reports' && isReportsActive) ||
                (item.to === '/people' && location.pathname.startsWith('/people'))
              }
            />
          ))}

        </nav>
      </div>

      {/* Bottom section */}
      <div className="px-2 pb-4 mt-auto">
        {!collapsed && (
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            general
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {bottomNav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
          <button
            onClick={toggle}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150',
              'text-muted hover:text-foreground hover:bg-elevated',
            )}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <Moon className="h-4 w-4 shrink-0 opacity-70" />
            )}
            {!collapsed && <span className="truncate">{theme === 'dark' ? 'light mode' : 'dark mode'}</span>}
          </button>
        </nav>
      </div>
    </aside>
  )
}

/* ── Titlebar ──────────────────────────────────────────────────── */

function Titlebar({ setup, currentMood, sessionId }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sentinelSidebarCollapsed') === 'true' } catch { return false }
  })

  const title = sessionId && setup
    ? `sentinel · ${setup.scenario?.toLowerCase() || 'session'} · ${setup.personality?.split(' ')[0]?.toLowerCase() || ''}`
    : 'sentinel'

  const mood = sessionId ? currentMood : null
  const color = mood ? moodColor(mood) : null
  const label = mood ? moodLabel(mood) : null

  // Listen for sidebar toggle from Electron
  useEffect(() => {
    if (!isElectron()) return
    const unsub = electronEvents.onToggleSidebar(() => {
      const next = !collapsed
      setCollapsed(next)
      try { localStorage.setItem('sentinelSidebarCollapsed', String(next)) } catch {}
    })
    return unsub
  }, [collapsed])

  // Expose collapse state to parent
  useEffect(() => {
    window.__sentinelSidebarCollapsed = collapsed
    window.dispatchEvent(new Event('sentinel-sidebar-change'))
  }, [collapsed])

  const { minimizeWindow, maximizeWindow, closeWindow } = electron

  return (
    <div
      className="flex h-9 items-center border-b border-sidebar-border bg-sidebar px-4 text-muted select-none"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left spacer for macOS traffic light area */}
      <div className="w-16 shrink-0" />

      {/* Center: title + mood chip */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <span className="text-[12px] font-medium tracking-wide text-muted">{title}</span>
        {label && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Right: window controls (non-macOS) */}
      <div className="flex shrink-0 items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' }}>
        {isElectron() && (
          <>
            <button
              onClick={() => minimizeWindow()}
              className="rounded p-1 text-muted hover:bg-elevated hover:text-foreground"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="7.5" x2="9" y2="7.5" />
              </svg>
            </button>
            <button
              onClick={() => maximizeWindow()}
              className="rounded p-1 text-muted hover:bg-elevated hover:text-foreground"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2.5" y="2.5" width="7" height="7" rx="0.5" />
              </svg>
            </button>
            <button
              onClick={() => closeWindow()}
              className="rounded p-1 text-muted hover:bg-destructive/20 hover:text-destructive"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
                <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main shell ────────────────────────────────────────────────── */

export default function DesktopAppShell({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { org, loading: orgLoading, pendingInvites, reload } = useOrg()
  const [acceptingId, setAcceptingId] = useState(null)

  const { sessionId, setup, currentMood } = useSessionStore()

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sentinelSidebarCollapsed') === 'true' } catch { return false }
  })

  const pending = pendingInvites?.[0] ?? null
  const showOrgPrompt = !orgLoading && !org

  // Sync sidebar collapse from Electron toggle
  useEffect(() => {
    function onSidebarChange() {
      setCollapsed(window.__sentinelSidebarCollapsed ?? false)
    }
    window.addEventListener('sentinel-sidebar-change', onSidebarChange)
    return () => window.removeEventListener('sentinel-sidebar-change', onSidebarChange)
  }, [])

  // Electron event listeners
  useEffect(() => {
    if (!isElectron()) return
    const unsubs = [
      electronEvents.onNewSession(() => navigate('/scenarios')),
      electronEvents.onNavigateSessions(() => navigate('/sessions')),
      electronEvents.onNavigateSettings(() => navigate('/settings')),
      electronEvents.onNewSimulation(() => navigate('/scenarios')),
      electronEvents.onResumeLastSession(async () => {
        try {
          const sessions = await fetchSessions()
          if (sessions.length) {
            const sorted = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            navigate(`/interview/${sorted[0].id}`)
          } else {
            navigate('/scenarios')
          }
        } catch {
          navigate('/scenarios')
        }
      }),
      electronEvents.onToggleSidebar(() => {
        setCollapsed((c) => {
          const next = !c
          try { localStorage.setItem('sentinelSidebarCollapsed', String(next)) } catch {}
          return next
        })
      }),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [navigate])

  async function handleAcceptInvite() {
    if (!pending || acceptingId) return
    setAcceptingId(pending.org.id)
    try {
      await joinOrg(pending.org.id)
      await reload()
    } catch (err) {
      console.error(err)
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Titlebar */}
      <Titlebar setup={setup} currentMood={currentMood} sessionId={sessionId} />

      {/* Body: sidebar + content */}
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Org prompt */}
          {showOrgPrompt && (
            <div className="mx-6 mt-6 flex items-center justify-between gap-4 rounded-xl border border-accent/30 bg-accent/[0.06] px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {pending ? `You've been invited to ${pending.org.name}` : "You're not part of a team yet"}
                </p>
                <p className="truncate text-xs text-muted">
                  {pending
                    ? 'Accept the invitation to unlock team features.'
                    : 'Create an organization or join one to unlock team features.'}
                </p>
              </div>
              {pending ? (
                <button
                  onClick={handleAcceptInvite}
                  disabled={acceptingId !== null}
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-light"
                >
                  {acceptingId ? 'Accepting…' : 'Accept invite'}
                </button>
              ) : (
                <NavLink
                  to="/people"
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-light"
                >
                  Get started
                </NavLink>
              )}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}
