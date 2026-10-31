import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode, useEffect } from 'react'
import { render, screen, act } from '@testing-library/react'
import PassProvider from './PassProvider'
import usePass, { passStateFrom } from './passContext'
import { getMe, verifyMagicLink } from '../api/client'

vi.mock('../api/client', () => ({ getMe: vi.fn(), verifyMagicLink: vi.fn() }))

// The latest usePass() value, so tests can call signIn/signOut.
const seen = {}
function Probe() {
  const pass = usePass()
  useEffect(() => { seen.pass = pass })
  return <p>status: {pass.status}{pass.email ? ` (${pass.email})` : ''}</p>
}

const renderProvider = () => render(<StrictMode><PassProvider><Probe /></PassProvider></StrictMode>)

describe('usePass / PassProvider', () => {
  beforeEach(() => {
    vi.mocked(getMe).mockReset()
    vi.mocked(verifyMagicLink).mockReset()
  })

  it('reports no Pass without a stored token, and never calls /me', () => {
    renderProvider()
    expect(screen.getByText('status: none')).toBeInTheDocument()
    expect(seen.pass.hasPass).toBe(false)
    expect(getMe).not.toHaveBeenCalled()
  })

  it('checks a stored token with /me and shares the result', async () => {
    localStorage.setItem('bw.passToken', 'session-1')
    vi.mocked(getMe).mockResolvedValue({ email: 'a@example.com', pass_valid_until: '2027-10-24T00:00:00Z', has_pass: true })
    renderProvider()

    expect(screen.getByText('status: loading')).toBeInTheDocument()
    expect(await screen.findByText('status: active (a@example.com)')).toBeInTheDocument()
    expect(seen.pass.hasPass).toBe(true)
    expect(getMe).toHaveBeenCalledWith('session-1', expect.anything())
  })

  it('forgets a token the API rejects (401)', async () => {
    localStorage.setItem('bw.passToken', 'stale')
    vi.mocked(getMe).mockRejectedValue({ response: { status: 401 } })
    renderProvider()

    expect(await screen.findByText('status: none')).toBeInTheDocument()
    expect(localStorage.getItem('bw.passToken')).toBeNull()
    expect(seen.pass.sessionExpired).toBe(true)
  })

  it('signs in with an email link token once, even when asked twice', async () => {
    vi.mocked(verifyMagicLink).mockResolvedValue({ access_token: 'session-2', email: 'b@example.com', pass_valid_until: '2099-01-01T00:00:00Z' })
    renderProvider()

    await act(() => Promise.all([seen.pass.signIn('magic'), seen.pass.signIn('magic')]))

    expect(verifyMagicLink).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('bw.passToken')).toBe('session-2')
    expect(screen.getByText('status: active (b@example.com)')).toBeInTheDocument()

    act(() => seen.pass.signOut())
    expect(screen.getByText('status: none')).toBeInTheDocument()
    expect(localStorage.getItem('bw.passToken')).toBeNull()
  })

  it('is safe to use without a provider', () => {
    render(<Probe />)
    expect(screen.getByText('status: none')).toBeInTheDocument()
  })
})

describe('passStateFrom', () => {
  it('marks an ended Pass as expired', () => {
    expect(passStateFrom({ email: 'c@example.com', pass_valid_until: '2020-01-01T00:00:00Z', has_pass: false }))
      .toEqual({ status: 'expired', hasPass: false, email: 'c@example.com', validUntil: '2020-01-01T00:00:00Z' })
  })
})
