import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import UserForm from '../../components/UserForm'
import ConfirmDialog from '../../components/ConfirmDialog'
import { usersApi, extractError } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, Modal, PageLoader } from '../../components/ui'

export default function AdminUsersPage() {
  const { data: users, loading, reload } = useApi(() => usersApi.list())
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (u) => {
    setEditing(u)
    setFormOpen(true)
  }

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await usersApi.update(editing.id, payload)
        toast.success('Utilisateur mis à jour.')
      } else {
        await usersApi.create(payload)
        toast.success('Utilisateur créé.')
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
      await usersApi.remove(deleting.id)
      toast.success('Utilisateur supprimé.')
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
        title="Gestion des utilisateurs"
        description="Créez, modifiez les rôles et supprimez les comptes."
        action={<Button onClick={openCreate}>Nouvel utilisateur</Button>}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">Réservations</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {u.full_name}
                    {u.id === currentUser?.id && <span className="ml-2 text-xs text-slate-400">(vous)</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge variant={u.role === 'ADMIN' ? 'indigo' : 'gray'}>
                      {u.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.reservations_count ?? 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(u)}>
                        Modifier
                      </Button>
                      <Button variant="danger" disabled={u.id === currentUser?.id} onClick={() => setDeleting(u)}>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}>
        <UserForm
          initialValues={editing || {}}
          isEdit={!!editing}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Supprimer l'utilisateur"
        message={deleting ? `Supprimer définitivement ${deleting.full_name} et ses réservations ?` : ''}
        confirmLabel="Supprimer"
        loading={actionLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
