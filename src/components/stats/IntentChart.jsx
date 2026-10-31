import { textTint } from '../../lib/color'

const SEGMENTS = [
  { key: 'typed_pct',  label: 'Typed directly', color: '#a855f7', desc: 'You knew where you were going' },
  { key: 'search_pct', label: 'Via search',      color: '#06b6d4', desc: 'Discovered through search engines' },
  { key: 'link_pct',   label: 'Followed links',  color: '#f472b6', desc: 'Clicked through from other pages' },
  { key: 'other_pct',  label: 'Other',            color: '#475569', desc: 'Bookmarks, reloads, forms' },
]

export default function IntentChart({ intent }) {
  if (!intent) return null

  const hasData = intent.typed_pct > 0 || intent.search_pct > 0 || intent.link_pct > 0

  return (
    <div>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 20, gap: 2 }}>
        {SEGMENTS.map(({ key, color }) => {
          const pct = intent[key] || 0
          return pct > 0 ? (
            <div key={key} style={{ flex: `0 0 ${pct}%`, background: color, opacity: 0.85, borderRadius: 3 }} title={`${pct}%`} />
          ) : null
        })}
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SEGMENTS.map(({ key, label, color, desc }) => {
          const pct = intent[key] || 0
          if (!hasData && pct === 0) return null
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: textTint(color), flexShrink: 0 }}>
                {pct}%
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, opacity: 0.7, borderRadius: 2 }} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', margin: '3px 0 0' }}>{desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Top intentionally typed domains */}
      {intent.top_intentional?.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Most intentionally visited
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {intent.top_intentional.slice(0, 8).map((d) => (
              <div key={d.domain} style={{
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.08)',
                fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c4b5fd',
              }}>
                {d.domain}
                <span style={{ color: 'rgba(196,181,253,0.8)', marginLeft: 5 }}>×{d.typed_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasData && (
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', padding: '12px 0 0' }}>
          Navigation data available for Chrome direct import only.
        </p>
      )}
    </div>
  )
}
