import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, useReducedMotion } from '@viverst/ui'
import { CHAIN } from '../data/agro.js'
import './ValueChain.css'

const DWELL = 4600 // ms a stage holds before the chain moves on by itself

/**
 * The journey from farm to buyer, step by step.
 *
 * The node shape is the hexagon from the Viverst Agro mark, so the chain reads
 * as the brand repeating along a line rather than a generic stepper. Product
 * flows left to right; the segment behind the active stage is lit, the ones
 * ahead are not. It advances on its own until the visitor takes over, and then
 * it stays where they put it.
 */
export default function ValueChain() {
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const reduced = useReducedMotion()
  const timer = useRef(null)

  const choose = useCallback((i) => {
    setActive(i)
    setHeld(true) // the visitor is driving now; stop advancing
  }, [])

  useEffect(() => {
    if (held || reduced) return undefined
    timer.current = setInterval(() => setActive((i) => (i + 1) % CHAIN.length), DWELL)
    return () => clearInterval(timer.current)
  }, [held, reduced])

  const stage = CHAIN[active]

  return (
    <div className="chain-wrap">
      <ol className="chain" aria-label="From the farm to the buyer">
        {CHAIN.map((s, i) => (
          <li
            key={s.key}
            className={`chain-node ${i === active ? 'is-active' : ''} ${i < active ? 'is-passed' : ''}`}
            style={{ '--i': i }}
          >
            <button
              type="button"
              className="chain-btn"
              aria-current={i === active ? 'step' : undefined}
              aria-label={`${s.stage} — ${s.headline}`}
              onClick={() => choose(i)}
              onMouseEnter={() => choose(i)}
              onFocus={() => choose(i)}
            >
              <span className="chain-hex" aria-hidden="true">
                <span className="chain-hex-inner">
                  <Icon name={s.icon} size={22} />
                </span>
              </span>
              <span className="chain-stage">{s.stage}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* Keyed so the panel re-mounts: the picture replays its zoom and the
          copy replays its entrance every time the stage changes. */}
      <div className="chain-panel" key={stage.key}>
        <figure className="chain-shot">
          <img src={stage.img} alt={`${stage.stage} — ${stage.headline}`}
               width="1200" height="860" loading="lazy" decoding="async" />
          <span className="chain-shot-veil" aria-hidden="true" />
          <figcaption>{stage.stage}</figcaption>
        </figure>

        <div className="chain-text">
          <p className="chain-loss">
            <span className="chain-loss-dot" aria-hidden="true" />
            {stage.loss}
          </p>
          <h2 className="chain-headline">{stage.headline}</h2>
          <p className="chain-body">{stage.body}</p>
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        Stage {active + 1} of {CHAIN.length}: {stage.stage}. {stage.headline}
      </p>
    </div>
  )
}
