import { Reveal, Float } from '@viverst/ui'
import './Gallery.css'

/** Operational imagery. Each tile lifts and pushes in on hover. */
export default function Gallery({ items }) {
  return (
    <div className="gallery">
      {items.map((g, i) => (
        <Reveal key={g.label} delay={(i % 3) * 0.06} className={`gallery-cell gallery-cell--${i % 6}`}>
          <Float delay={i * 0.5} duration={7.6 + (i % 3) * 0.9} distance={-7}>
            <figure className="tile">
              <img src={g.img} alt={g.label} width="1200" height="860" loading="lazy" decoding="async" />
              <span className="tile-veil" aria-hidden="true" />
              <figcaption>
                <span className="tile-meta">{g.meta}</span>
                <span className="tile-label">{g.label}</span>
              </figcaption>
            </figure>
          </Float>
        </Reveal>
      ))}
    </div>
  )
}
