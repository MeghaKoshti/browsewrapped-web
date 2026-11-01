import { useEffect, useRef, useState } from 'react'
import { buildPersonaCardData, personaCardFilename, renderPersonaCardPng } from '../../lib/personaImage'
import { shareOrDownload, shareSupported } from '../../lib/shareFile'

// "Share image" on phones (system share sheet), "Download image" elsewhere:
// the persona card as a 1080×1350 PNG made in the browser. Nothing is uploaded.
export default function DownloadCardButton({ report, color = '#a855f7' }) {
  const [state, setState] = useState('idle') // idle | working | error
  const [canShare] = useState(shareSupported)
  // Browsers only open the share sheet straight after a tap, so on devices
  // that can share, the image is made ahead of time.
  const ready = useRef(null)

  useEffect(() => {
    if (!canShare) return
    const data = buildPersonaCardData(report)
    if (data) ready.current = renderPersonaCardPng(data).catch(() => null)
  }, [canShare, report])

  const run = async () => {
    const data = buildPersonaCardData(report)
    if (!data) return
    setState('working')
    try {
      const blob = (await ready.current) || (await renderPersonaCardPng(data))
      await shareOrDownload(blob, personaCardFilename(data), { title: `I’m ${data.title}`, text: data.site ? `My ${data.year} in tabs. Make yours at ${data.site}` : undefined })
      setState('idle')
    } catch {
      setState('error')
    }
  }

  const working = state === 'working'
  const label = canShare ? 'Share image' : 'Download image'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={run}
        disabled={working}
        aria-busy={working}
        style={{
          padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-display)', cursor: working ? 'progress' : 'pointer',
          border: `1px solid ${color}`, background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
        }}
      >
        {working ? 'Preparing image…' : label}
      </button>
      <span role="status" style={{ fontSize: 12, color: state === 'error' ? '#fca5a5' : 'var(--muted)' }}>
        {state === 'error' ? 'Your browser couldn’t create the image. Try another browser.' : ''}
      </span>
    </div>
  )
}
