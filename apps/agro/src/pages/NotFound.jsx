import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Seo, Reveal, Float } from '@viverst/ui'
import { BUSINESS, NAV_LINKS } from '../data/agro.js'
import './Pages.css'

export default function NotFound() {
  return (
    <section className="notfound">
      <Seo
        title="Page not found | Viverst Agro"
        description="That page is not part of Viverst Agro."
        url={BUSINESS.site + '/404'}
        siteName={BUSINESS.name}
        noindex
      />
      <span className="field-glow field-glow--a drift" aria-hidden="true" />

      <div className="container notfound-inner">
        <Reveal as="p" className="notfound-code">404</Reveal>
        <Reveal as="h1" delay={0.05}>Nothing growing here.</Reveal>
        <Reveal as="p" className="lede" delay={0.1}>
          That link may be old. Everything we have is one tap away.
        </Reveal>

        <Reveal className="notfound-links" delay={0.16}>
          {NAV_LINKS.map((l, i) => (
            <Float key={l.to} delay={i * 0.4} duration={6.5 + i * 0.5} distance={-5}>
              <Link className="notfound-chip" to={l.to}>{l.label}</Link>
            </Float>
          ))}
        </Reveal>

        <Reveal delay={0.24}>
          <Link className="btn btn--primary" to="/">
            <ArrowLeft size={17} aria-hidden="true" /> Back home
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
