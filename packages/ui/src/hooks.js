import { useEffect, useRef, useState } from 'react'

/** Tracks the OS "reduce motion" setting and reacts if it changes mid-session. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const on = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

/**
 * Fires once when the element scrolls into view.
 * IntersectionObserver is native and costs nothing, unlike a scroll listener
 * that runs on every frame for every watched element.
 */
export function useInView({ margin = '-70px', once = true } = {}) {
  const ref = useRef(null)
  // Where IntersectionObserver is unavailable, start visible rather than
  // setting state from inside the effect — content must never stay hidden.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) setInView(false)
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin, once])

  return [ref, inView]
}

/** requestAnimationFrame loop that pauses when the tab is hidden. */
export function useRaf(callback, active = true) {
  const cb = useRef(callback)
  useEffect(() => { cb.current = callback }, [callback])

  useEffect(() => {
    if (!active) return undefined
    let raf = 0
    let prev = performance.now()
    let running = true

    const tick = (now) => {
      if (!running) return
      cb.current(Math.min((now - prev) / 1000, 1 / 20), now)
      prev = now
      raf = requestAnimationFrame(tick)
    }
    const visibility = () => {
      running = document.visibilityState === 'visible'
      if (running) { prev = performance.now(); raf = requestAnimationFrame(tick) }
      else cancelAnimationFrame(raf)
    }
    document.addEventListener('visibilitychange', visibility)
    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [active])
}
