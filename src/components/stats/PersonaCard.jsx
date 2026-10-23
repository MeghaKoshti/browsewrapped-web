import DownloadCardButton from './DownloadCardButton'

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return '168,85,247'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// report – the full report, used to build the downloadable image (optional)
export default function PersonaCard({ persona, report = null }) {
  if (!persona?.title) return null

  const rgb = hexToRgb(persona.color)

  return (
    <div style={{
      borderRadius: 20,
      background: `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 100%)`,
      border: `1px solid rgba(${rgb},0.28)`,
      padding: '36px 40px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orb */}
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 260, height: 260,
        borderRadius: '50%', background: persona.color, opacity: 0.06,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40, width: 140, height: 140,
        borderRadius: '50%', background: persona.color, opacity: 0.04,
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Label */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.25em',
        color: persona.color, textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        You are
      </p>

      {/* Title */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(2rem, 5vw, 3.2rem)',
        fontWeight: 800, color: '#eaeaf4',
        margin: '0 0 16px', lineHeight: 1.05, letterSpacing: '-0.02em',
      }}>
        {persona.title}
      </h2>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 15, color: '#8892a4',
        margin: '0 0 24px', maxWidth: 500, lineHeight: 1.65,
      }}>
        {persona.description}
      </p>

      {/* Trait pills */}
      {persona.traits?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {persona.traits.map((trait) => (
            <span key={trait} style={{
              padding: '5px 14px', borderRadius: 20,
              background: `rgba(${rgb},0.12)`,
              border: `1px solid rgba(${rgb},0.3)`,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: persona.color, letterSpacing: '0.04em',
            }}>
              {trait}
            </span>
          ))}
        </div>
      )}

      {/* Stat label */}
      {persona.stat_label && (
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--muted)', margin: 0, letterSpacing: '0.04em',
        }}>
          {persona.stat_label}
        </p>
      )}

      {report && (
        <div style={{ marginTop: 24, position: 'relative' }}>
          <DownloadCardButton report={report} color={persona.color} />
        </div>
      )}
    </div>
  )
}
