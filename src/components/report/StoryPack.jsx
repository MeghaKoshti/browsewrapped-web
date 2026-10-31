import { useEffect, useRef, useState } from 'react'
import usePass from '../../pass/passContext'
import { UpgradePrompt } from '../pass/PassGate'
import { loadCardFonts } from '../../lib/personaImage'
import { buildStorySlides, drawStorySlide, renderStorySlidePng, storySlideFilename, STORY_WIDTH, STORY_HEIGHT } from '../../lib/storySlides'
import { shareOrDownload, shareSupported } from '../../lib/shareFile'
import SectionHeader from '../ui/SectionHeader'

const PREVIEW_WIDTH = 180 // CSS pixels

// A small live preview of one slide, drawn at screen resolution.
function SlidePreview({ slide, locked }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = typeof canvas?.getContext === 'function' ? canvas.getContext('2d') : null
    if (!ctx) return undefined
    let live = true
    loadCardFonts().then(() => {
      if (!live) return
      const scale = canvas.width / STORY_WIDTH
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      drawStorySlide(ctx, slide)
    })
    return () => { live = false }
  }, [slide])

  const ratio = Math.min(2, globalThis.devicePixelRatio || 1)
  return (
    <canvas
      ref={ref}
      width={Math.round(PREVIEW_WIDTH * ratio)}
      height={Math.round(PREVIEW_WIDTH * ratio * (STORY_HEIGHT / STORY_WIDTH))}
      className={`story-preview${locked ? ' story-preview-locked' : ''}`}
      role="img"
      aria-label={`Slide ${slide.number}: ${slide.caption}${locked ? ' (locked)' : ''}`}
    />
  )
}

function SlideAction({ slide, prepared, canShare }) {
  const [state, setState] = useState('idle')
  const run = async () => {
    setState('working')
    try {
      const png = (await prepared()) || (await renderStorySlidePng(slide))
      await shareOrDownload(png, storySlideFilename(slide), {
        title: `My ${slide.year} Wrapped`,
        text: slide.site ? `My ${slide.year} in tabs. Make yours at ${slide.site}` : undefined,
      })
      setState('idle')
    } catch {
      setState('error')
    }
  }
  const verb = canShare ? 'Share' : 'Download'
  return (
    <>
      <button type="button" className="story-action" onClick={run} disabled={state === 'working'} aria-busy={state === 'working'}
        aria-label={`${verb} slide ${slide.number}, ${slide.caption}`}>
        {state === 'working' ? 'Preparing…' : verb}
      </button>
      {state === 'error' && <span role="status" className="story-error">Couldn’t make the image in this browser.</span>}
    </>
  )
}

// "Post your Wrapped": the 1080×1920 story slides. Slide 1 is free; the rest
// unlock with a Wrapped Pass.
export default function StoryPack({ report }) {
  const { hasPass, status } = usePass()
  const [slides] = useState(() => buildStorySlides(report))
  const [canShare] = useState(shareSupported)
  const blobs = useRef({})

  const unlocked = (slide) => slide.free || hasPass

  // Phones only open the share sheet straight after a tap, so make the
  // images there ahead of time.
  useEffect(() => {
    if (!canShare) return
    for (const slide of slides) {
      if (unlocked(slide) && !blobs.current[slide.number]) {
        blobs.current[slide.number] = renderStorySlidePng(slide).catch(() => null)
      }
    }
  })

  if (!slides.length) return null
  const lockedCount = slides.filter((s) => !unlocked(s)).length

  return (
    <section className="card p-6 md:p-7 min-w-0" aria-labelledby="story-pack-title">
      <SectionHeader
        id="story-pack-title"
        label="Story Pack"
        title="Post your Wrapped"
        description={`${slides.length} slides sized for Instagram, WhatsApp and LinkedIn stories, made in your browser. Nothing is uploaded.`}
      />
      <ol className="story-strip">
        {slides.map((slide) => {
          const open = unlocked(slide)
          return (
            <li key={slide.id} className="story-item">
              <div className="story-frame">
                <SlidePreview slide={slide} locked={!open} />
                {!open && <span className="story-lock" aria-hidden="true">🔒</span>}
              </div>
              <p className="story-caption"><span className="mono">{slide.number}</span> {slide.caption}</p>
              {open
                ? <SlideAction slide={slide} prepared={() => blobs.current[slide.number]} canShare={canShare} />
                : <span className="story-locked-label">Pass</span>}
            </li>
          )
        })}
      </ol>
      {lockedCount > 0 && status !== 'loading' && (
        <UpgradePrompt
          compact
          expired={status === 'expired'}
          title={`Unlock ${lockedCount === 1 ? 'the last slide' : `the other ${lockedCount} slides`} with a Wrapped Pass`}
        />
      )}
    </section>
  )
}
