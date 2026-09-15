import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import './WaveField.css'

const BLUE = [4, 100, 222]
const MID = [128, 174, 242]
const REST = [140, 255, 137]

/**
 * Tapered, mirrored wave strands drawn as ink on the page.
 * Additive blending washes out on a light background, so these multiply
 * into it instead — the effect reads as fine contour lines.
 *
 * `accent` shifts the far end of the colour ramp, which is how the
 * subsidiaries tint the field when a visitor engages with them.
 */
export default function WaveField({
  accent = REST,
  opacity = 1,
  interactive = true,
  className = '',
}) {
  const canvasRef = useRef(null)
  const accentRef = useRef([...accent])
  const reduce = useReducedMotion()

  useEffect(() => { accentRef.current = accent }, [accent])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const P = {
      speed: 0.2, threadCount: 6, frequency: 5.0, spread: 0.18,
      taper: 1.0, position: 0.5, falloff: 0.6, thickness: 1.1, mirror: true,
      mouseStrength: 0.3,
    }

    let W = 0, H = 0, raf = 0, running = true
    let cur = [...accentRef.current]
    let mx = -9999, my = -9999, tmx = -9999, tmy = -9999, engaged = false

    const mix = (a, b, t) => [
      a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t,
    ]
    const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = cv.clientWidth
      H = cv.clientHeight
      if (!W || !H) return
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      P.threadCount = W < 700 ? 5 : 6
    }

    function strand(i, n, t, dir) {
      const k = (i + 1) / n
      const amp = P.spread * H * k
      const ph = i * 0.85 + (dir < 0 ? Math.PI * 0.5 : 0)
      const by = H * P.position
      const steps = Math.max(70, Math.min(200, Math.round(W / 8)))

      ctx.beginPath()
      for (let s = 0; s <= steps; s++) {
        const xn = s / steps
        const x = xn * W
        const env = Math.pow(Math.sin(Math.PI * xn), P.taper)
        let y = by + dir * amp * env * Math.sin(P.frequency * xn * Math.PI * 2 + t * P.speed * 2.2 + ph)
        if (engaged) {
          const d = (x - mx) / (W * 0.17)
          y += Math.exp(-d * d) * (my - by) * P.mouseStrength * (0.3 + k * 0.8)
        }
        if (s === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      const col = k < 0.6 ? mix(BLUE, MID, k / 0.6) : mix(MID, cur, (k - 0.6) / 0.4)
      const fade = (Math.pow(1 - k, P.falloff) * 0.8 + 0.2) * opacity

      ctx.lineCap = 'round'
      ctx.lineWidth = P.thickness * 7
      ctx.strokeStyle = rgba(col, 0.022 * fade)
      ctx.stroke()
      ctx.lineWidth = P.thickness
      ctx.strokeStyle = rgba(col, 0.21 * fade)
      ctx.stroke()
    }

    function paint(t) {
      ctx.fillStyle = '#f5faff'
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'multiply'
      for (let i = 0; i < P.threadCount; i++) {
        strand(i, P.threadCount, t, 1)
        if (P.mirror) strand(i, P.threadCount, t, -1)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const onPointer = (e) => { tmx = e.clientX; tmy = e.clientY; engaged = true }
    const onLeave = () => { engaged = false }
    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running && !reduce) { start = performance.now() - elapsed * 1000; raf = requestAnimationFrame(loop) }
      else cancelAnimationFrame(raf)
    }

    let start = performance.now()
    let elapsed = 0

    function loop(now) {
      if (!running) return
      elapsed = (now - start) / 1000
      mx += (tmx - mx) * 0.07
      my += (tmy - my) * 0.07
      cur = mix(cur, accentRef.current, 0.06)
      paint(elapsed)
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    if (interactive) {
      window.addEventListener('pointermove', onPointer, { passive: true })
      window.addEventListener('pointerleave', onLeave)
    }

    if (reduce) paint(0)
    else raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [reduce, interactive, opacity])

  return <canvas ref={canvasRef} className={`wave-field ${className}`} aria-hidden="true" />
}
