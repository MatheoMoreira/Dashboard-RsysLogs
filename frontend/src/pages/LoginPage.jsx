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
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-900">Connexion</h2>
      <p className="mb-6 text-sm text-slate-500">Accédez à votre espace de réservation.</p>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Adresse e-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="vous@exemple.com" />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
        </Field>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Créer un compte
        </Link>
      </p>

      <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Comptes de démonstration</p>
        <p>admin@resa.test / password — Administrateur</p>
        <p>user@resa.test / password — Utilisateur</p>
      </div>
    </div>
  )
}
