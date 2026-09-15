import { useRef } from 'react'
import { useReducedMotion } from './hooks.js'

/** Card tips toward the pointer. Small angles — weight, not spin. */
export default function Tilt({ children, max = 6, className = '', style, ...rest }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  const move = (e) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--tilt-y', `${((e.clientX - r.left) / r.width - 0.5) * max * 2}deg`)
    ref.current.style.setProperty('--tilt-x', `${-((e.clientY - r.top) / r.height - 0.5) * max * 2}deg`)
  }
  const reset = () => {
    if (!ref.current) return
    ref.current.style.setProperty('--tilt-y', '0deg')
    ref.current.style.setProperty('--tilt-x', '0deg')
  }

  return (
    <div ref={ref} className={`tiltable ${className}`} style={style}
         onPointerMove={move} onPointerLeave={reset} {...rest}>
      {children}
    </div>
  )
}
