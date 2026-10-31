import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PricingPage from './PricingPage'
import GetPassForm from '../../components/pass/GetPassForm'
import { PassContext, NO_PASS } from '../../pass/passContext'
import { getPricing, createCheckout, requestMagicLink } from '../../api/client'

vi.mock('../../api/client', () => ({ getPricing: vi.fn(), createCheckout: vi.fn(), requestMagicLink: vi.fn() }))

const pricing = {
  plan: 'wrapped_pass',
  prices: { INR: { amount: 19900, early_bird_amount: 9900 }, USD: { amount: 500, early_bird_amount: 300 } },
  early_bird_until: '2099-12-15T23:59:59Z',
  valid_days: 365,
}

function renderPricing(pass = NO_PASS) {
  return render(
    <MemoryRouter>
      <PassContext.Provider value={pass}><PricingPage /></PassContext.Provider>
    </MemoryRouter>,
  )
}

const passCard = () => within(screen.getByRole('region', { name: 'Wrapped Pass' }))

describe('PricingPage', () => {
  beforeEach(() => {
    vi.mocked(getPricing).mockReset().mockResolvedValue(pricing)
    vi.mocked(createCheckout).mockReset()
    vi.mocked(requestMagicLink).mockReset()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    // The machine running the tests may sit in an Indian timezone.
    const options = Intl.DateTimeFormat.prototype.resolvedOptions
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function () {
      return { ...options.call(this), timeZone: 'America/New_York' }
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows dollars by default outside India, with the early-bird price', async () => {
    renderPricing()
    expect(await passCard().findByText('$3')).toBeInTheDocument()
    expect(passCard().getByText('$5').closest('s')).not.toBeNull()
    expect(passCard().getByText(/Early-bird price until 15 December 2099/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '$ USD' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows rupees for an en-IN browser, and switches currency by hand', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-IN', 'en'])
    renderPricing()
    expect(await passCard().findByText('₹99')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '$ USD' }))
    expect(passCard().getByText('$3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '$ USD' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the regular price once the early bird has ended', async () => {
    vi.mocked(getPricing).mockResolvedValue({ ...pricing, early_bird_until: '2020-01-01T00:00:00Z' })
    renderPricing()
    expect(await passCard().findByText('$5')).toBeInTheDocument()
    expect(passCard().queryByText(/Early-bird/)).not.toBeInTheDocument()
  })

  it('lists free vs Pass features, marking unbuilt ones as coming soon', async () => {
    renderPricing()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('row', { name: /Story slides.*First slide.*All 5 slides/ })).toBeInTheDocument()
    expect(within(table).getByRole('row', { name: /Merge several history files.*Not included.*Included.*Coming soon/ })).toBeInTheDocument()
    await passCard().findByText('$3')
  })

  it('asks for an email, starts a checkout in the chosen currency and redirects', async () => {
    vi.mocked(createCheckout).mockResolvedValue({ checkout_url: 'https://checkout.example.com/pay/1' })
    const redirect = vi.fn()
    render(<GetPassForm currency="INR" priceLabel="₹99" redirect={redirect} />)

    await userEvent.click(screen.getByRole('button', { name: 'Get the Pass' }))
    await userEvent.type(screen.getByLabelText('Your email'), ' me@example.com ')
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment (₹99)' }))

    expect(createCheckout).toHaveBeenCalledWith({ email: 'me@example.com', currency: 'INR' })
    expect(redirect).toHaveBeenCalledWith('https://checkout.example.com/pay/1')
  })

  it('explains an invalid email (422) and never follows an unsafe checkout URL', async () => {
    const redirect = vi.fn()
    vi.mocked(createCheckout)
      .mockRejectedValueOnce({ response: { status: 422, data: { error: { code: 'invalid_email', message: 'Please enter a valid email address.' } } } })
      .mockResolvedValueOnce({ checkout_url: 'javascript:alert(1)' })
    render(<GetPassForm currency="USD" redirect={redirect} />)

    await userEvent.click(screen.getByRole('button', { name: 'Get the Pass' }))
    await userEvent.type(screen.getByLabelText('Your email'), 'me@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address')

    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Nothing was charged')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('restores a Pass by email without revealing whether it exists', async () => {
    vi.mocked(requestMagicLink).mockResolvedValue()
    renderPricing()
    const restore = within(screen.getByRole('region', { name: 'Restore my Pass' }))

    await userEvent.type(restore.getByLabelText('Email you paid with'), 'me@example.com')
    await userEvent.click(restore.getByRole('button', { name: 'Email me a sign-in link' }))

    expect(requestMagicLink).toHaveBeenCalledWith('me@example.com')
    expect(await screen.findByText(/If/)).toHaveTextContent('If me@example.com has a Wrapped Pass, a sign-in link is on its way.')
  })

  it('shows an active Pass instead of the buy button', async () => {
    renderPricing({ ...NO_PASS, status: 'active', hasPass: true, validUntil: '2027-10-31T00:00:00Z' })
    expect(await passCard().findByText(/Your Pass is active until 31 October 2027/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Get the Pass' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Restore my Pass' })).not.toBeInTheDocument()
  })

  it('says so when pricing cannot load', async () => {
    vi.mocked(getPricing).mockRejectedValue(new Error('Network Error'))
    renderPricing()
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load the price')
  })
})
