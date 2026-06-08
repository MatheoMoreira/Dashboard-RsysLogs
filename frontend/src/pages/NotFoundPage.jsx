import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <p className="label-mono mb-4">status 404 · route not found</p>
      <p className="font-display text-7xl font-extrabold tracking-tight text-signal-400">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-fog-50">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-fog-500">
        La ressource demandée n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-signal-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-300"
      >
        ← Retour à l'accueil
      </Link>
    </div>
  )
}
