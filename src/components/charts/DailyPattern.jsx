import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { summarizeDailyPattern } from '../../lib/chartSummaries'

const fmtH = (h) => h === 0 ? '12A' : h === 12 ? '12P' : h < 12 ? `${h}A` : `${h - 12}P`

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const full = label === 0 ? '12 AM' : label < 12 ? `${label} AM` : label === 12 ? '12 PM' : `${label - 12} PM`
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8b8ba7' }}>{full}</p>
      <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'white' }}>
        {payload[0].value.toLocaleString()} visits
      </p>
    </div>
  )
}

export default function DailyPattern({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data.map((d) => d.visits))
  return (
    <div role="img" aria-label={summarizeDailyPattern(data)}>
    <ResponsiveContainer width="100%" height={170}>
      <BarChart accessibilityLayer={false} data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="hour"
          interval={0}
          tickFormatter={(h) => h % 6 === 0 ? fmtH(h) : ''}
          tick={{ fill: '#8b8ba7', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="visits" radius={[3, 3, 0, 0]} maxBarSize={22}>
          {data.map((d, i) => {
            const ratio = max > 0 ? d.visits / max : 0
            const isPeak = d.visits === max && max > 0
            return (
              <Cell
                key={i}
                fill={isPeak ? '#a855f7' : `rgba(168,85,247,${0.15 + ratio * 0.65})`}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  )
}
