import { Outlet } from 'react-router-dom'

const logLines = [
  { t: 'info', e: 'user_login', d: 'status 200' },
  { t: 'info', e: 'reservation_created', d: 'room_id 5' },
  { t: 'warn', e: 'double_booking_attempt', d: 'status 409' },
  { t: 'info', e: 'rooms_list_viewed', d: 'count 10' },
  { t: 'warn', e: 'failed_login', d: 'status 401' },
  { t: 'info', e: 'http_request', d: '2.6 ms' },
]

const dot = { info: 'bg-ok-400', warn: 'bg-warn-400', alert: 'bg-alert-400' }

/** Split "console" layout for the public auth pages. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Left — editorial console panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-ink-700 bg-ink-900/40 p-12 lg:flex">
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(198,242,78,0.10), transparent 45%)',
        }} />

        <div className="relative flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-signal-400 font-display text-xl font-bold text-ink-950">
            R
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-ok-400 ring-2 ring-ink-900 pulse-dot" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-fog-50">resa</p>
            <p className="label-mono">observability console</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-fog-50">
            Réservez.
            <br />
            <span className="text-signal-400">Journalisez.</span>
            <br />
            Observez.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-fog-400">
            Une plateforme de réservation de salles instrumentée de bout en bout —
            chaque action produit un log JSON structuré, prêt pour rsyslog.
          </p>
        </div>

        {/* Faux live log stream */}
        <div className="relative space-y-1.5 font-mono text-xs">
          {logLines.map((l, i) => (
            <div
              key={i}
              className="reveal flex items-center gap-3 text-fog-500"
              style={{ animationDelay: `${0.3 + i * 0.12}s` }}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[l.t]}`} />
              <span className="text-fog-600">{'{'}</span>
              <span className="text-signal-300">"{l.e}"</span>
              <span className="text-fog-600">·</span>
              <span className="text-fog-400">{l.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-400 font-display text-lg font-bold text-ink-950">
              R
            </div>
            <p className="font-display text-lg font-bold tracking-tight text-fog-50">resa</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
