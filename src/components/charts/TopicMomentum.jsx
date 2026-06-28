function MomentumItem({ item, direction }) {
  const color = direction === 'up' ? '#10b981' : '#f43f5e'
  const arrow = direction === 'up' ? '↑' : '↓'

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color, flexShrink: 0, lineHeight: 1.4 }}>
        {arrow}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {item.topic}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
            {direction === 'up' ? '+' : ''}{item.delta}pp
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            {item.first_pct}%
          </span>
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 1, background: item.color,
              width: `${Math.min(item.second_pct * 3, 100)}%`, opacity: 0.7,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)', fontWeight: 500 }}>
            {item.second_pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function TopicMomentum({ momentum }) {
  const hasRising  = momentum?.rising?.length > 0
  const hasFalling = momentum?.falling?.length > 0

  if (!hasRising && !hasFalling) return null

  return (
    <div>
      {/* Time range label */}
      {momentum.first_label && momentum.second_label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{momentum.first_label}</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{momentum.second_label}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Rising */}
        {hasRising && (
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#10b981', margin: '0 0 14px',
            }}>
              Rising interests
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {momentum.rising.map((item) => (
                <MomentumItem key={item.topic} item={item} direction="up" />
              ))}
            </div>
          </div>
        )}

        {/* Falling */}
        {hasFalling && (
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#f43f5e', margin: '0 0 14px',
            }}>
              Fading interests
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {momentum.falling.map((item) => (
                <MomentumItem key={item.topic} item={item} direction="down" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
