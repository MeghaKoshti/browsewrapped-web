import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { summarizeTimeByTopic } from '../../lib/chartSummaries'
import { textTint } from '../../lib/color'

const CustomTooltip = ({ active, payload, mode }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: textTint(d.color) }}>{d.name}</p>
      {mode === 'time' ? (
        <>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#eaeaf4' }}>{d.hours}h <span style={{ color: '#8b8ba7' }}>({d.minutes} min)</span></p>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8b8ba7' }}>{d.percentage}% of browsing time</p>
        </>
      ) : (
        <>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#eaeaf4' }}>{d.visits_with_duration?.toLocaleString()} visits</p>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8b8ba7' }}>{d.percentage}% of timed visits</p>
        </>
      )}
    </div>
  )
}

export default function TimeByTopic({ timeByTopic }) {
  const [mode, setMode] = useState('time')

  if (!timeByTopic?.length) return null

  const top = timeByTopic.slice(0, 10)
  const dataKey = mode === 'time' ? 'hours' : 'visits_with_duration'
  const total = mode === 'time'
    ? timeByTopic.reduce((s, t) => s + t.hours, 0).toFixed(1)
    : timeByTopic.reduce((s, t) => s + (t.visits_with_duration || 0), 0).toLocaleString()

  return (
    <div>
      {/* Toggle + summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>
          Total: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{total}{mode === 'time' ? 'h' : ' visits'}</span>
        </p>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
          {['time', 'visits'].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m ? '#7e22ce' : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)',
              }}
            >
              {m === 'time' ? 'Time spent' : 'Visit count'}
            </button>
          ))}
        </div>
      </div>

      <div role="img" aria-label={summarizeTimeByTopic(top, mode)}>
      <ResponsiveContainer width="100%" height={Math.max(220, top.length * 36)}>
        <BarChart accessibilityLayer={false} data={top} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'var(--font-display)' }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} minPointSize={3}>
            {top.map((entry) => (
              <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>

      {/* Legend: total hours per top 3 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {top.slice(0, 4).map((t) => (
          <span key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
            {t.name}: <span style={{ color: 'var(--text)' }}>{mode === 'time' ? `${t.hours}h` : t.visits_with_duration?.toLocaleString()}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
