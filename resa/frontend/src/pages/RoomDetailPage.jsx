import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { roomsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Badge, Button, Card, EmptyState, PageLoader } from '../components/ui'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-700 py-3 last:border-0">
      <dt className="label-mono">{label}</dt>
      <dd className="font-mono text-sm font-medium text-fog-100 tabular-nums">{value}</dd>
    </div>
  )
}

export default function RoomDetailPage() {
  const { id } = useParams()
  const { data: room, loading, error } = useApi(() => roomsApi.get(id), [id])

  if (loading) return <PageLoader />
  if (error || !room) return <EmptyState title="Salle introuvable" description={error} />

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={`rooms · #${room.id}`}
        title={room.name}
        description={`${room.building} · niveau ${room.floor}`}
        action={
          <Link to={`/reservations/new?room=${room.id}`}>
            <Button>Réserver →</Button>
          </Link>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="reveal p-6">
          <p className="label-mono mb-3">// informations</p>
          <dl>
            <InfoRow label="bâtiment" value={room.building} />
            <InfoRow label="étage" value={room.floor} />
            <InfoRow label="capacité" value={`${room.capacity} pers`} />
            <InfoRow label="réservations" value={room.reservations_count ?? 0} />
          </dl>
        </Card>

        <Card className="reveal p-6">
          <p className="label-mono mb-3">// équipements</p>
          {room.equipment?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {room.equipment.map((eq) => (
                <Badge key={eq.id} variant="signal">
                  {eq.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fog-500">Aucun équipement renseigné.</p>
          )}
        </Card>
      </div>

      {room.description && (
        <Card className="reveal mt-5 p-6">
          <p className="label-mono mb-2">// description</p>
          <p className="text-sm leading-relaxed text-fog-300">{room.description}</p>
        </Card>
      )}

      <div className="mt-6">
        <Link to="/rooms" className="font-mono text-xs text-signal-400 transition hover:text-signal-300">
          ← retour aux salles
        </Link>
      </div>
    </div>
  )
}
