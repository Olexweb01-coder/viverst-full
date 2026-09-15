import { useCallback, useEffect, useRef } from 'react'
import BrandLink from './BrandLink.jsx'
import { ArrowUpRight } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { SUBSIDIARIES } from '../data/site.js'
import vMark from '@brand-assets/main/v-mark.webp'
import './OrbitMark.css'

const TILT = (-11 * Math.PI) / 180
const PERIOD = 34 // seconds per revolution
const CYCLE = 13 // seconds per idle turn/hold cycle
const KEYS = [
  [0, -15], [0.18, -15], [0.31, 0], [0.49, 0],
  [0.62, 15], [0.8, 15], [0.93, -15], [1, -15],
]

const smoothstep = (u) => u * u * (3 - 2 * u)

function idleAngle(t) {
  const u = (t % CYCLE) / CYCLE
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [a, va] = KEYS[i]
    const [b, vb] = KEYS[i + 1]
    if (u >= a && u <= b) return b === a ? va : va + (vb - va) * smoothstep((u - a) / (b - a))
  }
  return KEYS[0][1]
}

/**
 * The parent mark, with Viverst Agro and Viverst Studio travelling a tilted
 * circular path around it.
 *
 * Each connector is drawn all the way to the mark's centre and the artwork sits
 * above it in the stacking order, so the PNG's own alpha clips the line exactly
 * at the silhouette. That means the wire meets the mark perfectly at every
 * angle and every viewport, with nothing to measure.
 */
export default function OrbitMark({ onFocusBrand }) {
  const fieldRef = useRef(null)
  const markRef = useRef(null)
  const spinRef = useRef(null)
  const ringRef = useRef(null)
  const satRefs = useRef({})
  const wireRefs = useRef({})
  const reduce = useReducedMotion()
  const hoveredRef = useRef(null)
  const notify = useRef(onFocusBrand)

  useEffect(() => { notify.current = onFocusBrand }, [onFocusBrand])

  const setHovered = useCallback((key) => {
    hoveredRef.current = key
    if (notify.current) notify.current(key)
  }, [])

  useEffect(() => {
    const field = fieldRef.current
    const markEl = markRef.current
    const spinEl = spinRef.current
    const ring = ringRef.current
    if (!field || !markEl || !spinEl) return

    const sats = SUBSIDIARIES.map((s, i) => ({
      key: s.key,
      phase: i * Math.PI,
      ink: s.theme.deep,
      el: satRefs.current[s.key],
      back: wireRefs.current[`${s.key}-back`],
      front: wireRefs.current[`${s.key}-front`],
    })).filter((s) => s.el && s.back && s.front)

    let CX = 0, CY = 0, RX = 0, RY = 0
    let theta = -Math.PI / 2
    let orbitRate = 1, orbitRateTarget = 1
    let userY = 0, userX = 0, velY = 0, velX = 0
    let dragging = false, lastX = 0, lastY = 0, released = -1e9
    let parX = 0, parY = 0, lean = 0
    let raf = 0, running = true

    /**
     * Radii derive from the chips' measured width, so a label can never be
     * pushed past the edge of the field. Self-corrects on resize and once
     * webfonts load and change the text metrics.
     */
    function measure() {
      const r = field.getBoundingClientRect()
      if (!r.width) return
      CX = r.width / 2
      CY = r.height / 2
      let halfW = 0, halfH = 0
      for (const s of sats) {
        halfW = Math.max(halfW, s.el.offsetWidth / 2)
        halfH = Math.max(halfH, s.el.offsetHeight / 2)
      }
      RX = Math.max(52, Math.min(r.width * 0.455, r.width / 2 - halfW - 4))
      RY = Math.max(38, Math.min(r.height * 0.355, r.height / 2 - halfH - 4))
      if (ring) {
        ring.setAttribute('cx', CX); ring.setAttribute('cy', CY)
        ring.setAttribute('rx', RX); ring.setAttribute('ry', RY)
        ring.setAttribute('transform', `rotate(${(TILT * 180) / Math.PI} ${CX} ${CY})`)
      }
    }

    function orbitPoint(t) {
      const ex = RX * Math.cos(t)
      const ey = RY * Math.sin(t)
      return {
        x: CX + ex * Math.cos(TILT) - ey * Math.sin(TILT),
        y: CY + ex * Math.sin(TILT) + ey * Math.cos(TILT),
        depth: Math.sin(t),
      }
    }

    /* ---- drag ---- */
    const onDown = (e) => {
      dragging = true
      markEl.classList.add('is-dragging')
      try { markEl.setPointerCapture(e.pointerId) } catch { /* not fatal */ }
      lastX = e.clientX; lastY = e.clientY; velY = 0; velX = 0
    }
    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX; lastY = e.clientY
      velY = dx * 0.55
      velX = -dy * 0.32
      userY += velY
      userX = Math.max(-24, Math.min(24, userX + velX))
    }
    const endDrag = (e) => {
      if (!dragging) return
      dragging = false
      markEl.classList.remove('is-dragging')
      try { if (e?.pointerId != null) markEl.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
      released = performance.now()
    }
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { userY -= 18; e.preventDefault() }
      if (e.key === 'ArrowRight') { userY += 18; e.preventDefault() }
    }

    const onParallax = (e) => {
      const r = field.getBoundingClientRect()
      parX = (e.clientX - (r.left + r.width / 2)) / window.innerWidth
      parY = (e.clientY - (r.top + r.height / 2)) / window.innerHeight
    }

    const onVisibility = () => {
      running = document.visibilityState === 'visible'
      if (running) { prev = performance.now(); raf = requestAnimationFrame(loop) }
      else cancelAnimationFrame(raf)
    }

    let prev = performance.now()
    let tSec = 0

    function loop(now) {
      if (!running) return
      const dt = Math.min((now - prev) / 1000, 1 / 20)
      prev = now
      tSec += dt

      orbitRateTarget = hoveredRef.current ? 0 : 1
      orbitRate += (orbitRateTarget - orbitRate) * 0.07
      if (!reduce) theta += ((2 * Math.PI) / PERIOD) * orbitRate * dt

      if (!dragging) {
        userY += velY; velY *= 0.94
        userX += velX; velX *= 0.9
        userX += (0 - userX) * 0.05
        // settle onto the nearest whole turn so it never rests edge-on
        if (Math.abs(velY) < 0.06 && now - released > 400) {
          const snap = Math.round(userY / 360) * 360
          userY += (snap - userY) * 0.1
          if (Math.abs(snap - userY) < 0.4) userY = snap
        }
      }

      const norm = ((userY % 360) + 360) % 360
      const atRest = !dragging && Math.abs(velY) < 0.06 && (norm < 1 || norm > 359)
      const baseY = reduce ? -15 : atRest ? idleAngle(tSec) : 0

      let leanTarget = 0
      if (hoveredRef.current) {
        const s = sats.find((x) => x.key === hoveredRef.current)
        if (s) leanTarget = ((orbitPoint(theta + s.phase).x - CX) / Math.max(RX, 1)) * 13
      }
      lean += (leanTarget - lean) * 0.08

      spinEl.style.setProperty('--ry', `${(baseY + userY + lean + parX * 9).toFixed(2)}deg`)
      spinEl.style.setProperty('--rx', `${(userX - parY * 7).toFixed(2)}deg`)
      spinEl.style.setProperty('--sc', (1 + Math.sin(tSec * 0.7) * 0.018).toFixed(4))

      for (const s of sats) {
        const p = orbitPoint(theta + s.phase)
        const near = p.depth > 0
        const scale = 0.9 + (0.1 * (p.depth + 1)) / 2
        s.el.style.transform =
          `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%,-50%) scale(${scale.toFixed(3)})`
        s.el.style.zIndex = near ? 5 : 2
        s.el.style.opacity = (0.72 + (0.28 * (p.depth + 1)) / 2).toFixed(3)

        const shown = near ? s.front : s.back
        const hidden = near ? s.back : s.front
        const active = hoveredRef.current === s.key
        shown.setAttribute('x1', p.x); shown.setAttribute('y1', p.y)
        shown.setAttribute('x2', CX); shown.setAttribute('y2', CY)
        shown.setAttribute('stroke', s.ink)
        shown.setAttribute('stroke-opacity', active ? 0.85 : 0.34)
        shown.setAttribute('stroke-width', active ? 2 : 1.2)
        hidden.setAttribute('stroke-opacity', 0)
      }

      raf = requestAnimationFrame(loop)
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {})
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointermove', onParallax, { passive: true })
    markEl.addEventListener('pointerdown', onDown)
    markEl.addEventListener('pointermove', onMove)
    markEl.addEventListener('pointerup', endDrag)
    markEl.addEventListener('pointercancel', endDrag)
    markEl.addEventListener('keydown', onKey)

    raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onParallax)
      markEl.removeEventListener('pointerdown', onDown)
      markEl.removeEventListener('pointermove', onMove)
      markEl.removeEventListener('pointerup', endDrag)
      markEl.removeEventListener('pointercancel', endDrag)
      markEl.removeEventListener('keydown', onKey)
    }
  }, [reduce])

  return (
    <div className="orbit" ref={fieldRef}>
      <svg className="orbit-wires orbit-wires--back" aria-hidden="true">
        <ellipse className="orbit-path" ref={ringRef} />
        {SUBSIDIARIES.map((s) => (
          <line key={s.key} ref={(el) => { wireRefs.current[`${s.key}-back`] = el }}
                strokeLinecap="round" strokeWidth="1.2" />
        ))}
      </svg>

      <div className="orbit-halo" aria-hidden="true" />

      <div
        className="orbit-mark"
        ref={markRef}
        role="button"
        tabIndex={0}
        aria-label="Viverst mark — drag or use arrow keys to rotate"
      >
        <div className="orbit-spin" ref={spinRef} style={{ '--rx': '0deg', '--ry': '0deg', '--sc': 1 }}>
          <img className="orbit-face" src={vMark} alt="Viverst" draggable="false" />
          <img className="orbit-face orbit-face--back" src={vMark} alt="" aria-hidden="true" draggable="false" />
          <span className="orbit-sheen" aria-hidden="true" style={{ '--vmask': `url(${vMark})` }} />
        </div>
      </div>

      <svg className="orbit-wires orbit-wires--front" aria-hidden="true">
        {SUBSIDIARIES.map((s) => (
          <line key={s.key} ref={(el) => { wireRefs.current[`${s.key}-front`] = el }}
                strokeLinecap="round" strokeWidth="1.2" />
        ))}
      </svg>

      {SUBSIDIARIES.map((s) => (
        <BrandLink
          key={s.key}
          to={s.path}
          external={s.external}
          className={`orbit-sat orbit-sat--${s.key}`}
          ref={(el) => { satRefs.current[s.key] = el }}
          onMouseEnter={() => setHovered(s.key)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(s.key)}
          onBlur={() => setHovered(null)}
        >
          <span className="orbit-sat-dot" aria-hidden="true" />
          <span className="orbit-sat-name">{s.name}</span>
          <span className="orbit-sat-sub">{s.blurb}</span>
          <ArrowUpRight className="orbit-sat-arrow" size={12} strokeWidth={3} aria-hidden="true" />
        </BrandLink>
      ))}
    </div>
  )
}
