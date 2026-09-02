import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchSessions, reportOf, sessionScore, sessionMinutes, endMoodOf } from '../lib/supabase'
import { moodColor } from '../lib/mood'
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

function SessionItem({ session, expanded, setExpanded, isFirst }) {
  const rep = reportOf(session)
  const score = sessionScore(session)
  const minutes = sessionMinutes(session)
  const isOpen = expanded === session.id

  return (
    <motion.div
      key={session.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.04 }}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer ${
          !isFirst ? 'border-t border-border' : ''
        } ${isOpen ? 'bg-accent/5' : 'hover:bg-elevated'}`}
        onClick={() => setExpanded(isOpen ? null : session.id)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-accent/15 shrink-0">
            <span className="text-sm font-semibold text-accent">
              {session.scenario?.charAt(0).toUpperCase() ?? 'S'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{session.scenario}</p>
            <p className="text-xs text-muted truncate">
              {session.context || 'No context'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted shrink-0">
          {rep ? (
            <>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: moodColor(endMoodOf(session)) }} />
                <MoodShift session={session} />
              </span>
              <span className={`inline-flex items-center rounded-[var(--radius)] border px-2 py-0.5 text-[11px] font-semibold ${verdictStyle(rep?.verdict, rep)}`}>
                {rep?.verdict ?? 'Pending'}
              </span>
              {score != null && (
                <span className="flex items-center gap-1 font-mono tabular-nums text-primary">
                  {score}/100
                </span>
              )}
              {minutes != null && (
                <span className="flex items-center gap-1 font-mono tabular-nums text-muted">
                  {minutes}m
                </span>
              )}
            </>
          ) : (
            <span className="italic text-muted">In progress</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && rep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-surface/50"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted mb-1">Personality</p>
                <p className="text-primary">{session.personality || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted mb-1">Brutal mode</p>
                <p className="text-primary">{session.brutal_mode ? 'On' : 'Off'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-muted mb-2">Executive summary</p>
                <p className="text-primary">{rep.executive_summary || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-muted mb-2">Strengths</p>
                <ul className="flex flex-col gap-1 text-primary">
                  {rep.strengths?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-mood-warm">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-muted mb-2">Weaknesses</p>
                <ul className="flex flex-col gap-1 text-primary">
                  {rep.critical_weaknesses?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-mood-cold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-4 pb-4 flex justify-end">
              <Link
                to={`/report/${session.id}`}
                className="inline-block text-sm font-semibold text-accent hover:opacity-80 transition-opacity"
              >
                View full report →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SessionList({ sessions, expanded, setExpanded }) {
  const reverse = useMemo(() => [...sessions].reverse(), [sessions])

  return (
    <div className="flex flex-col border border-border rounded-[var(--radius)] bg-surface">
      <AnimatePresence>
        {reverse.map((s, i) => (
          <SessionItem
            key={s.id}
            session={s}
            expanded={expanded}
            setExpanded={setExpanded}
            isFirst={i === 0}
          />
        ))}
      </AnimatePresence>
    </div>
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

  const bestScore = useMemo(() => {
    const scores = sessions.map(sessionScore).filter((s) => s != null)
    return scores.length ? Math.max(...scores) : null
  }, [sessions])

  if (loading) {
    return (
      <div className="px-6 py-12">
        <PageHero
          eyebrow="Session history"
          title="Your sessions"
          subtitle="Loading sessions…"
        />
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Loading sessions…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <PageHero
          eyebrow="Session history"
          title="Your sessions"
          subtitle="Error loading sessions"
        />
        <div className="mb-6 rounded-[var(--radius)] border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-12">
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
            className="rounded-[var(--radius)] border border-border bg-elevated px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
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

      {sessions.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border px-5 py-12 text-center">
          <p className="text-sm text-muted mb-4">No completed sessions yet.</p>
          <Link
            to="/scenarios"
            className="inline-block px-5 py-2.5 rounded-[var(--radius)] bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Start a scenario
          </Link>
        </div>
      ) : (
        <SessionList sessions={filtered} expanded={expanded} setExpanded={setExpanded} />
      )}
    </div>
  )
}
