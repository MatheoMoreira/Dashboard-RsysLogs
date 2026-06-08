import { Badge } from './ui'

/** Maps a reservation status to a coloured badge. */
export default function StatusBadge({ status }) {
  if (status === 'ACTIVE') return <Badge variant="green">Active</Badge>
  if (status === 'CANCELLED') return <Badge variant="red">Annulée</Badge>
  return <Badge variant="gray">{status}</Badge>
}
