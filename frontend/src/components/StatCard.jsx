/** KPI tile — console readout style with mono key + large display value. */
export default function StatCard({ label, value, code, accent = 'signal', delay = 0 }) {
  const accents = {
    signal: 'text-signal-400',
    ok: 'text-ok-400',
    alert: 'text-alert-400',
    warn: 'text-warn-400',
    fog: 'text-fog-50',
  }
  return (
    <div
      className="reveal panel group relative overflow-hidden p-5"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* corner tick */}
      <span className="absolute right-4 top-4 font-mono text-[0.625rem] text-fog-600">{code}</span>
      <p className="label-mono">{label}</p>
      <p className={`mt-3 font-display text-4xl font-extrabold tabular-nums ${accents[accent]}`}>{value}</p>
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-signal-400 transition-all duration-500 group-hover:w-full" />
    </div>
  )
}
