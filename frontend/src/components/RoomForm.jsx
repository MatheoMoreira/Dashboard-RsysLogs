import { useState } from 'react'
import { Button, Field, Input, Textarea } from './ui'

/** Create/edit form for a room, including equipment selection. */
export default function RoomForm({ equipment = [], initialValues = {}, submitLabel = 'Enregistrer', onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialValues.name || '',
    building: initialValues.building || '',
    floor: initialValues.floor ?? 0,
    capacity: initialValues.capacity ?? 1,
    description: initialValues.description || '',
    equipment: initialValues.equipment?.map((e) => e.id) || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleEquipment = (id) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(id) ? f.equipment.filter((x) => x !== id) : [...f.equipment, id],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
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

      <Field label="Nom" htmlFor="name">
        <Input id="name" name="name" required value={form.name} onChange={handleChange} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Bâtiment" htmlFor="building">
          <Input id="building" name="building" required value={form.building} onChange={handleChange} />
        </Field>
        <Field label="Étage" htmlFor="floor">
          <Input id="floor" name="floor" type="number" required value={form.floor} onChange={handleChange} />
        </Field>
        <Field label="Capacité" htmlFor="capacity">
          <Input id="capacity" name="capacity" type="number" min="1" required value={form.capacity} onChange={handleChange} />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange} />
      </Field>

      {equipment.length > 0 && (
        <Field label="Équipements">
          <div className="flex flex-wrap gap-2">
            {equipment.map((eq) => {
              const active = form.equipment.includes(eq.id)
              return (
                <button
                  type="button"
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {eq.name}
                </button>
              )
            })}
          </div>
        </Field>
      )}

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
