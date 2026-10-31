import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PassGate from './PassGate'
import PassStatus from './PassStatus'
import { PassContext, NO_PASS } from '../../pass/passContext'
import { errorMessage } from '../../api/errorMessage'

const ACTIVE = { ...NO_PASS, status: 'active', hasPass: true, email: 'me@example.com', validUntil: '2027-10-31T00:00:00Z' }

function renderWith(pass, ui) {
  return render(<MemoryRouter><PassContext.Provider value={pass}>{ui}</PassContext.Provider></MemoryRouter>)
}

const gate = <PassGate title="Unlock all 5 story slides" description="The Pass adds four more slides."><p>secret slides</p></PassGate>

describe('PassGate', () => {
  it('shows an upgrade prompt without a Pass', () => {
    renderWith(NO_PASS, gate)
    expect(screen.queryByText('secret slides')).not.toBeInTheDocument()
    const prompt = screen.getByRole('group', { name: 'Unlock all 5 story slides' })
    expect(prompt).toHaveTextContent('The Pass adds four more slides.')
    expect(screen.getByRole('link', { name: 'Get the Pass' })).toHaveAttribute('href', '/pricing')
    expect(screen.getByRole('link', { name: 'I already have one' })).toHaveAttribute('href', '/pricing#restore')
  })

  it('shows the feature to a Pass holder', () => {
    renderWith(ACTIVE, gate)
    expect(screen.getByText('secret slides')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Get the Pass' })).not.toBeInTheDocument()
  })

  it('waits quietly while the Pass is being checked', () => {
    renderWith({ ...NO_PASS, status: 'loading' }, gate)
    expect(screen.getByRole('status')).toHaveTextContent('Checking your Pass…')
    expect(screen.queryByRole('link', { name: 'Get the Pass' })).not.toBeInTheDocument()
  })

  it('tells an expired Pass holder why it is locked again', () => {
    renderWith({ ...NO_PASS, status: 'expired', validUntil: '2025-01-01T00:00:00Z' }, gate)
    expect(screen.getByText(/Your Wrapped Pass has ended/)).toBeInTheDocument()
  })
})

describe('PassStatus', () => {
  it('is empty without a Pass', () => {
    const { container } = renderWith(NO_PASS, <PassStatus />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the active Pass and signs this device out', async () => {
    const signOut = vi.fn()
    renderWith({ ...ACTIVE, signOut }, <PassStatus />)
    expect(screen.getByText(/Wrapped Pass active until 31 October 2027/)).toHaveTextContent('me@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Sign out on this device' }))
    expect(signOut).toHaveBeenCalled()
  })
})

describe('pass_required errors', () => {
  it('explain that a Pass is needed (402)', () => {
    expect(errorMessage({ response: { status: 402, data: { error: { code: 'pass_required' } } } })).toMatch(/needs a Wrapped Pass/)
    expect(errorMessage({ response: { status: 402, data: {} } })).toMatch(/needs a Wrapped Pass/)
  })
})
