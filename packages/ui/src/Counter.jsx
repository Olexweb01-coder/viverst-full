import { useEffect, useState } from 'react'
import { useReducedMotion, useInView } from './hooks.js'

/** Counts up once, the first time it scrolls into view. */
export default function Counter({ value, suffix = '', duration = 1400 }) {
  const [ref, inView] = useInView({ margin: '-60px' })
  const reduced = useReducedMotion()
  const [n, setN] = useState(0)
  const shown = reduced ? value : n

  useEffect(() => {
    if (!inView || reduced) return undefined
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setN(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, reduced])

  return <span ref={ref}>{shown}{suffix}</span>
}
