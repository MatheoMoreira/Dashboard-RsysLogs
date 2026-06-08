/**
 * Minimal dependency-free bar chart. `data` is an array of { label, value }.
 */
export default function BarChart({ data = [], height = 180 }) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="flex items-end gap-1.5 overflow-x-auto" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex min-w-[20px] flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-medium text-slate-500">{d.value || ''}</span>
          <div
            className="w-full rounded-t bg-brand-500 transition-all hover:bg-brand-600"
            style={{ height: `${(d.value / max) * (height - 40)}px`, minHeight: d.value ? '4px' : '0' }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="w-full truncate text-center text-[10px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
