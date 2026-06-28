import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: '#eaeaf4' }}>{d.day}</p>
      <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a855f7' }}>{d.visits.toLocaleString()} visits</p>
    </div>
  )
}

// Reorder to start from Monday
function reorderWeek(data) {
  if (!data?.length) return []
  // data[0]=Sun, data[1]=Mon, ..., data[6]=Sat
  return [...data.slice(1), data[0]]
}

export default function WeeklyPattern({ data }) {
  if (!data?.length) return null

  const ordered = reorderWeek(data)
  const max = Math.max(...ordered.map((d) => d.visits))
  const weekend = ['Sat', 'Sun']

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={ordered} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#52526e', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
          {ordered.map((entry) => (
            <Cell
              key={entry.day}
              fill={entry.visits === max ? '#a855f7' : weekend.includes(entry.day) ? '#f472b6' : 'rgba(168,85,247,0.3)'}
              fillOpacity={0.9}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
