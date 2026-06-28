export default function SearchCloud({ searches }) {
  if (!searches?.length) return null
  const top = searches.slice(0, 30)
  const max = top[0]?.count || 1

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, lineHeight: 1 }}>
      {top.map((s) => {
        const w = 0.5 + (s.count / max) * 0.5
        const sz = 11 + w * 5
        const alpha = 0.45 + w * 0.55
        return (
          <span
            key={s.query}
            title={`Searched ${s.count} times`}
            style={{
              display: 'inline-flex',
              padding: `${4 + w * 2}px ${8 + w * 4}px`,
              borderRadius: 100,
              fontSize: sz,
              fontFamily: 'var(--font-display)',
              fontWeight: Math.round(400 + w * 300),
              color: `rgba(199,210,254,${alpha})`,
              background: `rgba(168,85,247,${w * 0.18})`,
              border: `1px solid rgba(168,85,247,${w * 0.35})`,
              cursor: 'default',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(168,85,247,${w * 0.28})`; e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(168,85,247,${w * 0.18})`; e.currentTarget.style.color = `rgba(199,210,254,${alpha})` }}
          >
            {s.query}
          </span>
        )
      })}
    </div>
  )
}
