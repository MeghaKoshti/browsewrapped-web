import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SharedReportPage from './SharedReportPage'
import { getSharedReport } from '../api/client'
import { saveDeleteToken } from '../lib/shareTokens'
import report from '../test/fixtures/report.json'

vi.mock('../api/client', () => ({ getSharedReport: vi.fn(), deleteShareLink: vi.fn() }))

function renderShared(token = 'tok123') {
  return render(
    <MemoryRouter initialEntries={[`/r/${token}`]}>
      <Routes>
        <Route path="/r/:token" element={<SharedReportPage />} />
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
    expect(screen.getByRole('button', { name: /make your own wrapped/i })).toBeInTheDocument()
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
  })
})
