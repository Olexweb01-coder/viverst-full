import { Link } from 'react-router-dom'
import { Float, Icon, Magnetic } from '@viverst/ui'
import { ArrowUpRight, ArrowRight } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import BrandLink from '../components/BrandLink.jsx'
import WaveField from '../components/WaveField.jsx'
import { SUBSIDIARIES, COMPANY } from '../data/site.js'
import './Pages.css'

/* The one stop between the group site and each company's own site. Every
   business links straight to its subdomain rather than through viverst.com/agro,
   so a visitor makes one hop instead of two. The 301s on /agro and /studio stay
   in vercel.json for anyone typing a URL by hand or following an old link. */
export default function Businesses() {
  return (
    <>
      <Seo
        title="Our Businesses | Viverst Global Limited"
        description="Viverst Agro and Viverst Studio — the companies inside Viverst Global Limited, and what each one does."
        path="/businesses"
      />

      <header className="page-hero">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">Our businesses</p>
            <h1>Each company runs its own market.</h1>
            <p className="lede">
              Separate teams, separate customers, separate sites. One standard behind all of them.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          <div className="biz-list">
            {SUBSIDIARIES.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.08}>
                <article
                  className={`biz-card biz-card--${s.key}`}
                  style={{
                    '--c-deep': s.theme.deep,
                    '--c-bright': s.theme.bright,
                    '--c-accent': s.theme.accent,
                    '--c-paper': s.theme.paper,
                    '--c-font': s.theme.font,
                    '--c-rgb': s.theme.rgb,
                  }}
                >
                  <span className="biz-glow drift" aria-hidden="true"
                        style={{ '--drift-dur': `${18 + i * 4}s` }} />

                  <div className="biz-head">
                    <Float delay={i * 1.2} duration={9 + i} distance={-6}>
                      <span className="biz-swatch" aria-hidden="true" />
                    </Float>
                    <div>
                      <h2>{s.name}</h2>
                      <p className="biz-tagline">{s.tagline}</p>
                    </div>
                  </div>

                  <p className="biz-summary">{s.summary}</p>

                  <ul className="biz-units">
                    {s.units.map((u, j) => (
                      <li key={u.name} style={{ '--j': j }}>
                        <Icon name={u.icon} size={15} /> {u.name}
                      </li>
                    ))}
                  </ul>

                  <div className="biz-actions">
                    <Magnetic>
                      <BrandLink to={s.path} external={s.external} className="btn biz-btn">
                        Visit {s.short} <ArrowUpRight size={17} aria-hidden="true" />
                      </BrandLink>
                    </Magnetic>
                    <span className="biz-domain">{s.path.replace('https://', '')}</span>
                  </div>
                </article>
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
                <h2>More industries to come.</h2>
                <p>{COMPANY.shortName} is built to hold more than the two already here.</p>
              </div>
              <Magnetic>
                <Link className="btn" to="/contact">
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
