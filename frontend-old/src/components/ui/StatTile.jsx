import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const ACCENTS = {
  accent: 'var(--color-accent)',
  warm: 'var(--color-mood-warm)',
  neutral: 'var(--color-mood-neutral)',
  cold: 'var(--color-mood-cold)',
}

/**
 * Stat card with a tinted radial glow — the "make cards distinct" pattern
 * from the Dashboard. `tone` controls the glow color; `accentValue` (optional)
 * renders the value in the accent color.
 */
export default function StatTile({ label, value, sub, tone = 'accent', accentValue = false, className }) {
  const color = ACCENTS[tone] ?? ACCENTS.accent
  return (
    <motion.div
      className={cn('relative overflow-hidden rounded-xl border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors', className)}
    >
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.14 }}
      />
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className="text-xl font-semibold font-mono" style={accentValue ? { color } : undefined}>
        {value ?? '—'}
        {sub && <span className="text-sm text-dim">{sub}</span>}
      </p>
    </motion.div>
  )
}
