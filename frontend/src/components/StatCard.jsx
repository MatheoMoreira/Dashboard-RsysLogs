import { Card } from './ui'

/** KPI tile used on both the user and admin dashboards. */
export default function StatCard({ label, value, accent = 'brand' }) {
  const accents = {
    brand: 'text-brand-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    slate: 'text-slate-700',
  }
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accents[accent]}`}>{value}</p>
    </Card>
  )
}
