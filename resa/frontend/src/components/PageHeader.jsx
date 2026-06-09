/** Consistent page title block with optional eyebrow label + action area. */
export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="reveal mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="label-mono mb-2 text-signal-300">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-medium tracking-tight text-fog-50 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-fog-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  )
}
