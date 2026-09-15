import { Link } from 'react-router-dom'
import { Float, Icon, Magnetic, Tilt } from '@viverst/ui'
import BrandLink from '../components/BrandLink.jsx'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import Marquee from '../components/Marquee.jsx'
import { MISSION, POSITIONING, PURPOSE, SUBSIDIARIES, VALUES, VISION } from '../data/site.js'
import './Pages.css'

const PILLARS = [
  { icon: 'eye', label: 'Vision', body: VISION },
  { icon: 'target', label: 'Mission', body: MISSION },
  { icon: 'sparkles', label: 'Purpose', body: PURPOSE },
]

export default function About() {
  return (
    <>
      <Seo
        title="About | Viverst Global Limited"
        description="Vision, mission, purpose and brand architecture of Viverst Global Limited — the diversified holding company behind Viverst Agro and Viverst Studio."
        path="/about"
      />

      <header className="page-hero">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">About the group</p>
            <h1>A parent built to hold more than one industry.</h1>
            <p className="lede">We don&rsquo;t operate a business. We stand behind the ones that do.</p>
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          <div className="grid grid--3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.label} delay={i * 0.08}>
                <Float delay={i * 1.1} duration={7.5 + i * 0.8} distance={-8}>
                  <Tilt className="card pillar sheen-host" style={{ '--sheen-delay': `${i * 1.6}s` }}>
                    <span className="icon-plate"><Icon name={p.icon} size={21} /></span>
                    <h3>{p.label}</h3>
                    <p>{p.body}</p>
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
            <blockquote className="quote">
              <span className="quote-mark breathe" aria-hidden="true">&ldquo;</span>
              <p>{POSITIONING}</p>
              <footer>Corporate positioning</footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Brand architecture</p>
            <h2 className="page-title">A branded house. Parent-led, parent-named.</h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="tree">
              <Float duration={8} distance={-7}>
                <div className="tree-parent sheen-host">
                  <span className="tree-tag">Parent</span>
                  <strong>Viverst Global Limited</strong>
                </div>
              </Float>

              <motion.div className="tree-stem" aria-hidden="true"
                initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />

              <div className="tree-branches">
                {SUBSIDIARIES.map((s, i) => (
                  <motion.div key={s.key}
                    style={{ '--c-deep': s.theme.deep, '--c-bright': s.theme.bright, '--c-font': s.theme.font }}
                    initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}>
                    <Float delay={i * 1.4} duration={9 + i} distance={-6}>
                      <BrandLink to={s.path} external={s.external} className="tree-node">
                        <span className="tree-tag">Subsidiary</span>
                        <strong>{s.name}</strong>
                        <ul>
                          {s.units.map((u, j) => (
                            <li key={u.name} style={{ '--j': j }}>
                              <Icon name={u.icon} size={13} /> {u.name}
                            </li>
                          ))}
                        </ul>
                      </BrandLink>
                    </Float>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Core values</p>
            <h2 className="page-title page-title--center">Ten values, one standard.</h2>
          </Reveal>
        </div>
        <Reveal delay={0.08}><Marquee items={VALUES} duration={46} /></Reveal>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="next-band">
              <div>
                <h2>How the name came about</h2>
                <p>Viverst was constructed, not chosen.</p>
              </div>
              <Magnetic>
                <Link className="btn" to="/our-story">
                  Our story <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
