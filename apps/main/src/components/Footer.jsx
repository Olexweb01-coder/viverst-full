import { Link } from 'react-router-dom'
import { Float, SocialLinks } from '@viverst/ui'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin } from 'lucide-react'
import { COMPANY, NAV_LINKS, SOCIALS } from '../data/site.js'
import logoLight from '@brand-assets/main/logo-light.webp'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <span className="footer-glow drift" aria-hidden="true" />
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Float className="footer-logo-wrap" distance={-6} duration={8}>
              <img src={logoLight} alt="Viverst" className="footer-logo" />
            </Float>
            
            <a className="footer-contact" href={`mailto:${COMPANY.email}`}>
              <Mail size={15} aria-hidden="true" /> {COMPANY.email}
            </a>
            <a className="footer-contact" href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}>
              <Phone size={15} aria-hidden="true" /> {COMPANY.phone}
            </a>
            <span className="footer-contact footer-contact--plain">
              <MapPin size={15} aria-hidden="true" /> {COMPANY.city}, {COMPANY.country}
            </span>
            <SocialLinks brand={COMPANY.legalName} links={SOCIALS} className="footer-social" />
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Company</h4>
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="footer-link">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        <motion.div className="footer-rule"
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
          viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />

        <div className="footer-bottom">
          <span>© {year} {COMPANY.legalName}. All rights reserved.</span>
          <span className="footer-note">Building companies, one industry at a time.</span>
        </div>
      </div>
    </footer>
  )
}
