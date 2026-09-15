import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reveals every [data-rv] block and drives the scroll progress bar.
 *
 * This measures position inside one throttled rAF rather than using an
 * IntersectionObserver. An observer only fires when the intersecting state
 * CHANGES, so a hard flick or the End key can carry a section from below the
 * viewport to above it with no intersecting frame in between — the callback
 * never runs and the content stays at zero opacity for good. Measuring cannot
 * be outrun, and the pending list empties as the page is read.
 */
export default function Reveals() {
  const { pathname } = useLocation()

  useEffect(() => {
    const root = document.documentElement
    let pending = Array.from(document.querySelectorAll('[data-rv]'))
    let queued = false

    const frame = () => {
      const max = root.scrollHeight - root.clientHeight
      root.style.setProperty('--sp', max > 0 ? (root.scrollTop / max).toFixed(4) : '0')

      if (pending.length) {
        const trigger = window.innerHeight * 0.88
        const keep = []
        for (const el of pending) {
          if (el.getBoundingClientRect().top < trigger) el.setAttribute('data-rv', 'on')
          else keep.push(el)
        }
        pending = keep
      }
      queued = false
    }

    const onScroll = () => {
      if (!queued) { queued = true; requestAnimationFrame(frame) }
    }

    // The route has just changed, so the new markup is in the DOM but may not
    // be laid out yet. One frame of delay gives it real measurements.
    const id = requestAnimationFrame(frame)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  return <div className="progress" aria-hidden="true" />
}
