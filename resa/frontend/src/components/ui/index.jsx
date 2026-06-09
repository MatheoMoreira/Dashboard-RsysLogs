/**
 * Reusable UI primitives — "Corporate Editorial" aesthetic.
 * Light surfaces, soft hairline borders, a confident teal accent, and refined
 * sans labels. Import from one module: `import { Button, Card } ...`.
 */
import { useEffect } from 'react'

/* ------------------------------------------------------------------ Button */
const buttonVariants = {
  primary:
    'bg-signal-400 text-white font-semibold hover:bg-signal-500 focus-visible:ring-signal-400/40 signal-glow',
  secondary:
    'bg-white text-fog-100 ring-1 ring-inset ring-ink-600 hover:bg-ink-800 hover:ring-ink-600 focus-visible:ring-fog-500/30',
  danger:
    'bg-alert-500/10 text-alert-400 ring-1 ring-inset ring-alert-500/30 hover:bg-alert-500/15 focus-visible:ring-alert-400/40',
  ghost: 'bg-transparent text-fog-400 hover:bg-ink-800 hover:text-fog-100 focus-visible:ring-fog-500/30',
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
      {error && <p className="text-xs font-medium text-alert-400">{error}</p>}
    </div>
  )
}

const controlClasses =
  'w-full rounded-lg border border-ink-600 bg-white px-3 py-2 text-sm text-fog-100 transition placeholder:text-fog-600 focus:border-signal-400 focus:outline-none focus:ring-2 focus:ring-signal-400/20 disabled:opacity-50'

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
        <h3 className="text-lg font-medium text-fog-50">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-fog-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------- Badge */
const badgeVariants = {
  ok: 'bg-ok-400/10 text-ok-400 ring-ok-400/25',
  alert: 'bg-alert-400/10 text-alert-400 ring-alert-400/25',
  warn: 'bg-warn-400/10 text-warn-400 ring-warn-400/25',
  signal: 'bg-signal-400/10 text-signal-300 ring-signal-400/25',
  neutral: 'bg-ink-800 text-fog-400 ring-ink-600',
}

export function Badge({ variant = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider ring-1 ring-inset ${badgeVariants[variant]}`}
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

export function PageLoader({ label = 'Chargement…' }) {
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-950 px-6 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-signal-400/10 text-signal-300">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
      <p className="text-lg font-medium text-fog-50">{title}</p>
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
      <div className="absolute inset-0 bg-fog-50/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="reveal panel relative z-10 w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h3 className="text-lg font-medium text-fog-50">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-md text-fog-500 transition hover:bg-ink-800 hover:text-fog-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-700 bg-ink-950 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
