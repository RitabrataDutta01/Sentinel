import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  LineChart,
  Swords,
  Settings as SettingsIcon,
  LogOut,
  Swords as SwordsIcon,
  Users,
} from 'lucide-react'
import { supabase, signOut } from '../../lib/supabase'
import { useOrg } from '../../lib/useOrg'
import { joinOrg } from '../../lib/api'
import { cn } from '../../lib/utils'

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

export default function AppShell({ children, className = '' }) {
  const navigate = useNavigate()
  const { name, email, streak } = useShellData()
  const { org, loading: orgLoading, pendingInvites, reload } = useOrg()
  const [acceptingId, setAcceptingId] = useState(null)
  const initial = name.trim().charAt(0).toUpperCase() || 'S'

  const nav = baseNav

  const showOrgPrompt = !orgLoading && !org
  const pending = pendingInvites?.[0]

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

  return (
    <div className={cn('sentinel-noise relative min-h-screen bg-background text-foreground', className)}>
      <div className="relative z-10 flex w-full flex-col md:flex-row">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:w-60 md:px-4 md:py-5">
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

        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12">
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
        </main>
      </div>
    </div>
  )
}
