import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <p className="label-mono mb-4 text-signal-300">Erreur 404</p>
      <p className="font-display text-7xl font-medium tracking-tight text-signal-300">404</p>
      <h1 className="mt-4 font-display text-2xl font-medium text-fog-50">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-fog-500">
        La page demandée n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-signal-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-500"
      >
        ← Retour à l'accueil
      </Link>
    </div>
  )
}
