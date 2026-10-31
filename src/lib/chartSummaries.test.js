import { describe, it, expect } from 'vitest'
import * as s from './chartSummaries'
import report from '../test/fixtures/report.json'

describe('chart summaries', () => {
  it('formats hours', () => {
    expect([0, 9, 12, 15].map(s.formatHour)).toEqual(['12 AM', '9 AM', '12 PM', '3 PM'])
  })

  it('summarises each chart from the report', () => {
    expect(s.summarizeTopicsDonut(report.topics)).toMatch(/^Topic breakdown by share of visits: Programming 39.6%, AI & ML 21.4%/)
    expect(s.summarizeDailyPattern(report.daily_pattern)).toBe('Visits by hour of day. Busiest hour: 3 PM with 100 visits.')
    expect(s.summarizeWeeklyPattern(report.weekly_pattern)).toBe('Visits by day of week. Busiest: Mon (260). Quietest: Sat (110).')
    expect(s.summarizeMonthlyTrends(report.monthly_trends)).toBe('Monthly visits for Programming, AI & ML, from 2026-08 to 2026-09.')
    expect(s.summarizeTimeByTopic(report.time_by_topic)).toMatch(/^Hours spent per topic: Programming 10.17h/)
    expect(s.summarizeTimeByTopic(report.time_by_topic, 'visits')).toMatch(/^Timed visits per topic: Programming 488/)
    expect(s.summarizeHeatmap(report.heatmap)).toMatch(/^Visits by day of week and hour. Busiest slot: \w{3} at \d+ (AM|PM) with 12 visits.$/)
    expect(s.summarizeCalendar(report.activity_calendar)).toMatch(/^Daily activity from 2026-08-02 to 2026-09-30: \d+ active days, up to 49 visits a day.$/)
    expect(s.summarizeKnowledgeMap(report.knowledge_graph.nodes)).toBe('Knowledge map of 3 topic clusters. Largest: Programming, AI & ML, Tech News.')
  })

  it('copes with empty data', () => {
    expect(s.summarizeTopicsDonut([])).toMatch(/no data/)
    expect(s.summarizeDailyPattern()).toMatch(/no data/)
    expect(s.summarizeHeatmap({ grid: [[0, 0]], day_labels: ['Sun'] })).toMatch(/no data/)
    expect(s.summarizeCalendar()).toMatch(/no data/)
  })
})
