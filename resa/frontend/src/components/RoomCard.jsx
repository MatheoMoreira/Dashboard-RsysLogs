import { Link } from 'react-router-dom'
import { Badge } from './ui'

/** Room summary card — console panel with hover lift and signal accents. */
export default function RoomCard({ room, delay = 0 }) {
  return (
    <div
      className="reveal panel group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-600"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold text-fog-50">{room.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-fog-500">
            {room.building} · niv.{room.floor}
          </p>
        </div>
        <Badge variant="signal">{room.capacity} pers</Badge>
      </div>

      {room.description && <p className="mt-3 line-clamp-2 text-sm text-fog-400">{room.description}</p>}

      {room.equipment?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {room.equipment.map((eq) => (
            <Badge key={eq.id} variant="neutral">
              {eq.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2 border-t border-ink-700 pt-4">
        <Link
          to={`/rooms/${room.id}`}
          className="flex-1 rounded-lg border border-ink-600 px-3 py-2 text-center text-sm font-medium text-fog-300 transition hover:bg-ink-800 hover:text-fog-100"
        >
          Détails
        </Link>
        <Link
          to={`/reservations/new?room=${room.id}`}
          className="flex-1 rounded-lg bg-signal-400 px-3 py-2 text-center text-sm font-semibold text-ink-950 transition hover:bg-signal-300"
        >
          Réserver
        </Link>
      </div>
    </div>
  )
}
