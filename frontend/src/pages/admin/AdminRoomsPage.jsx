import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import RoomForm from '../../components/RoomForm'
import ConfirmDialog from '../../components/ConfirmDialog'
import { roomsApi, equipmentApi, extractError } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { Badge, Button, Card, EmptyState, Modal, PageLoader } from '../../components/ui'

export default function AdminRoomsPage() {
  const { data: rooms, loading, reload } = useApi(() => roomsApi.list())
  const { data: equipment } = useApi(() => equipmentApi.list())
  const toast = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (room) => {
    setEditing(room)
    setFormOpen(true)
  }

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await roomsApi.update(editing.id, payload)
        toast.success('Salle mise à jour.')
      } else {
        await roomsApi.create(payload)
        toast.success('Salle créée.')
      }
      setFormOpen(false)
      reload()
    } catch (err) {
      throw new Error(extractError(err, 'Enregistrement impossible.'))
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await roomsApi.remove(deleting.id)
      toast.success('Salle supprimée.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(extractError(err, 'Suppression impossible.'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Gestion des salles"
        description="Créez, modifiez et supprimez les salles."
        action={<Button onClick={openCreate}>Nouvelle salle</Button>}
      />

      {rooms?.length === 0 ? (
        <EmptyState title="Aucune salle" description="Commencez par créer une salle." action={<Button onClick={openCreate}>Créer une salle</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3">Bâtiment</th>
                  <th className="px-5 py-3">Étage</th>
                  <th className="px-5 py-3">Capacité</th>
                  <th className="px-5 py-3">Équipements</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{room.name}</td>
                    <td className="px-5 py-3 text-slate-600">{room.building}</td>
                    <td className="px-5 py-3 text-slate-600">{room.floor}</td>
                    <td className="px-5 py-3 text-slate-600">{room.capacity}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {room.equipment?.map((eq) => (
                          <Badge key={eq.id} variant="gray">
                            {eq.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(room)}>
                          Modifier
                        </Button>
                        <Button variant="danger" onClick={() => setDeleting(room)}>
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Modifier la salle' : 'Nouvelle salle'}>
        <RoomForm
          equipment={equipment || []}
          initialValues={editing || {}}
          submitLabel={editing ? 'Enregistrer' : 'Créer'}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Supprimer la salle"
        message={deleting ? `Supprimer définitivement « ${deleting.name} » et ses réservations ?` : ''}
        confirmLabel="Supprimer"
        loading={actionLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
