import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import ReservationForm from '../components/ReservationForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { reservationsApi, roomsApi, extractError } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../contexts/ToastContext'
import { Button, Card, EmptyState, Modal, PageLoader } from '../components/ui'
import { formatDate, formatTimeRange } from '../services/format'

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="label-mono">{label}</dt>
      <dd className="font-mono text-sm font-medium text-fog-200 tabular-nums">{value}</dd>
    </div>
  )
}

export default function MyReservationsPage() {
  const { data: reservations, loading, error, reload } = useApi(() => reservationsApi.mine())
  const { data: rooms } = useApi(() => roomsApi.list())
  const toast = useToast()

  const [editing, setEditing] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleUpdate = async (payload) => {
    try {
      await reservationsApi.update(editing.id, payload)
      toast.success('Réservation mise à jour · reservation_updated')
      setEditing(null)
      reload()
    } catch (err) {
      throw new Error(extractError(err, 'Mise à jour impossible.'))
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await reservationsApi.cancel(cancelling.id)
      toast.success('Réservation annulée · reservation_cancelled')
      setCancelling(null)
      reload()
    } catch (err) {
      toast.error(extractError(err, 'Annulation impossible.'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        eyebrow="reservations · mine"
        title="Mes réservations"
        description="Consultez, modifiez ou annulez vos réservations."
        action={
          <Link to="/reservations/new">
            <Button>Nouvelle réservation</Button>
          </Link>
        }
      />

      {error ? (
        <EmptyState title="Erreur de chargement" description={error} />
      ) : reservations?.length === 0 ? (
        <EmptyState
          title="Aucune réservation"
          description="Vous n'avez pas encore réservé de salle."
          action={
            <Link to="/reservations/new">
              <Button>Réserver une salle</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reservations.map((res, i) => (
            <Card key={res.id} className="reveal p-5" >
              <div style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-bold text-fog-50">
                      {res.room?.name || `Salle #${res.room_id}`}
                    </h3>
                    <p className="font-mono text-xs text-fog-500">{res.room?.building}</p>
                  </div>
                  <StatusBadge status={res.status} />
                </div>

                <dl className="mt-4 space-y-2">
                  <Detail label="date" value={formatDate(res.date)} />
                  <Detail label="horaire" value={formatTimeRange(res.start_time, res.end_time)} />
                  <Detail label="participants" value={res.participants} />
                </dl>

                <p className="mt-4 rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-fog-300">
                  {res.purpose}
                </p>

                {res.status === 'ACTIVE' && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setEditing(res)}>
                      Modifier
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={() => setCancelling(res)}>
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la réservation">
        {editing && (
          <ReservationForm
            rooms={rooms || []}
            lockRoom
            initialValues={editing}
            submitLabel="Enregistrer"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelling}
        title="Annuler la réservation"
        message={cancelling ? `Confirmer l'annulation de la réservation du ${formatDate(cancelling.date)} ?` : ''}
        confirmLabel="Annuler la réservation"
        loading={actionLoading}
        onConfirm={handleCancel}
        onClose={() => setCancelling(null)}
      />
    </div>
  )
}
