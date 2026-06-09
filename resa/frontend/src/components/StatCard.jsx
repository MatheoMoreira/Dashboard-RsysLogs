/** KPI tile — clean corporate readout with a quiet label and a large value. */
export default function StatCard({ label, value, accent = 'signal', delay = 0 }) {
  const accents = {
    signal: 'text-signal-300',
    ok: 'text-ok-400',
    alert: 'text-alert-400',
    warn: 'text-warn-400',
    fog: 'text-fog-50',
  }
  return (
    <div className="reveal panel group relative overflow-hidden p-5" style={{ animationDelay: `${delay}s` }}>
      <p className="label-mono leading-tight">{label}</p>
      <p className={`mt-3 font-display text-4xl font-medium tabular-nums ${accents[accent]}`}>{value}</p>
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-signal-400 transition-all duration-500 group-hover:w-full" />
    </div>
  )
}
