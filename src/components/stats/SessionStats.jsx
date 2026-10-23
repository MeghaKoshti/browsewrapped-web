function Metric({ label, value, sub, color = '#a855f7' }) {
  return (
    <div style={{
      // 2×2 on phones, one row on wider screens.
      flex: '1 1 130px', minWidth: 0, textAlign: 'center', padding: '16px 12px',
      borderRadius: 12, border: '1px solid var(--border)',
      background: 'rgba(255,255,255,0.015)',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        fontWeight: 700, color, margin: 0, lineHeight: 1,
      }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8b8ba7', margin: '3px 0 0' }}>{sub}</p>}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', margin: '6px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
    </div>
  )
}

export default function SessionStats({ sessions, summary, streaks }) {
  if (!sessions?.total_sessions) return null

  const fmtMin = (m) => {
    if (!m) return '—'
    if (m < 60) return `${Math.round(m)}m`
    const h = Math.floor(m / 60)
    const rem = Math.round(m % 60)
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`
  }

  const totalHours = sessions.total_hours_browsed
  const totalFmt = totalHours >= 1 ? `${totalHours}h` : `${Math.round(totalHours * 60)}m`

  return (
    <div>
      {/* Session metrics */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: streaks?.current > 0 ? 16 : 0 }}>
        <Metric
          label="Total sessions"
          value={sessions.total_sessions.toLocaleString()}
          sub={summary?.total_days ? `over ${summary.total_days} days` : null}
          color="#a855f7"
        />
        <Metric
          label="Avg session"
          value={fmtMin(sessions.avg_duration_minutes)}
          color="#06b6d4"
        />
        <Metric
          label="Longest session"
          value={fmtMin(sessions.longest_session_minutes)}
          color="#f472b6"
        />
        <Metric
          label="Total browsing"
          value={totalFmt}
          sub={summary?.avg_daily_minutes ? `~${summary.avg_daily_minutes}m / day` : null}
          color="#f59e0b"
        />
      </div>

      {/* Streak badges */}
      {streaks && (streaks.current > 0 || streaks.longest > 0) && (
        <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {streaks.current > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#a855f7' }}>{streaks.current}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>day streak</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', margin: 0 }}>current</p>
              </div>
            </div>
          )}
          {streaks.longest > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{streaks.longest}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>day streak</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', margin: 0 }}>longest ever</p>
              </div>
            </div>
          )}
          {streaks.total_active_days > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#06b6d4' }}>{streaks.total_active_days}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>active days</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', margin: 0 }}>in this history</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
