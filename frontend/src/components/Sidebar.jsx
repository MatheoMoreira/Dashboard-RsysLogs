import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const userLinks = [
  { to: '/', label: 'Tableau de bord', code: 'dash', end: true },
  { to: '/rooms', label: 'Salles', code: 'rooms' },
  { to: '/reservations', label: 'Mes réservations', code: 'mine' },
  { to: '/reservations/new', label: 'Nouvelle réservation', code: 'new' },
]

const adminLinks = [
  { to: '/admin', label: 'Console', code: 'stats', end: true },
  { to: '/admin/rooms', label: 'Gestion des salles', code: 'rooms.crud' },
  { to: '/admin/reservations', label: 'Toutes les réservations', code: 'resa.all' },
  { to: '/admin/users', label: 'Utilisateurs', code: 'users' },
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
                isActive ? 'bg-ink-800 text-fog-50' : 'text-fog-500 hover:bg-ink-850 hover:text-fog-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full transition-all ${
                    isActive ? 'bg-signal-400' : 'bg-transparent group-hover:bg-ink-600'
                  }`}
                />
                <span className="font-medium">{link.label}</span>
                <span className="ml-auto font-mono text-[0.625rem] text-fog-600 group-hover:text-fog-500">
                  {link.code}
                </span>
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
    <div className="flex h-full flex-col border-r border-ink-700 bg-ink-900/60 pb-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-signal-400 font-display text-lg font-bold text-ink-950">
          R
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ok-400 ring-2 ring-ink-900 pulse-dot" />
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-fog-50">resa</p>
          <p className="label-mono">observability</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavSection title="// espace utilisateur" links={userLinks} onNavigate={onNavigate} />
        {isAdmin && <NavSection title="// administration" links={adminLinks} onNavigate={onNavigate} />}
      </div>

      <div className="px-6 pt-4">
        <div className="flex items-center gap-2 font-mono text-[0.625rem] text-fog-600">
          <span className="h-1.5 w-1.5 rounded-full bg-ok-400 pulse-dot" />
          flux actif · json/rsyslog
        </div>
      </div>
    </div>
  )
}
