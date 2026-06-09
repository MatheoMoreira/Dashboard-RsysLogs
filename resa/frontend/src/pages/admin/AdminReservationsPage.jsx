import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { reservationsApi, roomsApi, usersApi, extractError } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { Button, Card, Input, PageLoader, Select } from '../../components/ui'
import { formatDate, formatTimeRange } from '../../services/format'

const emptyFilters = { user_id: '', room_id: '', date: '', status: '' }

export default function AdminReservationsPage() {
  const { data: rooms } = useApi(() => roomsApi.list())
  const { data: users } = useApi(() => usersApi.list())

  const [filters, setFilters] = useState(emptyFilters)
  const [reservations, setReservations] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    const params = { page }
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v))

    reservationsApi
      .all(params)
      .then((res) => {
        if (!active) return
        setReservations(res.data.data)
        setMeta(res.data.meta)
        setError(null)
      })
      .catch((err) => active && setError(extractError(err)))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [filters, page])

  const updateFilter = (e) => {
    setPage(1)
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const resetFilters = () => {
    setPage(1)
    setFilters(emptyFilters)
  }

  return (
    <div>
      <PageHeader
        eyebrow="admin · reservations/all"
        title="Toutes les réservations"
        description="Filtrez par utilisateur, salle, date ou statut."
      />

      <Card className="reveal mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select name="user_id" value={filters.user_id} onChange={updateFilter}>
            <option value="">Tous les utilisateurs</option>
            {(users || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </Select>
          <Select name="room_id" value={filters.room_id} onChange={updateFilter}>
            <option value="">Toutes les salles</option>
            {(rooms || []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Input type="date" name="date" value={filters.date} onChange={updateFilter} />
          <Select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Annulée</option>
          </Select>
          <Button variant="secondary" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <Card className="p-6 text-sm text-alert-400">{error}</Card>
      ) : (
        <Card className="reveal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-700 text-sm">
              <thead className="bg-ink-900/50">
                <tr className="label-mono text-left">
                  <th className="px-5 py-3 font-normal">salle</th>
                  <th className="px-5 py-3 font-normal">utilisateur</th>
                  <th className="px-5 py-3 font-normal">date</th>
                  <th className="px-5 py-3 font-normal">horaire</th>
                  <th className="px-5 py-3 font-normal">pers.</th>
                  <th className="px-5 py-3 font-normal">motif</th>
                  <th className="px-5 py-3 font-normal">statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center font-mono text-sm text-fog-600">
                      // aucune réservation pour ces critères
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="transition hover:bg-ink-800/40">
                      <td className="px-5 py-3 font-medium text-fog-50">{res.room?.name}</td>
                      <td className="px-5 py-3 text-fog-400">{res.user?.full_name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-fog-400">{formatDate(res.date)}</td>
                      <td className="px-5 py-3 font-mono text-xs text-fog-400 tabular-nums">
                        {formatTimeRange(res.start_time, res.end_time)}
                      </td>
                      <td className="px-5 py-3 font-mono text-fog-400 tabular-nums">{res.participants}</td>
                      <td className="max-w-[200px] truncate px-5 py-3 text-fog-400" title={res.purpose}>
                        {res.purpose}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={res.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-ink-700 px-5 py-3 font-mono text-xs text-fog-500">
              <span>
                page {meta.current_page}/{meta.last_page} · {meta.total} résultats
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Préc.
                </Button>
                <Button variant="secondary" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                  Suiv. →
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
