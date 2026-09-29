import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Seo, Reveal, Float, Tilt, Magnetic, Counter, Icon } from '@viverst/ui'

import ValueChain from '../components/ValueChain.jsx'
import Hero from '../components/Hero.jsx'
import { BUSINESS, SUMMARY, HERO_SUMMARY, HEADLINE_LINES, FOCUS_AREAS, STATS, SHOWCASE, IMG } from '../data/agro.js'
import './Pages.css'

/* The homepage introduces; the dedicated pages explain. Each door below is a
   short promise plus a way through, not a summary of the page behind it. */
const DOORS = [
  { to: '/solutions', img: IMG.orchard,  icon: 'wrench',
    kicker: 'What we do', title: 'Seven areas, one chain',
    body: 'From seed to buyer, and the steps in between.' },
  { to: '/about', img: IMG.farmland, icon: 'leaf',
    kicker: 'Who we are', title: 'Part of a bigger group',
    body: 'Backed by Viverst Global Limited, with the standards that come with it.' },
  { to: '/contact', img: IMG.store, icon: 'handshake',
    kicker: 'Work with us', title: 'Tell us the problem',
    body: 'Supply, processing, packaging or partnership.' },
]

export default function Home() {
  return (
    <>
      <Seo
        title="Viverst Agro | Farming Solutions From Farm to Buyer in Nigeria"
        description="Grow more, waste less, earn better. Viverst Agro works from the farm to the buyer — agricultural technology, crop production, processing, packaging and getting produce to market. Lagos, Nigeria."
        url={BUSINESS.site + '/'}
        siteName={BUSINESS.name}
        image={BUSINESS.site + '/og-image.png'}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': BUSINESS.site + '/#organization',
          name: BUSINESS.name,
          url: BUSINESS.site,
          email: BUSINESS.email,
          description: SUMMARY,
          address: { '@type': 'PostalAddress', addressLocality: BUSINESS.city, addressCountry: 'NG' },
          parentOrganization: { '@type': 'Organization', name: BUSINESS.parent, url: BUSINESS.parentUrl },
          knowsAbout: FOCUS_AREAS.map((f) => f.title),
          areaServed: { '@type': 'Country', name: 'Nigeria' },
        }}
      />

      <Hero frames={SHOWCASE} lines={HEADLINE_LINES} summary={HERO_SUMMARY} />

      {/* The counts sit under the hero, not on top of the photograph. */}
      <section className="figures" aria-label="Viverst Agro at a glance">
        <div className="container figures-inner">
          {STATS.map((st, i) => (
            <Reveal key={st.label} delay={i * 0.08} className="figure">
              <span className="figure-n"><Counter value={st.value} /></span>
              <span className="figure-l">{st.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── THE CHAIN ───────────── */}
      <section className="section section--alt">
        <span className="hex-field" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <p className="eyebrow">Where money is lost</p>
            <h2 className="page-title">Five steps. Every one of them loses something.</h2>
          </Reveal>
          <Reveal delay={0.08}><ValueChain /></Reveal>
        </div>
      </section>

      {/* ───────────── DOORS ───────────── */}
      <section className="section">
        <div className="container">
          <div className="doors">
            {DOORS.map((d, i) => (
              <Reveal key={d.to} delay={i * 0.08}>
                <Float delay={i * 0.8} duration={7.6 + i * 0.7} distance={-8}>
                  <Tilt max={4}>
                    <Link to={d.to} className="door">
                      <span className="door-media">
                        <img src={d.img} alt="" width="1120" height="788" loading="lazy" decoding="async" />
                      </span>
                      <span className="door-body">
                        <span className="door-kicker">
                          <Icon name={d.icon} size={14} /> {d.kicker}
                        </span>
                        <span className="door-title">{d.title}</span>
                        <span className="door-text">{d.body}</span>
                        <span className="door-go">
                          Open <ArrowRight size={15} aria-hidden="true" />
                        </span>
                      </span>
                    </Link>
                  </Tilt>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <span className="cta-orb drift" aria-hidden="true" />
              <div className="cta-copy">
                <h2>Where are you losing money?</h2>
                <p>Tell us the step that is costing you. That is usually the whole conversation.</p>
              </div>
              <div className="cta-actions">
                <Magnetic>
                  <Link className="btn btn--primary" to="/contact">
                    Start a conversation <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <a className="btn btn--onDark" href={BUSINESS.parentUrl}>
                    {BUSINESS.parent} <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
