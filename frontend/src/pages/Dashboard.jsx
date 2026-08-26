import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSessions } from '../lib/supabase'
import { useSessionStore } from '../store/sessionStore'
import { PlayCircle, TrendingUp, Clock, Activity, Zap } from 'lucide-react'

function computeStreak(sessions) {
  if (!sessions.length) return 0
  const days = [...new Set(
    sessions
      .map(s => {
        const d = new Date(s.created_at)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
      .filter(Boolean)
  )].sort((a, b) => b - a)
  if (!days.length) return 0
  const DAY = 86_400_000
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === DAY) streak++
    else break
  }
  return streak
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted text-sm">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
      <p className="text-xs text-dim">{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadSessions() {
      try {
        setLoading(true)
        const data = await fetchSessions()
        if (!cancelled) { setSessions(data); setError(null) }
      } catch (err) {
        if (!cancelled) { setError(err.message); console.error('Failed to fetch sessions:', err) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSessions()
    return () => { cancelled = true }
  }, [])

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.evaluation_report).length
  const avgScore = completedSessions > 0
    ? Math.round(
        sessions
          .filter(s => s.evaluation_report)
          .reduce((sum, s) => sum + (s.evaluation_report?.overall_score || 0), 0) /
          completedSessions
      )
    : 0
  const totalMinutes = sessions.reduce((sum, s) => {
    const dur = s.evaluation_report?.duration_sec
    return sum + (dur ? Math.round(dur / 60) : 0)
  }, 0)
  const streak = computeStreak(sessions)

  const recentSessions = [...sessions].reverse().slice(0, 5)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-light transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-0.5 text-sm text-muted">Your Sentinel HR simulation dashboard</p>
        </div>
        <button
          onClick={() => sessionId ? navigate(`/interview/${sessionId}`) : navigate('/scenarios')}
          className="flex items-center gap-2 rounded-lg bg-elevated px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <PlayCircle className="h-4 w-4" />
          {sessionId ? 'Resume Session' : 'Start New Session'}
        </button>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Sessions" value={totalSessions} sub={`${completedSessions} completed`} />
        <StatCard icon={TrendingUp} label="Avg Score" value={`${avgScore}/10`} sub={completedSessions > 0 ? `from ${completedSessions} sessions` : 'No sessions yet'} />
        <StatCard icon={Clock} label="Time Practiced" value={`${totalMinutes} mins`} sub="Total simulation time" />
        <StatCard icon={Zap} label="Streak" value={streak} sub="Days in a row" />
      </div>

      {/* Recent sessions */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-light py-10 text-center text-sm text-dim">
            No sessions recorded yet. Start your first simulation to see progress here.
          </p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const report = session.evaluation_report
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-elevated"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                    {session.scenario?.charAt(0).toUpperCase() ?? 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{session.scenario}</p>
                    <p className="truncate text-xs text-dim">{session.context || 'No context'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
                    {report ? (
                      <>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {report.overall_score ?? 'N/A'}/10
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.duration_sec ? Math.round(report.duration_sec / 60) : '?'}m
                        </span>
                      </>
                    ) : (
                      <span className="italic text-dim">In progress</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      {sessions.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-dim mb-3">
            Ready to practice your HR skills? Choose a scenario and start a simulated interview.
          </p>
          <button
            onClick={() => navigate('/scenarios')}
            className="flex items-center gap-2 mx-auto rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
          >
            <PlayCircle className="h-4 w-4" />
            Browse Scenarios
          </button>
        </div>
      )}
    </div>
  )
}
