import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-100 px-4 text-center">
      <p className="text-6xl font-black text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Page introuvable</h1>
      <p className="mt-2 text-sm text-slate-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
        Retour à l'accueil
      </Link>
    </div>
  )
}
