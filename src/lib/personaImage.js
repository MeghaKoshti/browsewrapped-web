// Builds the shareable persona card image (1080×1350, a 4:5 portrait that fits
// Instagram and most feeds) fully in the browser with <canvas>.
//
// The work is split so it can be tested without a real canvas (jsdom has none):
//   buildPersonaCardData – picks the aggregated stats to show (pure)
//   wrapText             – line breaking with an injected measure function (pure)
//   drawPersonaCard      – draws onto any 2D context, so tests can pass a fake
//   renderPersonaCardPng – creates the canvas and encodes a PNG (browser only)

import { siteDomain } from './site'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350
// Link previews (og:image) on WhatsApp, X, LinkedIn and Slack.
export const OG_WIDTH = 1200
export const OG_HEIGHT = 630
export const OG_MAX_BYTES = 300 * 1024
const OG_GLOW_RINGS = 20

export const DISPLAY_FONT = '"Space Grotesk", system-ui, sans-serif'
export const MONO_FONT = '"DM Mono", "Courier New", monospace'

export function compact(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('en-US')
}

export function formatDay(iso) {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// Only aggregated, non-identifying data goes on the card: the persona, topic
// shares and totals. Never domains, URLs, page titles or searches.
//   site – the domain printed in the footer (from VITE_PUBLIC_URL)
export function buildPersonaCardData(report, { site = siteDomain() } = {}) {
  const { persona, summary = {}, topics = [], streaks } = report || {}
  if (!persona?.title) return null

  const stats = [{ label: 'Visits', value: compact(summary.total_visits) }]
  stats.push(summary.total_hours_browsed > 0
    ? { label: 'Hours browsed', value: `${summary.total_hours_browsed}h` }
    : { label: 'Sites explored', value: compact(summary.unique_domains) })
  if (streaks?.longest > 0) stats.push({ label: 'Longest streak', value: `${streaks.longest} days` })
  else if (summary.total_days) stats.push({ label: 'Days tracked', value: compact(summary.total_days) })

  const range = summary.date_range
  return {
    title: persona.title,
    description: persona.description || '',
    color: /^#[0-9a-f]{6}$/i.test(persona.color || '') ? persona.color : '#a855f7',
    year: range?.start?.slice(0, 4) || String(new Date().getFullYear()),
    dateRange: range?.start && range?.end ? `${formatDay(range.start)} – ${formatDay(range.end)}` : '',
    site,
    stats,
    topTopics: topics.slice(0, 4).map((t) => ({ name: t.name, percentage: t.percentage, color: t.color || '#a855f7' })),
  }
}

export function personaCardFilename(data) {
  const slug = (data?.title || 'persona').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `browsewrapped-${slug}-${data?.year || 'wrapped'}.png`
}

// Greedy word wrap. `measure(text)` returns the rendered width; the last line
// gets an ellipsis if the text needs more than `maxLines`.
export function wrapText(text, maxWidth, measure, maxLines = Infinity) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || measure(candidate) <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines

  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last.includes(' ') && measure(`${last}…`) > maxWidth) last = last.slice(0, last.lastIndexOf(' '))
  kept[maxLines - 1] = `${last.replace(/[\s,.;:]+$/, '')}…`
  return kept
}

export function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Draws the card. Layout uses the app's tokens: void background, the persona
// colour as the glow, Space Grotesk for display and DM Mono for small labels.
export function drawPersonaCard(ctx, data) {
  const W = CARD_WIDTH
  const H = CARD_HEIGHT
  const PAD = 96
  const text = '#eaeaf4'
  const muted = '#9a9ab8'

  // Background + persona-coloured glow
  ctx.fillStyle = '#06060e'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.8, 160, 0, W * 0.8, 160, 760)
  glow.addColorStop(0, hexToRgba(data.color, 0.35))
  glow.addColorStop(1, hexToRgba(data.color, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  // Mark + year
  ctx.fillStyle = muted
  ctx.font = `500 26px ${MONO_FONT}`
  ctx.fillText('B R O W S E W R A P P E D', PAD, PAD + 20)
  ctx.textAlign = 'right'
  ctx.fillText(`${data.year} WRAPPED`, W - PAD, PAD + 20)
  ctx.textAlign = 'left'

  // "You are" + persona title
  let y = 330
  ctx.fillStyle = data.color
  ctx.font = `500 30px ${MONO_FONT}`
  ctx.fillText('YOU ARE', PAD, y)

  ctx.font = `700 112px ${DISPLAY_FONT}`
  const titleGradient = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
  titleGradient.addColorStop(0, '#a855f7')
  titleGradient.addColorStop(0.55, '#f472b6')
  titleGradient.addColorStop(1, '#fb923c')
  ctx.fillStyle = titleGradient
  const titleLines = wrapText(data.title, W - PAD * 2, (t) => ctx.measureText(t).width, 2)
  for (const line of titleLines) {
    y += 118
    ctx.fillText(line, PAD, y)
  }

  // Description
  y += 70
  ctx.fillStyle = muted
  ctx.font = `400 34px ${DISPLAY_FONT}`
  // A two-line title leaves room for two description lines, otherwise three,
  // so the stats and topics below always keep their place.
  const descriptionLines = titleLines.length > 1 ? 2 : 3
  for (const line of wrapText(data.description, W - PAD * 2, (t) => ctx.measureText(t).width, descriptionLines)) {
    ctx.fillText(line, PAD, y)
    y += 50
  }

  // Key stats row (fixed position; the text above is capped to fit)
  const statsTop = 760
  const gap = 24
  const boxW = (W - PAD * 2 - gap * (data.stats.length - 1)) / data.stats.length
  data.stats.forEach((stat, i) => {
    const x = PAD + i * (boxW + gap)
    roundRect(ctx, x, statsTop, boxW, 150, 24)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = text
    ctx.font = `700 54px ${DISPLAY_FONT}`
    ctx.fillText(stat.value, x + 28, statsTop + 78)
    ctx.fillStyle = muted
    ctx.font = `500 22px ${MONO_FONT}`
    ctx.fillText(stat.label.toUpperCase(), x + 28, statsTop + 120)
  })

  // Top topics: name, share bar and percentage
  let ty = statsTop + 222
  ctx.fillStyle = muted
  ctx.font = `500 22px ${MONO_FONT}`
  ctx.fillText('TOP TOPICS', PAD, ty)
  ty += 22
  const maxPct = Math.max(...data.topTopics.map((t) => t.percentage || 0), 1)
  const barX = PAD + 300
  const barMax = W - PAD - barX - 110
  for (const topic of data.topTopics) {
    ty += 52
    ctx.fillStyle = text
    ctx.font = `600 30px ${DISPLAY_FONT}`
    ctx.fillText(wrapText(topic.name, 280, (t) => ctx.measureText(t).width, 1)[0], PAD, ty)
    roundRect(ctx, barX, ty - 20, Math.max(8, (topic.percentage / maxPct) * barMax), 14, 7)
    ctx.fillStyle = topic.color
    ctx.fill()
    ctx.fillStyle = muted
    ctx.font = `500 26px ${MONO_FONT}`
    ctx.textAlign = 'right'
    ctx.fillText(`${topic.percentage}%`, W - PAD, ty)
    ctx.textAlign = 'left'
  }

  // Footer: hairline, date range and the site address (the watermark)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(PAD, H - 110, W - PAD * 2, 2)
  ctx.fillStyle = muted
  ctx.font = `400 22px ${MONO_FONT}`
  ctx.fillText(data.dateRange, PAD, H - 64)
  if (data.site) {
    ctx.textAlign = 'right'
    ctx.fillStyle = text
    ctx.font = `500 24px ${MONO_FONT}`
    ctx.fillText(data.site, W - PAD, H - 64)
    ctx.textAlign = 'left'
  }
}

// The same card in the 1200×630 link-preview shape: persona on the left,
// top topics on the right, the site address in the footer.
export function drawOgCard(ctx, data) {
  const W = OG_WIDTH
  const H = OG_HEIGHT
  const PAD = 64
  const text = '#eaeaf4'
  const muted = '#9a9ab8'

  ctx.fillStyle = '#06060e'
  ctx.fillRect(0, 0, W, H)
  // The glow is stacked faint rings, not a radial gradient: Chromium dithers
  // gradients, and that noise made the PNG ~560 KB, over the 300 KB link
  // preview cap (WhatsApp skips bigger images). Rings keep it near 160 KB.
  ctx.fillStyle = hexToRgba(data.color, (0.32 / OG_GLOW_RINGS).toFixed(4))
  for (let i = 0; i < OG_GLOW_RINGS; i++) {
    ctx.beginPath()
    ctx.arc(W * 0.2, 0, 640 * (1 - i / OG_GLOW_RINGS), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  ctx.fillStyle = muted
  ctx.font = `500 20px ${MONO_FONT}`
  ctx.fillText('B R O W S E W R A P P E D', PAD, PAD + 14)
  ctx.textAlign = 'right'
  ctx.fillText(`${data.year} WRAPPED`, W - PAD, PAD + 14)
  ctx.textAlign = 'left'

  // Left column: who you are
  const leftW = 620
  let y = 190
  ctx.fillStyle = data.color
  ctx.font = `500 22px ${MONO_FONT}`
  ctx.fillText('YOU ARE', PAD, y)
  ctx.font = `700 76px ${DISPLAY_FONT}`
  const gradient = ctx.createLinearGradient(PAD, 0, PAD + leftW, 0)
  gradient.addColorStop(0, '#a855f7')
  gradient.addColorStop(0.55, '#f472b6')
  gradient.addColorStop(1, '#fb923c')
  ctx.fillStyle = gradient
  const titleLines = wrapText(data.title, leftW, (t) => ctx.measureText(t).width, 2)
  for (const line of titleLines) {
    y += 80
    ctx.fillText(line, PAD, y)
  }
  y += 52
  ctx.fillStyle = muted
  ctx.font = `400 26px ${DISPLAY_FONT}`
  for (const line of wrapText(data.description, leftW, (t) => ctx.measureText(t).width, titleLines.length > 1 ? 2 : 3)) {
    ctx.fillText(line, PAD, y)
    y += 38
  }

  // Right column: top topics
  const colX = PAD + leftW + 60
  const colW = W - PAD - colX
  let ty = 190
  ctx.fillStyle = muted
  ctx.font = `500 18px ${MONO_FONT}`
  ctx.fillText('TOP TOPICS', colX, ty)
  const maxPct = Math.max(...data.topTopics.map((t) => t.percentage || 0), 1)
  for (const topic of data.topTopics) {
    ty += 70
    ctx.fillStyle = text
    ctx.font = `600 24px ${DISPLAY_FONT}`
    ctx.fillText(wrapText(topic.name, colW - 80, (t) => ctx.measureText(t).width, 1)[0], colX, ty)
    ctx.fillStyle = muted
    ctx.font = `500 20px ${MONO_FONT}`
    ctx.textAlign = 'right'
    ctx.fillText(`${topic.percentage}%`, W - PAD, ty)
    ctx.textAlign = 'left'
    roundRect(ctx, colX, ty + 14, Math.max(8, (topic.percentage / maxPct) * colW), 10, 5)
    ctx.fillStyle = topic.color
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(PAD, H - 92, W - PAD * 2, 2)
  ctx.fillStyle = muted
  ctx.font = `400 20px ${MONO_FONT}`
  ctx.fillText(data.dateRange, PAD, H - 50)
  if (data.site) {
    ctx.textAlign = 'right'
    ctx.fillStyle = text
    ctx.font = `500 22px ${MONO_FONT}`
    ctx.fillText(data.site, W - PAD, H - 50)
    ctx.textAlign = 'left'
  }
}

// Canvas text silently falls back to a system font if the web font is not
// loaded yet, so load the exact faces the images use first.
export async function loadCardFonts() {
  if (!document.fonts?.load) return
  await Promise.all([
    document.fonts.load(`700 112px "Space Grotesk"`),
    document.fonts.load(`600 40px "Space Grotesk"`),
    document.fonts.load(`400 34px "Space Grotesk"`),
    document.fonts.load(`500 26px "DM Mono"`),
  ]).catch(() => {})
}

// Browser only: draws with `draw(ctx)` on a width×height canvas and encodes a PNG blob.
export async function renderPng(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null
  if (!ctx || typeof canvas.toBlob !== 'function') throw new Error('Canvas is not supported in this browser')

  await loadCardFonts()
  draw(ctx)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png')
  })
}

export function renderPersonaCardPng(data) {
  return renderPng(CARD_WIDTH, CARD_HEIGHT, (ctx) => drawPersonaCard(ctx, data))
}

export function renderOgCardPng(data) {
  return renderPng(OG_WIDTH, OG_HEIGHT, (ctx) => drawOgCard(ctx, data))
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser a moment to start the download before freeing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
