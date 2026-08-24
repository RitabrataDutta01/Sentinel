/**
 * Shared verdict -> color/style mapping used by Report, Sessions, People, and
 * Dashboard. New reports carry a backend-computed `verdict_level` (1-4, 4 =
 * best). For older stored reports without a level we fall back to substring
 * matching, always checking negative markers before positive ones so values
 * like "NO HIRE" / "UNRESOLVED" never render as positive.
 */

const NEGATIVE_MARKERS = ['NO HIRE', 'NON-COMPLIANT', 'UNRESOLVED', 'MISALIGNED', 'WEAK', 'NO']
const NEUTRAL_MARKERS = ['LEANING', 'PARTIAL', 'UNCERTAIN']

export function verdictTone(verdict, report) {
  const numeric = report?.verdict_level
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 4) return numeric

  const v = (verdict || '').toUpperCase()
  if (NEGATIVE_MARKERS.some((m) => v.includes(m))) return 1
  if (NEUTRAL_MARKERS.some((m) => v.includes(m))) return 2
  if (v.includes('STRONG')) return 4
  if (v.includes('HIRE') || v.includes('RESOLVED') || v.includes('ALIGN') || v.includes('COMPLIAN') || v.includes('LEADERSHIP')) return 3
  return 2
}

export function verdictStyle(verdict, report) {
  const tone = verdictTone(verdict, report)
  if (tone === 4) return 'bg-mood-warm/15 text-mood-warm border-mood-warm/40'
  if (tone === 3) return 'bg-mood-warm/10 text-mood-warm border-mood-warm/30'
  if (tone === 2) return 'bg-mood-neutral/10 text-mood-neutral border-mood-neutral/30'
  return 'bg-mood-cold/10 text-mood-cold border-mood-cold/30'
}

export function verdictCssColor(verdict, report) {
  const tone = verdictTone(verdict, report)
  if (tone === 4 || tone === 3) return 'var(--color-mood-warm)'
  if (tone === 2) return 'var(--color-mood-neutral)'
  return 'var(--color-mood-cold)'
}