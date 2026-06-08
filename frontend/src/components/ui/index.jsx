/**
 * Reusable UI primitives — "Observability Console" aesthetic.
 * Dark warm surfaces, hairline borders, an electric "signal" accent, and
 * monospace labels. Import from one module: `import { Button, Card } ...`.
 */
import { useEffect } from 'react'

/* ------------------------------------------------------------------ Button */
const buttonVariants = {
  primary:
    'bg-signal-400 text-ink-950 font-semibold hover:bg-signal-300 focus-visible:ring-signal-400/60 signal-glow',
  secondary:
    'bg-ink-800 text-fog-100 ring-1 ring-inset ring-ink-600 hover:bg-ink-750 hover:ring-ink-600 focus-visible:ring-fog-500/50',
  danger:
    'bg-alert-500/15 text-alert-400 ring-1 ring-inset ring-alert-500/40 hover:bg-alert-500/25 focus-visible:ring-alert-400/50',
  ghost: 'bg-transparent text-fog-300 hover:bg-ink-800 hover:text-fog-100 focus-visible:ring-fog-500/40',
}

export function Button({ variant = 'primary', className = '', loading = false, disabled, children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- Field */
export function Field({ label, error, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="label-mono">
          {label}
        </label>
      )}
      {children}
      {error && <p className="font-mono text-xs text-alert-400">{error}</p>}
    </div>
  )
}

const controlClasses =
  'w-full rounded-lg border border-ink-700 bg-ink-900/70 px-3 py-2 text-sm text-fog-100 transition placeholder:text-fog-600 focus:border-signal-500 focus:outline-none focus:ring-2 focus:ring-signal-500/25 disabled:opacity-50'

export function Input({ className = '', ...props }) {
  return <input className={`${controlClasses} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${controlClasses} resize-none ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${controlClasses} cursor-pointer appearance-none ${className}`} {...props}>
      {children}
    </select>
  )
}

/* -------------------------------------------------------------------- Card */
export function Card({ className = '', children }) {
  return <div className={`panel ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
      <div>
        <h3 className="text-base font-semibold text-fog-50">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-fog-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------- Badge */
const badgeVariants = {
  ok: 'bg-ok-400/12 text-ok-400 ring-ok-400/25',
  alert: 'bg-alert-400/12 text-alert-400 ring-alert-400/25',
  warn: 'bg-warn-400/12 text-warn-400 ring-warn-400/25',
  signal: 'bg-signal-400/12 text-signal-300 ring-signal-400/25',
  neutral: 'bg-ink-700/60 text-fog-300 ring-ink-600',
}

export function Badge({ variant = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider ring-1 ring-inset ${badgeVariants[variant]}`}
    >
      {children}
    </span>
  )
}

/* ----------------------------------------------------------------- Spinner */
export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}

export function PageLoader({ label = 'Connexion au flux…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-fog-500">
      <Spinner className="h-7 w-7 text-signal-400" />
      <p className="label-mono">{label}</p>
    </div>
  )
}

/* -------------------------------------------------------------- EmptyState */
export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-ink-600 bg-ink-900/40 px-6 py-16 text-center">
      <div className="mb-3 font-mono text-signal-400/70">{'// '}</div>
      <p className="text-base font-semibold text-fog-100">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fog-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------- Modal */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="reveal panel relative z-10 w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-fog-50">
            <span className="text-signal-400">▸</span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 font-mono text-sm text-fog-500 transition hover:bg-ink-800 hover:text-fog-100"
          >
            esc
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-700 bg-ink-900/50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
