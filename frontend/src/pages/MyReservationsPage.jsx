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
      toast.success('Réservation mise à jour.')
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
      toast.success('Réservation annulée.')
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
          {reservations.map((res) => (
            <Card key={res.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{res.room?.name || `Salle #${res.room_id}`}</h3>
                  <p className="text-sm text-slate-500">{res.room?.building}</p>
                </div>
                <StatusBadge status={res.status} />
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Date</dt>
                  <dd className="font-medium text-slate-700">{formatDate(res.date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Horaire</dt>
                  <dd className="font-medium text-slate-700">{formatTimeRange(res.start_time, res.end_time)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Participants</dt>
                  <dd className="font-medium text-slate-700">{res.participants}</dd>
                </div>
              </dl>

              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{res.purpose}</p>

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
            </Card>
          ))}
        </div>
      )}

      {/* Edit modal */}
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

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelling}
        title="Annuler la réservation"
        message={
          cancelling
            ? `Confirmer l'annulation de la réservation du ${formatDate(cancelling.date)} ?`
            : ''
        }
        confirmLabel="Annuler la réservation"
        loading={actionLoading}
        onConfirm={handleCancel}
        onClose={() => setCancelling(null)}
      />
    </div>
  )
}
