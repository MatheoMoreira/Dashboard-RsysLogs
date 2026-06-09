import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const userLinks = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/rooms', label: 'Salles' },
  { to: '/reservations', label: 'Mes réservations' },
  { to: '/reservations/new', label: 'Nouvelle réservation' },
]

const adminLinks = [
  { to: '/admin', label: 'Statistiques', end: true },
  { to: '/admin/rooms', label: 'Gestion des salles' },
  { to: '/admin/reservations', label: 'Toutes les réservations' },
  { to: '/admin/users', label: 'Utilisateurs' },
]

function NavSection({ title, links, onNavigate }) {
  return (
    <div className="px-3">
      <p className="label-mono px-3 pb-2 pt-5">{title}</p>
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                isActive ? 'bg-signal-400/10 text-signal-300' : 'text-fog-400 hover:bg-ink-800 hover:text-fog-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full transition-all ${
                    isActive ? 'bg-signal-400' : 'bg-transparent group-hover:bg-ink-600'
                  }`}
                />
                <span className={isActive ? 'font-semibold' : 'font-medium'}>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar({ onNavigate }) {
  const { isAdmin } = useAuth()

  return (
    <div className="flex h-full flex-col border-r border-ink-700 bg-ink-900 pb-6">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-400 font-display text-lg font-semibold text-white">
          R
        </div>
        <div>
          <p className="font-display text-base font-semibold tracking-tight text-fog-50">Resa</p>
          <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-fog-500">Réservation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavSection title="Espace utilisateur" links={userLinks} onNavigate={onNavigate} />
        {isAdmin && <NavSection title="Administration" links={adminLinks} onNavigate={onNavigate} />}
      </div>

      <div className="px-6 pt-4">
        <div className="rounded-xl border border-ink-700 bg-ink-950 px-4 py-3">
          <p className="text-sm font-semibold text-fog-100">Besoin d'aide ?</p>
          <p className="mt-0.5 text-xs text-fog-500">Contactez votre administrateur.</p>
        </div>
      </div>
    </div>
  )
}
