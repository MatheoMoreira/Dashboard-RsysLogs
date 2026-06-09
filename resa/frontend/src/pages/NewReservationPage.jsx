import { useSearchParams, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ReservationForm from '../components/ReservationForm'
import { reservationsApi, roomsApi, extractError } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../contexts/ToastContext'
import { Card, EmptyState, PageLoader } from '../components/ui'

export default function NewReservationPage() {
  const { data: rooms, loading } = useApi(() => roomsApi.list())
  const [params] = useSearchParams()
  const toast = useToast()
  const navigate = useNavigate()

  if (loading) return <PageLoader />
  if (!rooms?.length) {
    return <EmptyState title="Aucune salle disponible" description="Contactez un administrateur." />
  }

  const preselectedRoom = params.get('room')

  const handleSubmit = async (payload) => {
    try {
      await reservationsApi.create(payload)
      toast.success('Réservation confirmée.')
      navigate('/reservations')
    } catch (err) {
      // Surface explicit business errors (409 double booking, 422 capacity, …).
      throw new Error(extractError(err, 'Réservation impossible.'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Réservation" title="Nouvelle réservation" description="Réservez une salle pour votre créneau." />
      <Card className="reveal p-6">
        <ReservationForm
          rooms={rooms}
          initialValues={{ room_id: preselectedRoom ? Number(preselectedRoom) : undefined }}
          submitLabel="Confirmer la réservation"
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      </Card>
    </div>
  )
}
