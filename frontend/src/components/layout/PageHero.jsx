/**
 * Page hero — eyebrow + title + subtitle with an ambient accent glow and
 * optional right-side actions. Lightweight version of the Dashboard hero band
 * (non-card, sits directly on the page background).
 */
export default function PageHero({ eyebrow, title, subtitle, children, glow = true }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-7 py-8 mb-8">
      {glow && (
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-accent-dim) 0%, transparent 65%)', opacity: 0.28 }}
        />
      )}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-2 max-w-xl">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </div>
  )
}
