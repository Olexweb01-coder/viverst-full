import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import { ScrollToTop, ScrollProgress } from '@viverst/ui'

import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'

const About    = lazy(() => import('./pages/About.jsx'))
const Solutions= lazy(() => import('./pages/Solutions.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const Contact  = lazy(() => import('./pages/Contact.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

// The review build runs in a sandboxed frame where location.origin is "null",
// which history and hash routing cannot use as a URL base. MemoryRouter keeps
// navigation in memory. Production is unaffected and uses real URLs.
const Router = import.meta.env.MODE === 'singlefile' ? MemoryRouter : BrowserRouter

export default function App() {
  // Warm the route chunks once the main thread is idle so navigation never
  // falls through to the Suspense fallback.
  useEffect(() => {
    const warm = () => {
      import('./pages/About.jsx')
      import('./pages/Solutions.jsx')
      import('./pages/Products.jsx')
      import('./pages/Contact.jsx')
    }
    const idle = window.requestIdleCallback
    const id = idle ? idle(warm, { timeout: 2500 }) : setTimeout(warm, 1200)
    return () => {
      if (idle && window.cancelIdleCallback) window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])

  return (
    <Router>
      <ScrollToTop />
      <ScrollProgress />
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Suspense fallback={<div style={{ minHeight: '70svh' }} />}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/about"     element={<About />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/products"  element={<Products />} />
            <Route path="/contact"   element={<Contact />} />
            <Route path="*"          element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </Router>
  )
}
