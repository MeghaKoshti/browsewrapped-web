import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DownloadCardButton from './DownloadCardButton'
import { renderPersonaCardPng, downloadBlob } from '../../lib/personaImage'
import report from '../../test/fixtures/report.json'

vi.mock('../../lib/personaImage', async (importOriginal) => ({
  ...(await importOriginal()),
  renderPersonaCardPng: vi.fn(),
  downloadBlob: vi.fn(),
}))

describe('DownloadCardButton', () => {
  beforeEach(() => {
    vi.mocked(renderPersonaCardPng).mockReset()
    vi.mocked(downloadBlob).mockReset()
  })

  it('shows a loading state, then downloads the PNG', async () => {
    let finish
    vi.mocked(renderPersonaCardPng).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    render(<DownloadCardButton report={report} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download image' }))
    const busy = screen.getByRole('button', { name: 'Preparing image…' })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')

    const blob = new Blob(['png'], { type: 'image/png' })
    finish(blob)

    expect(await screen.findByRole('button', { name: 'Download image' })).toBeEnabled()
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'browsewrapped-the-builder-2026.png')
    expect(renderPersonaCardPng).toHaveBeenCalledWith(expect.objectContaining({ title: 'The Builder' }))
  })

  it('can be used from the keyboard', async () => {
    vi.mocked(renderPersonaCardPng).mockResolvedValue(new Blob(['png']))
    render(<DownloadCardButton report={report} />)

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Download image' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    expect(renderPersonaCardPng).toHaveBeenCalledTimes(1)
  })

  it('explains when the browser cannot make the image', async () => {
    vi.mocked(renderPersonaCardPng).mockRejectedValue(new Error('Canvas is not supported'))
    render(<DownloadCardButton report={report} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download image' }))

    expect(await screen.findByRole('status')).toHaveTextContent(/couldn’t create the image/)
    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
