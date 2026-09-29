import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { useReducedMotion, Magnetic } from '@viverst/ui'
import './Hero.css'

const DWELL = 6   // seconds a picture holds
const FADE = 1.6  // seconds the two overlap

/**
 * The hero.
 *
 * The photograph fills the panel, pushes in the whole time it is on screen,
 * and the next fades up underneath while the current is still travelling.
 *
 * The photographs show as shot: no scrim, no tint, nothing behind the type.
 * The client chose this over the guaranteed-contrast scrim. What keeps the
 * words legible is the shadow on the type itself, which is on the letters,
 * not the picture.
 */
export default function Hero({ frames, lines, summary }) {
  const root = useRef(null)
  const layers = useRef([])
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || frames.length < 2) return undefined
    const els = layers.current.filter(Boolean)
    if (els.length < 2) return undefined

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 })
      els.forEach((el, i) => {
        const next = els[(i + 1) % els.length]
        const at = `f${i}`
        tl.addLabel(at)
          .fromTo(el, { scale: 1 }, { scale: 1.17, duration: DWELL + FADE, ease: 'none' }, at)
          .set(next, { scale: 1, zIndex: 2 }, `${at}+=${DWELL - FADE}`)
          .set(el, { zIndex: 1 }, `${at}+=${DWELL - FADE}`)
          .to(next, { autoAlpha: 1, duration: FADE, ease: 'power2.inOut' }, `${at}+=${DWELL - FADE}`)
          .to(el, { autoAlpha: 0, duration: FADE, ease: 'power2.inOut' }, `${at}+=${DWELL - FADE}`)
      })
    }, root)
    return () => ctx.revert()
  }, [frames.length, reduced])

  useEffect(() => {
    if (reduced) return undefined
    const ctx = gsap.context(() => {
      gsap.set('[data-rise]', { yPercent: 112 })
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        // the backing arrives with its words, never as an empty bar
        .from('.hero-line', { autoAlpha: 0, duration: 0.5, stagger: 0.14, ease: 'power2.out' }, 0.1)
        .to('[data-rise]', { yPercent: 0, duration: 1.15, stagger: 0.05 }, 0.15)
        .from('[data-fade]', { autoAlpha: 0, y: 18, duration: 0.85, stagger: 0.1 }, 0.6)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="hero" ref={root} aria-label="Viverst Agro">
      <div className="hero-bg" aria-hidden="true">
        {frames.map((f, i) => (
          <div key={f.key} className="hero-layer"
               ref={(el) => { layers.current[i] = el }}
               style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden', zIndex: i === 0 ? 2 : 1 }}>
            <img src={f.img} alt="" width="1120" height="788"
                 loading={i === 0 ? 'eager' : 'lazy'} decoding="async"
                 fetchPriority={i === 0 ? 'high' : 'low'} />
          </div>
        ))}
      </div>

      <div className="hero-inner">
        {/* Words carry the rise; the spaces between them are real text nodes.
            Held inside the clipped span they would render joined together. */}
        <h1 className="hero-title">
          {lines.map((line, li) => (
            <Fragment key={line.text}>
              <span className="hero-line" style={{ '--shift': `${line.shift}%` }}>
                {line.text.split(' ').map((word, i, all) => (
                  <Fragment key={`${word}-${i}`}>
                    <span className="hero-word"><span data-rise>{word}</span></span>
                    {i < all.length - 1 ? ' ' : ''}
                  </Fragment>
                ))}
              </span>
              {li < lines.length - 1 ? ' ' : ''}
            </Fragment>
          ))}
        </h1>

        <p className="hero-lede" data-fade>{summary}</p>

        <div className="hero-cta" data-fade>
          <Magnetic>
            <Link className="btn btn--primary" to="/solutions">
              See what we do <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </Magnetic>
          <Magnetic><Link className="btn btn--onGlass" to="/contact">Contact us</Link></Magnetic>
        </div>
      </div>

    </section>
  )
}
