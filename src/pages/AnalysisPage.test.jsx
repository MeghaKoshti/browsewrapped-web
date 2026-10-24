import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import AnalysisPage from './AnalysisPage'
import { getAnalysis, deleteAnalysis } from '../api/client'
import { saveAnalysisDeleteToken, loadAnalysisDeleteToken } from '../lib/deleteTokens'
import report from '../test/fixtures/report.json'

vi.mock('../api/client', () => ({
  getAnalysis: vi.fn(),
  deleteAnalysis: vi.fn(),
  createShareLink: vi.fn(),
  deleteShareLink: vi.fn(),
}))

function renderAnalysis(entry = '/analyses/42') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/analyses/:id" element={<AnalysisPage />} />
        <Route path="/" element={<HomeProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Stands in for the upload page so we can read the notice it receives.
function HomeProbe() {
  const { state } = useLocation()
  return <p>home: {state?.notice}</p>
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

describe('AnalysisPage "Delete this report now"', () => {
  beforeEach(() => {
    vi.mocked(getAnalysis).mockReset().mockResolvedValue({ id: '42', status: 'completed', result: report })
    vi.mocked(deleteAnalysis).mockReset()
  })
  afterEach(() => sessionStorage.clear())

  const openReport = async () => {
    renderAnalysis()
    await screen.findByRole('heading', { name: 'The Builder' }, { timeout: 5000 })
  }

  it('is hidden when this browser has no delete token for the report', async () => {
    await openReport()
    expect(screen.queryByRole('button', { name: 'Delete this report now' })).not.toBeInTheDocument()
  })

  it('asks first, then deletes with the stored token and returns home with a confirmation', async () => {
    saveAnalysisDeleteToken('42', 'del-token')
    vi.mocked(deleteAnalysis).mockResolvedValue()
    await openReport()

    fireEvent.click(screen.getByRole('button', { name: 'Delete this report now' }))
    expect(screen.getByRole('group', { name: 'Delete this report?' })).toHaveTextContent('can’t be undone')
    expect(deleteAnalysis).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Delete report' }))

    expect(await screen.findByText(/home: Your report was deleted/)).toBeInTheDocument()
    expect(deleteAnalysis).toHaveBeenCalledWith('42', 'del-token')
    expect(loadAnalysisDeleteToken('42')).toBeNull()
  })

  it('can be cancelled with "Keep report"', async () => {
    saveAnalysisDeleteToken('42', 'del-token')
    await openReport()

    fireEvent.click(screen.getByRole('button', { name: 'Delete this report now' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep report' }))

    expect(screen.getByRole('button', { name: 'Delete this report now' })).toBeInTheDocument()
    expect(deleteAnalysis).not.toHaveBeenCalled()
  })

  it('explains a rejected token and keeps the report open', async () => {
    saveAnalysisDeleteToken('42', 'wrong')
    vi.mocked(deleteAnalysis).mockRejectedValue({ response: { status: 403, data: { error: { code: 'invalid_delete_token', message: 'Invalid delete token' } } } })
    await openReport()

    fireEvent.click(screen.getByRole('button', { name: 'Delete this report now' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete report' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('the delete key doesn’t match')
    expect(screen.getByRole('heading', { name: 'The Builder' })).toBeInTheDocument()
  })

  it('treats an already-deleted report (404) as done', async () => {
    saveAnalysisDeleteToken('42', 'del-token')
    vi.mocked(deleteAnalysis).mockRejectedValue({ response: { status: 404 } })
    await openReport()

    fireEvent.click(screen.getByRole('button', { name: 'Delete this report now' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete report' }))

    expect(await screen.findByText(/home: Your report was deleted/)).toBeInTheDocument()
  })
})
