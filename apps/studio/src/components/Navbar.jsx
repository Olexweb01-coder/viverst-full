import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV_LINKS, BUSINESS } from '../data/studio.js'

import icon from '@brand-assets/studio/icon.webp'
import wordmark from '@brand-assets/studio/wordmark.webp'
import wordmarkLight from '@brand-assets/studio/wordmark-light.webp'

export default function Navbar() {
  const [stuck, setStuck] = useState(false)
  const [invert, setInvert] = useState(false)
  const [open, setOpen] = useState(false)
  const sentinel = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Invert the header while a dark block sits underneath it. The root margin
  // narrows the viewport to a band at the height of the bar itself.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    let count = 0
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) count += e.isIntersecting ? 1 : -1
        if (count < 0) count = 0
        setInvert(count > 0)
      },
      { rootMargin: '-34px 0px -100% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-dark]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <span className="nav-sentinel" ref={sentinel} aria-hidden="true" />
      <header className={`nav${stuck ? ' is-stuck' : ''}${invert ? ' is-invert' : ''}`}>
        <div className="shell nav-in">
          <Link className="brand" to="/" aria-label={`${BUSINESS.name}, back to home`}>
            <img className="brand-icon" src={icon} alt="" width="40" height="40" />
            <img className="brand-word" src={wordmark} alt={BUSINESS.name} width="140" height="15" />
            <img className="brand-word-light" src={wordmarkLight} alt="" width="140" height="15" aria-hidden="true" />
          </Link>

          <nav className="nav-links" aria-label="Main">
            <NavLink className="nav-link" to="/" end>
              <u><span>Home</span><span aria-hidden="true">Home</span></u>
            </NavLink>
            {NAV_LINKS.map((l) => (
              <NavLink className="nav-link" key={l.to} to={l.to}>
                <u><span>{l.label}</span><span aria-hidden="true">{l.label}</span></u>
              </NavLink>
            ))}
          </nav>

          <Link className="btn btn-accent nav-cta" to="/contact"><span>Start a project</span></Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <i /><i /><i />
          </button>
        </div>

        {/* Rendered only while open. Hiding it with CSS would leave the links
            in the tab order behind a closed drawer. */}
        {open && (
          <div className="nav-drawer">
            <div className="shell">
              {[{ to: '/', label: 'Home' }, ...NAV_LINKS, { to: '/contact', label: 'Start a project' }]
                .map((l, i) => (
                  <Link
                    className="nav-drawer-link"
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                    <b>{String(i + 1).padStart(2, '0')}</b>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
