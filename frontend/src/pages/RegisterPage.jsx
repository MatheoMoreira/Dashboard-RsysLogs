import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { extractError } from '../services/api'
import { Button, Field, Input } from '../components/ui'

const initial = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  password_confirmation: '',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register(form)
      toast.success('Compte créé avec succès !')
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractError(err, 'Inscription impossible.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-900">Créer un compte</h2>
      <p className="mb-6 text-sm text-slate-500">Rejoignez la plateforme de réservation.</p>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" htmlFor="firstname">
            <Input id="firstname" name="firstname" required value={form.firstname} onChange={handleChange} />
          </Field>
          <Field label="Nom" htmlFor="lastname">
            <Input id="lastname" name="lastname" required value={form.lastname} onChange={handleChange} />
          </Field>
        </div>
        <Field label="Adresse e-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={handleChange} />
        </Field>
        <Field label="Confirmer le mot de passe" htmlFor="password_confirmation">
          <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" required value={form.password_confirmation} onChange={handleChange} />
        </Field>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          S'inscrire
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
