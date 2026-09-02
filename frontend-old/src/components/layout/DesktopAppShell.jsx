import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  LineChart,
  Swords,
  Settings as SettingsIcon,
  LogOut,
  Swords as SwordsIcon,
  Users,
  Menu,
  SquarePen,
  ClipboardList,
  Bell,
  HelpCircle,
  Calendar,
  } from 'lucide-react'
import { supabase, signOut } from '../../lib/supabase'
import { useOrg } from '../../lib/useOrg'
import { joinOrg } from '../../lib/api'
import { cn } from '../../lib/utils'
import { isElectron, shortcutManager } from '../../desktop/index.js'

const baseNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sessions', label: 'Sessions', icon: History },
  { to: '/insights', label: 'Insights', icon: LineChart },
  { to: '/scenarios', label: 'Scenarios', icon: Swords },
  { to: '/people', label: 'Organisation', icon: Users },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

function currentStreakDays(dates) {
  if (!dates || dates.length === 0) return 0
  const days = dates
    .map((d) => {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
    .filter(Boolean)
  if (days.length === 0) return 0
  const unique = [...new Set(days)].sort((a, b) => b - a)
  let streak = 1
  const day = 86400000
  for (let i = 1; i < unique.length; i++) {
    if (unique[i - 1] - unique[i] === day) streak += 1
    else break
  }
  return streak
}

function useShellData() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [streak, setStreak] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      const meta = data?.user?.user_metadata ?? {}
      const first = meta.first_name || ''
      const last = meta.last_name || ''
      setName([first, last].filter(Boolean).join(' ') || 'Candidate')
      setEmail(data?.user?.email || '')
    })

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data?.user) return
      const { data: rows } = await supabase
        .from('sessions')
        .select('created_at')
        .eq('user_id', data.user.id)
      if (cancelled) return
      setStreak(currentStreakDays((rows ?? []).map((r) => r.created_at)))
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { name, email, streak }
}

export default function DesktopAppShell({ children, className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { name, email, streak } = useShellData()
  const { org, loading: orgLoading, pendingInvites, reload } = useOrg()
  const [acceptingId, setAcceptingId] = useState(null)
  const initial = name.trim().charAt(0).toUpperCase() || 'S'
  const isDesktop = window.innerWidth >= 1200

  const nav = baseNav

  const showOrgPrompt = !orgLoading && !org
  const pending = pendingInvites?.[0]

  // Initialize desktop features on mount
  useEffect(() => {
    if (isElectron()) {
      // Enable desktop-specific shortcuts based on current route
      shortcutManager.enableEditingShortcuts()
      shortcutManager.enableSessionControlShortcuts()
    }
  }, [location.pathname])

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

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  // Enhanced desktop layout with three-pane view for certain routes
  const isThreePaneView = location.pathname.startsWith('/sessions') ||
                         location.pathname.startsWith('/insights') ||
                         location.pathname.startsWith('/report/');

  return (
    <div className={cn('sentinel-noise relative min-h-screen bg-background text-foreground', className)}>
      <div className="relative z-10 flex w-full flex-col md:flex-row">
        {/* ── Enhanced Sidebar (desktop) ── */}
        <aside className={cn(
          'hidden shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur md:sticky md:top-0 md:flex md:h-screen',
          isDesktop ? 'md:w-72' : 'md:w-60',
          'md:px-4 md:py-5'
        )}>
          <NavLink to="/dashboard" className="flex items-center gap-2 px-2 py-1">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
              S
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Sentinel</p>
              <p className="text-[11px] text-dim">AI Workplace Simulator</p>
            </div>
          </NavLink>

          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground',
                    isActive && 'bg-elevated text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}

            {/* Desktop-only additional nav items */}
            {isDesktop && (
              <>
                <NavLink
                  to="/people"
                  key="/people-desktop"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground',
                      isActive && 'bg-elevated text-foreground',
                    )
                  }
                >
                  <Users className="h-4 w-4" />
                  Organisation
                </NavLink>

                <NavLink
                  to="/settings"
                  key="/settings-desktop"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground',
                      isActive && 'bg-elevated text-foreground',
                    )
                  }
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </NavLink>
              </>
            )}
          </nav>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-elevated p-4">
              <p className="text-xs text-muted-foreground">Practice streak</p>
              <p className="mt-1 font-mono text-xl font-bold">
                {streak === null ? '—' : `${streak} ${streak === 1 ? 'day' : 'days'}`}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-elevated p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {initial}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="truncate text-[11px] text-dim">{email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Mobile header ── */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                <SwordsIcon className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-semibold">Sentinel</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="rounded-lg border border-border p-1.5 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Enhanced Main Content Area ── */}
        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          {/* Enhanced header for desktop */}
          {isDesktop && !location.pathname.startsWith('/auth') && !location.pathname === '/' && (
            <div className="mb-6 flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">
                  {/* Dynamic page title based on route */}
                  {location.pathname === '/dashboard' && 'Overview'}
                  {location.pathname === '/sessions' && 'Simulation Sessions'}
                  {location.pathname === '/insights' && 'Analytics & Insights'}
                  {location.pathname === '/scenarios' && 'Scenario Library'}
                  {location.pathname === '/people' && 'Team Management'}
                  {location.pathname === '/settings' && 'Application Settings'}
                  {location.pathname.startsWith('/interview/') && 'Simulation Interview'}
                  {location.pathname.startsWith('/report/') && 'Session Report'}
                </h1>
                {/* Desktop-only badges/info */}
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="whitespace-nowrap">
                      {/* Today's date or session info */}
                      {/* Dynamic based on current view */}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="h-4 w-4" />
                    {/* Notification indicator */}
                  </span>
                </div>
              </div>

              {/* Desktop-only actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Toggle sidebar on desktop
                    const sidebar = document.querySelector('aside[class*="hidden shrink-0"]')
                    if (sidebar) {
                      sidebar.classList.toggle('hidden')
                    }
                  }}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"
                  title="Toggle Sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>

                {location.pathname === '/sessions' && (
                  <button
                    onClick={() => navigate('/sessions/new')}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-light"
                  >
                    <SquarePen className="h-4 w-4" /> New Session
                  </button>
                )}

                {location.pathname === '/insights' && (
                  <button
                    onClick={() => {
                      // Export insights/analytics
                      console.log('Export insights')
                    }}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"
                    title="Export Insights"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {showOrgPrompt && (
            <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">
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
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-light"
                >
                  {acceptingId !== null ? 'Accepting…' : 'Accept invite'}
                </button>
              ) : (
                <NavLink
                  to="/people"
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-light"
                >
                  Get started
                </NavLink>
              )}
            </div>
          )}
          {children}

          {/* Enhanced footer for desktop */}
          {isDesktop && (
            <div className="mt-12 pt-8 border-t border-border text-xs text-muted flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Version 0.0.0 • Desktop Edition</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    // Open log viewer or debug info
                    console.log('Opening debug info')
                  }}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
                  title="Developer Tools"
                >
                  <SquarePen className="h-3 w-3" />
                </button>

                <button
                  onClick={() => {
                    // Check for updates
                    console.log('Checking for updates')
                  }}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
                  title="Check for Updates"
                >
                  <Bell className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}