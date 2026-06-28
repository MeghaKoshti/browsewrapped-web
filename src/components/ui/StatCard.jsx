export default function StatCard({ label, value, sub, color }) {
  const glowRgb = color
    ? hexToRgb(color)
    : '168,85,247'

  return (
    <div
      className="card card-glow p-6 flex flex-col justify-between min-h-[130px]"
      style={{ '--glow-color': `rgba(${glowRgb},0.2)` }}
    >
      <p className="section-label" style={{ color: color || 'var(--accent)' }}>{label}</p>
      <div>
        <p
          className="display leading-none mt-2"
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 700,
            color: color || 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return isNaN(r) ? '168,85,247' : `${r},${g},${b}`
}
