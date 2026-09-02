/**
 * Page hero — eyebrow + title + subtitle with optional right-side actions.
 * Flat, no gradient or glow effects per DESIGN.md rules.
 */
export default function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface px-7 py-8 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
