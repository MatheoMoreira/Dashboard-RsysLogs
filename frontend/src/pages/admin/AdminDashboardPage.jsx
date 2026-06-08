import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import BarChart from '../../components/BarChart'
import { statsApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { Card, CardHeader, EmptyState, PageLoader } from '../../components/ui'

function RankedList({ items }) {
  if (!items?.length) {
    return <p className="p-5 text-sm text-fog-500">Aucune donnée disponible.</p>
  }
  const max = Math.max(...items.map((i) => i.count))
  return (
    <ul className="divide-y divide-ink-700">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center gap-3 px-5 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-800 font-mono text-xs font-bold text-signal-300 ring-1 ring-ink-600">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fog-100">{item.name}</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-signal-600 to-signal-400"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 font-mono text-sm font-semibold text-fog-200 tabular-nums">{item.count}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi(() => statsApi.dashboard())

  if (loading) return <PageLoader label="Agrégation des métriques…" />
  if (error) return <EmptyState title="Erreur" description={error} />

  const { globals, reservations_per_day, top_rooms, top_users } = data
  const chartData = (reservations_per_day || []).map((d) => ({ label: d.date.slice(5), value: d.count }))

  return (
    <div>
      <PageHeader
        eyebrow="admin · stats/dashboard"
        title="Console d'observabilité"
        description="Vue d'ensemble de l'activité de réservation."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="total réservations" code="total" value={globals.total_reservations} accent="signal" delay={0.05} />
        <StatCard label="aujourd'hui" code="today" value={globals.reservations_today} accent="ok" delay={0.1} />
        <StatCard label="annulations" code="cancel" value={globals.cancelled_reservations} accent="alert" delay={0.15} />
        <StatCard label="salles" code="rooms" value={globals.total_rooms} accent="warn" delay={0.2} />
        <StatCard label="utilisateurs" code="users" value={globals.total_users} accent="fog" delay={0.25} />
      </div>

      <Card className="reveal mt-8">
        <CardHeader title="Réservations par jour" subtitle="14 derniers jours" />
        <div className="p-5">
          <BarChart data={chartData} />
        </div>
      </Card>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="reveal">
          <CardHeader title="Top 5 des salles" subtitle="Les plus réservées" />
          <RankedList items={top_rooms} />
        </Card>
        <Card className="reveal">
          <CardHeader title="Utilisateurs les plus actifs" />
          <RankedList items={top_users} />
        </Card>
      </div>
    </div>
  )
}
