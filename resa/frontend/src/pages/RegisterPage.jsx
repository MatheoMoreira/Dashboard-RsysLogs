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
      toast.success('Compte créé. Bienvenue !')
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractError(err, 'Inscription impossible.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reveal">
      <p className="label-mono mb-2 text-signal-300">Inscription</p>
      <h2 className="font-display text-3xl font-medium tracking-tight text-fog-50">Créer un compte</h2>
      <p className="mt-2 text-sm text-fog-500">Rejoignez la plateforme de réservation.</p>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" htmlFor="firstname">
            <Input id="firstname" name="firstname" required value={form.firstname} onChange={handleChange} />
          </Field>
          <Field label="Nom" htmlFor="lastname">
            <Input id="lastname" name="lastname" required value={form.lastname} onChange={handleChange} />
          </Field>
        </div>
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={handleChange} />
        </Field>
        <Field label="Confirmation" htmlFor="password_confirmation">
          <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" required value={form.password_confirmation} onChange={handleChange} />
        </Field>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          S'inscrire
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fog-500">
        Déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-signal-300 transition hover:text-signal-400">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
