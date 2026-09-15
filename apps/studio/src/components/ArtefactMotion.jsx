import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Pauses the artefact choreography while a card is off screen.
 *
 * An IntersectionObserver is the right tool here, unlike in Reveals.jsx: note
 * the direction. The parts animate by default and this only ever PAUSES them,
 * so if the observer is unavailable or misses an entry the drawings keep
 * moving. The failure mode is a little wasted work, never frozen artwork.
 */
export default function ArtefactMotion() {
  const { pathname } = useLocation()

  useEffect(() => {
    const arts = document.querySelectorAll('.art')
    if (!arts.length || typeof IntersectionObserver === 'undefined') return undefined

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle('is-idle', !e.isIntersecting)
      },
      { rootMargin: '120px 0px' },
    )
    arts.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  return null
}
