import { useState } from 'react'
import { Button, Field, Input, Select, Textarea } from './ui'
import { todayIso } from '../services/format'

/**
 * Reusable reservation form. `rooms` is the selectable list; `lockRoom` hides
 * the room selector (used when editing). Calls `onSubmit(payload)`.
 */
export default function ReservationForm({
  rooms = [],
  initialValues = {},
  lockRoom = false,
  submitLabel = 'Réserver',
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    room_id: initialValues.room_id || rooms[0]?.id || '',
    date: initialValues.date || todayIso(),
    start_time: initialValues.start_time || '09:00',
    end_time: initialValues.end_time || '10:00',
    purpose: initialValues.purpose || '',
    participants: initialValues.participants || 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const selectedRoom = rooms.find((r) => String(r.id) === String(form.room_id))

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.end_time <= form.start_time) {
      setError("L'heure de fin doit être postérieure à l'heure de début.")
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        ...form,
        room_id: Number(form.room_id),
        participants: Number(form.participants),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!lockRoom && (
        <Field label="Salle" htmlFor="room_id">
          <Select id="room_id" name="room_id" required value={form.room_id} onChange={handleChange}>
            <option value="" disabled>
              Sélectionner une salle
            </option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} — {room.building} (capacité {room.capacity})
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Date" htmlFor="date">
        <Input id="date" name="date" type="date" required min={todayIso()} value={form.date} onChange={handleChange} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Heure de début" htmlFor="start_time">
          <Input id="start_time" name="start_time" type="time" required step="900" value={form.start_time} onChange={handleChange} />
        </Field>
        <Field label="Heure de fin" htmlFor="end_time">
          <Input id="end_time" name="end_time" type="time" required step="900" value={form.end_time} onChange={handleChange} />
        </Field>
      </div>

      <Field
        label="Nombre de participants"
        htmlFor="participants"
        error={selectedRoom && form.participants > selectedRoom.capacity ? `Capacité maximale : ${selectedRoom.capacity}` : null}
      >
        <Input
          id="participants"
          name="participants"
          type="number"
          min="1"
          max={selectedRoom?.capacity || undefined}
          required
          value={form.participants}
          onChange={handleChange}
        />
      </Field>

      <Field label="Motif" htmlFor="purpose">
        <Textarea id="purpose" name="purpose" rows={3} required value={form.purpose} onChange={handleChange} placeholder="Réunion d'équipe, entretien…" />
      </Field>

      <div className="mt-2 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
