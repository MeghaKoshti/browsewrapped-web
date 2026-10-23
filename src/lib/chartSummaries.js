// One-sentence text alternatives for the report charts, used as aria-labels so
// screen reader users get the gist without the hover tooltips.

export function formatHour(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

const peakOf = (rows, key = 'visits') => rows.reduce((a, b) => (b[key] > a[key] ? b : a), rows[0])

const list = (items) => items.join(', ')

export function summarizeTopicsDonut(topics = []) {
  if (!topics.length) return 'Topic breakdown: no data.'
  return `Topic breakdown by share of visits: ${list(topics.slice(0, 6).map((t) => `${t.name} ${t.percentage}%`))}.`
}

export function summarizeDailyPattern(data = []) {
  if (!data.length) return 'Visits by hour of day: no data.'
  const peak = peakOf(data)
  return `Visits by hour of day. Busiest hour: ${formatHour(peak.hour)} with ${peak.visits.toLocaleString()} visits.`
}

export function summarizeWeeklyPattern(data = []) {
  if (!data.length) return 'Visits by day of week: no data.'
  const peak = peakOf(data)
  const quiet = data.reduce((a, b) => (b.visits < a.visits ? b : a), data[0])
  return `Visits by day of week. Busiest: ${peak.day} (${peak.visits.toLocaleString()}). Quietest: ${quiet.day} (${quiet.visits.toLocaleString()}).`
}

export function summarizeMonthlyTrends({ labels = [], data = [] } = {}) {
  if (!data.length || !labels.length) return 'Monthly topic trends: no data.'
  const first = data[0].month
  const last = data[data.length - 1].month
  return `Monthly visits for ${list(labels)}, from ${first} to ${last}.`
}

export function summarizeTimeByTopic(rows = [], mode = 'time') {
  if (!rows.length) return 'Time per topic: no data.'
  const top = rows.slice(0, 5)
  return mode === 'time'
    ? `Hours spent per topic: ${list(top.map((t) => `${t.name} ${t.hours}h`))}.`
    : `Timed visits per topic: ${list(top.map((t) => `${t.name} ${(t.visits_with_duration || 0).toLocaleString()}`))}.`
}

export function summarizeHeatmap({ grid = [], day_labels: days = [] } = {}) {
  let best = { value: 0 }
  grid.forEach((row, d) => row.forEach((value, h) => { if (value > best.value) best = { value, d, h } }))
  if (!best.value) return 'Visits by day and hour: no data.'
  return `Visits by day of week and hour. Busiest slot: ${days[best.d] || ''} at ${formatHour(best.h)} with ${best.value.toLocaleString()} visits.`.replace('  ', ' ')
}

export function summarizeCalendar({ days = [], max = 0 } = {}) {
  if (!days.length) return 'Daily activity calendar: no data.'
  const active = days.filter((d) => d.visits > 0).length
  return `Daily activity from ${days[0].date} to ${days[days.length - 1].date}: ${active} active days, up to ${max.toLocaleString()} visits a day.`
}

export function summarizeKnowledgeMap(nodes = []) {
  if (!nodes.length) return 'Knowledge map: no data.'
  const biggest = [...nodes].sort((a, b) => b.size - a.size).slice(0, 5).map((n) => n.label || n.id)
  return `Knowledge map of ${nodes.length} topic clusters. Largest: ${list(biggest)}.`
}
