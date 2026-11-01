import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import SharedReportPage from './SharedReportPage'
import { getSharedReport } from '../api/client'
import { saveDeleteToken } from '../lib/shareTokens'
import report from '../test/fixtures/report.json'

vi.mock('../api/client', () => ({ getSharedReport: vi.fn(), deleteShareLink: vi.fn() }))

function HomeProbe() {
  return <p>home{useLocation().search}</p>
}

function renderShared(token = 'tok123') {
  return render(
    <MemoryRouter initialEntries={[`/r/${token}`]}>
      <Routes>
        <Route path="/r/:token" element={<SharedReportPage />} />
        <Route path="/" element={<HomeProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SharedReportPage', () => {
  beforeEach(() => { vi.mocked(getSharedReport).mockReset() })

  it('shows a not-found message for an unknown or expired link', async () => {
    vi.mocked(getSharedReport).mockRejectedValue({ response: { status: 404 } })
    renderShared()

    expect(await screen.findByText(/doesn’t exist or has expired/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /make your own wrapped/i }))
    expect(screen.getByText('home?ref=share')).toBeInTheDocument()
  })

  it('renders a shared report whose period comparison is null', async () => {
    vi.mocked(getSharedReport).mockResolvedValue({ token: 'tok123', report: { ...report, period_comparison: null }, expires_at: '2026-11-22T00:00:00Z' })
    renderShared()

    expect(await screen.findByRole('heading', { name: 'The Builder' })).toBeInTheDocument()
    expect(screen.queryByText('Then vs now')).not.toBeInTheDocument()
  })

  it('shows a generic error when the server fails', async () => {
    vi.mocked(getSharedReport).mockRejectedValue({ response: { status: 500 } })
    renderShared()

    expect(await screen.findByText(/couldn’t load this report/i)).toBeInTheDocument()
  })

  it('renders a shared report read-only, with a delete link only for its creator', async () => {
    vi.mocked(getSharedReport).mockResolvedValue({ token: 'tok123', report, expires_at: '2026-11-22T00:00:00Z' })
    saveDeleteToken('tok123', 'del-secret')
    renderShared()

    expect(await screen.findByRole('heading', { name: 'The Builder' })).toBeInTheDocument()
    expect(screen.getByText(/a shared browsewrapped report/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete this link/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /share my report/i })).not.toBeInTheDocument()
    expect(getSharedReport).toHaveBeenCalledWith('tok123', expect.anything())
    expect(screen.getByRole('heading', { name: 'Last 30 days vs the 30 days before' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download image' })).toBeInTheDocument()
    // Story slides are for your own report, not someone else's share.
    expect(screen.queryByRole('heading', { name: 'Post your Wrapped' })).not.toBeInTheDocument()
  })

  it('tags "Make your own" links with ?ref=share', async () => {
    vi.mocked(getSharedReport).mockResolvedValue({ token: 'tok123', report, expires_at: '2026-11-22T00:00:00Z' })
    renderShared()

    expect(await screen.findByRole('link', { name: 'Make your own →' })).toHaveAttribute('href', '/?ref=share')
  })
})
