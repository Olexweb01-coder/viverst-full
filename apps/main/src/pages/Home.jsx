import { useCallback, useMemo, useState } from 'react'
import { Float, Icon, Magnetic, Tilt } from '@viverst/ui'
import { Link } from 'react-router-dom'
import BrandLink from '../components/BrandLink.jsx'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import OrbitMark from '../components/OrbitMark.jsx'
import Marquee from '../components/Marquee.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import Parallax from '../components/Parallax.jsx'
import { PROVIDES, REPUTATION, STATS, SUBSIDIARIES, VALUES } from '../data/site.js'
import './Home.css'

const REST_ACCENT = [140, 255, 137]

export default function Home() {
  const [focus, setFocus] = useState(null)
  const onFocusBrand = useCallback((key) => setFocus(key), [])

  const accent = useMemo(() => {
    const s = SUBSIDIARIES.find((x) => x.key === focus)
    return s ? s.theme.rgb.split(',').map((n) => Number(n.trim())) : REST_ACCENT
  }, [focus])

  return (
    <>
      <Seo
        title="Viverst Global Limited | Diversified Corporate Group"
        description="Parent company of Viverst Agro and Viverst Studio. Vision, governance and shared resources for businesses across agriculture, technology and design in Lagos, Nigeria."
        path="/"
      />

      {/* ─────────────── HERO ─────────────── */}
      <section className="hero">
        <WaveField accent={accent} />

        <div className="container hero-inner">
          <div className="hero-orbit"><OrbitMark onFocusBrand={onFocusBrand} /></div>

          <div className="hero-copy">
            <motion.span className="hero-live"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <span className="livedot" aria-hidden="true" /> Two companies operating
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}>
              We don&rsquo;t run a business. We build the companies that do.
            </motion.h1>

            <motion.p className="lede"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}>
              One parent. One standard. Two companies already running.
            </motion.p>

            <motion.div className="hero-cta"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}>
              <Magnetic>
                <Link className="btn btn--primary" to="/about">
                  How we&rsquo;re structured <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Magnetic>
              <Magnetic><Link className="btn" to="/our-story">Our story</Link></Magnetic>
            </motion.div>
          </div>
        </div>

        <motion.div className="scroll-cue" aria-hidden="true"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}>
          <span className="scroll-cue-rail"><span className="scroll-cue-dot" /></span>
        </motion.div>
      </section>

      {/* ─────────────── WHAT THE PARENT SUPPLIES ─────────────── */}
      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">What a parent is for</p>
            <h2 className="section-title">Four things every company gets from the one above it.</h2>
          </Reveal>

          <div className="grid grid--4">
            {PROVIDES.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07}>
                <Float delay={i * 0.9} duration={7 + i * 0.7} distance={-8}>
                  <Tilt className="card provides-card sheen-host"
                        style={{ '--sheen-delay': `${i * 1.4}s` }}>
                    <span className="icon-plate"><Icon name={p.icon} size={21} /></span>
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                    <span className="provides-index">{String(i + 1).padStart(2, '0')}</span>
                  </Tilt>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── THE TWO COMPANIES ─────────────── */}
      <section className="section section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow">The portfolio</p>
            <h2 className="section-title">Two companies. Nine units. One name.</h2>
          </Reveal>

          <div className="grid grid--2">
            {SUBSIDIARIES.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.1}>
                <Float delay={i * 1.6} duration={9 + i} distance={-7}>
                  <BrandLink to={s.path} external={s.external} className={`company-card company-card--${s.key}`}
                    style={{
                      '--c-deep': s.theme.deep, '--c-bright': s.theme.bright,
                      '--c-accent': s.theme.accent, '--c-paper': s.theme.paper,
                      '--c-font': s.theme.font, '--c-rgb': s.theme.rgb,
                    }}>
                    <span className="company-glow drift" aria-hidden="true"
                          style={{ '--drift-dur': `${17 + i * 4}s` }} />
                    <span className="company-ring spin-slow" aria-hidden="true"
                          style={{ '--spin-dur': `${52 + i * 12}s` }} />

                    <div className="company-head">
                      <span className="company-swatch breathe" aria-hidden="true"
                            style={{ '--breathe-dur': `${5.5 + i}s`, '--breathe': 1.09 }} />
                      <h3>{s.name}</h3>
                      <ArrowUpRight className="company-arrow" size={20} aria-hidden="true" />
                    </div>

                    <p className="company-tagline">{s.tagline}</p>

                    <ul className="company-units">
                      {s.units.map((u, j) => (
                        <li key={u.name} style={{ '--j': j }}>
                          <Icon name={u.icon} size={14} /> {u.name}
                        </li>
                      ))}
                    </ul>
                  </BrandLink>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── STATS ─────────────── */}
      <section className="section--tight">
        <div className="container">
          <div className="grid grid--4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <Float delay={i * 0.7} duration={6.5 + i * 0.6} distance={-7}>
                  <div className="stat sheen-host" style={{ '--sheen-delay': `${i * 1.1}s` }}>
                    <span className="stat-value"><AnimatedCounter value={s.value} suffix={s.suffix} /></span>
                    <span className="stat-label">{s.label}</span>
                  </div>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── VALUES ─────────────── */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Core values</p>
            <h2 className="section-title section-title--center">Ten values. Every company. Same standard.</h2>
          </Reveal>
        </div>
        <Reveal delay={0.08}><Marquee items={VALUES} /></Reveal>
      </section>

      {/* ─────────────── REPUTATION ─────────────── */}
      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Known for</p>
            <h2 className="section-title">What we intend to be.</h2>
          </Reveal>

          <div className="grid grid--3">
            {REPUTATION.map((r, i) => (
              <Reveal key={r.title} delay={(i % 3) * 0.07}>
                <Float delay={i * 0.55} duration={7.5 + (i % 3) * 0.8} distance={-8}>
                  <Tilt className="card rep-card" max={6}>
                    <span className="icon-plate"><Icon name={r.icon} size={20} /></span>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                    <span className="rep-bar" aria-hidden="true" />
                  </Tilt>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <Parallax distance={26} className="cta-orb-wrap">
                <span className="cta-orb drift" aria-hidden="true" />
              </Parallax>
              <div className="cta-copy">
                <h2>Building something that needs a parent behind it?</h2>
                <p>Long-term, governed, and built to last.</p>
              </div>
              <Magnetic>
                <Link className="btn btn--primary cta-btn" to="/contact">
                  Start a conversation <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
