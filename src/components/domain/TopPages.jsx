import { textTint } from '../../lib/color'

function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

export default function TopPages({ pages }) {
  if (!pages?.length) return null

  const max = pages[0]?.visits || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {pages.slice(0, 12).map((page, i) => (
        <div key={page.url} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Rank */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
            minWidth: 18, paddingTop: 3, flexShrink: 0,
          }}>
            {String(i + 1).padStart(2, '0')}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title + domain */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.3 }}
                title={page.url}
              >
                {truncate(page.title || page.domain, 55)}
              </a>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: textTint(page.color), flexShrink: 0 }}>
                {page.domain}
              </span>
            </div>

            {/* Bar + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${(page.visits / max) * 100}%`, height: '100%', background: page.color, opacity: 0.7, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                {page.visits.toLocaleString()}
                {page.duration_min ? ` · ${page.duration_min}m` : ''}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
