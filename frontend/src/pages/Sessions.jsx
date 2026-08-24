import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchSessions, reportOf, sessionScore, sessionMinutes, endMoodOf } from '../lib/supabase'
import { moodColor } from '../lib/mood'
import PageShell from '../components/layout/PageShell'
import PageHero from '../components/layout/PageHero'
import StatTile from '../components/ui/StatTile'
import { verdictStyle, verdictCssColor } from '../lib/verdict'

function MoodShift({ session }) {
  const start = 5
  const end = endMoodOf(session)
  const delta = end - start
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const arrow = dir === 'up' ? '↗' : dir === 'down' ? '↘' : '→'
  const color = dir === 'up' ? 'text-mood-warm' : dir === 'down' ? 'text-mood-cold' : 'text-dim'
  return (
    <span className={`text-xs font-mono tabular-nums ${color}`} title={`Mood ${start} → ${end}/10`}>
      {arrow} {Math.abs(delta)} · {end}/10
    </span>
  )
}

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    fetchSessions()
      .then((rows) => !cancelled && setSessions(rows))
      .catch((err) => !cancelled && setError(err.message || 'Could not load sessions.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const scenarioOptions = useMemo(() => {
    const set = new Set(sessions.map((s) => s.scenario).filter(Boolean))
    return [...set].sort()
  }, [sessions])

  const filtered = useMemo(() => {
    if (filter === 'all') return sessions
    return sessions.filter((s) => s.scenario === filter)
  }, [sessions, filter])

  const reverse = useMemo(() => [...filtered].reverse(), [filtered])

  const bestScore = useMemo(() => {
    const scores = sessions.map(sessionScore).filter((s) => s != null)
    return scores.length ? Math.max(...scores) : null
  }, [sessions])

  return (
    <PageShell className="px-6 py-12">
      <div className="w-full">
        <PageHero
          eyebrow="Session history"
          title="Your sessions"
          subtitle={
            sessions.length > 0
              ? `${sessions.length} completed run${sessions.length > 1 ? 's' : ''} across ${scenarioOptions.length} scenario${scenarioOptions.length !== 1 ? 's' : ''}.`
              : 'No sessions yet — start your first scenario.'
          }
        >
          {scenarioOptions.length > 1 && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option value="all">All scenarios</option>
              {scenarioOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </PageHero>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <StatTile label="Completed runs" value={sessions.length} tone="accent" />
          <StatTile label="Scenarios" value={scenarioOptions.length} tone="neutral" />
          <StatTile
            label="Best score"
            value={bestScore ?? '—'}
            tone="warm"
            accentValue={bestScore != null}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Loading sessions…
          </div>
        ) : reverse.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
            <p className="text-sm text-muted mb-4">No completed sessions yet.</p>
            <Link
              to="/scenarios"
              className="inline-block px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
            >
              Start a scenario
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reverse.map((s, i) => {
              const rep = reportOf(s)
              const score = sessionScore(s)
              const minutes = sessionMinutes(s)
              const isOpen = expanded === s.id
              const verdictColor = verdictCssColor(rep?.verdict, rep)
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.04 * i }}
                  className={`relative overflow-hidden rounded-2xl border bg-surface transition-colors ${
                    isOpen ? 'border-accent/50' : 'border-border hover:border-border-light'
                  }`}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: verdictColor }}
                  />
                  <button
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    className="w-full text-left px-5 pl-8 py-4"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {s.scenario}
                        </p>
                        <p className="text-xs text-dim mt-0.5">
                          {new Date(s.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {minutes ? ` · ${minutes}m` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <MoodShift session={s} />
                        {score != null && (
                          <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: moodColor(Math.max(1, Math.min(10, 1 + score / 12))) }}>
                            {score}
                          </span>
                        )}
                        {rep?.verdict && (
                          <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wide ${verdictStyle(rep.verdict, rep)}`}>
                            {rep.verdict}
                          </span>
                        )}
                        <span className={`text-xs text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-border/60 pl-8">
                          {rep?.executive_summary && (
                            <p className="text-sm text-muted leading-relaxed mb-4 max-w-prose">{rep.executive_summary}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-mood-warm mb-2">
                                Strengths
                              </p>
                              {rep?.strengths?.length ? (
                                <ul className="flex flex-col gap-1.5">
                                  {rep.strengths.map((item, i) => (
                                    <li key={i} className="text-sm text-muted flex items-start gap-2">
                                      <span className="text-mood-warm mt-0.5">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-dim italic">None noted.</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-mood-cold mb-2">
                                Weaknesses
                              </p>
                              {rep?.critical_weaknesses?.length ? (
                                <ul className="flex flex-col gap-1.5">
                                  {rep.critical_weaknesses.map((item, i) => (
                                    <li key={i} className="text-sm text-muted flex items-start gap-2">
                                      <span className="text-mood-cold mt-0.5">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-dim italic">None noted.</p>
                              )}
                            </div>
                          </div>

                          <Link
                            to={`/report/${s.id}`}
                            className="inline-block text-sm font-semibold text-accent hover:text-accent-light transition-colors"
                          >
                            View full report →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
