import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Stat card — flat, bordered tile with no shadows or gradients.
 * `tone` controls the accent color; `accentValue` renders the value in accent color.
 */
export default function StatTile({ label, value, sub, tone = 'accent', accentValue = false, className }) {
  return (
    <motion.div
      className={cn('rounded-[var(--radius)] border border-border bg-surface px-4 py-4 hover:border-border-light transition-colors', className)}
    >
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className="text-xl font-semibold font-mono text-primary">
        {value ?? '—'}
        {sub && <span className="text-sm text-dim">{sub}</span>}
      </p>
    </motion.div>
  )
}
