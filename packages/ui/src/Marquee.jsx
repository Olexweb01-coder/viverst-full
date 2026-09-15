import Icon from './Icon.jsx'
import { useReducedMotion } from './hooks.js'

function Row({ items, muted }) {
  return (
    <div className="marquee-row" aria-hidden={muted || undefined}>
      {items.map((it, i) => (
        <span className="marquee-item" key={`${muted ? 'd-' : ''}${it.name}`} style={{ '--i': i }}>
          {it.icon
            ? <Icon name={it.icon} size={15} className="marquee-icon" />
            : <span className="marquee-bullet" aria-hidden="true" />}
          {it.name}
        </span>
      ))}
    </div>
  )
}

/** Seamless ticker. The duplicate row is hidden from assistive tech. */
export default function Marquee({ items, duration = 42 }) {
  const reduced = useReducedMotion()
  const list = items.map((i) => (typeof i === 'string' ? { name: i } : i))

  if (reduced) return <div className="marquee marquee--static"><Row items={list} /></div>

  return (
    <div className="marquee">
      <div className="marquee-track" style={{ '--marquee-dur': `${duration}s` }}>
        <Row items={list} />
        <Row items={list} muted />
      </div>
    </div>
  )
}
