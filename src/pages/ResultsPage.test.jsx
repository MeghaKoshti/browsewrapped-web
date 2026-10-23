import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ResultsPage from './ResultsPage'
import report from '../test/fixtures/report.json'

vi.mock('../api/client', () => ({ createShareLink: vi.fn(), deleteShareLink: vi.fn() }))

function renderResults(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/results', state }]}>
      <Routes>
        <Route path="/" element={<p>upload page</p>} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResultsPage', () => {
  it('renders the key report sections from a report', () => {
    renderResults({ data: report, filename: 'history.json' })

    expect(screen.getByRole('heading', { level: 1, name: '2026 Wrapped' })).toBeInTheDocument()
    expect(screen.getByText('history.json')).toBeInTheDocument()

    // Persona
    expect(screen.getByRole('heading', { name: 'The Builder' })).toBeInTheDocument()
    expect(screen.getByText('Night owl')).toBeInTheDocument()

    // Stat cards
    expect(screen.getByText('Total visits')).toBeInTheDocument()
    expect(screen.getByText('1.5k')).toBeInTheDocument()
    expect(screen.getAllByText('25.4h').length).toBeGreaterThan(0)

    // Sections that depend on data being present. One heading query keeps
    // this fast: role queries over the whole report are slow in jsdom.
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(expect.arrayContaining([
      'Where Your Hours Went', 'How You Browse', 'What You Explored', 'Your Most Visited',
      'Your Browsing Rhythm', 'When You Browse', "What's Changing", 'How You Discover Content',
      'What You Were Looking For', 'Your Digital Universe',
    ]))

    expect(screen.getByText('stackoverflow.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share my report/i })).toBeInTheDocument()
  })

  it('shows the "Then vs now" section when the report has a period comparison', () => {
    renderResults({ data: report })
    expect(screen.getByRole('heading', { name: 'Last 30 days vs the 30 days before' })).toBeInTheDocument()
  })

  it('leaves out "Then vs now" for older reports without period_comparison', () => {
    const older = { ...report }
    delete older.period_comparison
    renderResults({ data: older })
    expect(screen.queryByText('Then vs now')).not.toBeInTheDocument()
  })

  it('hides sections whose data is missing', () => {
    const sparse = { ...report, top_domains: [], top_searches: [], knowledge_graph: { nodes: [], edges: [] } }
    renderResults({ data: sparse })

    expect(screen.queryByRole('heading', { name: 'Your Most Visited' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'What You Were Looking For' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your Digital Universe' })).not.toBeInTheDocument()
  })

  it('sends visitors without a report back to the upload page', async () => {
    renderResults(undefined)
    expect(await screen.findByText('upload page')).toBeInTheDocument()
  })
})
