/**
 * Dependency-free bar chart. `data` = [{ label, value }].
 * Bars grow in on mount via a CSS transform for a subtle reveal.
 */
export default function BarChart({ data = [], height = 200 }) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 44)
        return (
          <div key={i} className="group flex min-w-[18px] flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[0.625rem] font-medium text-fog-500 opacity-0 transition group-hover:opacity-100">
              {d.value || ''}
            </span>
            <div
              className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-signal-600 to-signal-400 transition-all duration-200 group-hover:from-signal-500 group-hover:to-signal-300"
              style={{
                height: `${Math.max(h, d.value ? 3 : 0)}px`,
                animation: `grow-bar 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.025}s both`,
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="w-full truncate text-center text-[0.5625rem] font-medium text-fog-600">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
