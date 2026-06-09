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
        eyebrow="Tableau de bord"
        title={`Bonjour, ${user?.firstname}`}
        description="Aperçu de votre activité de réservation."
        action={
          isAdmin && (
            <Link to="/admin">
              <Button variant="secondary">Espace admin</Button>
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Réservations actives" value={stats.active} accent="ok" delay={0.05} />
        <StatCard label="À venir" value={stats.upcoming.length} accent="signal" delay={0.1} />
        <StatCard label="Annulées" value={stats.cancelled} accent="alert" delay={0.15} />
        <StatCard label="Salles disponibles" value={rooms?.length ?? '—'} accent="fog" delay={0.2} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card className="reveal lg:col-span-2" >
          <CardHeader
            title="Prochaines réservations"
            action={
              <Link to="/reservations" className="text-sm font-semibold text-signal-300 transition hover:text-signal-400">
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
              <ul className="divide-y divide-ink-700">
                {stats.upcoming.slice(0, 5).map((res) => (
                  <li key={res.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fog-100">{res.room?.name || `Salle #${res.room_id}`}</p>
                      <p className="text-xs text-fog-500">
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

        <Card className="reveal">
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
