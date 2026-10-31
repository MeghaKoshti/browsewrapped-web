import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'
import { getSharedReport, getAnalysis } from './api/client'
import report from './test/fixtures/report.json'

vi.mock('./api/client', () => ({
  getSharedReport: vi.fn(),
  getAnalysis: vi.fn(),
  deleteShareLink: vi.fn(),
  fetchSampleReport: vi.fn(),
  createAnalysis: vi.fn(),
  analyzeChrome: vi.fn(),
  canImportLocalChrome: true,
}))

// Lazy chunks are transformed on first import, which can take a few
// seconds on a busy machine.
const slow = { timeout: 8000 }

describe('App routing (code-split pages)', () => {
  afterEach(() => window.history.pushState({}, '', '/'))

  it('renders the upload page straight away, without a loading state', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByRole('button', { name: /try with sample data/i })).toBeInTheDocument()
  })

  it('shows a skeleton while a lazy page loads, then opens a /r/:token deep link', async () => {
    vi.mocked(getSharedReport).mockResolvedValue({ token: 'tok', report, expires_at: '2026-11-22T00:00:00Z' })
    window.history.pushState({}, '', '/r/tok')
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading your report…')
    expect(await screen.findByRole('heading', { name: 'The Builder' }, slow)).toBeInTheDocument()
    expect(getSharedReport).toHaveBeenCalledWith('tok', expect.anything())

    // The D3 knowledge map is its own chunk and arrives after the report.
    expect(await screen.findByRole('img', { name: /knowledge map/i }, slow)).toBeInTheDocument()
  })
  describe('footer', () => {
    const expectFooterLinks = () => {
      const footer = within(screen.getByRole('contentinfo'))
      for (const [name, href] of [['Privacy', '/privacy'], ['Terms', '/terms'], ['Refunds', '/refund'], ['Contact', '/contact']]) {
        expect(footer.getByRole('link', { name })).toHaveAttribute('href', href)
      }
    }

    it('is on the upload page', () => {
      window.history.pushState({}, '', '/')
      render(<App />)
      expectFooterLinks()
    })

    it('is on a report page', async () => {
      vi.mocked(getAnalysis).mockResolvedValue({ id: '42', status: 'completed', result: report })
      window.history.pushState({}, '', '/analyses/42')
      render(<App />)
      await screen.findByRole('heading', { name: 'The Builder' }, slow)
      expectFooterLinks()
    })

    it('is on a shared report page', async () => {
      vi.mocked(getSharedReport).mockResolvedValue({ token: 'tok', report, expires_at: '2026-11-22T00:00:00Z' })
      window.history.pushState({}, '', '/r/tok')
      render(<App />)
      await screen.findByRole('heading', { name: 'The Builder' }, slow)
      expectFooterLinks()
    })
  })
})
