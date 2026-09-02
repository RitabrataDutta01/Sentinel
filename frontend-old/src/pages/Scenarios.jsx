import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getScenarios, startSession } from '../lib/api'
import { fetchSessions } from '../lib/supabase'
import { useSessionStore } from '../store/sessionStore'
import PageShell from '../components/layout/PageShell'
import PageHero from '../components/layout/PageHero'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'

const CATEGORY_LABELS = {
  Compliance_and_Ethics: 'Compliance & Ethics',
  Customer_Escalations: 'Customer Escalations',
  External_Stakeholders: 'External Stakeholders',
  HR_and_Interviews: 'HR & Interviews',
  Leadership_and_Management: 'Leadership & Management',
  Team_Dynamics: 'Team Dynamics',
}

const PERSONAS = [
  'Consulting Style',
  'Warm & Collaborative',
  'Professional / Detached',
  'Aggressive / Confrontational',
  'Defensive / Evasive',
  'Manipulative / Political',
]

const INTENSITY = {
  Compliance_and_Ethics: 1,
  Customer_Escalations: 2,
  External_Stakeholders: 2,
  HR_and_Interviews: 3,
  Leadership_and_Management: 2,
  Team_Dynamics: 1,
}

function IntensityDots({ level }) {
  return (
    <div className="flex items-center gap-1" title={`Intensity ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= level ? 'bg-accent' : 'bg-border'}`}
        />
      ))}
    </div>
  )
}

export default function Scenarios() {
  const navigate = useNavigate()
  const startSessionStore = useSessionStore((s) => s.startSession)

  const [scenarios, setScenarios] = useState([])
  const [runCounts, setRunCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selected, setSelected] = useState(null) // scenario key of open config
  const [personality, setPersonality] = useState(PERSONAS[0])
  const [context, setContext] = useState('')
  const [brutal, setBrutal] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [scen, sessions] = await Promise.all([getScenarios(), fetchSessions()])
        if (cancelled) return
        setScenarios(scen)
        const counts = {}
        for (const s of sessions) {
          if (s.scenario) counts[s.scenario] = (counts[s.scenario] ?? 0) + 1
        }
        setRunCounts(counts)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load the scenario library.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = useMemo(() => {
    const groups = {}
    for (const s of scenarios) {
      const label = CATEGORY_LABELS[s.category] ?? s.category ?? 'General'
      ;(groups[label] ??= []).push(s)
    }
    return Object.entries(groups)
  }, [scenarios])

  async function handleStart() {
    const scenario = selected
    if (!scenario) return
    setStarting(true)
    setStartError(null)
    try {
      const data = await startSession({
        scenario,
        personality,
        context: context.trim() || 'You are applying for a senior role at a fast-growing company. The interviewer can sense your hesitation — prove yourself.',
        brutal,
      })
      startSessionStore({
        sessionId: data.session_id,
        setup: { scenario, personality, context, brutal },
      })
      navigate(`/interview/${data.session_id}`)
    } catch (err) {
      setStartError(err.message || 'Could not start the session.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <PageShell className="px-6 py-12">
      <div className="w-full">
        <PageHero
          eyebrow="Scenario library"
          title="Choose a battle"
          subtitle="Each scenario drops you into a high-stakes conversation with a realistic counterpart. Pick one, tune the pressure, and the interviewer takes it from there."
        />

        {error && (
          <div className="mb-8 rounded-xl border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Loading scenarios…
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {grouped.map(([category, items]) => (
              <section key={category}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-dim mb-4">
                  {category}
                </h2>
                <div className="relative rounded-2xl p-4 -m-4">
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-accent-dim) 0%, transparent 60%)', opacity: 0.12 }}
                  />
                  <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((s, i) => {
                      const runs = runCounts[s.key] ?? 0
                      return (
                        <motion.button
                          key={s.key}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.04 * i }}
                          onClick={() => {
                            setSelected(s.key)
                            setContext('')
                            setBrutal(false)
                            setStartError(null)
                          }}
                          className={`text-left rounded-2xl border bg-surface p-5 transition-colors ${
                            selected === s.key
                              ? 'border-accent ring-1 ring-accent/40'
                              : 'border-border hover:border-border-light'
                          }`}
                        >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-primary">{s.label}</span>
                          <IntensityDots level={INTENSITY[s.category] ?? 1} />
                        </div>
                        <p className="text-xs text-muted leading-relaxed line-clamp-2">
                          {s.label} — pushback you can expect: realistic, in-character resistance.
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[11px] text-dim">
                            {runs > 0 ? `${runs} run${runs > 1 ? 's' : ''} so far` : 'Not attempted yet'}
                          </span>
                          <span className="text-[11px] font-semibold text-accent">
                            {selected === s.key ? 'Configure →' : 'Start'}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Config overlay */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-elevated p-6"
            >
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">
                  Configure session
                </p>
                <h2 className="text-lg font-semibold text-primary">{selected}</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="persona">Interviewer persona</Label>
                  <select
                    id="persona"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
                  >
                    {PERSONAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="context">Context (optional)</Label>
                  <Textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. Caught violating data policies during a layoff audit…"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Brutal honesty mode</p>
                    <p className="text-xs text-muted">The counterpart calls out vagueness aggressively.</p>
                  </div>
                  <Switch checked={brutal} onCheckedChange={setBrutal} />
                </div>

                {startError && (
                  <p className="text-sm text-mood-cold">{startError}</p>
                )}

                <div className="flex gap-3 mt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelected(null)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleStart} disabled={starting}>
                    {starting ? 'Starting…' : 'Begin'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageShell>
  )
}
