import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import BarChart from '../../components/BarChart'
import { statsApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { Card, CardHeader, EmptyState, PageLoader } from '../../components/ui'

function RankedList({ items, valueLabel }) {
  if (!items?.length) {
    return <p className="p-5 text-sm text-slate-500">Aucune donnée disponible.</p>
  }
  const max = Math.max(...items.map((i) => i.count))
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center gap-3 px-5 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-slate-600">
            {item.count} {valueLabel}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi(() => statsApi.dashboard())

  if (loading) return <PageLoader />
  if (error) return <EmptyState title="Erreur" description={error} />

  const { globals, reservations_per_day, top_rooms, top_users } = data

  const chartData = (reservations_per_day || []).map((d) => ({
    label: d.date.slice(5), // MM-DD
    value: d.count,
  }))

  return (
    <div>
      <PageHeader title="Dashboard administrateur" description="Vue d'ensemble de l'activité de réservation." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total réservations" value={globals.total_reservations} accent="brand" />
        <StatCard label="Aujourd'hui" value={globals.reservations_today} accent="emerald" />
        <StatCard label="Annulations" value={globals.cancelled_reservations} accent="rose" />
        <StatCard label="Salles" value={globals.total_rooms} accent="amber" />
        <StatCard label="Utilisateurs" value={globals.total_users} accent="slate" />
      </div>

      <Card className="mt-8">
        <CardHeader title="Réservations par jour" subtitle="14 derniers jours" />
        <div className="p-5">
          <BarChart data={chartData} />
        </div>
      </Card>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top 5 des salles" subtitle="Les plus réservées" />
          <RankedList items={top_rooms} valueLabel="résa" />
        </Card>
        <Card>
          <CardHeader title="Utilisateurs les plus actifs" />
          <RankedList items={top_users} valueLabel="résa" />
        </Card>
      </div>
    </div>
  )
}
