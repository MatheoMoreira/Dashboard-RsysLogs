import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { roomsApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Badge, Button, Card, EmptyState, PageLoader } from '../components/ui'

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-3 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
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
        title={room.name}
        description={`${room.building} · Étage ${room.floor}`}
        action={
          <Link to={`/reservations/new?room=${room.id}`}>
            <Button>Réserver cette salle</Button>
          </Link>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Informations</h3>
          <dl>
            <InfoRow label="Bâtiment" value={room.building} />
            <InfoRow label="Étage" value={room.floor} />
            <InfoRow label="Capacité" value={`${room.capacity} personnes`} />
            <InfoRow label="Réservations" value={room.reservations_count ?? 0} />
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Équipements</h3>
          {room.equipment?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {room.equipment.map((eq) => (
                <Badge key={eq.id} variant="indigo">
                  {eq.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucun équipement renseigné.</p>
          )}
        </Card>
      </div>

      {room.description && (
        <Card className="mt-5 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h3>
          <p className="text-sm leading-relaxed text-slate-600">{room.description}</p>
        </Card>
      )}

      <div className="mt-6">
        <Link to="/rooms" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Retour à la liste des salles
        </Link>
      </div>
    </div>
  )
}
