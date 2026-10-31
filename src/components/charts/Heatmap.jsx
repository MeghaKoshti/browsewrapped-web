import { useState } from 'react'
import { summarizeHeatmap } from '../../lib/chartSummaries'

const CELL = 21
const GAP  = 3
const STEP = CELL + GAP
const LEFT_PAD  = 34
const BOTTOM_PAD = 18

function cellColor(value, max) {
  if (!value || !max) return 'rgba(255,255,255,0.04)'
  const r = value / max
  if (r < 0.1)  return 'rgba(168,85,247,0.18)'
  if (r < 0.25) return 'rgba(168,85,247,0.35)'
  if (r < 0.5)  return 'rgba(168,85,247,0.55)'
  if (r < 0.75) return 'rgba(168,85,247,0.78)'
  return '#a855f7'
}

function fmtHour(h) {
  if (h === 0)  return '12A'
  if (h === 12) return '12P'
  return h < 12 ? `${h}A` : `${h - 12}P`
}

export default function Heatmap({ heatmap }) {
  const [tooltip, setTooltip] = useState(null)
  const { grid, max, day_labels } = heatmap || {}

  if (!grid?.length || max === 0) {
    return (
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', padding: '24px 0' }}>
        Timestamp data required for heatmap.
      </p>
    )
  }

  const W = 24 * STEP + LEFT_PAD
  const H = 7 * STEP + BOTTOM_PAD

  const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 23]

  return (
    // Focusable so keyboard users can scroll it sideways on narrow screens.
    <div style={{ position: 'relative', overflowX: 'auto' }} tabIndex={0} role="region" aria-label="Day by hour heatmap">
      {tooltip && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', zIndex: 10,
          background: '#13132a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '7px 12px', fontSize: 12,
          left: tooltip.x, top: tooltip.y - 52,
          fontFamily: 'var(--font-mono)', color: 'var(--text)', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#a855f7', fontWeight: 600 }}>{tooltip.visits}</span>
          {' '}visits · {tooltip.day} {tooltip.hour}
        </div>
      )}

      <svg width={W} height={H} style={{ display: 'block', minWidth: W }} role="img" aria-label={summarizeHeatmap(heatmap)}>
        {/* Day labels */}
        {(day_labels || []).map((day, di) => (
          <text
            key={day}
            x={LEFT_PAD - 6}
            y={di * STEP + CELL / 2 + 4}
            fill="#8b8ba7" fontSize={10} textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            {day}
          </text>
        ))}

        {/* Hour labels */}
        {HOUR_TICKS.map((h) => (
          <text
            key={h}
            x={LEFT_PAD + h * STEP + CELL / 2}
            y={7 * STEP + BOTTOM_PAD - 4}
            fill="#8b8ba7" fontSize={9} textAnchor="middle"
            fontFamily="var(--font-mono)"
          >
            {fmtHour(h)}
          </text>
        ))}

        {/* Cells */}
        {grid.map((row, di) =>
          row.map((value, hi) => (
            <rect
              key={`${di}-${hi}`}
              x={LEFT_PAD + hi * STEP}
              y={di * STEP}
              width={CELL}
              height={CELL}
              rx={3}
              fill={cellColor(value, max)}
              style={{ cursor: value > 0 ? 'default' : 'default', transition: 'fill 0.1s' }}
              onMouseEnter={(e) => {
                if (!value) return
                const rect = e.currentTarget.getBoundingClientRect()
                const parent = e.currentTarget.closest('div').getBoundingClientRect()
                setTooltip({
                  x: rect.left - parent.left + CELL / 2,
                  y: rect.top  - parent.top,
                  visits: value,
                  day: (day_labels || [])[di] || '',
                  hour: `${fmtHour(hi)}`,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>Less</span>
        {[0, 0.1, 0.3, 0.6, 1].map((r) => (
          <div key={r} style={{ width: 12, height: 12, borderRadius: 2, background: cellColor(r * max, max) }} />
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>More</span>
      </div>
    </div>
  )
}
