/**
 * Maps the confirmed 1-10 mood int to a color, interpolating across the
 * three mood tones from the design system (cold → neutral → warm).
 * Shared by Interview.jsx (ambient bar) and Report.jsx (mood timeline).
 */
export function moodColor(mood) {
  const cold = [207, 86, 86]     // --color-mood-cold
  const neutral = [207, 158, 86] // --color-mood-neutral
  const warm = [86, 207, 138]    // --color-mood-warm
  const t = Math.max(1, Math.min(10, mood))
  const [a, b, mix] = t <= 5 ? [cold, neutral, (t - 1) / 4] : [neutral, warm, (t - 5) / 5]
  const rgb = a.map((v, i) => Math.round(v + (b[i] - v) * mix))
  return `rgb(${rgb.join(',')})`
}
