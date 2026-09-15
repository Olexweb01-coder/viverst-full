import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Seo, Reveal, Float, Tilt, Magnetic, Icon } from '@viverst/ui'
import { BUSINESS, MISSION, PROMISE, SUMMARY, COMMITMENTS, VALUE_PILLARS, IMG } from '../data/agro.js'
import './Pages.css'

export default function About() {
  return (
    <>
      <Seo
        title="About | Viverst Agro"
        description="Viverst Agro turns farming problems into practical businesses that pay. Part of Viverst Global Limited, Lagos."
        url={BUSINESS.site + '/about'}
        siteName={BUSINESS.name}
      />

      <header className="page-hero">
        <span className="field-glow field-glow--a drift" aria-hidden="true" />
        <div className="container page-hero-inner">
          <Reveal as="p" className="eyebrow">About</Reveal>
          <Reveal as="h1" delay={0.05}>Farming is too important to keep losing money in.</Reveal>
          <Reveal as="p" className="lede" delay={0.1}>
It is one of the biggest parts of the economy and one of the most wasteful. That gap is our business.
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container split">
          <Reveal className="split-media">
            <Float distance={-9} duration={9.5}>
              <figure className="framed">
                <img src={IMG.orchard} alt="A farm seen from above before planning begins"
                     width="1200" height="860" loading="lazy" decoding="async" />
                <span className="framed-tag">From above</span>
              </figure>
            </Float>
          </Reveal>
          <div className="about-statements">
            <Reveal>
              <Float distance={-7} duration={8}>
                <Tilt className="card statement-card" max={4}>
                  <span className="icon-plate"><Icon name="target" size={21} /></span>
                  <h2>Mission</h2>
                  <p>{MISSION}</p>
                </Tilt>
              </Float>
            </Reveal>
            <Reveal delay={0.08}>
              <Float delay={1} distance={-7} duration={9}>
                <Tilt className="card statement-card" max={4}>
                  <span className="icon-plate"><Icon name="wrench" size={21} /></span>
                  <h2>What we do</h2>
                  <p>{PROMISE} {SUMMARY}</p>
                </Tilt>
              </Float>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <span className="hex-field" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <p className="eyebrow">What we hold ourselves to</p>
            <h2 className="page-title">Six commitments.</h2>
          </Reveal>
          <div className="grid grid--3">
            {COMMITMENTS.map((c, i) => (
              <Reveal key={c.k} delay={(i % 3) * 0.07}>
                <Float delay={i * 0.6} duration={7.2 + (i % 3) * 0.7} distance={-7}>
                  <div className="commit-card">
                    <span className="commit-k">{c.k}</span>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Why people work with us</p>
            <h2 className="page-title">Six things we hold to.</h2>
          </Reveal>
          <div className="grid grid--3">
            {VALUE_PILLARS.map((pillar, i) => (
              <Reveal key={pillar.title} delay={(i % 3) * 0.07}>
                <Float delay={i * 0.6} duration={7 + (i % 3) * 0.7} distance={-7}>
                  <div className="pillar-card">
                    <span className="pillar-hex" aria-hidden="true"><Icon name={pillar.icon} size={19} /></span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.body}</p>
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
            <div className="parent-band">
              <div>
                <p className="eyebrow">Part of a group</p>
                <h2>We carry the same name as the group above us.</h2>
                <p className="parent-body">
                  Viverst Agro sits under {BUSINESS.parent}, alongside {BUSINESS.siblingName}.
                  Same oversight, same standards, different markets.
                </p>
              </div>
              <div className="cta-actions">
                <Magnetic>
                  <a className="btn" href={BUSINESS.parentUrl}>
                    {BUSINESS.parent} <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </Magnetic>
                <Magnetic>
                  <Link className="btn btn--primary" to="/solutions">
                    What we do <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
