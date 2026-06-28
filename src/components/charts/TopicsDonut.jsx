import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 14 }}>{d.name}</p>
      <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6b7280' }}>
        {d.visits.toLocaleString()} visits · {d.percentage}%
      </p>
    </div>
  )
}

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
  if (percentage < 6) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * R)
  const y = cy + r * Math.sin(-midAngle * R)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight="700" fontFamily="var(--font-display)">
      {percentage}%
    </text>
  )
}

export default function TopicsDonut({ topics }) {
  if (!topics?.length) return null
  const top = topics.slice(0, 10)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={top} cx="50%" cy="44%"
          innerRadius={70} outerRadius={118}
          paddingAngle={2} dataKey="visits" nameKey="name"
          labelLine={false} label={renderLabel}
        >
          {top.map((e) => <Cell key={e.name} fill={e.color} />)}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend
          iconType="circle" iconSize={7}
          formatter={(v) => <span style={{ fontFamily: 'var(--font-display)', color: '#6b7280', fontSize: 11 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
