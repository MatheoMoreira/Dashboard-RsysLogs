import { Navigate, Route, Routes } from 'react-router-dom'

import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import RoomsPage from './pages/RoomsPage'
import RoomDetailPage from './pages/RoomDetailPage'
import MyReservationsPage from './pages/MyReservationsPage'
import NewReservationPage from './pages/NewReservationPage'

import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminRoomsPage from './pages/admin/AdminRoomsPage'
import AdminReservationsPage from './pages/admin/AdminReservationsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/reservations" element={<MyReservationsPage />} />
          <Route path="/reservations/new" element={<NewReservationPage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/rooms" element={<AdminRoomsPage />} />
          <Route path="/admin/reservations" element={<AdminReservationsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
