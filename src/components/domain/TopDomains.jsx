export default function TopDomains({ domains }) {
  if (!domains?.length) return null
  const top = domains.slice(0, 15)
  const max = top[0]?.visits || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {top.map((d, i) => (
        <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', width: 18, textAlign: 'right', flexShrink: 0 }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                {d.domain}
              </span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, marginLeft: 6 }}>
                {d.visits.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(d.visits / max) * 100}%`,
                  background: d.color || '#a855f7',
                  opacity: 0.75,
                  borderRadius: 1,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
