import { useState } from 'react'
import { Button, Field, Input, Select } from './ui'

/** Create/edit form for a user (admin). Password optional when editing. */
export default function UserForm({ initialValues = {}, isEdit = false, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    firstname: initialValues.firstname || '',
    lastname: initialValues.lastname || '',
    email: initialValues.email || '',
    role: initialValues.role || 'USER',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = { ...form }
      if (isEdit && !payload.password) {
        delete payload.password
        delete payload.password_confirmation
      }
      await onSubmit(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          <span className="font-mono">!</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" htmlFor="firstname">
          <Input id="firstname" name="firstname" required value={form.firstname} onChange={handleChange} />
        </Field>
        <Field label="Nom" htmlFor="lastname">
          <Input id="lastname" name="lastname" required value={form.lastname} onChange={handleChange} />
        </Field>
      </div>

      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
      </Field>

      <Field label="Rôle" htmlFor="role">
        <Select id="role" name="role" value={form.role} onChange={handleChange}>
          <option value="USER">Utilisateur</option>
          <option value="ADMIN">Administrateur</option>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={isEdit ? 'Nouveau mot de passe' : 'Mot de passe'} htmlFor="password">
          <Input id="password" name="password" type="password" required={!isEdit} value={form.password} onChange={handleChange} placeholder={isEdit ? 'Inchangé' : ''} />
        </Field>
        <Field label="Confirmation" htmlFor="password_confirmation">
          <Input id="password_confirmation" name="password_confirmation" type="password" required={!isEdit && !!form.password} value={form.password_confirmation} onChange={handleChange} />
        </Field>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {isEdit ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
