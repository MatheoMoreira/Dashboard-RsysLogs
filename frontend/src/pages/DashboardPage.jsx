import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { reservationsApi, roomsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { Button, Card, CardHeader, EmptyState, PageLoader } from '../components/ui'
import { formatDate, formatTimeRange, todayIso } from '../services/format'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { data: reservations, loading } = useApi(() => reservationsApi.mine())
  const { data: rooms } = useApi(() => roomsApi.list())

  const stats = useMemo(() => {
    const list = reservations || []
    const today = todayIso()
    return {
      active: list.filter((r) => r.status === 'ACTIVE').length,
      upcoming: list.filter((r) => r.status === 'ACTIVE' && r.date >= today),
      cancelled: list.filter((r) => r.status === 'CANCELLED').length,
    }
  }, [reservations])

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user?.firstname} 👋`}
        description="Voici un aperçu de votre activité de réservation."
        action={
          isAdmin && (
            <Link to="/admin">
              <Button variant="secondary">Dashboard admin</Button>
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Réservations actives" value={stats.active} accent="emerald" />
        <StatCard label="À venir" value={stats.upcoming.length} accent="brand" />
        <StatCard label="Annulées" value={stats.cancelled} accent="rose" />
        <StatCard label="Salles disponibles" value={rooms?.length ?? '—'} accent="slate" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Prochaines réservations"
            action={
              <Link to="/reservations" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Tout voir
              </Link>
            }
          />
          <div className="p-5">
            {stats.upcoming.length === 0 ? (
              <EmptyState
                title="Aucune réservation à venir"
                description="Réservez une salle pour vos prochains créneaux."
                action={
                  <Link to="/reservations/new">
                    <Button>Réserver</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.upcoming.slice(0, 5).map((res) => (
                  <li key={res.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-800">{res.room?.name || `Salle #${res.room_id}`}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(res.date)} · {formatTimeRange(res.start_time, res.end_time)}
                      </p>
                    </div>
                    <StatusBadge status={res.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Actions rapides" />
          <div className="flex flex-col gap-2 p-5">
            <Link to="/reservations/new">
              <Button className="w-full">Nouvelle réservation</Button>
            </Link>
            <Link to="/rooms">
              <Button variant="secondary" className="w-full">
                Parcourir les salles
              </Button>
            </Link>
            <Link to="/reservations">
              <Button variant="secondary" className="w-full">
                Mes réservations
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
