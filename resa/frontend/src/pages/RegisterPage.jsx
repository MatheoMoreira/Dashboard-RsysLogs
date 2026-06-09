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
      toast.success('Compte créé · session ouverte')
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractError(err, 'Inscription impossible.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reveal">
      <p className="label-mono mb-2">auth · register</p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-fog-50">Créer un compte</h2>
      <p className="mt-2 text-sm text-fog-500">Rejoignez la plateforme de réservation.</p>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          <span className="font-mono">!</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="prénom" htmlFor="firstname">
            <Input id="firstname" name="firstname" required value={form.firstname} onChange={handleChange} />
          </Field>
          <Field label="nom" htmlFor="lastname">
            <Input id="lastname" name="lastname" required value={form.lastname} onChange={handleChange} />
          </Field>
        </div>
        <Field label="email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} />
        </Field>
        <Field label="mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={handleChange} />
        </Field>
        <Field label="confirmation" htmlFor="password_confirmation">
          <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" required value={form.password_confirmation} onChange={handleChange} />
        </Field>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          S'inscrire →
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fog-500">
        Déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-signal-400 transition hover:text-signal-300">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
