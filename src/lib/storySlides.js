// The story pack: five 1080×1920 slides (the Instagram / WhatsApp story
// size) built in the browser, like the persona card.
//
//   buildStorySlides  – picks the data for each slide from a report (pure)
//   drawStorySlide    – draws one slide onto any 2D context (testable with a fake)
//   renderStorySlidePng / storySlideFilename – browser-only helpers
//
// Slides show aggregated data only (persona, topic shares, totals, times of
// day): never domains, URLs, page titles or searches. Slide 1 is free; the
// rest need a Wrapped Pass.
import {
  DISPLAY_FONT, MONO_FONT, compact, formatDay, hexToRgba, roundRect, wrapText, renderPng,
} from './personaImage'
import { siteDomain } from './site'

export const STORY_WIDTH = 1080
export const STORY_HEIGHT = 1920
export const FREE_SLIDES = 1

const TEXT = '#eaeaf4'
const MUTED = '#9a9ab8'
const UP = '#6ee7b7'
const DOWN = '#fca5a5'
const DAY_NAMES = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }

export function formatHour(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

const sum = (values) => values.reduce((a, b) => a + (Number(b) || 0), 0)
const argmax = (values) => values.reduce((best, v, i) => (v > values[best] ? i : best), 0)

function personaSlide({ persona, summary = {}, streaks }) {
  if (!persona?.title) return null
  const stats = [{ label: 'Visits', value: compact(summary.total_visits) }]
  if (summary.total_hours_browsed > 0) stats.push({ label: 'Hours browsed', value: `${summary.total_hours_browsed}h` })
  else stats.push({ label: 'Sites explored', value: compact(summary.unique_domains) })
  if (streaks?.longest > 0) stats.push({ label: 'Longest streak', value: `${streaks.longest} days` })
  return { id: 'persona', caption: 'Persona', title: persona.title, description: persona.description || '', traits: (persona.traits || []).slice(0, 3), stats }
}

function topicsSlide({ topics = [] }) {
  const top = topics.filter((t) => t.percentage > 0).slice(0, 5)
  if (!top.length) return null
  return {
    id: 'topics',
    caption: 'Top topics',
    lead: { name: top[0].name, percentage: top[0].percentage },
    topics: top.map((t) => ({ name: t.name, percentage: t.percentage, color: t.color || '#a855f7' })),
  }
}

function rhythmSlide({ heatmap, summary = {} }) {
  const grid = heatmap?.grid
  if (!grid?.length || !(heatmap.max > 0)) return null
  const labels = heatmap.day_labels || Object.keys(DAY_NAMES)
  const hourTotals = Array.from({ length: 24 }, (_, h) => sum(grid.map((row) => row[h])))
  const dayTotals = grid.map(sum)
  const day = labels[argmax(dayTotals)]
  return {
    id: 'rhythm',
    caption: 'Rhythm',
    peakHour: formatHour(argmax(hourTotals)),
    busiestDay: DAY_NAMES[day] || day,
    weekendPct: summary.weekend_pct ?? null,
    grid,
    max: heatmap.max,
    dayLabels: labels,
  }
}

function thenVsNowSlide({ period_comparison: pc }) {
  if (!pc?.current || !pc?.previous) return null
  const compared = (pc.topics || []).filter((t) => t.change_pct != null)
  const riser = compared.reduce((best, t) => (t.change_pct > (best?.change_pct ?? 0) ? t : best), null)
  return {
    id: 'then-vs-now',
    caption: 'Then vs now',
    windowDays: pc.window_days || 30,
    visitsPct: pc.changes?.visits_pct ?? null,
    then: { topTopic: pc.previous.top_topic || '—', visits: pc.previous.visits },
    now: { topTopic: pc.current.top_topic || '—', visits: pc.current.visits },
    riser: riser ? { name: riser.topic, pct: riser.change_pct } : null,
  }
}

function streakSlide({ streaks, summary = {}, sessions }) {
  if (!(streaks?.longest > 0)) return null
  return {
    id: 'streak',
    caption: 'Streak',
    longest: streaks.longest,
    current: streaks.current || 0,
    activeDays: streaks.total_active_days || null,
    totalDays: summary.total_days || null,
    sessions: sessions?.total_sessions || null,
  }
}

// Slides in order, skipping any the report has no data for (a short history
// has no "then vs now"). Each slide also carries what every frame shows.
export function buildStorySlides(report, { site = siteDomain() } = {}) {
  if (!report?.persona?.title) return []
  const range = report.summary?.date_range
  const common = {
    year: range?.start?.slice(0, 4) || String(new Date().getFullYear()),
    dateRange: range?.start && range?.end ? `${formatDay(range.start)} – ${formatDay(range.end)}` : '',
    color: /^#[0-9a-f]{6}$/i.test(report.persona.color || '') ? report.persona.color : '#a855f7',
    site,
  }
  const slides = [personaSlide, topicsSlide, rhythmSlide, thenVsNowSlide, streakSlide]
    .map((build) => build(report))
    .filter(Boolean)
  return slides.map((slide, i) => ({ ...common, ...slide, number: i + 1, total: slides.length, free: i < FREE_SLIDES }))
}

export function storySlideFilename(slide) {
  return `browsewrapped-${slide.year}-story-${slide.number}-${slide.id}.png`
}

// ── Drawing ────────────────────────────────────────────────────────────────
const W = STORY_WIDTH
const H = STORY_HEIGHT
const PAD = 96
const INNER = W - PAD * 2

function gradientFill(ctx, x0, x1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0)
  g.addColorStop(0, '#a855f7')
  g.addColorStop(0.55, '#f472b6')
  g.addColorStop(1, '#fb923c')
  return g
}

function text(ctx, value, x, y, { font, color = TEXT, align = 'left' }) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(value, x, y)
  ctx.textAlign = 'left'
}

const measureWith = (ctx) => (t) => ctx.measureText(t).width

function drawFrame(ctx, slide) {
  ctx.fillStyle = '#06060e'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.85, 260, 0, W * 0.85, 260, 900)
  glow.addColorStop(0, hexToRgba(slide.color, 0.38))
  glow.addColorStop(1, hexToRgba(slide.color, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  const low = ctx.createRadialGradient(0, H - 300, 0, 0, H - 300, 800)
  low.addColorStop(0, 'rgba(244,114,182,0.14)')
  low.addColorStop(1, 'rgba(244,114,182,0)')
  ctx.fillStyle = low
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'

  text(ctx, 'B R O W S E W R A P P E D', PAD, 170, { font: `500 28px ${MONO_FONT}`, color: MUTED })
  text(ctx, `${slide.number} / ${slide.total}`, W - PAD, 170, { font: `500 28px ${MONO_FONT}`, color: MUTED, align: 'right' })

  // Footer watermark: the site address is the point of a shared story.
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.fillRect(PAD, H - 270, INNER, 2)
  if (slide.site) {
    text(ctx, 'Make yours at', PAD, H - 190, { font: `500 28px ${MONO_FONT}`, color: MUTED })
    text(ctx, slide.site, PAD, H - 122, { font: `700 56px ${DISPLAY_FONT}` })
  }
  if (slide.dateRange) text(ctx, slide.dateRange, W - PAD, H - 190, { font: `400 26px ${MONO_FONT}`, color: MUTED, align: 'right' })
}

function kicker(ctx, slide, label, y = 400) {
  text(ctx, label, PAD, y, { font: `500 34px ${MONO_FONT}`, color: slide.color })
}

function drawPersona(ctx, s) {
  kicker(ctx, s, `MY ${s.year} IN TABS`)
  text(ctx, 'I’m', PAD, 500, { font: `400 56px ${DISPLAY_FONT}`, color: MUTED })
  ctx.font = `700 140px ${DISPLAY_FONT}`
  let y = 500
  for (const line of wrapText(s.title, INNER, measureWith(ctx), 3)) {
    y += 150
    text(ctx, line, PAD, y, { font: `700 140px ${DISPLAY_FONT}`, color: gradientFill(ctx, PAD, W - PAD) })
  }
  y += 90
  ctx.font = `400 42px ${DISPLAY_FONT}`
  for (const line of wrapText(s.description, INNER, measureWith(ctx), 4)) {
    text(ctx, line, PAD, y, { font: `400 42px ${DISPLAY_FONT}`, color: MUTED })
    y += 62
  }
  // Stats sit at a fixed height; the text above is capped so they never collide.
  let sy = 1240
  for (const stat of s.stats) {
    text(ctx, stat.value, PAD, sy, { font: `700 84px ${DISPLAY_FONT}` })
    text(ctx, stat.label.toUpperCase(), W - PAD, sy, { font: `500 28px ${MONO_FONT}`, color: MUTED, align: 'right' })
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(PAD, sy + 34, INNER, 2)
    sy += 126
  }
}

function drawTopics(ctx, s) {
  kicker(ctx, s, 'WHAT I EXPLORED')
  text(ctx, 'Mostly', PAD, 510, { font: `400 56px ${DISPLAY_FONT}`, color: MUTED })
  ctx.font = `700 120px ${DISPLAY_FONT}`
  let y = 510
  for (const line of wrapText(s.lead.name, INNER, measureWith(ctx), 2)) {
    y += 130
    text(ctx, line, PAD, y, { font: `700 120px ${DISPLAY_FONT}`, color: gradientFill(ctx, PAD, W - PAD) })
  }
  text(ctx, `${s.lead.percentage}% of my visits`, PAD, y + 80, { font: `400 44px ${DISPLAY_FONT}`, color: MUTED })

  const maxPct = Math.max(...s.topics.map((t) => t.percentage), 1)
  let ty = 1010
  for (const topic of s.topics) {
    ctx.font = `600 44px ${DISPLAY_FONT}`
    text(ctx, wrapText(topic.name, INNER - 200, measureWith(ctx), 1)[0], PAD, ty, { font: `600 44px ${DISPLAY_FONT}` })
    text(ctx, `${topic.percentage}%`, W - PAD, ty, { font: `500 36px ${MONO_FONT}`, color: MUTED, align: 'right' })
    roundRect(ctx, PAD, ty + 24, INNER, 18, 9)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fill()
    roundRect(ctx, PAD, ty + 24, Math.max(18, (topic.percentage / maxPct) * INNER), 18, 9)
    ctx.fillStyle = topic.color
    ctx.fill()
    ty += 124
  }
}

function heatColor(value, max, color) {
  if (!value) return 'rgba(255,255,255,0.05)'
  return hexToRgba(color, 0.18 + 0.82 * (value / max))
}

function drawRhythm(ctx, s) {
  kicker(ctx, s, 'WHEN I BROWSE')
  text(ctx, s.peakHour, PAD, 680, { font: `700 220px ${DISPLAY_FONT}`, color: gradientFill(ctx, PAD, W - PAD) })
  text(ctx, 'is my busiest hour', PAD, 760, { font: `400 48px ${DISPLAY_FONT}`, color: MUTED })
  text(ctx, `${s.busiestDay}s`, PAD, 900, { font: `700 84px ${DISPLAY_FONT}` })
  text(ctx, 'are my busiest days', PAD, 966, { font: `400 48px ${DISPLAY_FONT}`, color: MUTED })
  if (s.weekendPct != null) text(ctx, `${s.weekendPct}% of my browsing happens at weekends`, PAD, 1060, { font: `400 36px ${DISPLAY_FONT}`, color: MUTED })

  // Day × hour grid, the report's heatmap in miniature.
  const labelW = 90
  const gap = 5
  const cell = Math.floor((INNER - labelW - gap * 23) / 24)
  const top = 1150
  s.grid.forEach((row, d) => {
    const y = top + d * (cell + gap)
    text(ctx, String(s.dayLabels[d] || '').slice(0, 3), PAD, y + cell - 6, { font: `500 24px ${MONO_FONT}`, color: MUTED })
    row.forEach((value, h) => {
      roundRect(ctx, PAD + labelW + h * (cell + gap), y, cell, cell, 6)
      ctx.fillStyle = heatColor(value, s.max, s.color)
      ctx.fill()
    })
  })
  const axisY = top + 7 * (cell + gap) + 30
  for (const h of [0, 6, 12, 18]) {
    text(ctx, formatHour(h), PAD + labelW + h * (cell + gap), axisY, { font: `500 22px ${MONO_FONT}`, color: MUTED })
  }
}

function drawThenVsNow(ctx, s) {
  kicker(ctx, s, 'THEN VS NOW')
  text(ctx, `My last ${s.windowDays} days vs the ${s.windowDays} before`, PAD, 470, { font: `400 40px ${DISPLAY_FONT}`, color: MUTED })
  if (s.visitsPct != null) {
    const up = s.visitsPct >= 0
    // Plain +/− signs: arrow glyphs aren't in Space Grotesk and fall back to a huge system font.
    text(ctx, `${up ? '+' : '−'}${Math.abs(s.visitsPct)}%`, PAD, 690, { font: `700 190px ${DISPLAY_FONT}`, color: up ? UP : DOWN })
    text(ctx, up ? 'more browsing' : 'less browsing', PAD, 770, { font: `400 48px ${DISPLAY_FONT}`, color: MUTED })
  }
  const colW = (INNER - 40) / 2
  for (const [i, [label, side]] of [['THEN', s.then], ['NOW', s.now]].entries()) {
    const x = PAD + i * (colW + 40)
    roundRect(ctx, x, 880, colW, 300, 28)
    ctx.fillStyle = i === 1 ? hexToRgba(s.color, 0.14) : 'rgba(255,255,255,0.04)'
    ctx.fill()
    text(ctx, label, x + 36, 950, { font: `500 28px ${MONO_FONT}`, color: MUTED })
    ctx.font = `700 54px ${DISPLAY_FONT}`
    const lines = wrapText(side.topTopic, colW - 72, measureWith(ctx), 2)
    lines.forEach((line, n) => text(ctx, line, x + 36, 1030 + n * 62, { font: `700 54px ${DISPLAY_FONT}` }))
    text(ctx, `${compact(side.visits)} visits`, x + 36, 1150, { font: `400 32px ${DISPLAY_FONT}`, color: MUTED })
  }
  text(ctx, 'Top topic in each period', PAD, 1240, { font: `400 30px ${DISPLAY_FONT}`, color: MUTED })
  if (s.riser) {
    text(ctx, 'BIGGEST RISER', PAD, 1380, { font: `500 28px ${MONO_FONT}`, color: MUTED })
    ctx.font = `700 72px ${DISPLAY_FONT}`
    text(ctx, wrapText(s.riser.name, INNER, measureWith(ctx), 1)[0], PAD, 1470, { font: `700 72px ${DISPLAY_FONT}` })
    text(ctx, `+${s.riser.pct}%`, PAD, 1540, { font: `500 40px ${MONO_FONT}`, color: UP })
  }
}

function drawStreak(ctx, s) {
  kicker(ctx, s, 'MY LONGEST STREAK')
  text(ctx, String(s.longest), PAD, 860, { font: `700 400px ${DISPLAY_FONT}`, color: gradientFill(ctx, PAD, W - PAD) })
  text(ctx, s.longest === 1 ? 'day in a row' : 'days in a row', PAD, 960, { font: `400 60px ${DISPLAY_FONT}`, color: MUTED })
  const rows = [
    s.activeDays && { label: 'Active days', value: s.totalDays ? `${s.activeDays} of ${s.totalDays}` : String(s.activeDays) },
    // The API counts the current streak back from today, so an older export
    // shows 0; "0 days" under a big streak reads like a mistake on a post.
    s.current > 0 && { label: 'Current streak', value: `${s.current} ${s.current === 1 ? 'day' : 'days'}` },
    s.sessions && { label: 'Browsing sessions', value: compact(s.sessions) },
  ].filter(Boolean)
  let y = 1160
  for (const row of rows) {
    text(ctx, row.value, PAD, y, { font: `700 72px ${DISPLAY_FONT}` })
    text(ctx, row.label.toUpperCase(), W - PAD, y, { font: `500 28px ${MONO_FONT}`, color: MUTED, align: 'right' })
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(PAD, y + 34, INNER, 2)
    y += 120
  }
}

const BODIES = { persona: drawPersona, topics: drawTopics, rhythm: drawRhythm, 'then-vs-now': drawThenVsNow, streak: drawStreak }

export function drawStorySlide(ctx, slide) {
  drawFrame(ctx, slide)
  BODIES[slide.id](ctx, slide)
}

export function renderStorySlidePng(slide) {
  return renderPng(STORY_WIDTH, STORY_HEIGHT, (ctx) => drawStorySlide(ctx, slide))
}
