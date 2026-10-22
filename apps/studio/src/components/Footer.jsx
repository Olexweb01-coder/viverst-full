import { Link } from 'react-router-dom'
import { Icon, SocialLinks } from '@viverst/ui'
import { BUSINESS, NAV_LINKS, FOCUS_AREAS, SOCIALS } from '../data/studio.js'

import icon from '@brand-assets/studio/icon.webp'
import wordmarkLight from '@brand-assets/studio/wordmark-light.webp'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="foot" data-dark>
      <div className="shell foot-in">
        <div className="foot-top">
          <div className="foot-brand">
            <Link className="foot-lock" to="/" aria-label={`${BUSINESS.name}, back to home`}>
              <img src={icon} alt="" width="38" height="38" />
              <img src={wordmarkLight} alt={BUSINESS.name} width="150" height="17" />
            </Link>
            <p>Brand, design and visual communication. Made in {BUSINESS.city}.</p>
            <a className="foot-contact" href={`mailto:${BUSINESS.email}`}>
              <Icon name="mail" size={15} /> {BUSINESS.email}
            </a>
            <span className="foot-contact">
              <Icon name="pin" size={15} /> {BUSINESS.city}, {BUSINESS.country}
            </span>
            <SocialLinks brand={BUSINESS.name} links={SOCIALS} className="foot-social" />
          </div>

          <div className="foot-col">
            <h2>Pages</h2>
            {NAV_LINKS.map((l) => (
              <Link className="foot-link" key={l.to} to={l.to}>{l.label}</Link>
            ))}
            <Link className="foot-link" to="/contact">Contact</Link>
          </div>

          <div className="foot-col">
            <h2>What we do</h2>
            {FOCUS_AREAS.slice(0, 5).map((f) => (
              <Link className="foot-link" key={f.key} to="/services">{f.title}</Link>
            ))}
          </div>

          <div className="foot-col">
            <h2>The group</h2>
            <a className="foot-link" href={BUSINESS.parentUrl}>{BUSINESS.parent}</a>
            <a className="foot-link" href={BUSINESS.siblingUrl}>{BUSINESS.siblingName}</a>
          </div>
        </div>

        <div className="foot-rule" />
        <div className="foot-bottom">
          <span>© {year} {BUSINESS.name}. A subsidiary of {BUSINESS.parent}.</span>
          <span>{BUSINESS.industry}</span>
        </div>
      </div>
    </footer>
  )
}
