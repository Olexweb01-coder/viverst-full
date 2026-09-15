import { useEffect, useRef } from 'react'
import { useReducedMotion } from './hooks.js'

/**
 * Moves at a different rate to the page. Driven by a passive scroll listener
 * that only writes a CSS variable, so no React render happens per frame.
 */
export default function Parallax({ children, distance = 50, className = '' }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return undefined
    let ticking = false

    const update = () => {
      ticking = false
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // -1 when the element is below the fold, +1 once it has passed above
      const progress = 1 - (r.top + r.height / 2) / (vh / 2 + r.height / 2)
      el.style.setProperty('--px-y', `${(progress * distance).toFixed(1)}px`)
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [distance, reduced])

  return <div ref={ref} className={`parallax ${className}`}>{children}</div>
}
