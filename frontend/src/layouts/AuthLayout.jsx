import { Outlet } from 'react-router-dom'

/** Centered, minimal layout for the public login / register pages. */
export default function AuthLayout() {
  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-700 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white shadow-lg">
            R
          </div>
          <h1 className="text-2xl font-bold text-white">Resa</h1>
          <p className="mt-1 text-sm text-slate-300">Réservation de salles</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
