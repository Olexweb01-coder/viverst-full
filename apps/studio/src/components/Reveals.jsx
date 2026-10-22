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
 *
 * The pages below the homepage load lazily, so on a direct visit (a link from
 * Google or Instagram straight to /contact) their sections arrive AFTER this
 * effect has run. A list taken once at that moment was empty, and those
 * sections stayed invisible however far the visitor scrolled. So the hidden
 * sections are looked up on every frame, and new markup arriving in the page
 * schedules a frame of its own.
 */
export default function Reveals() {
  const { pathname } = useLocation()

  useEffect(() => {
    const root = document.documentElement
    let queued = false

    const frame = () => {
      const max = root.scrollHeight - root.clientHeight
      root.style.setProperty('--sp', max > 0 ? (root.scrollTop / max).toFixed(4) : '0')

      // only sections not yet shown; once shown they drop out of this list
      const pending = document.querySelectorAll('[data-rv]:not([data-rv="on"])')
      if (pending.length) {
        const trigger = window.innerHeight * 0.88
        for (const el of pending) {
          if (el.getBoundingClientRect().top < trigger) el.setAttribute('data-rv', 'on')
        }
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
    // A lazily loaded page mounts later; its arrival is a change to the
    // element tree, so it is caught here. Setting data-rv is an attribute
    // change, not a tree change, so this never triggers itself.
    const arrivals = typeof MutationObserver === 'function' ? new MutationObserver(onScroll) : null
    arrivals?.observe(document.getElementById('main') || document.body, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(id)
      arrivals?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  return <div className="progress" aria-hidden="true" />
}
