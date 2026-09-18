import { Fragment } from 'react'
import { Float, Icon, Magnetic, Tilt } from '@viverst/ui'
import { Link } from 'react-router-dom'
import BrandLink from '../components/BrandLink.jsx'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import Marquee from '../components/Marquee.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import Parallax from '../components/Parallax.jsx'
import {
  HERO_FRAMES, HERO_LINES, HERO_SUMMARY,
  PROVIDES, REPUTATION, STATS, SUBSIDIARIES, VALUES,
} from '../data/site.js'
import './Home.css'

export default function Home() {
  return (
    <>
      <Seo
        title="Viverst Global Limited | Diversified Corporate Group"
        description="Parent company of Viverst Agro and Viverst Studio. Vision, governance and shared resources for businesses across agriculture, technology and design in Lagos, Nigeria."
        path="/"
      />

      {/* ─────────────── HERO ─────────────── */}
      <section className="hero" aria-label="Viverst Global Limited">
        {/* Five frames, each pushing in while it is on screen, the next fading
            up underneath before the current has finished travelling. Pure CSS:
            one keyframe set, each frame offset by its index. No library and no
            timer to fall out of step. */}
        <div className="hero-bg" aria-hidden="true">
          {HERO_FRAMES.map((f, i) => (
            <div className="hero-frame" key={f.key} style={{ '--i': i }}>
              <img
                src={f.img}
                alt=""
                width="1600"
                height="1100"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={i === 0 ? 'high' : 'low'}
              />
            </div>
          ))}
          {/* Load-bearing: the type sits directly on the picture with nothing
              behind it. The scrim is what keeps it readable over the palest
              frame, and contrast runs one way only. */}
          <span className="hero-scrim" />
        </div>

        <div className="container hero-inner">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* The space between the lines is a real text node. Held inside a
                clipped span it renders joined. */}
            {HERO_LINES.map((line, i) => (
              <Fragment key={line.text}>
                <span className="hero-line" style={{ '--shift': line.shift }}>{line.text}</span>
                {i < HERO_LINES.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
          </motion.h1>

          <motion.p
            className="hero-lede"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {HERO_SUMMARY}
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <Magnetic>
              <Link className="btn btn--primary" to="/about">
                How we&rsquo;re structured <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </Magnetic>
            <Magnetic><Link className="btn btn--onGlass" to="/contact">Start a conversation</Link></Magnetic>
          </motion.div>
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
            <p className="eyebrow">Our businesses</p>
            <h2 className="section-title">One name. Separate markets.</h2>
          </Reveal>

          <div className="grid grid--2">
            {SUBSIDIARIES.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.1}>
                <Float delay={i * 1.6} duration={9 + i} distance={-7}>
                  <BrandLink to="/businesses" external={false} className={`company-card company-card--${s.key}`}
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
                      <ArrowRight className="company-arrow" size={20} aria-hidden="true" />
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
