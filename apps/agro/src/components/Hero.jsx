import { Fragment, useEffect, useRef, useState } from 'react'
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
 * The type sits directly on the picture with nothing behind it. What makes
 * that safe is the scrim on the image itself, held at 0.84: over the palest
 * frame in the set that still puts white at 5.8:1, and it only improves from
 * there. A lighter scrim is what made the words hard to read before — no text
 * colour can fix it, because contrast runs one way only and the picture keeps
 * changing underneath.
 */
export default function Hero({ frames, lines, summary, place }) {
  const root = useRef(null)
  const layers = useRef([])
  const [index, setIndex] = useState(0)
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
          .call(() => setIndex((i + 1) % els.length), null, `${at}+=${DWELL}`)
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

  const shot = frames[index]

  return (
    <section className="hero" ref={root} aria-label="Viverst Agro">
      <div className="hero-bg" aria-hidden="true">
        {frames.map((f, i) => (
          <div key={f.label} className="hero-layer"
               ref={(el) => { layers.current[i] = el }}
               style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden', zIndex: i === 0 ? 2 : 1 }}>
            <img src={f.img} alt="" width="1120" height="788"
                 loading={i === 0 ? 'eager' : 'lazy'} decoding="async"
                 fetchPriority={i === 0 ? 'high' : 'low'} />
          </div>
        ))}
        {/* this is load-bearing: the type has nothing else behind it */}
        <span className="hero-scrim" />
      </div>

      <div className="hero-inner">
        <p className="hero-eyebrow" data-fade>
          <span className="hero-dot" />Farming and agribusiness &middot; {place}
        </p>

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
          <Magnetic><Link className="btn btn--onGlass" to="/contact">Talk to us</Link></Magnetic>
        </div>
      </div>

      <p className="hero-now" data-fade>
        <span className="hero-now-label">{shot.label}</span>
        <span className="hero-now-text">{shot.caption}</span>
      </p>

      <p className="visually-hidden" aria-live="polite">{shot.label}. {shot.caption}</p>
    </section>
  )
}
