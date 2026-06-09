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
      toast.success(`Bienvenue, ${user.firstname} !`)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(extractError(err, 'Connexion impossible.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reveal">
      <p className="label-mono mb-2 text-signal-300">Connexion</p>
      <h2 className="font-display text-3xl font-medium tracking-tight text-fog-50">Bon retour</h2>
      <p className="mt-2 text-sm text-fog-500">Accédez à votre espace de réservation.</p>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="vous@exemple.com" />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
        </Field>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fog-500">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-signal-300 transition hover:text-signal-400">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
