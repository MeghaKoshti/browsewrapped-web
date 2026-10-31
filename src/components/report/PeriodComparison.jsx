import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import SectionHeader from '../ui/SectionHeader'
import { hasPeriodComparison, formatRange, describeChange, summarizeTopics } from '../../lib/periodComparison'

// Series colours: "then" in cyan, "now" in the app accent. Checked with the
// dataviz palette validator against the card surface (#0d0d1c).
const PREVIOUS_COLOR = '#0891b2'
const CURRENT_COLOR = '#a855f7'

const ARROW_COLOR = { up: '#34d399', down: '#fb7185', flat: 'var(--muted)', new: '#fbbf24' }

function ChangeTile({ label, value, previousValue, change, previousLabel }) {
  return (
    <div className="card" style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.015)' }}>
      <p className="section-label" style={{ margin: 0 }}>{label}</p>
      <p className="display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: 'var(--text)', margin: '8px 0 6px', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span aria-hidden="true" style={{ color: ARROW_COLOR[change.direction], fontSize: 11 }}>{change.arrow}</span>
        <span style={{ fontWeight: 600 }}>{change.text}</span>
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
        {previousLabel}: {previousValue}
      </p>
    </div>
  )
}

const Tip = ({ active, payload, labels }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const change = describeChange({ pct: d.change_pct })
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', minWidth: 170 }}>
      <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{d.topic}</p>
      {[[labels.previous, d.previous, PREVIOUS_COLOR], [labels.current, d.current, CURRENT_COLOR]].map(([name, v, color]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{name}</span>
          <span style={{ fontWeight: 600 }}>{v.toLocaleString()}</span>
        </div>
      ))}
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>{change.arrow} {change.text}</p>
    </div>
  )
}

function LegendKey({ color, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text)' }}>
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      {children}
    </span>
  )
}

// "Then vs now": the latest window of the history against the one before it.
// Renders nothing for older reports or histories too short to compare.
export default function PeriodComparison({ comparison }) {
  if (!hasPeriodComparison(comparison)) return null

  const { current, previous, changes = {}, topics = [] } = comparison
  const labels = { current: current.label, previous: previous.label }
  const summary = summarizeTopics(comparison)
  const summaryId = 'period-comparison-summary'

  return (
    <section className="card p-6 md:p-7" aria-labelledby="period-comparison-title">
      <SectionHeader
        label="Then vs now"
        title={<span id="period-comparison-title">{current.label} vs the {comparison.window_days} days before</span>}
        description={`${formatRange(current)} compared with ${formatRange(previous)}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <ChangeTile
          label="Visits"
          value={current.visits.toLocaleString()}
          previousValue={previous.visits.toLocaleString()}
          previousLabel={previous.label}
          change={describeChange({ pct: changes.visits_pct })}
        />
        <ChangeTile
          label="Active days"
          value={current.active_days}
          previousValue={previous.active_days}
          previousLabel={previous.label}
          change={describeChange({ delta: changes.active_days_delta, unit: changes.active_days_delta === 1 || changes.active_days_delta === -1 ? 'day' : 'days' })}
        />
        <ChangeTile
          label="Hours"
          value={`${current.hours}h`}
          previousValue={`${previous.hours}h`}
          previousLabel={previous.label}
          change={describeChange({ pct: changes.hours_pct })}
        />
      </div>

      {topics.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h3 className="display" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Visits by topic</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <LegendKey color={PREVIOUS_COLOR}>{previous.label}</LegendKey>
              <LegendKey color={CURRENT_COLOR}>{current.label}</LegendKey>
            </div>
          </div>

          <div role="img" aria-label={`Bar chart of visits per topic: ${current.label.toLowerCase()} compared with ${previous.label.toLowerCase()}`} aria-describedby={summaryId}>
            <ResponsiveContainer width="100%" height={Math.max(160, topics.length * 44)}>
              <BarChart data={topics} layout="vertical" margin={{ left: 0, right: 44, top: 0, bottom: 0 }} barGap={2} barCategoryGap="22%" accessibilityLayer={false}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="topic" width={104} axisLine={false} tickLine={false}
                  tick={{ fill: '#a3a3bd', fontSize: 12, fontFamily: 'var(--font-display)' }}
                />
                <Tooltip content={<Tip labels={labels} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="previous" name={previous.label} fill={PREVIOUS_COLOR} barSize={10} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                <Bar dataKey="current" name={current.label} fill={CURRENT_COLOR} barSize={10} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="current" position="right" style={{ fill: '#a3a3bd', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p id={summaryId} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: '12px 0 0', maxWidth: '68ch' }}>
            {summary}
          </p>

          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--accent-text)', width: 'fit-content' }}>Show as a table</summary>
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: 'var(--text)' }}>
                <caption className="sr-only">Visits per topic, {previous.label.toLowerCase()} and {current.label.toLowerCase()}</caption>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                    <th scope="col" style={{ padding: '6px 8px 6px 0', fontWeight: 500 }}>Topic</th>
                    <th scope="col" style={{ padding: 6, fontWeight: 500, textAlign: 'right' }}>{previous.label}</th>
                    <th scope="col" style={{ padding: 6, fontWeight: 500, textAlign: 'right' }}>{current.label}</th>
                    <th scope="col" style={{ padding: '6px 0 6px 6px', fontWeight: 500, textAlign: 'right' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t) => (
                    <tr key={t.topic} style={{ borderTop: '1px solid var(--border)' }}>
                      <th scope="row" style={{ padding: '6px 8px 6px 0', fontWeight: 500, textAlign: 'left' }}>{t.topic}</th>
                      <td style={{ padding: 6, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.previous.toLocaleString()}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.current.toLocaleString()}</td>
                      <td style={{ padding: '6px 0 6px 6px', textAlign: 'right' }}>{describeChange({ pct: t.change_pct }).text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  )
}
