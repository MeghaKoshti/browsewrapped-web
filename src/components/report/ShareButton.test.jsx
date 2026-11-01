import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareButton from './ShareButton'
import { createShareLink } from '../../api/client'
import { renderOgCardPng } from '../../lib/personaImage'
import report from '../../test/fixtures/report.json'

vi.mock('../../api/client', () => ({ createShareLink: vi.fn(), deleteShareLink: vi.fn() }))
vi.mock('../../lib/personaImage', async (importOriginal) => ({ ...(await importOriginal()), renderOgCardPng: vi.fn() }))

const png = (bytes = 1000) => new Blob([new Uint8Array(bytes)], { type: 'image/png' })
const created = {
  token: 'tok', path: '/r/tok', preview_url: 'https://api.example.com/s/tok', delete_token: 'del', expires_at: '2026-11-30T00:00:00Z',
}

describe('ShareButton', () => {
  beforeEach(() => {
    vi.mocked(createShareLink).mockReset().mockResolvedValue(created)
    vi.mocked(renderOgCardPng).mockReset()
  })

  it('sends the 1200×630 persona card with the share and copies the preview link', async () => {
    const card = png()
    vi.mocked(renderOgCardPng).mockResolvedValue(card)
    render(<ShareButton analysisId="42" report={report} />)

    await userEvent.click(screen.getByRole('button', { name: /share my report/i }))

    expect(renderOgCardPng).toHaveBeenCalledWith(expect.objectContaining({ title: 'The Builder' }))
    expect(createShareLink).toHaveBeenCalledWith({ analysisId: '42', report, card })
    expect(await screen.findByRole('textbox', { name: 'Share link' })).toHaveValue('https://api.example.com/s/tok')
  })

  it('shares without a card where the browser can’t draw one, linking to /r/:token', async () => {
    vi.mocked(renderOgCardPng).mockRejectedValue(new Error('Canvas is not supported'))
    vi.mocked(createShareLink).mockResolvedValue({ ...created, preview_url: undefined })
    render(<ShareButton report={report} />)

    await userEvent.click(screen.getByRole('button', { name: /share my report/i }))

    expect(createShareLink).toHaveBeenCalledWith({ analysisId: undefined, report, card: null })
    expect(await screen.findByRole('textbox', { name: 'Share link' })).toHaveValue(`${window.location.origin}/r/tok`)
  })

  it('leaves out a card over 300 KB', async () => {
    vi.mocked(renderOgCardPng).mockResolvedValue(png(301 * 1024))
    render(<ShareButton report={report} />)

    await userEvent.click(screen.getByRole('button', { name: /share my report/i }))
    await screen.findByRole('textbox', { name: 'Share link' })
    expect(createShareLink).toHaveBeenCalledWith(expect.objectContaining({ card: null }))
  })

  it('retries without the card when the API refuses it', async () => {
    vi.mocked(renderOgCardPng).mockResolvedValue(png())
    vi.mocked(createShareLink)
      .mockRejectedValueOnce({ response: { status: 422, data: { error: { code: 'invalid_card_dimensions' } } } })
      .mockResolvedValueOnce(created)
    render(<ShareButton report={report} />)

    await userEvent.click(screen.getByRole('button', { name: /share my report/i }))

    expect(await screen.findByRole('textbox', { name: 'Share link' })).toHaveValue('https://api.example.com/s/tok')
    expect(createShareLink).toHaveBeenCalledTimes(2)
    expect(vi.mocked(createShareLink).mock.calls[1][0]).toEqual({ analysisId: undefined, report })
  })

  it('shows the error when sharing fails for another reason', async () => {
    vi.mocked(renderOgCardPng).mockResolvedValue(png())
    vi.mocked(createShareLink).mockRejectedValue({ response: { status: 500, data: { error: { code: 'x', message: 'Server error' } } } })
    render(<ShareButton report={report} />)

    await userEvent.click(screen.getByRole('button', { name: /share my report/i }))
    expect(await screen.findByText('Server error')).toBeInTheDocument()
    expect(createShareLink).toHaveBeenCalledTimes(1)
  })
})
