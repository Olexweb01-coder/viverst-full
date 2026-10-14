import { Link } from 'react-router-dom'
import wordmark from '@brand-assets/agro/wordmark-light.webp'
import { SHOP } from '../lib/config.js'

export default function Footer({ contact }) {
  return (
    <footer className="shop-footer">
      <div className="container shop-footer-inner">
        <div><img src={wordmark} alt="Viverst Agro" width="140" height="36" /><p>Cleaned, graded and packed to move. Part of <a href={SHOP.groupUrl}>{SHOP.group}</a>.</p></div>
        <div className="shop-footer-links">
          <Link to="/products">All products</Link>
          <Link to="/cart">Cart</Link>
          <a href={SHOP.parentUrl}>agro.viverst.com</a>
          {contact?.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp}`}>WhatsApp</a>}
        </div>
        <p className="shop-footer-small">© {new Date().getFullYear()} {SHOP.group}. {SHOP.city}, {SHOP.country}.</p>
      </div>
    </footer>
  )
}
