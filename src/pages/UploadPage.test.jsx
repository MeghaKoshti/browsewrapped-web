import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import UploadPage from './UploadPage'
import { fetchSampleReport, createAnalysis } from '../api/client'
import report from '../test/fixtures/report.json'

vi.mock('../api/client', () => ({
  fetchSampleReport: vi.fn(),
  createAnalysis: vi.fn(),
  analyzeChrome: vi.fn(),
}))

// Stands in for the results page so we can see what UploadPage navigated with.
function ResultsProbe() {
  const { state } = useLocation()
  return <p>results for {state?.filename} ({state?.data?.summary?.total_visits} visits)</p>
}

function renderUpload() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UploadPage', () => {
  beforeEach(() => { vi.mocked(fetchSampleReport).mockReset() })

  it('loads the sample report through the API client and opens the results page', async () => {
    vi.mocked(fetchSampleReport).mockResolvedValue(report)
    renderUpload()

    await userEvent.click(screen.getByRole('button', { name: /try with sample data/i }))

    expect(fetchSampleReport).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('results for Sample data (1540 visits)')).toBeInTheDocument()
  })

  it('shows the API error when the sample report cannot be loaded', async () => {
    vi.mocked(fetchSampleReport).mockRejectedValue({
      response: { status: 503, data: { error: { code: 'sample_unavailable', message: 'Sample unavailable' }, error_message: 'Sample unavailable' } },
    })
    renderUpload()

    await userEvent.click(screen.getByRole('button', { name: /try with sample data/i }))

    expect(await screen.findByText('Sample unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows friendly copy when uploads are rate limited', async () => {
    vi.mocked(createAnalysis).mockRejectedValue({
      response: { status: 429, headers: { 'retry-after': '60' }, data: { error: { code: 'rate_limited', message: 'Rate limit exceeded' } } },
    })
    const { container } = renderUpload()

    const file = new File(['{}'], 'history.json', { type: 'application/json' })
    await userEvent.upload(container.querySelector('input[type="file"]'), file)

    expect(await screen.findByText('Too many requests right now. Please wait 60 seconds and try again.')).toBeInTheDocument()
  })
})
