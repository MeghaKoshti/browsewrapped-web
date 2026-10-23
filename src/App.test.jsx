import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { getSharedReport } from './api/client'
import report from './test/fixtures/report.json'

vi.mock('./api/client', () => ({
  getSharedReport: vi.fn(),
  deleteShareLink: vi.fn(),
  fetchSampleReport: vi.fn(),
  createAnalysis: vi.fn(),
  analyzeChrome: vi.fn(),
}))

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
    expect(await screen.findByRole('heading', { name: 'The Builder' })).toBeInTheDocument()
    expect(getSharedReport).toHaveBeenCalledWith('tok', expect.anything())

    // The D3 knowledge map is its own chunk and arrives after the report.
    expect(await screen.findByRole('img', { name: /knowledge map/i })).toBeInTheDocument()
  })
})
