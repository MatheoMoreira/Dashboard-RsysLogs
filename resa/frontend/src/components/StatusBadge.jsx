import { Badge } from './ui'

/** Maps a reservation status to a coloured console badge. */
export default function StatusBadge({ status }) {
  if (status === 'ACTIVE')
    return (
      <Badge variant="ok">
        <span className="h-1.5 w-1.5 rounded-full bg-ok-400" />
        active
      </Badge>
    )
  if (status === 'CANCELLED')
    return (
      <Badge variant="alert">
        <span className="h-1.5 w-1.5 rounded-full bg-alert-400" />
        annulée
      </Badge>
    )
  return <Badge variant="neutral">{status}</Badge>
}
