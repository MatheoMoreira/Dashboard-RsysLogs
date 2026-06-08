import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import RoomCard from '../components/RoomCard'
import { roomsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { EmptyState, Input, PageLoader, Select } from '../components/ui'

export default function RoomsPage() {
  const { data: rooms, loading, error } = useApi(() => roomsApi.list())
  const [search, setSearch] = useState('')
  const [building, setBuilding] = useState('')

  const buildings = useMemo(() => [...new Set((rooms || []).map((r) => r.building))].sort(), [rooms])

  const filtered = useMemo(() => {
    return (rooms || []).filter((room) => {
      const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase())
      const matchesBuilding = !building || room.building === building
      return matchesSearch && matchesBuilding
    })
  }, [rooms, search, building])

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        eyebrow="rooms · index"
        title="Salles"
        description="Parcourez les salles disponibles et réservez en un clic."
      />

      {error ? (
        <EmptyState title="Impossible de charger les salles" description={error} />
      ) : (
        <>
          <div className="reveal mb-6 flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Rechercher une salle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={building} onChange={(e) => setBuilding(e.target.value)} className="sm:max-w-xs">
              <option value="">Tous les bâtiments</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
            <span className="ml-auto hidden items-center font-mono text-xs text-fog-600 sm:flex">
              {filtered.length} / {rooms?.length ?? 0} salles
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Aucune salle trouvée" description="Essayez d'ajuster vos filtres." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((room, i) => (
                <RoomCard key={room.id} room={room} delay={Math.min(i * 0.04, 0.4)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
