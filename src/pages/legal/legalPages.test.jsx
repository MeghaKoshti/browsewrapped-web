import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from '../../App'
import { formatLegalDate, LEGAL_LAST_UPDATED } from '../../lib/legal'

vi.mock('../../api/client', () => ({ canImportLocalChrome: false }))

const slow = { timeout: 8000 }

function open(path) {
  window.history.pushState({}, '', path)
  render(<App />)
}

describe('legal pages', () => {
  afterEach(() => window.history.pushState({}, '', '/'))

  it('formats the single "last updated" date', () => {
    expect(LEGAL_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(formatLegalDate('2026-10-24')).toBe('24 October 2026')
  })

  it.each([
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms of Service'],
    ['/refund', 'Refund Policy'],
    ['/contact', 'Contact'],
  ])('routes %s to its page with the shared last-updated date', async (path, title) => {
    open(path)
    expect(await screen.findByRole('heading', { level: 1, name: title }, slow)).toBeInTheDocument()
    expect(screen.getByText(`Last updated ${formatLegalDate()}`)).toBeInTheDocument()
    expect(document.title).toBe(`${title} — BrowseWrapped`)
  })

  it('privacy page has the data-flow table, processors, rights and the age limit', async () => {
    open('/privacy')
    const table = await screen.findByRole('table', {}, slow)
    const rows = within(table).getAllByRole('row').map((r) => r.textContent)
    expect(rows.some((r) => /history file.*deleted/i.test(r))).toBe(true)
    expect(rows.some((r) => /top searches.*7 days after upload/i.test(r))).toBe(true)
    expect(rows.some((r) => /Share link.*30 days/i.test(r))).toBe(true)
    expect(rows.some((r) => /Google Gemini/.test(r))).toBe(true)

    for (const processor of ['Fly.io', 'Google (Gemini API)', 'Dodo Payments', 'Analytics']) {
      expect(screen.getByText(`${processor}:`)).toBeInTheDocument()
    }
    expect(screen.getByText(/Digital Personal Data Protection Act, 2023/)).toBeInTheDocument()
    expect(screen.getByText(/GDPR/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Grievances and complaints' })).toBeInTheDocument()
    expect(screen.getByText(/not intended for anyone under 18/)).toBeInTheDocument()
  })

  it('refund page offers a 7-day no-questions refund and says how to ask', async () => {
    open('/refund')
    expect(await screen.findByText(/Ask within 7 days and you get all your money back/, {}, slow)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How to ask' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'contact@example.com' })[0].getAttribute('href')).toMatch(/^mailto:contact@example\.com\?subject=Wrapped%20Pass%20refund/)
  })

  it('names an India-based individual operator on the terms page', async () => {
    open('/terms')
    expect(await screen.findByText(/an individual based in India/, {}, slow)).toBeInTheDocument()
    expect(screen.getByText(/one-time payment, not a subscription/)).toBeInTheDocument()
  })
})
