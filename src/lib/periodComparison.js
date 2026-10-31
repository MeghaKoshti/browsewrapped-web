// Helpers for the "Then vs now" section. Kept free of React so they are easy
// to unit test and reuse (e.g. for alt text).

// Older reports don't have `period_comparison`; short histories send null.
export function hasPeriodComparison(pc) {
  return Boolean(pc?.current && pc?.previous)
}

// 'YYYY-MM-DD' → 'Sep 1'. Parsed as UTC so the day never shifts with the
// viewer's timezone.
export function formatDay(iso) {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function formatRange(period) {
  if (!period?.from || !period?.to) return ''
  return `${formatDay(period.from)} – ${formatDay(period.to)}`
}

// Describes a change as an arrow plus words, so direction never relies on
// colour alone.
//   pct:   percent change (null when the previous value was 0)
//   delta: absolute change (used for active days)
export function describeChange({ pct, delta, unit = '' }) {
  if (delta != null) {
    if (delta === 0) return { direction: 'flat', arrow: '■', text: 'Same as before' }
    const n = Math.abs(delta)
    const word = delta > 0 ? 'more' : 'fewer'
    return { direction: delta > 0 ? 'up' : 'down', arrow: delta > 0 ? '▲' : '▼', text: `${n} ${word}${unit ? ` ${unit}` : ''}` }
  }
  if (pct == null) return { direction: 'new', arrow: '★', text: 'New this period' }
  if (pct === 0) return { direction: 'flat', arrow: '■', text: 'No change' }
  return { direction: pct > 0 ? 'up' : 'down', arrow: pct > 0 ? '▲' : '▼', text: `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'}` }
}

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

// A short plain-English summary of the topic chart for screen readers and
// anyone who prefers text over bars.
export function summarizeTopics(pc) {
  const topics = pc?.topics || []
  if (!topics.length) return 'No topic visits in either period.'

  const sentences = []
  const lead = topics[0]
  sentences.push(`${lead.topic} led the ${pc.current.label.toLowerCase()} with ${plural(lead.current, 'visit')}, against ${lead.previous.toLocaleString()} before.`)

  const compared = topics.filter((t) => t.change_pct != null)
  const riser = compared.reduce((best, t) => (t.change_pct > (best?.change_pct ?? 0) ? t : best), null)
  const faller = compared.reduce((worst, t) => (t.change_pct < (worst?.change_pct ?? 0) ? t : worst), null)
  if (riser && riser !== lead) sentences.push(`${riser.topic} grew the most (up ${riser.change_pct}%).`)
  if (faller) sentences.push(`${faller.topic} dropped the most (down ${Math.abs(faller.change_pct)}%).`)

  const fresh = topics.filter((t) => t.change_pct == null && t.current > 0).map((t) => t.topic)
  if (fresh.length) sentences.push(`New this period: ${fresh.join(', ')}.`)

  return sentences.join(' ')
}
