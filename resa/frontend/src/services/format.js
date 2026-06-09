/** Formatting helpers shared across the UI. */

export function formatDate(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value + 'T00:00:00') : new Date(value)
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTimeRange(start, end) {
  return `${start} – ${end}`
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
