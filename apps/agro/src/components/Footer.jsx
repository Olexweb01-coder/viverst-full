import { Link } from 'react-router-dom'
import { Mail, MapPin, ArrowUpRight } from 'lucide-react'
import { Reveal, Float, SocialLinks } from '@viverst/ui'
import { BUSINESS, NAV_LINKS, FOCUS_AREAS, SOCIALS } from '../data/agro.js'
import wordmark from '@brand-assets/agro/wordmark-light.webp'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <span className="footer-glow drift" aria-hidden="true" />
      <div className="container footer-inner">
        <div className="footer-top">
          <div>
            <Float distance={-6} duration={8}>
              <img src={wordmark} alt={BUSINESS.name} className="footer-mark" width="260" height="31" />
            </Float>
            <p className="footer-line">
              Practical farming solutions, from the farm to the buyer.
            </p>
            <a className="footer-contact" href={`mailto:${BUSINESS.email}`}>
              <Mail size={15} aria-hidden="true" /> {BUSINESS.email}
            </a>
            <span className="footer-contact footer-contact--plain">
              <MapPin size={15} aria-hidden="true" /> {BUSINESS.city}, {BUSINESS.country}
            </span>
            <SocialLinks brand={BUSINESS.name} links={SOCIALS} className="footer-social" />
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h2>Company</h2>
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="footer-link">{l.label}</Link>
              ))}
            </div>

            <div className="footer-col">
              <h2>Focus</h2>
              {FOCUS_AREAS.slice(0, 5).map((f) => (
                <Link key={f.title} to="/solutions" className="footer-link">{f.title}</Link>
              ))}
            </div>

            <div className="footer-col">
              <h2>The group</h2>
              <a className="footer-link" href={BUSINESS.parentUrl}>
                {BUSINESS.parent} <ArrowUpRight size={13} aria-hidden="true" />
              </a>
              <a className="footer-link" href={BUSINESS.siblingUrl}>
                {BUSINESS.siblingName} <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <Reveal className="footer-rule" />

        <div className="footer-bottom">
          <span>© {year} {BUSINESS.name}. A subsidiary of {BUSINESS.parent}.</span>
          <span className="footer-note">{BUSINESS.industry}</span>
        </div>
      </div>
    </footer>
  )
}
