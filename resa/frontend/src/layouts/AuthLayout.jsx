import { Outlet } from 'react-router-dom'

const highlights = [
  { title: 'Réservation en quelques clics', desc: 'Trouvez une salle disponible et confirmez votre créneau instantanément.' },
  { title: 'Vos espaces, centralisés', desc: 'Salles, équipements et capacités réunis en un seul endroit.' },
  { title: 'Une vue claire de votre activité', desc: 'Suivez vos réservations à venir, passées et annulées.' },
]

/** Split layout for the public auth pages: editorial brand panel + form. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Left — editorial brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-fog-50 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 15%, rgba(13,148,136,0.35), transparent 50%), radial-gradient(circle at 90% 90%, rgba(13,148,136,0.18), transparent 45%)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-400 font-display text-xl font-semibold text-white">
            R
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">Resa</p>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Réservation de salles</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl font-medium leading-[1.08] tracking-tight text-white">
            Réservez vos salles,
            <br />
            <span className="text-signal-400">simplement.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            La plateforme qui simplifie la gestion et la réservation de vos espaces
            de travail au quotidien.
          </p>
        </div>

        <ul className="relative space-y-4">
          {highlights.map((h, i) => (
            <li
              key={i}
              className="reveal flex gap-3"
              style={{ animationDelay: `${0.2 + i * 0.12}s` }}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-400/20 text-signal-400">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{h.title}</p>
                <p className="text-sm text-white/50">{h.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-400 font-display text-lg font-semibold text-white">
              R
            </div>
            <p className="font-display text-lg font-semibold tracking-tight text-fog-50">Resa</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
