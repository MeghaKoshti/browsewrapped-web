import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PeriodComparison from './PeriodComparison'
import report from '../../test/fixtures/report.json'

const pc = report.period_comparison

describe('PeriodComparison', () => {
  it('renders nothing when the comparison is null or missing', () => {
    const { container: a } = render(<PeriodComparison comparison={null} />)
    const { container: b } = render(<PeriodComparison />)
    expect(a).toBeEmptyDOMElement()
    expect(b).toBeEmptyDOMElement()
  })

  it('shows stat tiles with direction in words', () => {
    render(<PeriodComparison comparison={pc} />)

    const section = screen.getByRole('region', { name: 'Last 30 days vs the 30 days before' })
    expect(within(section).getByText('Sep 1 – Sep 30 compared with Aug 2 – Aug 31')).toBeInTheDocument()

    expect(screen.getByText('820')).toBeInTheDocument()
    expect(screen.getByText('12.2% more')).toBeInTheDocument()
    expect(screen.getByText('Previous 30 days: 731')).toBeInTheDocument()

    expect(screen.getByText('3 more days')).toBeInTheDocument()
    expect(screen.getByText('12.4h')).toBeInTheDocument()
    expect(screen.getByText('4.6% less')).toBeInTheDocument()
  })

  it('gives the topic chart an accessible name, text summary and table', () => {
    render(<PeriodComparison comparison={pc} />)

    const chart = screen.getByRole('img', { name: /visits per topic/i })
    expect(chart).toHaveAccessibleDescription(/Programming led the last 30 days/)

    const table = screen.getByRole('table', { hidden: true })
    const rows = within(table).getAllByRole('row', { hidden: true })
    expect(rows).toHaveLength(pc.topics.length + 1)
    expect(within(table).getByRole('rowheader', { name: 'Education', hidden: true })).toBeInTheDocument()
  })

  it('skips the chart when there are no topics', () => {
    render(<PeriodComparison comparison={{ ...pc, topics: [] }} />)
    expect(screen.queryByRole('img', { name: /visits per topic/i })).not.toBeInTheDocument()
    expect(screen.getByText('12.2% more')).toBeInTheDocument()
  })
})
