import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Seo, Reveal, Float, Tilt, Magnetic, Icon } from '@viverst/ui'
import Gallery from '../components/Gallery.jsx'
import { BUSINESS, FOCUS_AREAS, CHAIN, AUDIENCE, GALLERY, IMG } from '../data/agro.js'
import './Pages.css'

export default function Solutions() {
  return (
    <>
      <Seo
        title="Solutions | Viverst Agro"
        description="Farm technology, crop production, processing, packaging, farm services and sustainable farming — the seven areas Viverst Agro works in."
        url={BUSINESS.site + '/solutions'}
        siteName={BUSINESS.name}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Viverst Agro solutions',
          itemListElement: FOCUS_AREAS.map((f, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: { '@type': 'Service', name: f.title, description: f.body,
                    provider: { '@type': 'Organization', name: BUSINESS.name, url: BUSINESS.site } },
          })),
        }}
      />

      <header className="page-hero">
        <span className="field-glow field-glow--a drift" aria-hidden="true" />
        <div className="container page-hero-inner">
          <Reveal as="p" className="eyebrow">Solutions</Reveal>
          <Reveal as="h1" delay={0.05}>Seven areas. One journey.</Reveal>
          <Reveal as="p" className="lede" delay={0.1}>
            Each one exists because money disappears at a particular step.
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          <div className="solutions-list">
            {FOCUS_AREAS.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <Float delay={i * 0.5} duration={7 + (i % 3) * 0.8} distance={-6}>
                  <Tilt className="solution-row sheen-host" max={3} style={{ '--sheen-delay': `${i}s` }}>
                    <span className="solution-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="solution-hex" aria-hidden="true"><Icon name={f.icon} size={22} /></span>
                    <div className="solution-text">
                      <h2>{f.title}</h2>
                      <p>{f.body}</p>
                    </div>
                    <figure className="solution-shot">
                      <img src={Object.values(IMG)[i % 8]} alt="" width="1200" height="860"
                           loading="lazy" decoding="async" />
                    </figure>
                  </Tilt>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <span className="hex-field" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <p className="eyebrow">What goes wrong</p>
            <h2 className="page-title">The problems we fix.</h2>
          </Reveal>
          <div className="grid grid--3">
            {CHAIN.map((s, i) => (
              <Reveal key={s.key} delay={(i % 3) * 0.07}>
                <Float delay={i * 0.6} duration={7 + (i % 3) * 0.7} distance={-7}>
                  <div className="loss-card">
                    <span className="loss-tag">{s.loss}</span>
                    <h3>{s.headline}</h3>
                    <p>{s.body}</p>
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
            <p className="eyebrow">Who we work with</p>
            <h2 className="page-title page-title--center">Anyone moving produce from farm to buyer.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <ul className="audience">
              {AUDIENCE.map((a, i) => <li key={a} style={{ '--i': i }}>{a}</li>)}
            </ul>
          </Reveal>
          <Reveal delay={0.1}><Gallery items={GALLERY.slice(0, 4)} /></Reveal>
          <Reveal delay={0.16}>
            <div className="center-cta">
              <Magnetic>
                <Link className="btn btn--primary" to="/contact">
                  Tell us what you need <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
