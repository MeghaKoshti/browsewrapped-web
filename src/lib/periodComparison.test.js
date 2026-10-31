import { describe, it, expect } from 'vitest'
import { hasPeriodComparison, formatDay, formatRange, describeChange, summarizeTopics } from './periodComparison'
import report from '../test/fixtures/report.json'

const pc = report.period_comparison

describe('periodComparison helpers', () => {
  it('treats null or missing comparisons as absent', () => {
    expect(hasPeriodComparison(undefined)).toBe(false)
    expect(hasPeriodComparison(null)).toBe(false)
    expect(hasPeriodComparison({ current: {} })).toBe(false)
    expect(hasPeriodComparison(pc)).toBe(true)
  })

  it('formats ISO dates without shifting the day', () => {
    expect(formatDay('2026-09-01')).toBe('Sep 1')
    expect(formatRange(pc.current)).toBe('Sep 1 – Sep 30')
    expect(formatDay('not-a-date')).toBe('not-a-date')
  })

  it('describes changes with an arrow and words, not just colour', () => {
    expect(describeChange({ pct: 12.2 })).toEqual({ direction: 'up', arrow: '▲', text: '12.2% more' })
    expect(describeChange({ pct: -4.6 })).toEqual({ direction: 'down', arrow: '▼', text: '4.6% less' })
    expect(describeChange({ pct: 0 }).text).toBe('No change')
    expect(describeChange({ pct: null }).text).toBe('New this period')
    expect(describeChange({ delta: 3, unit: 'days' }).text).toBe('3 more days')
    expect(describeChange({ delta: -1, unit: 'day' }).text).toBe('1 fewer day')
    expect(describeChange({ delta: 0 }).text).toBe('Same as before')
  })

  it('summarises the topic chart in plain text', () => {
    const text = summarizeTopics(pc)
    expect(text).toContain('Programming led the last 30 days with 300 visits, against 250 before.')
    expect(text).toContain('AI & ML grew the most (up 35.7%).')
    expect(text).toContain('Entertainment dropped the most (down 36.4%).')
    expect(text).toContain('New this period: Education.')
  })

  it('handles an empty topic list', () => {
    expect(summarizeTopics({ ...pc, topics: [] })).toBe('No topic visits in either period.')
  })
})
