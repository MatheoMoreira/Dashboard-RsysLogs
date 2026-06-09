import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { extractError } from '../services/api'
import { Button, Field, Input } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = await login(form)
      toast.success(`Session ouverte · ${user.firstname}`)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(extractError(err, 'Connexion impossible.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reveal">
      <p className="label-mono mb-2">auth · login</p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-fog-50">Connexion</h2>
      <p className="mt-2 text-sm text-fog-500">Accédez à votre espace de réservation.</p>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          <span className="font-mono">!</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="vous@exemple.com" />
        </Field>
        <Field label="mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
        </Field>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Se connecter →
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fog-500">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-signal-400 transition hover:text-signal-300">
          Créer un compte
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-ink-700 bg-ink-900/50 p-4">
        <p className="label-mono mb-2">// comptes de démonstration</p>
        <div className="space-y-1 font-mono text-xs text-fog-400">
          <p>
            <span className="text-signal-300">admin@resa.test</span> · password
          </p>
          <p>
            <span className="text-signal-300">user@resa.test</span> · password
          </p>
        </div>
      </div>
    </div>
  )
}
