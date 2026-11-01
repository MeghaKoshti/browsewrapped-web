import { describe, it, expect, vi, afterEach } from 'vitest'
import { shareOrDownload, shareSupported } from './shareFile'
import { downloadBlob } from './personaImage'

vi.mock('./personaImage', () => ({ downloadBlob: vi.fn() }))

const blob = new Blob(['png'], { type: 'image/png' })

function stubShare({ canShare = true, share = vi.fn().mockResolvedValue() } = {}) {
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => canShare) })
  Object.defineProperty(navigator, 'share', { configurable: true, value: share })
  return share
}

describe('shareOrDownload', () => {
  afterEach(() => {
    delete navigator.canShare
    delete navigator.share
    vi.mocked(downloadBlob).mockReset()
  })

  it('opens the share sheet with the PNG file when the browser can share files', async () => {
    const share = stubShare()
    expect(shareSupported()).toBe(true)
    expect(await shareOrDownload(blob, 'slide.png', { title: 'My Wrapped', text: 'Make yours' })).toBe('shared')

    const { files, title, text } = share.mock.calls[0][0]
    expect(files[0]).toBeInstanceOf(File)
    expect(files[0].name).toBe('slide.png')
    expect(files[0].type).toBe('image/png')
    expect({ title, text }).toEqual({ title: 'My Wrapped', text: 'Make yours' })
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('downloads where files can’t be shared', async () => {
    expect(shareSupported()).toBe(false)
    expect(await shareOrDownload(blob, 'slide.png')).toBe('downloaded')
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'slide.png')

    stubShare({ canShare: false })
    expect(await shareOrDownload(blob, 'slide.png')).toBe('downloaded')
  })

  it('does nothing more when the user closes the share sheet', async () => {
    stubShare({ share: vi.fn().mockRejectedValue(Object.assign(new Error('closed'), { name: 'AbortError' })) })
    expect(await shareOrDownload(blob, 'slide.png')).toBe('cancelled')
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('falls back to a download when sharing is refused', async () => {
    stubShare({ share: vi.fn().mockRejectedValue(Object.assign(new Error('no'), { name: 'NotAllowedError' })) })
    expect(await shareOrDownload(blob, 'slide.png')).toBe('downloaded')
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'slide.png')
  })
})
