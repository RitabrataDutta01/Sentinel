import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { evaluateSession, exportReportPdf } from '../lib/api'
import { useSessionStore } from '../store/sessionStore'
import { moodColor } from '../lib/mood'
import ScoreRing from '../components/ui/ScoreRing'
import { verdictStyle } from '../lib/verdict'

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">
      {children}
    </p>
  )
}

function MoodTimeline({ points }) {
  if (!points || points.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border px-5 py-8 text-center text-sm text-dim">
        No mood data recorded for this session.
      </div>
    )
  }

  const moods = points.map(p => (typeof p === 'object' && p !== null ? p.mood : p))

  const w = 600
  const h = 120
  const pad = 24
  const step = moods.length > 1 ? (w - pad * 2) / (moods.length - 1) : 0
  const yFor = (mood) => h - pad - ((mood - 1) / 9) * (h - pad * 2)
  const coords = moods.map((m, i) => [pad + i * step, yFor(m)])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface px-5 py-6">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--border-light)" strokeWidth="2" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill={moodColor(moods[i])} />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-dim font-mono">
        <span>Start (Mood 5)</span>
        <span>End</span>
      </div>
    </div>
  )
}

function SkillBars({ skills }) {
  if (!skills || Object.keys(skills).length === 0) return null
  const entries = Object.entries(skills)
  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-3">Skill breakdown</h2>
      <div className="rounded-[var(--radius)] border border-border bg-surface p-6 flex flex-col gap-4">
        {entries.map(([skill, value]) => (
          <div key={skill}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm capitalize text-primary">{skill}</span>
              <span className="text-xs font-mono text-muted tabular-nums">{value}/100</span>
            </div>
            <div className="h-2 rounded-[var(--radius)] bg-background overflow-hidden">
              <motion.div
                className="h-full rounded-[var(--radius)] bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Report() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const moodHistory = useSessionStore((s) => s.moodHistory)
  const storeSessionId = useSessionStore((s) => s.sessionId)
  const storeDurationSec = useSessionStore((s) => s.durationSec)

  const durationSec = storeSessionId === sessionId ? storeDurationSec : null

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    evaluateSession(sessionId, durationSec)
      .then((data) => !cancelled && setReport(data))
      .catch((err) => !cancelled && setError(err.message || 'Could not load the report.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [sessionId, durationSec])

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await exportReportPdf(sessionId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentinel-report-${sessionId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'PDF export failed.')
    } finally {
      setExporting(false)
    }
  }

  const timelinePoints = report?.mood_timeline ?? moodHistory

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Evaluating session performance…
        </div>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Report unavailable</h1>
          <p className="text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-[var(--radius)] bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-14">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* Hero */}
        <div className="rounded-[var(--radius)] border border-border bg-surface px-7 py-8 mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Eyebrow>Evaluation report</Eyebrow>
              <h1 className="text-2xl font-semibold tracking-tight">Performance summary</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 rounded-[var(--radius)] border border-border text-sm text-muted hover:border-border-light hover:text-primary transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2.5 rounded-[var(--radius)] bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {exporting ? 'Exporting PDF…' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Score, Confidence & Verdict Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-[var(--radius)] border border-border bg-surface p-6 flex flex-col items-center justify-center gap-2">
            <span className="text-xs text-muted uppercase tracking-wider">Overall score</span>
            <ScoreRing score={report?.overall_score ?? 0} size={120} />
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-surface p-6 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-muted uppercase tracking-wider mb-1">Confidence</span>
            <span className="text-4xl font-bold tracking-tight text-primary">
              {report?.confidence_score ?? '—'}<span className="text-lg text-dim">/100</span>
            </span>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-surface p-6 flex flex-col justify-center">
            <span className="text-xs text-muted uppercase tracking-wider mb-2">Final verdict</span>
            <div>
              {/* Verdict text uses Source Serif 4 (font-serif) */}
              <span className={`inline-block px-3 py-1.5 rounded-[var(--radius)] border text-sm font-bold tracking-wide font-serif ${verdictStyle(report?.verdict, report)}`}>
                {report?.verdict ?? 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {report?.executive_summary && (
          <section className="mb-10 rounded-[var(--radius)] border border-border bg-surface p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-2">Executive summary</h2>
            <p className="text-sm text-primary leading-relaxed max-w-prose">{report.executive_summary}</p>
          </section>
        )}

        {/* Skill Breakdown */}
        <SkillBars skills={report?.skills} />

        {/* Mood Timeline */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-3">Mood timeline (1–10)</h2>
          <MoodTimeline points={timelinePoints} />
        </section>

        {/* Flagged Weak Moments — bordered rows with left accent bar */}
        {report?.weak_moments && report.weak_moments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-3">Flagged weak moments</h2>
            <div className="flex flex-col border border-border rounded-[var(--radius)] bg-surface">
              {report.weak_moments.map((m, i) => (
                <div key={i} className={`p-5 ${i > 0 ? 'border-t border-border' : ''} border-l-2 border-l-mood-cold`}>
                  <p className="text-xs text-dim font-semibold uppercase tracking-wider mb-2">Turn {m.turn_index} — {m.issue}</p>
                  <div className="mb-3 p-3 rounded-[var(--radius)] bg-mood-cold/5 border border-mood-cold/20">
                    <p className="text-xs text-mood-cold font-semibold mb-1">You said:</p>
                    <p className="text-sm text-primary">{m.user_answer}</p>
                  </div>
                  <div className="p-3 rounded-[var(--radius)] bg-mood-warm/5 border border-mood-warm/20">
                    <p className="text-xs text-mood-warm font-semibold mb-1">Ideal rewrite:</p>
                    <p className="text-sm text-primary">{m.ideal_rewrite}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ideal Answer Rewrites */}
        {report?.ideal_rewrites && report.ideal_rewrites.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-3">Ideal answer rewrites</h2>
            <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
              <ol className="flex flex-col gap-3 list-decimal pl-5">
                {report.ideal_rewrites.map((r, i) => (
                  <li key={i} className="text-sm text-primary leading-relaxed pl-1">{r}</li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Strengths & Weaknesses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <section className="rounded-[var(--radius)] border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-mood-warm mb-3 uppercase tracking-wider flex items-center gap-2">
              <span>✓</span> Strengths
            </h2>
            {report?.strengths && report.strengths.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {report.strengths.map((item, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-2">
                    <span className="text-mood-warm mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dim italic">No standout strengths noted.</p>
            )}
          </section>

          <section className="rounded-[var(--radius)] border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-mood-cold mb-3 uppercase tracking-wider flex items-center gap-2">
              <span>⚠</span> Critical weaknesses
            </h2>
            {report?.critical_weaknesses && report.critical_weaknesses.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {report.critical_weaknesses.map((item, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-2">
                    <span className="text-mood-cold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dim italic">No critical weaknesses noted.</p>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  )
}
