import { useEffect, useRef } from 'react'
import { useReducedMotion } from './hooks.js'

/** Progress bar at the top of the window. Writes a transform, never state. */
export default function ScrollProgress() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return undefined
    let ticking = false

    const update = () => {
      ticking = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      el.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced])

  if (reduced) return null
  return <div ref={ref} className="scroll-progress" aria-hidden="true" />
}
