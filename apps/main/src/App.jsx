import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { ScrollToTop } from '@viverst/ui'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import PageShell from './components/PageShell.jsx'

import Home from './pages/Home.jsx'

// Routes below the fold of the first paint are split out so the homepage
// ships the smallest possible bundle.
const About     = lazy(() => import('./pages/About.jsx'))
const Contact   = lazy(() => import('./pages/Contact.jsx'))
const Businesses= lazy(() => import('./pages/Businesses.jsx'))
const Blog      = lazy(() => import('./pages/Blog.jsx'))
const BlogPost  = lazy(() => import('./pages/BlogPost.jsx'))
const Events    = lazy(() => import('./pages/Events.jsx'))
const EventDetail = lazy(() => import('./pages/EventDetail.jsx'))
const NotFound  = lazy(() => import('./pages/NotFound.jsx'))

// The single-file review build runs inside a sandboxed frame where
// location.origin is "null" and location.href is "about:srcdoc" — not a valid
// base for `new URL()`, which history and hash routing both rely on.
// MemoryRouter keeps navigation entirely in memory, so it works anywhere.
// Production builds are unaffected and use real URLs.
const Router = import.meta.env.MODE === 'singlefile' ? MemoryRouter : BrowserRouter

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<PageShell><Home /></PageShell>} />
        <Route path="/about"     element={<PageShell><About /></PageShell>} />
        <Route path="/businesses" element={<PageShell><Businesses /></PageShell>} />
        <Route path="/contact"   element={<PageShell><Contact /></PageShell>} />
        <Route path="/blog"          element={<PageShell><Blog /></PageShell>} />
        <Route path="/blog/:slug"    element={<PageShell><BlogPost /></PageShell>} />
        <Route path="/events"        element={<PageShell><Events /></PageShell>} />
        <Route path="/events/:slug"  element={<PageShell><EventDetail /></PageShell>} />
        {/* Catch-all: without this, a typo'd URL renders a blank page. */}
        <Route path="*"          element={<PageShell><NotFound /></PageShell>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  // Prefetch every route chunk once the main thread is idle. Without this the
  // first visit to a route can flash the Suspense fallback while it downloads.
  useEffect(() => {
    const warm = () => {
      import('./pages/About.jsx')
      import('./pages/Contact.jsx')
      import('./pages/Businesses.jsx')
      import('./pages/Blog.jsx')
      import('./pages/Events.jsx')
      import('./pages/NotFound.jsx')
    }
    const idle = window.requestIdleCallback
    const id = idle ? idle(warm, { timeout: 2500 }) : setTimeout(warm, 1200)
    return () => { if (idle && window.cancelIdleCallback) window.cancelIdleCallback(id); else clearTimeout(id) }
  }, [])

  return (
    <Router>
      <ScrollToTop />
      <ScrollProgress />
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Suspense fallback={<div style={{ minHeight: '100svh' }} />}>
          <AnimatedRoutes />
        </Suspense>
      </main>
      <Footer />
    </Router>
  )
}
