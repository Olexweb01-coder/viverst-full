import { useRef } from 'react'
import { useReducedMotion } from './hooks.js'

/** Drifts toward the cursor while it's close, then springs back. */
export default function Magnetic({ children, strength = 0.22, className = '' }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  const move = (e) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    ref.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = 'translate3d(0,0,0)' }

  return (
    <span ref={ref} className={`magnetic ${className}`} onPointerMove={move} onPointerLeave={reset}>
      {children}
    </span>
  )
}
