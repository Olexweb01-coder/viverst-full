import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../data/site.js'
import logo from '@brand-assets/main/logo.webp'
import logoLight from '@brand-assets/main/logo-light.webp'
import './Navbar.css'

export default function Navbar() {
  // read the real scroll position up front instead of setting it from an effect
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 12)
  const { pathname } = useLocation()
  // The drawer is derived from the route it was opened on, so any navigation —
  // including browser back/forward — closes it without an effect.
  const [openPath, setOpenPath] = useState(null)
  const onDarkHero = pathname === '/' && !scrolled
  const open = openPath === pathname
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setOpenPath(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setOpenPath(null) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  // The homepage hero is a dark photograph. Until the bar picks up its own
  // background on scroll, the logo and links have to read light against it,
  // or they vanish into the picture.
  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}${onDarkHero ? ' nav--onDark' : ''}`}>
      <div className="nav-inner container">
        <Link to="/" className="nav-logo" aria-label="Viverst Global Limited — home">
          <img src={onDarkHero ? logoLight : logo} alt="Viverst" className="nav-logo-img" />
        </Link>

        <nav className="nav-links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
                     className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && !reduce && (
                    <motion.span layoutId="nav-pill" className="nav-pill"
                                 transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                  <span className="nav-link-text">{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nav-right">
          <button type="button" className="nav-toggle" onClick={() => setOpenPath(open ? null : pathname)}
                  aria-expanded={open} aria-controls="nav-drawer"
                  aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Conditionally rendered rather than collapsed with max-height, so the
          links are not focusable while the drawer is closed. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="nav-drawer" className="nav-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nav-drawer-inner container">
              {NAV_LINKS.map((l, i) => (
                <motion.div key={l.to}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <NavLink to={l.to} end={l.to === '/'} onClick={close}
                           className={({ isActive }) => `nav-drawer-link ${isActive ? 'is-active' : ''}`}>
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
