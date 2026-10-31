import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import StoryPack from './StoryPack'
import { PassContext, NO_PASS } from '../../pass/passContext'
import { renderStorySlidePng } from '../../lib/storySlides'
import { shareOrDownload } from '../../lib/shareFile'
import report from '../../test/fixtures/report.json'

vi.mock('../../lib/storySlides', async (importOriginal) => ({ ...(await importOriginal()), renderStorySlidePng: vi.fn() }))
vi.mock('../../lib/shareFile', async (importOriginal) => ({ ...(await importOriginal()), shareOrDownload: vi.fn() }))

const ACTIVE = { ...NO_PASS, status: 'active', hasPass: true }

function renderPack(pass = NO_PASS) {
  return render(<MemoryRouter><PassContext.Provider value={pass}><StoryPack report={report} /></PassContext.Provider></MemoryRouter>)
}

describe('StoryPack', () => {
  beforeEach(() => {
    // jsdom has no canvas; previews just stay blank.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.mocked(renderStorySlidePng).mockReset().mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    vi.mocked(shareOrDownload).mockReset().mockResolvedValue('downloaded')
  })

  it('without a Pass, only slide 1 can be downloaded and the rest show an upgrade prompt', () => {
    renderPack()
    expect(screen.getByRole('heading', { name: 'Post your Wrapped' })).toBeInTheDocument()
    expect(screen.getAllByRole('img').map((i) => i.getAttribute('aria-label'))).toEqual([
      'Slide 1: Persona', 'Slide 2: Top topics (locked)', 'Slide 3: Rhythm (locked)', 'Slide 4: Then vs now (locked)', 'Slide 5: Streak (locked)',
    ])
    expect(screen.getAllByRole('button', { name: /^Download slide/ })).toHaveLength(1)
    expect(screen.getByRole('group', { name: 'Unlock the other 4 slides with a Wrapped Pass' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get the Pass' })).toHaveAttribute('href', '/pricing')
  })

  it('with a Pass, every slide is unlocked', () => {
    renderPack(ACTIVE)
    expect(screen.getAllByRole('button', { name: /^Download slide/ })).toHaveLength(5)
    expect(screen.queryByRole('img', { name: /locked/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Get the Pass' })).not.toBeInTheDocument()
  })

  it('renders the full-size PNG and hands it to share-or-download', async () => {
    renderPack(ACTIVE)
    await userEvent.click(screen.getByRole('button', { name: 'Download slide 3, Rhythm' }))

    expect(renderStorySlidePng).toHaveBeenCalledWith(expect.objectContaining({ id: 'rhythm', number: 3 }))
    expect(shareOrDownload).toHaveBeenCalledWith(expect.any(Blob), 'browsewrapped-2026-story-3-rhythm.png', expect.objectContaining({ title: 'My 2026 Wrapped' }))
  })

  it('offers Share instead of Download where the browser can share files', () => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() })
    try {
      renderPack()
      expect(screen.getByRole('button', { name: 'Share slide 1, Persona' })).toBeInTheDocument()
      // The free slide is prepared ahead of the tap so the share sheet can open.
      expect(renderStorySlidePng).toHaveBeenCalledTimes(1)
    } finally {
      delete navigator.canShare
      delete navigator.share
    }
  })

  it('hides the upgrade prompt while the Pass is being checked', () => {
    renderPack({ ...NO_PASS, status: 'loading' })
    expect(screen.queryByRole('link', { name: 'Get the Pass' })).not.toBeInTheDocument()
  })
})
