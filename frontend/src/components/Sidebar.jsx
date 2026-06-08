import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const userLinks = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/rooms', label: 'Salles' },
  { to: '/reservations', label: 'Mes réservations' },
  { to: '/reservations/new', label: 'Nouvelle réservation' },
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/rooms', label: 'Gestion des salles' },
  { to: '/admin/reservations', label: 'Toutes les réservations' },
  { to: '/admin/users', label: 'Utilisateurs' },
]

function NavSection({ title, links, onNavigate }) {
  return (
    <div className="px-3">
      <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar({ onNavigate }) {
  const { isAdmin } = useAuth()

  return (
    <div className="flex h-full flex-col bg-slate-900 pb-6">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">R</div>
        <div>
          <p className="text-sm font-bold text-white">Resa</p>
          <p className="text-xs text-slate-400">Réservation de salles</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavSection title="Espace utilisateur" links={userLinks} onNavigate={onNavigate} />
        {isAdmin && <NavSection title="Administration" links={adminLinks} onNavigate={onNavigate} />}
      </div>
    </div>
  )
}
