import { Link } from 'react-router-dom'
import { Float, Icon, Magnetic } from '@viverst/ui'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import { STORY } from '../data/site.js'
import './Pages.css'

export default function OurStory() {
  return (
    <>
      <Seo
        title="Our Story | Viverst Global Limited"
        description="VIVERST was built from Vi, an entity, and Verst, from versatile — a name made for a company designed to be more than a single business."
        path="/our-story"
      />

      <header className="page-hero">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">Our story</p>
            <h1>The name was built before the businesses were.</h1>
          </Reveal>

          {/* the etymology, assembled on screen */}
          <div className="etymology">
            {STORY.name.map((n, i) => (
              <motion.div key={n.part} className="etymology-part float"
                style={{ '--float-delay': `${i * 1.2}s`, '--float-dur': '7.5s', '--float-y': '-8px' }}
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.75, delay: 0.25 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="etymology-word">{n.part}</span>
                <span className="etymology-meaning">{n.meaning}</span>
              </motion.div>
            ))}

            <motion.div className="etymology-result"
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="etymology-equals" aria-hidden="true">=</span>
              <span className="etymology-final sheen-host">VIVERST</span>
            </motion.div>
          </div>

          <Reveal delay={0.4}>
            <p className="lede etymology-note">
              An entity that is versatile &mdash; named before there was a
              portfolio to describe.
            </p>
          </Reveal>
        </div>
      </header>

      {/* ─────────── CHAPTERS ─────────── */}
      <section className="section">
        <div className="container">
          <div className="timeline">
            <motion.span className="timeline-spine" aria-hidden="true"
              initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }} />

            {STORY.chapters.map((c, i) => (
              <Reveal key={c.k} delay={i * 0.06} className="timeline-row">
                <span className="timeline-dot breathe" aria-hidden="true"
                      style={{ '--breathe-dur': `${3.4 + i * 0.4}s`, '--breathe': 1.35 }} />
                <Float delay={i * 0.7} duration={7.5 + i * 0.5} distance={-6}>
                  <div className="timeline-card">
                    <span className="timeline-icon"><Icon name={c.icon} size={18} /></span>
                    <span className="timeline-key">{c.k}</span>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="next-band">
              <div>
                <h2>See how the group is structured</h2>
                <p>Vision, mission and the companies underneath.</p>
              </div>
              <Magnetic>
                <Link className="btn" to="/about">
                  About Viverst <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
