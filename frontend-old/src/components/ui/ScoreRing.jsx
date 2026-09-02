import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Animated gradient progress ring. `score` is 0–100. Reused by the
 * Dashboard hero and the Report overall score.
 */
export default function ScoreRing({ score, size = 100 }) {
  const r = size * 0.36
  const circ = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circ - (clamped / 100) * circ
  const id = useMemo(() => `ring-grad-${Math.round(Math.random() * 1e9)}`, [])
  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--color-accent-dim) 0%, transparent 70%)', opacity: 0.35 }}
      />
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-light)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={size * 0.06} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={size * 0.06}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute font-bold font-mono text-primary" style={{ fontSize: size * 0.26 }}>
        {clamped}
      </span>
    </div>
  )
}
