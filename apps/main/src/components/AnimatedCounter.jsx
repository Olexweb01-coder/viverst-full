import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/** Counts up once, the first time it scrolls into view. */
export default function AnimatedCounter({ value, suffix = '', duration = 1500 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  // With reduced motion the final value renders directly — no animation, and
  // nothing set synchronously from inside the effect.
  const display = reduce ? value : n

  useEffect(() => {
    if (!inView || reduce) return undefined

    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, reduce])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}
