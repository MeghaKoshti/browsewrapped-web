import { downloadBlob } from './personaImage'

// True when this browser can hand image files to the system share sheet
// (most phones, Safari, Chrome on Android/Windows). Desktop Firefox can't.
export function canShareFiles(files) {
  try {
    return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files })
  } catch {
    return false
  }
}

const probe = () => [new File([''], 'probe.png', { type: 'image/png' })]
export const shareSupported = () => (typeof File === 'function' ? canShareFiles(probe()) : false)

// Opens the share sheet with the image, or downloads it where sharing files
// isn't possible. Returns 'shared', 'cancelled' or 'downloaded'.
export async function shareOrDownload(blob, filename, { title, text } = {}) {
  const file = new File([blob], filename, { type: blob.type || 'image/png' })
  if (canShareFiles([file])) {
    try {
      await navigator.share({ files: [file], title, text })
      return 'shared'
    } catch (err) {
      // Closing the share sheet is a choice, not a failure.
      if (err?.name === 'AbortError') return 'cancelled'
      // Anything else (e.g. NotAllowedError): fall back to a download.
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}
