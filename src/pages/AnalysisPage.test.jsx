import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AnalysisPage from './AnalysisPage'
import { getAnalysis } from '../api/client'
import report from '../test/fixtures/report.json'

vi.mock('../api/client', () => ({
  getAnalysis: vi.fn(),
  createShareLink: vi.fn(),
  deleteShareLink: vi.fn(),
}))

function renderAnalysis(entry = '/analyses/42') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/analyses/:id" element={<AnalysisPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Lets pending promises settle and moves the 2 s poll timer forward.
const tick = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms))

describe('AnalysisPage (processing + polling)', () => {
  beforeEach(() => {
    // Only fake the poll timer; charts keep their real animation frames.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(getAnalysis).mockReset()
  })
  afterEach(() => { vi.useRealTimers() })

  it('polls through pending and processing until the report is ready', async () => {
    vi.mocked(getAnalysis)
      .mockResolvedValueOnce({ id: '42', status: 'pending' })
      .mockResolvedValueOnce({ id: '42', status: 'processing', filename: 'history.json' })
      .mockResolvedValueOnce({ id: '42', status: 'completed', result: report })

    renderAnalysis()
    await tick()
    expect(screen.getByRole('status')).toHaveTextContent('Queued…')

    await tick(2000)
    expect(screen.getByRole('status')).toHaveTextContent('Analyzing your history…')
    expect(screen.getByText('history.json')).toBeInTheDocument()

    await tick(2000)
    expect(screen.getByRole('heading', { name: 'The Builder' })).toBeInTheDocument()
    expect(getAnalysis).toHaveBeenCalledTimes(3)

    // Completed: polling stops.
    await tick(10000)
    expect(getAnalysis).toHaveBeenCalledTimes(3)
  })

  it('shows the server error message when the analysis failed', async () => {
    vi.mocked(getAnalysis).mockResolvedValue({ id: '42', status: 'failed', error_message: 'Unsupported file format' })

    renderAnalysis()
    await tick()

    expect(screen.getByText('We couldn’t analyze that file')).toBeInTheDocument()
    expect(screen.getByText('Unsupported file format')).toBeInTheDocument()
  })

  it('explains that the analysis expired on a 404', async () => {
    vi.mocked(getAnalysis).mockRejectedValue({ response: { status: 404 } })

    renderAnalysis()
    await tick()

    expect(screen.getByText(/couldn’t find this analysis/i)).toBeInTheDocument()
  })

  it('gives up after repeated network errors', async () => {
    vi.mocked(getAnalysis).mockRejectedValue(new Error('Network Error'))

    renderAnalysis()
    await tick()
    for (let i = 0; i < 4; i++) await tick(2000)

    expect(getAnalysis).toHaveBeenCalledTimes(5)
    expect(screen.getByText(/lost contact with the server/i)).toBeInTheDocument()
  })
})
