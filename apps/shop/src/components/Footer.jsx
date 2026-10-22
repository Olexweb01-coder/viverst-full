import { Link } from 'react-router-dom'
import { SocialLinks } from '@viverst/ui'
import wordmark from '@brand-assets/agro/wordmark-light.webp'
import { SHOP, SOCIALS } from '../lib/config.js'

export default function Footer({ contact }) {
  // the number set in the admin, when there is one; otherwise the standing one
  const phone = contact?.phone || SHOP.phone
  return (
    <footer className="shop-footer">
      <div className="container shop-footer-inner">
        <div><img src={wordmark} alt="Viverst Agro" width="140" height="36" /><p>Cleaned, graded and packed to move. Part of <a href={SHOP.groupUrl}>{SHOP.group}</a>.</p><SocialLinks brand={SHOP.parent} links={SOCIALS} className="shop-social" /></div>
        <div className="shop-footer-links">
          <Link to="/products">All products</Link>
          <Link to="/cart">Cart</Link>
          <a href={SHOP.parentUrl}>agro.viverst.com</a>
          {contact?.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
          {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp}`}>WhatsApp</a>}
        </div>
        <p className="shop-footer-small">© {new Date().getFullYear()} {SHOP.group}. {SHOP.city}, {SHOP.country}.</p>
      </div>
    </footer>
  )
}
