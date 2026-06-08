import { Link } from 'react-router-dom'
import { Badge, Card } from './ui'

/** Compact summary card for a room, used in the rooms listing. */
export default function RoomCard({ room }) {
  return (
    <Card className="flex flex-col p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{room.name}</h3>
          <p className="text-sm text-slate-500">
            {room.building} · Étage {room.floor}
          </p>
        </div>
        <Badge variant="indigo">{room.capacity} pers.</Badge>
      </div>

      {room.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{room.description}</p>}

      {room.equipment?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {room.equipment.map((eq) => (
            <Badge key={eq.id} variant="gray">
              {eq.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
        <Link
          to={`/rooms/${room.id}`}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Détails
        </Link>
        <Link
          to={`/reservations/new?room=${room.id}`}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Réserver
        </Link>
      </div>
    </Card>
  )
}
