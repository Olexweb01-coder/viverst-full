import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Jump to the top on route change.
 * 'instant' is required: 'auto' resolves to the CSS scroll-behavior, which is
 * smooth, so navigation would animate a long scroll instead of snapping.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }
    catch { window.scrollTo(0, 0) }
  }, [pathname])
  return null
}
