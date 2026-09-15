import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@viverst/ui'

/* The eight-pointed star is the supplied brand mark. There is no vector file
   in the asset set, so it is reconstructed here: outer radius 100, inner 40,
   on a rounded octagon of radius 104. Redrawing it as geometry is what lets
   the eight strokes travel outward and the star knock through the blob. */
export const STAR_POINTS = '0.0,-100.0 15.3,-37.0 70.7,-70.7 37.0,-15.3 100.0,0.0 37.0,15.3 70.7,70.7 15.3,37.0 0.0,100.0 -15.3,37.0 -70.7,70.7 -37.0,15.3 -100.0,0.0 -37.0,-15.3 -70.7,-70.7 -15.3,-37.0'
export const OCTAGON_POINTS = '39.8,-96.1 96.1,-39.8 96.1,39.8 39.8,96.1 -39.8,96.1 -96.1,39.8 -96.1,-39.8 -39.8,-96.1'

export default function Mark({ interactive = true }) {
  const stage = useRef(null)
  const svg = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const box = stage.current
    const el = svg.current
    if (!box || !el || !interactive || reduced) return undefined
    if (!window.matchMedia?.('(pointer: fine)').matches) return undefined

    let queued = false
    let next = null
    const move = (e) => {
      const r = box.getBoundingClientRect()
      next = [
        ((e.clientX - r.left) / r.width) * 2 - 1,
        ((e.clientY - r.top) / r.height) * 2 - 1,
      ]
      if (!queued) {
        queued = true
        requestAnimationFrame(() => {
          el.style.setProperty('--px', next[0].toFixed(3))
          el.style.setProperty('--py', next[1].toFixed(3))
          queued = false
        })
      }
    }
    const leave = () => {
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }
    box.addEventListener('pointermove', move)
    box.addEventListener('pointerleave', leave)
    return () => {
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerleave', leave)
    }
  }, [interactive, reduced])

  return (
    <div className="mark-stage" ref={stage}>
      <span className="mark-mesh" aria-hidden="true"><i /><i /><i /></span>
      <svg
        className="mark"
        ref={svg}
        viewBox="-165 -165 330 330"
        role="img"
        aria-label="The Viverst Studio mark: an eight-pointed star assembling from eight strokes"
      >
        <defs>
          <linearGradient id="studio-mark-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8338ec" />
            <stop offset="1" stopColor="#411d77" />
          </linearGradient>
        </defs>
        <g className="mark-drift">
          <line className="mark-ray" x1="0" y1="0" x2="0.0" y2="-128.0" style={{ animationDelay: '0.000s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="90.5" y2="-90.5" style={{ animationDelay: '0.045s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="128.0" y2="0.0" style={{ animationDelay: '0.090s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="90.5" y2="90.5" style={{ animationDelay: '0.135s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="0.0" y2="128.0" style={{ animationDelay: '0.180s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="-90.5" y2="90.5" style={{ animationDelay: '0.225s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="-128.0" y2="0.0" style={{ animationDelay: '0.270s' }} />
        <line className="mark-ray" x1="0" y1="0" x2="-90.5" y2="-90.5" style={{ animationDelay: '0.315s' }} />
          <polygon className="mark-blob" points="39.8,-96.1 96.1,-39.8 96.1,39.8 39.8,96.1 -39.8,96.1 -96.1,39.8 -96.1,-39.8 -39.8,-96.1" />
          <polygon className="mark-star" points="0.0,-100.0 15.3,-37.0 70.7,-70.7 37.0,-15.3 100.0,0.0 37.0,15.3 70.7,70.7 15.3,37.0 0.0,100.0 -15.3,37.0 -70.7,70.7 -37.0,15.3 -100.0,0.0 -37.0,-15.3 -70.7,-70.7 -15.3,-37.0" />
        </g>
      </svg>
    </div>
  )
}
