/**
 * Maps the confirmed 1-10 mood int to a color, interpolating across the
 * three mood tones from the design system (cold → neutral → warm).
 * Shared by Interview.jsx (ambient bar) and Report.jsx (mood timeline).
 */
export function moodColor(mood) {
  const cold = [168, 80, 66]     // --danger-base: brick red
  const neutral = [156, 143, 125] // --text-secondary: warm gray
  const warm = [126, 191, 142]    // --success-base: sage green
  const t = Math.max(1, Math.min(10, mood))
  const [a, b, mix] = t <= 5 ? [cold, neutral, (t - 1) / 4] : [neutral, warm, (t - 5) / 5]
  const rgb = a.map((v, i) => Math.round(v + (b[i] - v) * mix))
  return `rgb(${rgb.join(',')})`
}
