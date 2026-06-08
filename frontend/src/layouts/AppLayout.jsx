import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { Badge, Button } from '../components/ui'

/** Authenticated application shell: responsive sidebar + topbar + content. */
export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = `${user?.firstname?.[0] ?? ''}${user?.lastname?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-700 bg-ink-950/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg p-2 font-mono text-fog-400 hover:bg-ink-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            ≡
          </button>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Badge variant={isAdmin ? 'signal' : 'neutral'}>{isAdmin ? 'admin' : 'user'}</Badge>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-fog-50">{user?.full_name}</p>
              <p className="font-mono text-xs text-fog-500">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 font-mono text-xs font-semibold text-signal-300 ring-1 ring-ink-600">
              {initials}
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sortir
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
