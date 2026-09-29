import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { NAV_LINKS, BUSINESS } from '../data/agro.js'
import lockup from '@brand-assets/agro/lockup.webp'
import wordmarkLight from '@brand-assets/agro/wordmark-light.webp'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 12,
  )
  // Derived from the route it was opened on, so any navigation — including
  // browser back — closes it without an effect watching the pathname.
  const [openPath, setOpenPath] = useState(null)
  const open = openPath === pathname
  const close = () => setOpenPath(null)
  // The homepage hero is a dark photograph under a scrim. Until the bar picks
  // up its own background on scroll, the logo and links read light against
  // it, or they disappear into the picture. Open drawer is light-backed, so
  // it counts as scrolled here.
  const onDarkHero = pathname === '/' && !scrolled && !open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setOpenPath(null) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}${onDarkHero ? ' nav--onDark' : ''}`}>
      <div className="nav-inner container">
        <Link to="/" className="nav-logo" aria-label={`${BUSINESS.name} — home`}>
          {onDarkHero
            ? <img src={wordmarkLight} alt={BUSINESS.name} className="nav-logo-img nav-logo-img--light" width="260" height="31" />
            : <img src={lockup} alt={BUSINESS.name} className="nav-logo-img" width="304" height="48" />}
        </Link>

        <nav className="nav-links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
                     className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-right">
          {/* Up to the parent group — the branded-house link, on every page. */}
          <a className="nav-parent" href={BUSINESS.parentUrl}>
            {BUSINESS.parent}
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>

          <button type="button" className="nav-toggle" onClick={() => setOpenPath(open ? null : pathname)}
                  aria-expanded={open} aria-controls="agro-drawer"
                  aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Rendered only when open, so the links are never focusable behind it. */}
      {open && (
        <div id="agro-drawer" className="nav-drawer">
          <div className="nav-drawer-inner container">
            {NAV_LINKS.map((l, i) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={close}
                       style={{ '--i': i }}
                       className={({ isActive }) => `nav-drawer-link ${isActive ? 'is-active' : ''}`}>
                {l.label}
              </NavLink>
            ))}
            <a className="nav-drawer-parent" href={BUSINESS.parentUrl} onClick={close}>
              {BUSINESS.parent} <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
