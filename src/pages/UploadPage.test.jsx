import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import UploadPage from './UploadPage'
import { fetchSampleReport, createAnalysis } from '../api/client'
import report from '../test/fixtures/report.json'

const api = vi.hoisted(() => ({ localChrome: true }))
vi.mock('../api/client', () => ({
  fetchSampleReport: vi.fn(),
  createAnalysis: vi.fn(),
  analyzeChrome: vi.fn(),
  get canImportLocalChrome() { return api.localChrome },
}))

// Stands in for the results page so we can see what UploadPage navigated with.
function ResultsProbe() {
  const { state } = useLocation()
  return <p>results for {state?.filename} ({state?.data?.summary?.total_visits} visits)</p>
}

function renderUpload(entry = '/') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UploadPage', () => {
  beforeEach(() => {
    vi.mocked(fetchSampleReport).mockReset()
    api.localChrome = true
  })

  it('offers "Import from Chrome" only when the API runs on this computer', () => {
    const { unmount } = renderUpload()
    expect(screen.getByRole('button', { name: /import from chrome/i })).toBeInTheDocument()
    unmount()

    api.localChrome = false
    renderUpload()
    expect(screen.queryByRole('button', { name: /import from chrome/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try with sample data/i })).toBeInTheDocument()
  })

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

  it('scrolls the error into view, since it sits below the fold on most screens', async () => {
    const scrollIntoView = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView
    vi.mocked(createAnalysis).mockRejectedValue({
      response: { status: 422, data: { error: { code: 'empty_file', message: 'The file is empty' } } },
    })
    const { container } = renderUpload()

    await userEvent.upload(container.querySelector('input[type="file"]'), new File([''], 'empty.json'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The file is empty')
    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.contexts[0]).toBe(alert)
    delete window.HTMLElement.prototype.scrollIntoView
  })

  it('lets any file through the picker, so Chrome’s extensionless "History" file can be chosen', async () => {
    vi.mocked(createAnalysis).mockResolvedValue({ id: '7', status: 'pending' })
    const { container } = renderUpload()
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toHaveAttribute('accept')

    const history = new File(['SQLite format 3\0'], 'History', { type: '' })
    await userEvent.upload(input, history)

    expect(createAnalysis).toHaveBeenCalledWith(history, expect.any(Function))
  })

  it('explains an SQLite file that isn’t browser history', async () => {
    vi.mocked(createAnalysis).mockRejectedValue({
      response: { status: 415, data: { error: { code: 'unsupported_sqlite', message: 'Unsupported SQLite database' } } },
    })
    const { container } = renderUpload()

    await userEvent.upload(container.querySelector('input[type="file"]'), new File(['x'], 'notes.db'))

    expect(await screen.findByRole('alert')).toHaveTextContent('That database isn’t a browser history file.')
  })

  it('opens the export guide on the visitor’s browser', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
    )
    renderUpload()

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Firefox')
    expect(screen.getAllByRole('button', { name: /^Copy .* path$/ })[0]).toHaveAccessibleName('Copy Linux path')
  })
  it('keeps the upload’s delete token for this tab so the report can be deleted', async () => {
    vi.mocked(createAnalysis).mockResolvedValue({ id: 9, status: 'pending', delete_token: 'one-time-delete-token' })
    const { container } = renderUpload()

    await userEvent.upload(container.querySelector('input[type="file"]'), new File(['{}'], 'history.json'))

    expect(JSON.parse(sessionStorage.getItem('bw.deleteTokens'))).toEqual({ 9: 'one-time-delete-token' })
    sessionStorage.clear()
  })

  it('says exactly what is kept, and for how long', () => {
    renderUpload()
    const privacy = screen.getByRole('region', { name: 'What happens to your file' })
    expect(privacy).toHaveTextContent('kept for 7 days')
    expect(privacy).toHaveTextContent('top pages (address and title) and top searches')
    expect(privacy).toHaveTextContent('Delete this report now')
  })

  it('shows a confirmation passed from the previous page', () => {
    renderUpload({ pathname: '/', state: { notice: 'Your report was deleted from our server.' } })
    expect(screen.getByRole('status')).toHaveTextContent('Your report was deleted from our server.')
  })
  it('tells uploaders they agree to the Terms and Privacy Policy, with links', () => {
    renderUpload()
    const notice = screen.getByText(/By uploading you agree to the/)
    expect(within(notice).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(within(notice).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })
})
