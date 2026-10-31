import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import PassProvider from '../../pass/PassProvider'
import BillingSuccessPage from './BillingSuccessPage'
import BillingCancelPage from './BillingCancelPage'
import VerifyPage from './VerifyPage'
import { getMe, verifyMagicLink, requestMagicLink } from '../../api/client'

vi.mock('../../api/client', () => ({ getMe: vi.fn(), verifyMagicLink: vi.fn(), requestMagicLink: vi.fn() }))

function LocationProbe() {
  const { search } = useLocation()
  return <p data-testid="search">{search}</p>
}

function renderAt(entry) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[entry]}>
        <PassProvider>
          <Routes>
            <Route path="/billing/success" element={<><BillingSuccessPage /><LocationProbe /></>} />
            <Route path="/billing/cancel" element={<BillingCancelPage />} />
            <Route path="/auth/verify" element={<><VerifyPage /><LocationProbe /></>} />
          </Routes>
        </PassProvider>
      </MemoryRouter>
    </StrictMode>,
  )
}

const tick = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms))
const ME_WITHOUT_PASS = { email: 'me@example.com', pass_valid_until: null, has_pass: false }
const ME_WITH_PASS = { email: 'me@example.com', pass_valid_until: '2027-10-31T00:00:00Z', has_pass: true }

describe('/billing/success', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(getMe).mockReset()
    vi.mocked(verifyMagicLink).mockReset()
    vi.mocked(requestMagicLink).mockReset().mockResolvedValue()
  })
  afterEach(() => vi.useRealTimers())

  it('polls /me until the webhook has created the Pass', async () => {
    localStorage.setItem('bw.passToken', 'session')
    vi.mocked(getMe)
      .mockResolvedValueOnce(ME_WITHOUT_PASS) // PassProvider's own check on load
      .mockResolvedValueOnce(ME_WITHOUT_PASS)
      .mockResolvedValueOnce(ME_WITHOUT_PASS)
      .mockResolvedValue(ME_WITH_PASS)
    renderAt('/billing/success?email=me%40example.com')

    await tick()
    expect(screen.getByRole('status')).toHaveTextContent('Activating your Pass')
    await tick(2000)
    await tick(2000)

    expect(screen.getByRole('heading', { name: 'Your Wrapped Pass is active' })).toBeInTheDocument()
    expect(screen.getByText(/valid until 31 October 2027/)).toBeInTheDocument()
    const calls = vi.mocked(getMe).mock.calls.length
    await tick(10000)
    expect(getMe).toHaveBeenCalledTimes(calls)
  })

  it('stops after 30 seconds with a timeout message', async () => {
    localStorage.setItem('bw.passToken', 'session')
    vi.mocked(getMe).mockResolvedValue(ME_WITHOUT_PASS)
    renderAt('/billing/success?email=me%40example.com')

    await tick()
    await tick(28000)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await tick(2000)

    expect(screen.getByRole('alert')).toHaveTextContent('We haven’t had the payment confirmation yet')
    expect(screen.getByRole('heading', { name: 'Your Pass is taking longer than usual' })).toBeInTheDocument()
    const calls = vi.mocked(getMe).mock.calls.length
    await tick(10000)
    expect(getMe).toHaveBeenCalledTimes(calls)
  })

  it('without a session, emails a sign-in link once and says to check email', async () => {
    renderAt('/billing/success?email=me%40example.com')
    await tick()

    expect(screen.getByRole('heading', { name: 'Thanks! Check your email' })).toBeInTheDocument()
    expect(screen.getByText('me@example.com')).toBeInTheDocument()
    expect(requestMagicLink).toHaveBeenCalledTimes(1)
    expect(requestMagicLink).toHaveBeenCalledWith('me@example.com')
    expect(getMe).not.toHaveBeenCalled()
  })

  it('signs straight in with the dev-only ?token=, then removes it from the address', async () => {
    vi.mocked(verifyMagicLink).mockResolvedValue({ access_token: 'session-dev', ...ME_WITH_PASS })
    vi.mocked(getMe).mockResolvedValue(ME_WITH_PASS)
    renderAt('/billing/success?email=me%40example.com&token=magic-dev')
    await tick()

    expect(screen.getByTestId('search')).toHaveTextContent('?email=me%40example.com')
    expect(verifyMagicLink).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('bw.passToken')).toBe('session-dev')
    expect(screen.getByRole('heading', { name: 'Your Wrapped Pass is active' })).toBeInTheDocument()
    expect(requestMagicLink).not.toHaveBeenCalled()
  })
})

describe('/billing/cancel', () => {
  it('says nothing was charged and links back to pricing', () => {
    renderAt('/billing/cancel')
    expect(screen.getByRole('heading', { name: 'Checkout cancelled' })).toBeInTheDocument()
    expect(screen.getByText(/Nothing was charged/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to pricing' })).toHaveAttribute('href', '/pricing')
  })
})

describe('/auth/verify', () => {
  beforeEach(() => {
    vi.mocked(verifyMagicLink).mockReset()
    vi.mocked(getMe).mockReset()
  })

  it('POSTs the token once, stores the session and hides the token', async () => {
    vi.mocked(verifyMagicLink).mockResolvedValue({ access_token: 'session-3', ...ME_WITH_PASS })
    renderAt('/auth/verify?token=verify-1')

    expect(await screen.findByRole('heading', { name: 'Your Pass is unlocked on this device' })).toBeInTheDocument()
    expect(verifyMagicLink).toHaveBeenCalledTimes(1)
    expect(verifyMagicLink).toHaveBeenCalledWith('verify-1')
    expect(localStorage.getItem('bw.passToken')).toBe('session-3')
    expect(screen.getByTestId('search')).toBeEmptyDOMElement()
  })

  it('explains an expired or used link (401) and offers a new one', async () => {
    vi.mocked(verifyMagicLink).mockRejectedValue({ response: { status: 401, data: { error: { code: 'invalid_or_expired_token' } } } })
    renderAt('/auth/verify?token=verify-2')

    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Email me a sign-in link' })).toBeInTheDocument()
    expect(localStorage.getItem('bw.passToken')).toBeNull()
  })

  it('tells a signed-in email without an active Pass', async () => {
    vi.mocked(verifyMagicLink).mockResolvedValue({ access_token: 'session-4', email: 'old@example.com', pass_valid_until: '2025-01-01T00:00:00Z' })
    renderAt('/auth/verify?token=verify-3')

    expect(await screen.findByRole('heading', { name: 'No active Pass for this email' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See pricing' })).toHaveAttribute('href', '/pricing')
  })
})
