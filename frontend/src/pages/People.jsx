import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useOrg } from '../lib/useOrg'
import { verdictStyle } from '../lib/verdict'
import StatTile from '../components/ui/StatTile'
import PageHero from '../components/layout/PageHero'
import {
  createOrg,
  joinOrg,
  fetchMembers,
  inviteMember,
  updateMember,
  removeMember,
} from '../lib/api'
import { fetchMemberSessions, aggregateAnalytics, reportOf, sessionScore, sessionMinutes, endMoodOf } from '../lib/supabase'
import { moodColor } from '../lib/mood'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Building2, Check, ChevronDown, Copy, LogIn, Mail, Shield, Trash2, Users } from 'lucide-react'
import { cn } from '../lib/utils'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' },
]

const roleBadge = {
  admin: 'bg-accent/10 text-accent border-accent/30',
  hr: 'bg-mood-warm/10 text-mood-warm border-mood-warm/30',
  member: 'bg-elevated text-muted-foreground border-border-light',
}

function RoleBadge({ role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius)] border px-2 py-0.5 text-[11px] font-semibold capitalize',
        roleBadge[role] ?? roleBadge.member,
      )}
    >
      <Shield className="h-3 w-3" />
      {role ?? 'member'}
    </span>
  )
}

function MemberSessions({ sessions }) {
  const analytics = aggregateAnalytics(sessions)
  const ordered = [...sessions].reverse()

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius)] border border-border bg-elevated px-4 py-3">
          <p className="text-[11px] text-muted">Sessions</p>
          <p className="mt-0.5 text-lg font-semibold font-mono text-primary">
            {analytics.sessionsCompleted}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-elevated px-4 py-3">
          <p className="text-[11px] text-muted">Avg score</p>
          <p className="mt-0.5 text-lg font-semibold font-mono text-primary">
            {analytics.averageScore ?? '—'}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-elevated px-4 py-3">
          <p className="text-[11px] text-muted">Best score</p>
          <p className="mt-0.5 text-lg font-semibold font-mono text-primary">
            {analytics.bestScore ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        {ordered.map((s, i) => {
          const rep = reportOf(s)
          const score = sessionScore(s)
          const minutes = sessionMinutes(s)
          return (
            <div
              key={s.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-elevated transition-colors ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{s.scenario}</p>
                <p className="text-xs text-dim">
                  {new Date(s.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {minutes ? ` · ${minutes}m` : ''} · End mood {endMoodOf(s)}/10
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {score != null && (
                  <span
                    className="text-sm font-mono font-semibold tabular-nums"
                    style={{ color: moodColor(Math.max(1, Math.min(10, 1 + score / 12))) }}
                  >
                    {score}
                  </span>
                )}
                {rep?.verdict && (
                  <span
                    className={cn(
                      'inline-block rounded-[var(--radius)] border px-2.5 py-1 text-[11px] font-bold tracking-wide',
                      verdictStyle(rep.verdict, rep),
                    )}
                  >
                    {rep.verdict}
                  </span>
                )}
                <Link
                  to={`/report/${s.id}`}
                  className="shrink-0 text-sm font-semibold text-accent hover:opacity-80 transition-opacity"
                >
                  Report →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function People() {
  const { org, membership, loading, pendingInvites, isStaff, isAdmin, reload } = useOrg()

  const [tab, setTab] = useState('create')
  const [orgName, setOrgName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  const [acceptingId, setAcceptingId] = useState(null)
  const [copied, setCopied] = useState(false)

  const [expandedMember, setExpandedMember] = useState(null)
  const [memberSessions, setMemberSessions] = useState([])
  const [memberSessionsLoading, setMemberSessionsLoading] = useState(false)
  const [memberSessionsError, setMemberSessionsError] = useState(null)

  const pending = pendingInvites?.[0] ?? null

  const roleCounts = useMemo(() => {
    const counts = { admin: 0, hr: 0, member: 0 }
    for (const m of members) {
      if (counts[m.system_role] != null) counts[m.system_role] += 1
    }
    return counts
  }, [members])

  const pendingCount = useMemo(
    () => members.filter((m) => m.status === 'invited').length,
    [members],
  )
  const soloMember = members.length === 1 && isStaff

  async function toggleMember(member) {
    if (expandedMember === member.user_id) {
      setExpandedMember(null)
      setMemberSessions([])
      return
    }
    setExpandedMember(member.user_id)
    setMemberSessions([])
    setMemberSessionsError(null)
    setMemberSessionsLoading(true)
    try {
      const rows = await fetchMemberSessions(member.user_id)
      setMemberSessions(rows)
    } catch (err) {
      setMemberSessionsError(err.message || 'Could not load sessions.')
    } finally {
      setMemberSessionsLoading(false)
    }
  }

  async function handleAcceptInvite(invite) {
    if (!invite || acceptingId) return
    setAcceptingId(invite.org.id)
    try {
      await joinOrg(invite.org.id)
      toast.success(`Welcome to ${invite.org.name}!`)
      setTab('create')
      await reload()
    } catch (err) {
      toast.error(err.message || 'Could not accept invitation.')
    } finally {
      setAcceptingId(null)
    }
  }

  async function copyOrgId() {
    if (!org?.id) return
    try {
      await navigator.clipboard.writeText(org.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy the invite code.')
    }
  }

  useEffect(() => {
    if (!org?.id) return
    let cancelled = false
    setMembersLoading(true)
    setMembersError(null)
    fetchMembers(org.id)
      .then((rows) => !cancelled && setMembers(rows))
      .catch((err) => !cancelled && setMembersError(err.message || 'Could not load members.'))
      .finally(() => !cancelled && setMembersLoading(false))
    return () => {
      cancelled = true
    }
  }, [org?.id])

  async function refreshMembers() {
    if (!org?.id) return
    const rows = await fetchMembers(org.id).catch(() => null)
    if (rows) setMembers(rows)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!orgName.trim()) return
    setBusy(true)
    try {
      await createOrg(orgName.trim())
      toast.success('Organisation created')
      reload()
    } catch (err) {
      toast.error(err.message || 'Could not create organisation.')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setBusy(true)
    try {
      await joinOrg(joinCode.trim())
      toast.success('Joined organisation')
      reload()
    } catch (err) {
      toast.error(err.message || 'Could not join organisation.')
    } finally {
      setBusy(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || !org?.id) return
    setInviting(true)
    try {
      await inviteMember(org.id, inviteEmail.trim(), inviteRole)
      toast.success(`Invite sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      await refreshMembers()
    } catch (err) {
      toast.error(err.message || 'Could not send invite.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRole(memberId, role) {
    if (!org?.id) return
    try {
      await updateMember(org.id, memberId, { system_role: role })
      toast.success('Role updated')
      setMembers((rows) =>
        rows.map((m) => (m.user_id === memberId ? { ...m, system_role: role } : m)),
      )
    } catch (err) {
      toast.error(err.message || 'Could not update role.')
    }
  }

  async function handleRemove(memberId) {
    if (!org?.id) return
    try {
      await removeMember(org.id, memberId)
      toast.success('Member removed')
      setMembers((rows) => rows.filter((m) => m.user_id !== memberId))
    } catch (err) {
      toast.error(err.message || 'Could not remove member.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Loading…
        </div>
      </div>
    )
  }

  /* ── No org yet: onboarding (create / join) ───────────────────── */
  if (!org) {
    return (
      <div className="px-6 py-12">
        <div className="mx-auto max-w-md">
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface px-6 py-10 mb-8">
            <div className="relative text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[var(--radius)] bg-accent/10 text-accent">
                <Users className="h-6 w-6" />
              </span>
              <h1 className="text-3xl font-semibold tracking-tight">Your team workspace</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                You're not part of an organisation yet. Create one for your team, or join with an
                invite code.
              </p>
            </div>
          </div>

          {pending && (
            <div className="mb-6 rounded-[var(--radius)] border border-accent/40 bg-accent/10 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                Pending invitation
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius)] bg-accent/15 text-accent">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-primary">{pending.org.name}</p>
                  <p className="text-xs text-muted">
                    {pending.membership.system_role === 'hr' ? 'HR' : 'Member'} role
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleAcceptInvite(pending)}
                disabled={acceptingId !== null}
                className="mt-4 w-full"
              >
                <Check className="mr-2 h-4 w-4" />
                {acceptingId !== null ? 'Accepting…' : 'Accept invitation'}
              </Button>
            </div>
          )}

          <div className="mb-6 flex rounded-[var(--radius)] border border-border bg-surface p-1">
            {[
              { key: 'create', label: 'Create', icon: Building2 },
              { key: 'join', label: 'Join', icon: LogIn },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-semibold transition-colors',
                  tab === key
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <form
              onSubmit={handleCreate}
              className="rounded-[var(--radius)] border border-border bg-surface p-6"
            >
              <Label htmlFor="orgName">Organisation name</Label>
              <Input
                id="orgName"
                className="mt-2"
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Button type="submit" className="mt-4 w-full" disabled={busy || !orgName.trim()}>
                {busy ? 'Creating…' : 'Create organisation'}
              </Button>
              <p className="mt-3 text-center text-xs text-dim">
                You'll become the admin and can invite your team.
              </p>
            </form>
          ) : (
            <form
              onSubmit={handleJoin}
              className="rounded-[var(--radius)] border border-border bg-surface p-6"
            >
              <Label htmlFor="joinCode">Invite code</Label>
              <Input
                id="joinCode"
                className="mt-2 font-mono"
                placeholder="Organisation ID"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button type="submit" className="mt-4 w-full" disabled={busy || !joinCode.trim()}>
                {busy ? 'Joining…' : 'Join organisation'}
              </Button>
              <p className="mt-3 text-center text-xs text-dim">
                Ask your admin for the invite code.
              </p>
            </form>
          )}
        </div>
      </div>
    )
  }

  /* ── Org present: roster + invites ────────────────────────────── */
  const yourUserId = membership?.user_id

  return (
    <div className="px-6 py-12">
      <div className="w-full">
        <PageHero
          eyebrow="Organisation"
          title={org.name}
          subtitle={`${members.length} member${members.length === 1 ? '' : 's'} · ${
            membership?.system_role === 'admin'
              ? 'You are the admin'
              : membership?.system_role === 'hr'
                ? 'You are HR staff'
                : 'Member'
          }`}
        >
          {isStaff && (
            <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-elevated px-3 py-2">
              <p className="text-xs text-muted">Invite code</p>
              <code className="font-mono text-xs text-primary">{org.id}</code>
              <button
                onClick={copyOrgId}
                title="Copy invite code"
                className="text-muted-foreground transition-colors hover:text-accent"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </PageHero>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatTile label="Members" value={members.length} tone="accent" />
          <StatTile label="Admins" value={roleCounts.admin} tone="neutral" />
          <StatTile label="HR staff" value={roleCounts.hr} tone="warm" />
          <StatTile label="Pending invites" value={pendingCount} tone="cold" />
        </div>

        {isStaff && (
          <form
            onSubmit={handleInvite}
            className="mb-8 rounded-[var(--radius)] border border-border bg-surface p-6"
          >
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              Invite a member
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                <Mail className="mr-2 h-4 w-4" />
                {inviting ? 'Sending…' : 'Invite'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-dim">
              The person must already have a Sentinel account (email + password).
            </p>
          </form>
        )}

        {membersError && (
          <div className="mb-6 rounded-[var(--radius)] border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
            {membersError}
          </div>
        )}

        {membersLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Loading members…
          </div>
        ) : soloMember ? (
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface px-6 py-8">
            <h3 className="text-base font-semibold">Invite your team</h3>
            <p className="mt-1.5 text-sm text-muted max-w-md">
              You're the only member right now. Share your invite code above so HR and teammates
              can join, run scenarios, and build a shared analytics picture.
            </p>
          </div>
        ) : (
          <div className="flex flex-col border border-border rounded-[var(--radius)] bg-surface">
            {members.map((m, i) => {
              const isYou = m.user_id === yourUserId
              const displayName = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Member'
              const isOpen = expandedMember === m.user_id
              return (
                <motion.div
                  key={m.id ?? m.user_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 * i }}
                >
                  <div className={`flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-elevated ${
                    i > 0 ? 'border-t border-border' : ''
                  } ${isOpen ? 'bg-accent/5' : ''}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-elevated text-xs font-bold text-muted-foreground">
                        {(displayName.charAt(0) || '?').toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">
                          {displayName}
                          {isYou && <span className="ml-2 text-xs font-medium text-dim">(you)</span>}
                        </p>
                        {m.email && <p className="truncate text-xs text-dim">{m.email}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {m.status === 'invited' && (
                        <span className="rounded-[var(--radius)] border border-mood-neutral/30 bg-mood-neutral/10 px-2 py-0.5 text-[11px] font-semibold text-mood-neutral">
                          Invited
                        </span>
                      )}
                      {isAdmin && m.user_id !== yourUserId ? (
                        <select
                          value={m.system_role}
                          onChange={(e) => handleRole(m.user_id, e.target.value)}
                          className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1.5 text-xs text-primary focus:outline-none focus:border-accent transition-colors"
                          title="Change role"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={m.system_role} />
                      )}
                      {isAdmin && m.user_id !== yourUserId && (
                        <button
                          onClick={() => handleRemove(m.user_id)}
                          aria-label={`Remove ${displayName}`}
                          title="Remove member"
                          className="rounded-[var(--radius)] border border-border p-1.5 text-muted-foreground transition-colors hover:text-mood-cold"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {isStaff && (
                        <button
                          onClick={() => toggleMember(m)}
                          aria-label={`View ${displayName}'s sessions`}
                          title="View sessions"
                          className="rounded-[var(--radius)] border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-border/60 px-5 py-4">
                      {memberSessionsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          Loading sessions…
                        </div>
                      ) : memberSessionsError ? (
                        <div className="rounded-[var(--radius)] border border-mood-cold/30 bg-mood-cold/5 px-4 py-3 text-sm text-mood-cold">
                          {memberSessionsError}
                        </div>
                      ) : memberSessions.length === 0 ? (
                        <p className="text-sm text-dim">
                          No completed sessions yet — {displayName.split(' ')[0]} hasn't run a
                          scenario.
                        </p>
                      ) : (
                        <MemberSessions sessions={memberSessions} />
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
