import { useEffect, useMemo, useState } from 'react'
import { Float, Icon, Magnetic, Tilt } from '@viverst/ui'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, MapPin, Clock, Users } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import { getEvents, getEventTypes, splitByTime } from '../lib/cms.js'
import { formatTimeRange, dayNumber, monthShort, yearOf, countdown } from '../lib/format.js'
import './Content.css'

/** Ticks once a second, straight into the DOM-free state of the parent. */
function Countdown({ iso }) {
  const reduce = useReducedMotion()
  const [t, setT] = useState(() => countdown(iso))

  useEffect(() => {
    if (reduce) return undefined
    const id = setInterval(() => setT(countdown(iso)), 1000)
    return () => clearInterval(id)
  }, [iso, reduce])

  if (!t) return null
  const cells = [
    { v: t.days, l: 'days' },
    { v: t.hours, l: 'hrs' },
    { v: t.minutes, l: 'min' },
    { v: t.seconds, l: 'sec' },
  ]
  return (
    <div className="countdown" aria-label="Time until this event">
      {cells.map((c, i) => (
        <span className="countdown-cell" key={c.l} style={{ '--i': i }}>
          <strong>{String(c.v).padStart(2, '0')}</strong>
          <em>{c.l}</em>
        </span>
      ))}
    </div>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [type, setType] = useState('all')
  const types = getEventTypes()

  useEffect(() => {
    let alive = true
    getEvents().then((e) => { if (alive) setEvents(e) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const { upcoming, past } = useMemo(() => splitByTime(events), [events])
  const next = upcoming[0]

  const shown = useMemo(() => {
    const base = tab === 'upcoming' ? upcoming.filter((e) => e.slug !== next?.slug) : past
    return type === 'all' ? base : base.filter((e) => e.type === type)
  }, [tab, type, upcoming, past, next])

  const typeMeta = (k) => types.find((x) => x.key === k)

  return (
    <>
      <Seo
        title="Events | Viverst Global Limited"
        description="Field days, workshops, briefings and masterclasses from Viverst Global Limited, Viverst Agro and Viverst Studio in Lagos and online."
        path="/events"
      />

      <header className="page-hero page-hero--short">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">Events</p>
            <h1>Come and see the work.</h1>
            <p className="lede">Webinars, workshops, briefings.</p>
          </Reveal>
        </div>
      </header>

      {/* ── the next one up ── */}
      {next && (
        <section className="section--tight">
          <div className="container">
            <Reveal>
              <Float distance={-7} duration={9}>
                <div className={`next-event brand--${next.brand} ${next.image ? 'has-flyer' : ''}`}>
                  <span className="next-event-glow drift" aria-hidden="true" />
                  <span className="next-event-ring spin-slow" aria-hidden="true" />

                  {next.image && (
                    <Link to={`/events/${next.slug}`} className="next-event-flyer" aria-label={`${next.title}: event details and flyer`}>
                      <img src={next.image} alt="" width="1200" height="1200" decoding="async" />
                    </Link>
                  )}

                  <div className="next-event-date">
                    <strong>{dayNumber(next.startsAt)}</strong>
                    <span>{monthShort(next.startsAt)}</span>
                    <em>{yearOf(next.startsAt)}</em>
                  </div>

                  <div className="next-event-body">
                    <span className="chip chip--next">
                      <span className="livedot" aria-hidden="true" /> Next up
                    </span>
                    <h2>{next.title}</h2>
                    <p>{next.excerpt}</p>
                    <div className="event-facts">
                      <span><MapPin size={14} aria-hidden="true" /> {next.city ? `${next.venue}, ${next.city}` : next.venue}</span>
                      <span><Clock size={14} aria-hidden="true" /> {formatTimeRange(next.startsAt, next.endsAt)}</span>
                      {next.capacity ? <span><Users size={14} aria-hidden="true" /> {next.capacity} places</span> : null}
                    </div>
                    <Countdown iso={next.startsAt} />
                  </div>

                  <div className="next-event-actions">
                    {next.registration?.whatsappUrl && (
                      <Magnetic>
                        <Link className="btn btn--primary" to={`/events/${next.slug}#register`}>
                          Register <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                      </Magnetic>
                    )}
                    <Magnetic>
                      <Link className={`btn ${next.registration?.whatsappUrl ? '' : 'btn--primary'}`} to={`/events/${next.slug}`}>
                        Details <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    </Magnetic>
                  </div>
                </div>
              </Float>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── tabs + filters ── */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="tabs" role="tablist" aria-label="Upcoming or past events">
              {['upcoming', 'past'].map((k) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k}
                        className={`tab ${tab === k ? 'is-on' : ''}`} onClick={() => setTab(k)}>
                  {tab === k && (
                    <motion.span layoutId="event-tab" className="tab-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                  <span className="tab-text">
                    {k === 'upcoming' ? 'Upcoming' : 'Past'}
                    <span className="tab-count">{k === 'upcoming' ? Math.max(upcoming.length - 1, 0) : past.length}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="filters" role="tablist" aria-label="Filter events by type">
              {types.map((c) => (
                <button key={c.key} type="button" role="tab" aria-selected={type === c.key}
                        className={`filter ${type === c.key ? 'is-on' : ''}`} onClick={() => setType(c.key)}>
                  {type === c.key && (
                    <motion.span layoutId="event-filter" className="filter-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                  <span className="filter-text">
                    {c.icon && <Icon name={c.icon} size={13} />} {c.label}
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          <motion.div layout className="grid grid--3">
            <AnimatePresence mode="popLayout">
              {shown.map((e, i) => (
                <motion.div key={e.slug} layout
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.42, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}>
                  <Float delay={i * 0.6} duration={7.5 + (i % 3) * 0.8} distance={-7}>
                    <Tilt max={5}>
                      <Link to={`/events/${e.slug}`}
                            className={`event-card sheen-host brand--${e.brand} ${tab === 'past' ? 'is-past' : ''}`}
                            style={{ '--sheen-delay': `${i * 1.3}s` }}>
                        <div className="event-date">
                          <strong>{dayNumber(e.startsAt)}</strong>
                          <span>{monthShort(e.startsAt)}</span>
                        </div>
                        <div className="event-main">
                          <span className="chip chip--type">
                            {typeMeta(e.type)?.icon && <Icon name={typeMeta(e.type).icon} size={12} />}
                            {typeMeta(e.type)?.label ?? e.type}
                            <span className={`mode mode--${e.mode}`}>{e.mode}</span>
                          </span>
                          <h3>{e.title}</h3>
                          <p>{e.excerpt}</p>
                          <span className="event-foot">
                            <MapPin size={13} aria-hidden="true" /> {e.city || e.venue}
                            <ArrowUpRight className="post-arrow" size={15} aria-hidden="true" />
                          </span>
                        </div>
                      </Link>
                    </Tilt>
                  </Float>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {shown.length === 0 && (
            <motion.p className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {tab === 'upcoming' ? 'Nothing scheduled under that yet.' : 'No past events of that type.'}
            </motion.p>
          )}
        </div>
      </section>
    </>
  )
}
