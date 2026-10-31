import { useState } from 'react'
import { summarizeCalendar } from '../../lib/chartSummaries'

const CELL  = 11
const GAP   = 2
const STEP  = CELL + GAP

function cellColor(value, max) {
  if (!value || !max) return 'rgba(255,255,255,0.04)'
  const r = value / max
  if (r < 0.1)  return 'rgba(168,85,247,0.22)'
  if (r < 0.25) return 'rgba(168,85,247,0.42)'
  if (r < 0.5)  return 'rgba(168,85,247,0.62)'
  if (r < 0.75) return 'rgba(168,85,247,0.82)'
  return '#a855f7'
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_ABBR    = ['S','M','T','W','T','F','S']

export default function ActivityCalendar({ calendar }) {
  const [tooltip, setTooltip] = useState(null)
  const { days, max } = calendar || {}

  if (!days?.length || max === 0) {
    return (
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', padding: '24px 0' }}>
        Timestamp data required for activity calendar.
      </p>
    )
  }

  // Group days into complete weeks (Sun=0 … Sat=6)
  const weeks = []
  let week = new Array(days[0] ? new Date(days[0].date).getDay() : 0).fill(null)
  days.forEach((d) => {
    if (week.length === 7) { weeks.push(week); week = [] }
    week.push(d)
  })
  if (week.length < 7) while (week.length < 7) week.push(null)
  weeks.push(week)

  // Month labels: place at the first week of each month
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((wk, wi) => {
    const firstDay = wk.find(Boolean)
    if (!firstDay) return
    const m = new Date(firstDay.date).getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ wi, label: MONTH_NAMES[m] })
      lastMonth = m
    }
  })

  const LEFT_PAD = 18
  const TOP_PAD  = 18
  // Wide enough for the Less/More legend even when the history is short.
  const W = Math.max(weeks.length * STEP + LEFT_PAD + 4, 150) + 28
  const H = 7 * STEP + TOP_PAD + 22

  const totalVisits = days.reduce((s, d) => s + d.visits, 0)
  const activeDays  = days.filter((d) => d.visits > 0).length

  return (
    <div>
      <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }} tabIndex={0} role="region" aria-label="Activity calendar">
        {/* Hover tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', pointerEvents: 'none', zIndex: 20,
            background: '#13132a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', fontSize: 11,
            left: tooltip.x, top: tooltip.y - 42,
            fontFamily: 'var(--font-mono)', color: 'var(--text)', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#a855f7', fontWeight: 600 }}>{tooltip.visits}</span>
            {' '}visits · {tooltip.date}
          </div>
        )}

        <svg width={W} height={H} style={{ display: 'block', minWidth: Math.min(W, 300) }} role="img" aria-label={summarizeCalendar(calendar)}>
          {/* Month labels */}
          {monthLabels.map(({ wi, label }) => (
            <text key={`${wi}-${label}`}
              x={LEFT_PAD + wi * STEP} y={11}
              fill="#8b8ba7" fontSize={9} fontFamily="var(--font-mono)"
            >
              {label}
            </text>
          ))}

          {/* Day-of-week labels (Mon, Wed, Fri) */}
          {[1, 3, 5].map((di) => (
            <text key={di}
              x={LEFT_PAD - 4} y={TOP_PAD + di * STEP + CELL / 2 + 3}
              fill="#8b8ba7" fontSize={8} textAnchor="end" fontFamily="var(--font-mono)"
            >
              {DAY_ABBR[di]}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((wk, wi) =>
            wk.map((day, di) =>
              day ? (
                <rect
                  key={`${wi}-${di}`}
                  x={LEFT_PAD + wi * STEP}
                  y={TOP_PAD + di * STEP}
                  width={CELL} height={CELL} rx={2}
                  fill={cellColor(day.visits, max)}
                  style={{ cursor: day.visits > 0 ? 'default' : 'default' }}
                  onMouseEnter={(e) => {
                    if (!day.visits) return
                    const r = e.currentTarget.getBoundingClientRect()
                    const p = e.currentTarget.closest('[data-cal]')?.getBoundingClientRect() ||
                              e.currentTarget.closest('div').getBoundingClientRect()
                    setTooltip({ x: r.left - (p?.left || 0) + CELL / 2, y: r.top - (p?.top || 0), visits: day.visits, date: day.date })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ) : (
                <rect
                  key={`${wi}-${di}-empty`}
                  x={LEFT_PAD + wi * STEP}
                  y={TOP_PAD + di * STEP}
                  width={CELL} height={CELL} rx={2}
                  fill="rgba(255,255,255,0.02)"
                />
              )
            )
          )}

          {/* Legend (right-aligned; leaves room for the "More" label) */}
          {[0, 0.12, 0.35, 0.65, 1].map((r, i) => (
            <rect key={i}
              x={W - 112 + i * 14} y={H - 13}
              width={CELL} height={CELL} rx={2}
              fill={cellColor(r * max, max)}
            />
          ))}
          <text x={W - 116} y={H - 5} fill="#8b8ba7" fontSize={8} textAnchor="end" fontFamily="var(--font-mono)">Less</text>
          <text x={W - 112 + 5 * 14 + 2} y={H - 5} fill="#8b8ba7" fontSize={8} fontFamily="var(--font-mono)">More</text>
        </svg>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '8px 24px', flexWrap: 'wrap', marginTop: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{activeDays}</span> active days
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{totalVisits.toLocaleString()}</span> total visits shown
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          peak <span style={{ color: '#a855f7', fontWeight: 500 }}>{max}</span>/day
        </span>
      </div>
    </div>
  )
}
