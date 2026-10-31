import { describe, it, expect, vi } from 'vitest'
import { buildStorySlides, drawStorySlide, storySlideFilename, formatHour, renderStorySlidePng } from './storySlides'
import report from '../test/fixtures/report.json'

// Records text and counts calls; every char is 10px wide.
function fakeContext() {
  const texts = []
  const gradient = { addColorStop: vi.fn() }
  return new Proxy({ texts }, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'fillText') return (t) => texts.push(String(t))
      if (prop === 'measureText') return (t) => ({ width: String(t).length * 10 })
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient
      return () => {}
    },
    set(target, prop, value) { target[prop] = value; return true },
  })
}

const slides = buildStorySlides(report, { site: 'browsewrapped.app' })

describe('buildStorySlides', () => {
  it('makes five slides in order, and only the first is free', () => {
    expect(slides.map((s) => s.id)).toEqual(['persona', 'topics', 'rhythm', 'then-vs-now', 'streak'])
    expect(slides.map((s) => s.free)).toEqual([true, false, false, false, false])
    expect(slides.map((s) => `${s.number}/${s.total}`)).toEqual(['1/5', '2/5', '3/5', '4/5', '5/5'])
    expect(slides[0]).toMatchObject({ year: '2026', site: 'browsewrapped.app', dateRange: 'Aug 2, 2026 – Sep 30, 2026', color: '#6366f1' })
  })

  it('picks the data for each slide', () => {
    const [persona, topics, rhythm, thenNow, streak] = slides
    expect(persona.title).toBe('The Builder')
    expect(persona.stats.map((s) => s.value)).toEqual(['1.5k', '25.4h', '11 days'])
    expect(topics.lead).toEqual({ name: 'Programming', percentage: 39.6 })
    expect(topics.topics).toHaveLength(5)
    expect(rhythm.busiestDay).toMatch(/day$/)
    expect(rhythm.peakHour).toMatch(/^\d{1,2} (AM|PM)$/)
    expect(rhythm.weekendPct).toBe(15.6)
    expect(thenNow).toMatchObject({ visitsPct: 12.2, then: { topTopic: 'AI & ML' }, now: { topTopic: 'Programming' }, riser: { name: 'AI & ML', pct: 35.7 } })
    expect(streak).toMatchObject({ longest: 11, current: 4, activeDays: 48, totalDays: 60, sessions: 184 })
  })

  it('skips slides without data and renumbers the rest', () => {
    const short = buildStorySlides({ ...report, period_comparison: null, heatmap: null }, { site: '' })
    expect(short.map((s) => `${s.id} ${s.number}/${s.total}`)).toEqual(['persona 1/3', 'topics 2/3', 'streak 3/3'])
    expect(buildStorySlides({ ...report, persona: null })).toEqual([])
  })

  it('never includes domains, URLs, page titles or searches', () => {
    const json = JSON.stringify(slides)
    for (const secret of ['github.com', 'stackoverflow', 'https://', 'rails/rails', 'solid queue']) expect(json).not.toContain(secret)
  })
})

describe('storySlideFilename and formatHour', () => {
  it('builds readable names and hours', () => {
    expect(slides.map(storySlideFilename)).toEqual([
      'browsewrapped-2026-story-1-persona.png', 'browsewrapped-2026-story-2-topics.png', 'browsewrapped-2026-story-3-rhythm.png',
      'browsewrapped-2026-story-4-then-vs-now.png', 'browsewrapped-2026-story-5-streak.png',
    ])
    expect([0, 9, 12, 14].map(formatHour)).toEqual(['12 AM', '9 AM', '12 PM', '2 PM'])
  })
})

describe('drawStorySlide', () => {
  it.each(slides.map((s) => [s.id, s]))('draws the %s slide with the frame and URL watermark', (_id, slide) => {
    const ctx = fakeContext()
    drawStorySlide(ctx, slide)
    expect(ctx.texts).toEqual(expect.arrayContaining(['B R O W S E W R A P P E D', `${slide.number} / 5`, 'Make yours at', 'browsewrapped.app', 'Aug 2, 2026 – Sep 30, 2026']))
  })

  it('draws each slide’s own content', () => {
    const drawn = slides.map((slide) => { const ctx = fakeContext(); drawStorySlide(ctx, slide); return ctx.texts })
    expect(drawn[0]).toEqual(expect.arrayContaining(['MY 2026 IN TABS', 'The Builder', '1.5k', 'VISITS']))
    expect(drawn[1]).toEqual(expect.arrayContaining(['WHAT I EXPLORED', 'Programming', '39.6%', '39.6% of my visits']))
    expect(drawn[2]).toEqual(expect.arrayContaining(['WHEN I BROWSE', 'is my busiest hour', '15.6% of my browsing happens at weekends']))
    expect(drawn[3]).toEqual(expect.arrayContaining(['THEN VS NOW', '+12.2%', 'THEN', 'NOW', 'BIGGEST RISER', '+35.7%']))
    expect(drawn[4]).toEqual(expect.arrayContaining(['MY LONGEST STREAK', '11', 'days in a row', '48 of 60', '4 days']))
  })

  it('wraps a long persona title to at most three lines', () => {
    const ctx = fakeContext()
    const long = { ...slides[0], title: 'The Extraordinarily Curious Midnight Documentation Explorer Of Many Tabs' }
    drawStorySlide(ctx, long)
    const titleLines = ctx.texts.filter((t) => long.title.includes(t.replace('…', '')) && t.length > 3 && t !== 'I’m')
    expect(titleLines.length).toBeLessThanOrEqual(3)
  })

  it('leaves the watermark out when no site is configured', () => {
    const ctx = fakeContext()
    drawStorySlide(ctx, { ...slides[0], site: '' })
    expect(ctx.texts).not.toContain('Make yours at')
  })
})

describe('renderStorySlidePng', () => {
  it('rejects cleanly without canvas support (jsdom)', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    await expect(renderStorySlidePng(slides[0])).rejects.toThrow(/not supported/)
  })
})
