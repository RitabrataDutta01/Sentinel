import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchSessions, aggregateAnalytics } from '../lib/supabase'
import { moodColor } from '../lib/mood'
import PageHero from '../components/layout/PageHero'
import StatTile from '../components/ui/StatTile'

function AreaChart({ points }) {
  if (points.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border px-5 py-10 text-center text-sm text-dim">
        No mood history yet.
      </div>
    )
  }

  const w = 600
  const h = 160
  const pad = 20
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const yFor = (m) => h - pad - ((m - 1) / 9) * (h - pad * 2)
  const coords = points.map((p, i) => [pad + i * step, yFor(p.endMood)])
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface px-5 py-6">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
        {[2, 4, 6, 8, 10].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={yFor(g)}
            y2={yFor(g)}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill={moodColor(points[i].endMood)} stroke="var(--surface)" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-dim font-mono">
        <span>First session</span>
        <span>Most recent</span>
      </div>
    </div>
  )
}

function InsightsContent({ analytics, maxSkill }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatTile label="Sessions" value={analytics.sessionsCompleted} tone="accent" />
        <StatTile label="Avg score" value={analytics.averageScore} sub="/100" tone="neutral" />
        <StatTile label="Best score" value={analytics.bestScore} sub="/100" tone="warm" accentValue />
        <StatTile label="Time practiced" value={analytics.totalMinutes} sub="minutes" tone="cold" />
      </div>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-3">Mood trend over sessions</h2>
        <AreaChart points={analytics.moodTrend} />
        <p className="text-xs text-dim mt-2">
          A rising line means your counterparts end warmer and more impressed than they started.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-3">Skill breakdown</h2>
        {analytics.skillBreakdown.length ? (
          <div className="rounded-[var(--radius)] border border-border bg-surface p-6 flex flex-col gap-5">
            {analytics.skillBreakdown.map((s, i) => (
              <div key={s.skill}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-primary">{s.skill}</span>
                  <span className="text-xs font-mono text-muted tabular-nums">{s.score}/100</span>
                </div>
                <div className="h-2.5 rounded-[var(--radius)] bg-background overflow-hidden">
                  <motion.div
                    className={`h-full rounded-[var(--radius)] ${s.score === maxSkill ? 'bg-mood-warm' : 'bg-accent'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dim italic">Skill data appears after your first evaluation.</p>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-[var(--radius)] border border-border bg-surface p-6">
          <h2 className="text-sm font-medium text-mood-warm mb-4 uppercase tracking-wider">
            ✓ Signature strengths
          </h2>
          {analytics.recurringStrengths.length ? (
            <ul className="flex flex-col gap-3">
              {analytics.recurringStrengths.slice(0, 5).map((s) => (
                <li key={s.note} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-mood-warm mt-0.5">•</span>
                  <span>{s.note}</span>
                  {s.count > 1 && <span className="text-xs text-dim ml-auto shrink-0">×{s.count}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-dim italic">No recurring strengths yet.</p>
          )}
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-surface p-6">
          <h2 className="text-sm font-medium text-mood-cold mb-4 uppercase tracking-wider">
            ⚠ Recurring feedback
          </h2>
          {analytics.recurringWeaknesses.length ? (
            <ul className="flex flex-col gap-3">
              {analytics.recurringWeaknesses.slice(0, 5).map((s) => (
                <li key={s.note} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-mood-cold mt-0.5">•</span>
                  <span>{s.note}</span>
                  {s.count > 1 && <span className="text-xs text-dim ml-auto shrink-0">×{s.count}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-dim italic">No recurring weaknesses yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default function Insights() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchSessions()
      .then((sessions) => !cancelled && setAnalytics(aggregateAnalytics(sessions)))
      .catch((err) => !cancelled && setError(err.message || 'Could not load insights.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const maxSkill = analytics?.skillBreakdown?.length
    ? Math.max(...analytics.skillBreakdown.map((s) => s.score))
    : 100

  if (loading) {
    return (
      <div className="px-6 py-12">
        <PageHero
          eyebrow="Insights"
          title="Your growth signal"
          subtitle="Crunching the numbers…"
        />
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Crunching the numbers…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <PageHero
          eyebrow="Insights"
          title="Your growth signal"
          subtitle="Error loading insights"
        />
        <div className="mb-8 rounded-[var(--radius)] border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
          {error}
        </div>
      </div>
    )
  }

  if (!analytics || analytics.sessionsCompleted === 0) {
    return (
      <div className="px-6 py-12">
        <PageHero
          eyebrow="Insights"
          title="Your growth signal"
          subtitle="Run a few sessions and your trends will show up here."
        />
        <div className="rounded-[var(--radius)] border border-dashed border-border px-5 py-12 text-center">
          <p className="text-sm text-muted">Run a few sessions and your trends will show up here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-12">
      <PageHero
        eyebrow="Insights"
        title="Your growth signal"
        subtitle="Aggregated across every session — score, mood trajectory, and the patterns your interviewers keep noticing."
      />

      {error && (
        <div className="mb-8 rounded-[var(--radius)] border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
          {error}
        </div>
      )}

      <InsightsContent analytics={analytics} maxSkill={maxSkill} />
    </div>
  )
}
