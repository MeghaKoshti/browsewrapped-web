import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { summarizeMonthlyTrends } from '../../lib/chartSummaries'

const COLORS = ['#a855f7', '#ec4899', '#f97316', '#3b82f6', '#10b981', '#eab308']

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', minWidth: 140 }}>
      <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8b8ba7' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-display)', flex: 1 }}>{p.dataKey}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)' }}>
            {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyTrends({ monthlyTrends }) {
  const { labels = [], data = [] } = monthlyTrends || {}
  if (!data.length || !labels.length) return null
  return (
    <div role="img" aria-label={summarizeMonthlyTrends(monthlyTrends)}>
    <ResponsiveContainer width="100%" height={260}>
      <LineChart accessibilityLayer={false} data={data} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tickFormatter={(m) => m.slice(5)}
          tick={{ fill: '#8b8ba7', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<Tip />} />
        <Legend
          iconType="circle" iconSize={7}
          formatter={(v) => <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#8b8ba7' }}>{v}</span>}
        />
        {labels.map((label, i) => (
          <Line
            key={label} type="monotone" dataKey={label}
            stroke={COLORS[i % COLORS.length]} strokeWidth={2}
            dot={false} activeDot={{ r: 4, fill: COLORS[i % COLORS.length] }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </div>
  )
}
