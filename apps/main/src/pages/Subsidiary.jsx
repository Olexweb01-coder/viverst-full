import { Link, Navigate } from 'react-router-dom'
import { Float, Icon, Magnetic, Tilt } from '@viverst/ui'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import { SUBSIDIARIES } from '../data/site.js'
import './Pages.css'

/** One themed page shared by both subsidiaries, each in its own guideline palette. */
export default function Subsidiary({ brandKey }) {
  const brand = SUBSIDIARIES.find((s) => s.key === brandKey)
  if (!brand) return <Navigate to="/" replace />

  const t = brand.theme
  const other = SUBSIDIARIES.find((s) => s.key !== brandKey)

  return (
    <div className={`sub sub--${brand.key}`}
      style={{
        '--c-deep': t.deep, '--c-bright': t.bright, '--c-accent': t.accent,
        '--c-paper': t.paper, '--c-font': t.font, '--c-rgb': t.rgb,
      }}>
      <Seo title={`${brand.name} | Viverst Global Limited`} description={brand.summary} path={brand.path} />

      <header className="sub-hero">
        <span className="sub-orb sub-orb--a drift" aria-hidden="true" />
        <span className="sub-orb sub-orb--b drift" aria-hidden="true" />
        <span className="sub-ring spin-slow" aria-hidden="true" />

        <div className="container sub-hero-inner">
          <Reveal>
            <Link to="/" className="sub-back">
              <ArrowLeft size={15} aria-hidden="true" /> Viverst Global Limited
            </Link>
          </Reveal>

          <motion.h1 className="sub-title"
            initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            {brand.name}
          </motion.h1>

          <motion.p className="sub-tagline"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}>
            {brand.tagline}
          </motion.p>

          <motion.span className="sub-status"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <span className="sub-pulse" aria-hidden="true" />
            Full site in development
          </motion.span>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow sub-eyebrow">Business units</p>
            <h2 className="page-title sub-h2">What this company does.</h2>
          </Reveal>

          <div className="sub-units">
            {brand.units.map((u, i) => (
              <Reveal key={u.name} delay={i * 0.06}>
                <Float delay={i * 0.8} duration={7 + (i % 3) * 0.9} distance={-8}>
                  <Tilt className="sub-unit sheen-host" max={6} style={{ '--sheen-delay': `${i * 1.2}s` }}>
                    <span className="sub-unit-icon"><Icon name={u.icon} size={20} /></span>
                    <span className="sub-unit-key">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{u.name}</h3>
                    <span className="sub-unit-line" aria-hidden="true" />
                  </Tilt>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="sub-next">
              <div>
                <h2>Part of a group.</h2>
                <p>Under Viverst Global Limited, alongside {other.name}.</p>
              </div>
              <div className="sub-next-actions">
                <Magnetic>
                  <Link className="btn sub-btn" to={other.path}>
                    {other.name} <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link className="btn sub-btn sub-btn--solid" to="/contact">Get in touch</Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
