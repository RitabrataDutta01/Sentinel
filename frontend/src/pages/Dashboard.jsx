import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchSessions, aggregateAnalytics, getProfile, reportOf, endMoodOf } from '../lib/supabase'
import { moodColor } from '../lib/mood'
import PageShell from '../components/layout/PageShell'
import ScoreRing from '../components/ui/ScoreRing'
import { verdictCssColor } from '../lib/verdict'

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">
      {children}
    </p>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function verdictColor(verdict, report) {
  return verdictCssColor(verdict, report)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function currentStreak(sessions) {
  const days = new Set(
    sessions
      .map((s) => s.created_at)
      .filter(Boolean)
      .map((iso) => new Date(iso).toDateString())
  )
  if (days.size === 0) return 0
  const dayInMs = 86400000
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!days.has(todayStart.toDateString())) {
    todayStart.setTime(todayStart.getTime() - dayInMs)
    if (!days.has(todayStart.toDateString())) return 0
  }
  let streak = 0
  const cursor = new Date(todayStart)
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setTime(cursor.getTime() - dayInMs)
  }
  return streak
}

function AreaChart({ points }) {
  const w = 600
  const h = 160
  const pad = 20
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const yFor = (m) => h - pad - ((m - 1) / 9) * (h - pad * 2)
  const coords = points.map((p, i) => [pad + i * step, yFor(p.endMood)])
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const area = `${line} L${coords[coords.length - 1][0]},${h - pad} L${coords[0][0]},${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 200 }}>
      <defs>
        <linearGradient id="dashMoodArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[2, 4, 6, 8, 10].map((g) => (
        <line
          key={g}
          x1={pad}
          x2={w - pad}
          y1={yFor(g)}
          y2={yFor(g)}
          stroke="var(--color-border-light)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}
      <path d={area} fill="url(#dashMoodArea)" />
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="4"
          fill={moodColor(points[i].endMood)}
          stroke="var(--color-surface)"
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.05 }}
        />
      ))}
    </svg>
  )
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const analytics = useMemo(() => aggregateAnalytics(sessions), [sessions])

  const latestSession = useMemo(() => {
    const withReports = sessions.filter((s) => reportOf(s))
    return withReports.length > 0 ? withReports[withReports.length - 1] : null
  }, [sessions])

  const streak = useMemo(() => currentStreak(sessions), [sessions])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSessions(), getProfile().catch(() => null)])
      .then(([rows, profile]) => {
        if (cancelled) return
        setSessions(rows)
        setFirstName(profile?.first_name ?? '')
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load your progress.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const moodData = useMemo(() => {
    return analytics.moodTrend.map((p) => ({
      endMood: p.endMood,
      date: p.date ? formatDate(p.date) : '',
    }))
  }, [analytics])

  const history = useMemo(() => [...sessions].reverse(), [sessions])

  const latestSkills = useMemo(() => {
    const skills = reportOf(latestSession)?.skills
    if (!skills || typeof skills !== 'object') return []
    return Object.entries(skills)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, score]) => ({ name, score }))
  }, [latestSession])

  return (
    <PageShell className="px-6 py-14">
      <div className="w-full">
        {/* ── Hero band ── */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-7 py-8 mb-8">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--color-accent-dim) 0%, transparent 65%)', opacity: 0.28 }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Eyebrow>Sentinel</Eyebrow>
              <h1 className="text-3xl font-semibold tracking-tight">
                {greeting()}{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="text-sm text-muted mt-2">
                {analytics.sessionsCompleted > 0
                  ? `${analytics.sessionsCompleted} sessions · Best ${analytics.bestScore ?? '—'}/100 · ${analytics.mostPracticedType || 'keep going'}`
                  : 'Pick a scenario and start your first practice session.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 border border-border"
                  style={{ background: 'var(--color-mood-warm)10', borderColor: 'var(--color-mood-warm)35' }}
                >
                  <span className="text-sm">🔥</span>
                  <span className="text-sm font-semibold font-mono text-primary">{streak}</span>
                  <span className="text-xs text-muted">{streak === 1 ? 'day streak' : 'days streak'}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/scenarios')}
                className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors shadow-[0_0_24px_-6px_var(--color-accent)]"
              >
                New session
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Loading your progress…
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show">
            {/* ── Stat tiles ── */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)', opacity: 0.14 }}
                />
                <p className="text-xs text-muted mb-1.5">📊 Sessions</p>
                <p className="text-xl font-semibold font-mono">{analytics.sessionsCompleted || '—'}</p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, var(--color-mood-warm) 0%, transparent 70%)', opacity: 0.14 }}
                />
                <p className="text-xs text-muted mb-1.5">🎯 Avg score</p>
                <p className="text-xl font-semibold font-mono">
                  {analytics.averageScore != null ? analytics.averageScore : '—'}
                  {analytics.averageScore != null && <span className="text-sm text-dim">/100</span>}
                </p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, var(--color-mood-neutral) 0%, transparent 70%)', opacity: 0.14 }}
                />
                <p className="text-xs text-muted mb-1.5">⏱ Time practiced</p>
                <p className="text-xl font-semibold font-mono">
                  {analytics.totalMinutes > 0 ? analytics.totalMinutes : '—'}
                  {analytics.totalMinutes > 0 && <span className="text-sm text-dim">m</span>}
                </p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors">
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, var(--color-mood-cold) 0%, transparent 70%)', opacity: 0.14 }}
                />
                <p className="text-xs text-muted mb-1.5">🏆 Best score</p>
                <p className="text-xl font-semibold font-mono">
                  {analytics.bestScore != null ? analytics.bestScore : '—'}
                  {analytics.bestScore != null && <span className="text-sm text-dim">/100</span>}
                </p>
              </div>
            </motion.div>

            {/* ── Latest report hero ── */}
            {latestSession && (
              <motion.div variants={item}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-7 mb-8">
                  <div
                    className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, var(--color-accent-dim) 0%, transparent 65%)', opacity: 0.22 }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wider mb-1">Latest report</p>
                        <h2 className="text-lg font-semibold tracking-tight">{latestSession.scenario}</h2>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{
                          background: `${verdictColor(reportOf(latestSession).verdict, reportOf(latestSession))}15`,
                          color: verdictColor(reportOf(latestSession).verdict, reportOf(latestSession)),
                        }}
                      >
                        {reportOf(latestSession).verdict ?? '—'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <ScoreRing score={reportOf(latestSession).overall_score ?? 0} size={170} />
                      <div className="flex-1 w-full">
                        <p className="text-xs text-dim font-semibold uppercase tracking-wider mb-3">Top skills</p>
                        {latestSkills.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {latestSkills.map((s, i) => (
                              <div key={s.name}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-primary capitalize">{s.name}</span>
                                  <span className="text-xs font-mono text-muted tabular-nums">{s.score}/100</span>
                                </div>
                                <div className="h-2 rounded-full bg-background overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: 'var(--color-accent)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${s.score}%` }}
                                    transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-dim">—</p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {(reportOf(latestSession).strengths ?? []).slice(0, 3).map((s, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--color-mood-warm)15', color: 'var(--color-mood-warm)' }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {reportOf(latestSession).executive_summary && (
                      <details className="group mt-6">
                        <summary className="text-xs text-muted cursor-pointer hover:text-primary transition-colors select-none">
                          Executive summary
                        </summary>
                        <p className="mt-2 text-sm text-primary leading-relaxed">{reportOf(latestSession).executive_summary}</p>
                      </details>
                    )}

                    <div className="mt-6 pt-4 border-t border-border/60 flex justify-between items-center">
                      <span className="text-xs text-dim">End mood {endMoodOf(latestSession)}/10</span>
                      <button
                        onClick={() => navigate(`/report/${latestSession.id}`)}
                        className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
                      >
                        View full report →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Mood trend ── */}
            <motion.div variants={item} className="mb-10">
              <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wider">Mood improvement trend</h2>
              {moodData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-dim">
                  Your mood trend will show up here after your first session.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface px-5 py-5">
                  <AreaChart points={moodData} />
                  <div className="flex justify-between mt-2 text-xs text-dim font-mono">
                    <span>First session</span>
                    <span>Most recent</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Session history ── */}
            <motion.div variants={item}>
              <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wider">Session history</h2>
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
                  <p className="text-sm text-muted mb-4">
                    You haven't completed a session yet.
                  </p>
                  <button
                    onClick={() => navigate('/scenarios')}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
                  >
                    Start your first session
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((session) => {
                    const report = reportOf(session)
                    const score = report?.overall_score
                    const verdict = report?.verdict
                    return (
                      <button
                        key={session.id}
                        onClick={() => navigate(`/report/${session.id}`)}
                        className="text-left px-4 py-3 rounded-lg border border-border bg-surface hover:border-border-light hover:ring-1 hover:ring-border-light transition-all flex items-center justify-between gap-4"
                        style={{ borderLeftColor: verdict ? verdictColor(verdict, report) : 'var(--color-border)', borderLeftWidth: 3 }}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: verdict ? verdictColor(verdict, report) : 'var(--color-dim)' }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-primary truncate">{session.scenario ?? 'Session'}</p>
                            <p className="text-xs text-dim">{formatDate(session.created_at)}</p>
                          </div>
                        </div>
                        {score != null && (
                          <span className="text-sm font-semibold font-mono" style={{ color: 'var(--color-accent)' }}>
                            {score}/100
                          </span>
                        )}
                        {verdict && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0"
                            style={{
                              background: `${verdictColor(verdict, report)}15`,
                              color: verdictColor(verdict, report),
                            }}
                          >
                            {verdict}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageShell>
  )
}
