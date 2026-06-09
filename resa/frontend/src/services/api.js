import http from './http'

/**
 * Thin, typed-ish wrappers around the REST API. Components never touch Axios
 * directly — they call these named functions, keeping API concerns in one place.
 */

export const authApi = {
  register: (payload) => http.post('/auth/register', payload),
  login: (payload) => http.post('/auth/login', payload),
  logout: () => http.post('/auth/logout'),
  me: () => http.get('/auth/me'),
}

export const roomsApi = {
  list: () => http.get('/rooms'),
  get: (id) => http.get(`/rooms/${id}`),
  create: (payload) => http.post('/rooms', payload),
  update: (id, payload) => http.put(`/rooms/${id}`, payload),
  remove: (id) => http.delete(`/rooms/${id}`),
}

export const equipmentApi = {
  list: () => http.get('/equipment'),
  create: (payload) => http.post('/equipment', payload),
}

export const reservationsApi = {
  mine: () => http.get('/reservations/mine'),
  all: (params) => http.get('/reservations', { params }),
  get: (id) => http.get(`/reservations/${id}`),
  create: (payload) => http.post('/reservations', payload),
  update: (id, payload) => http.put(`/reservations/${id}`, payload),
  cancel: (id) => http.delete(`/reservations/${id}`),
}

export const usersApi = {
  list: () => http.get('/users'),
  create: (payload) => http.post('/users', payload),
  update: (id, payload) => http.put(`/users/${id}`, payload),
  remove: (id) => http.delete(`/users/${id}`),
}

export const statsApi = {
  dashboard: () => http.get('/stats/dashboard'),
}

/** Normalises Laravel error responses into a single readable message. */
export function extractError(error, fallback = 'Une erreur est survenue.') {
  const data = error?.response?.data
  if (!data) return fallback
  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  return data.message || fallback
}
