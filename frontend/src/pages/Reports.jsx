import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getToken } from '../lib/supabase'
import { verdictStyle } from '../lib/verdict'
import PageHero from '../components/layout/PageHero'
import StatTile from '../components/ui/StatTile'

function ReportCard({ report }) {
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)

  const score = report.overall_score
  const verdict = report.verdict
  const minutes = report.duration_sec ? Math.round(report.duration_sec / 60) : null

  const date = report.created_at
    ? new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  async function handleDownloadPdf(e) {
    e.stopPropagation()
    setDownloading(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/export/${report.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Sentinel_Report_${report.scenario?.replace(/\s+/g, '_') || 'session'}_${report.id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group transition-colors hover:bg-elevated"
    >
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => navigate(`/report/${report.id}`)}
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent/15 text-accent">
          <FileText className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{report.scenario}</p>
          <p className="truncate text-xs text-dim mt-0.5">
            {report.personality ? `${report.personality} · ` : ''}{date}
          </p>
        </div>

        {/* Metrics */}
        <div className="flex shrink-0 items-center gap-4 text-xs text-muted">
          {score != null && (
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <TrendingUp className="h-3 w-3" />
              {score}/100
            </span>
          )}
          {minutes != null && (
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <Clock className="h-3 w-3" />
              {minutes}m
            </span>
          )}
          {verdict && (
            <span className={`inline-block rounded-[var(--radius)] border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${verdictStyle(verdict, report)}`}>
              {verdict}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="rounded-[var(--radius)] border border-border-light bg-elevated p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
            title="Download PDF"
          >
            <Download className={`h-4 w-4 ${downloading ? 'animate-pulse' : ''}`} />
          </button>
          <ChevronRight className="h-4 w-4 text-dim group-hover:text-muted transition-colors" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadReports() {
      try {
        const { data } = await api.get('/api/v1/reports')
        if (!cancelled) { setReports(data.reports ?? []); setError(null) }
      } catch (err) {
        if (!cancelled) { setError(err.message || 'Could not load reports.'); console.error(err) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadReports()
    return () => { cancelled = true }
  }, [])

  const totalScore = reports.reduce((s, r) => s + (r.overall_score ?? 0), 0)
  const avgScore = reports.length ? Math.round(totalScore / reports.length) : null
  const totalTime = reports.reduce((s, r) => s + (r.duration_sec ?? 0), 0)

  if (loading) {
    return (
      <div className="px-6 py-12">
        <PageHero eyebrow="Reports" title="Session reports" subtitle="Loading reports…" />
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Loading reports…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <PageHero eyebrow="Reports" title="Session reports" subtitle="Error loading reports" />
        <div className="mb-6 rounded-[var(--radius)] border border-mood-cold/30 bg-mood-cold/5 px-5 py-4 text-sm text-mood-cold">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-12">
      <PageHero
        eyebrow="Reports"
        title="Session reports"
        subtitle={
          reports.length > 0
            ? `${reports.length} report${reports.length !== 1 ? 's' : ''} with completed evaluations.`
            : 'No completed reports yet — finish a session to see your report here.'
        }
      />

      {/* Stats */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatTile label="Total reports" value={reports.length} tone="accent" />
          <StatTile label="Average score" value={avgScore ?? '—'} sub="/100" tone="neutral" />
          <StatTile label="Total time" value={Math.round(totalTime / 60)} sub="mins" tone="cold" />
          <StatTile label="Best score" value={Math.max(...reports.map(r => r.overall_score ?? 0)) || '—'} sub="/100" tone="warm" />
        </div>
      )}

      {/* Reports list — bordered rows */}
      {reports.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border-light py-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-dim" />
          <p className="text-sm text-dim">No completed reports yet.</p>
          <p className="text-xs text-dim mt-1">Finish an interview and evaluate it to generate a report.</p>
        </div>
      ) : (
        <div className="flex flex-col border border-border rounded-[var(--radius)] bg-surface">
          {reports.map((report, i) => (
            <div key={report.id} className={i > 0 ? 'border-t border-border' : ''}>
              <ReportCard report={report} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
