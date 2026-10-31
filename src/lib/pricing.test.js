import { describe, it, expect } from 'vitest'
import { detectCurrency, isEarlyBird, priceFor, formatPrice, formatDate, isSafeRedirect, PLAN_FEATURES } from './pricing'

const pricing = {
  plan: 'wrapped_pass',
  prices: { INR: { amount: 19900, early_bird_amount: 9900 }, USD: { amount: 500, early_bird_amount: 300 } },
  early_bird_until: '2026-12-15T23:59:59Z',
  valid_days: 365,
}

describe('detectCurrency', () => {
  it('shows rupees for an Indian locale or timezone', () => {
    expect(detectCurrency({ languages: ['en-IN'] })).toBe('INR')
    expect(detectCurrency({ languages: ['en-US', 'hi-IN'] })).toBe('INR')
    expect(detectCurrency({ languages: ['en-GB'], timeZone: 'Asia/Kolkata' })).toBe('INR')
    expect(detectCurrency({ languages: ['en'], timeZone: 'Asia/Calcutta' })).toBe('INR')
  })

  it('shows dollars everywhere else', () => {
    expect(detectCurrency({ languages: ['en-US'], timeZone: 'America/New_York' })).toBe('USD')
    expect(detectCurrency()).toBe('USD')
  })
})

describe('priceFor', () => {
  const before = Date.parse('2026-12-01T00:00:00Z')
  const after = Date.parse('2026-12-16T00:00:00Z')

  it('uses the early-bird price until the end date', () => {
    expect(isEarlyBird(pricing, before)).toBe(true)
    expect(priceFor(pricing, 'INR', before)).toEqual({ amount: 9900, regular: 19900, earlyBird: true })
    expect(priceFor(pricing, 'USD', before)).toEqual({ amount: 300, regular: 500, earlyBird: true })
  })

  it('uses the regular price after it, or when there is no early bird', () => {
    expect(priceFor(pricing, 'INR', after)).toEqual({ amount: 19900, regular: 19900, earlyBird: false })
    expect(priceFor({ ...pricing, early_bird_until: null }, 'USD', before).amount).toBe(500)
  })

  it('returns null for an unknown currency or missing pricing', () => {
    expect(priceFor(pricing, 'EUR')).toBeNull()
    expect(priceFor(null, 'INR')).toBeNull()
  })
})

describe('formatPrice', () => {
  it('formats paise and cents, dropping .00', () => {
    expect(formatPrice(19900, 'INR')).toBe('₹199')
    expect(formatPrice(9900, 'INR')).toBe('₹99')
    expect(formatPrice(500, 'USD')).toBe('$5')
    expect(formatPrice(250, 'USD')).toBe('$2.50')
    expect(formatPrice(0, 'INR')).toBe('₹0')
  })
})

describe('formatDate', () => {
  it('writes the end date in UTC', () => {
    expect(formatDate('2026-12-15T23:59:59Z')).toBe('15 December 2026')
    expect(formatDate('nope')).toBe('')
  })
})

describe('isSafeRedirect', () => {
  it('only follows http(s) checkout links', () => {
    expect(isSafeRedirect('https://test.checkout.dodopayments.com/abc')).toBe(true)
    expect(isSafeRedirect('http://localhost:3000/api/v1/fake_checkout/1')).toBe(true)
    expect(isSafeRedirect('javascript:alert(1)')).toBe(false)
    expect(isSafeRedirect('data:text/html,hi')).toBe(false)
  })
})

describe('PLAN_FEATURES', () => {
  it('locks only the story slides beyond the first one in the free plan today', () => {
    const live = PLAN_FEATURES.filter((f) => !f.soon && f.free !== f.pass)
    expect(live.map((f) => f.free)).toEqual(['First slide'])
  })
})
