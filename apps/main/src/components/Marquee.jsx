import { useReducedMotion } from 'framer-motion'
import { Icon } from '@viverst/ui'
import './Marquee.css'

/** One row of chips. Defined at module scope so it isn't recreated each render. */
function Row({ items, hidden }) {
  return (
    <div className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <span className="marquee-item" key={`${hidden ? 'dup-' : ''}${it.name}`} style={{ '--i': i }}>
          {it.icon
            ? <Icon name={it.icon} size={15} className="marquee-icon" />
            : <span className="marquee-bullet" aria-hidden="true" />}
          {it.name}
        </span>
      ))}
    </div>
  )
}

/**
 * Seamless ticker. The list renders twice and translates -50%; the duplicate is
 * hidden from assistive tech so nothing is announced twice.
 * Items may be plain strings or { name, icon }.
 */
export default function Marquee({ items, duration = 42 }) {
  const reduce = useReducedMotion()
  const norm = items.map((i) => (typeof i === 'string' ? { name: i } : i))

  if (reduce) {
    return <div className="marquee marquee--static"><Row items={norm} /></div>
  }

  return (
    <div className="marquee">
      <div className="marquee-track" style={{ '--marquee-dur': `${duration}s` }}>
        <Row items={norm} />
        <Row items={norm} hidden />
      </div>
    </div>
  )
}
