import { useEffect, useState } from 'react'
import { Blocks, Float, Icon, Magnetic } from '@viverst/ui'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, MapPin, Clock, Users, Calendar } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import NotFound from './NotFound.jsx'
import { getEvent, getEventTypes, isUpcoming } from '../lib/cms.js'
import { formatDate, formatTimeRange, dayNumber, monthShort, yearOf } from '../lib/format.js'
import RegisterForm from '../components/RegisterForm.jsx'
import './Content.css'

const SITE = 'https://www.viverst.com'

function scrollToRegister() {
  document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function EventDetail() {
  const { slug } = useParams()
  const { hash } = useLocation()
  // derived, not set inside the effect
  const [data, setData] = useState({ slug: null, event: null })
  const loading = data.slug !== slug
  const types = getEventTypes()

  useEffect(() => {
    let alive = true
    getEvent(slug)
      .then((event) => { if (alive) setData({ slug, event: event ?? null }) })
      .catch(() => { if (alive) setData({ slug, event: null }) })
    return () => { alive = false }
  }, [slug])

  // Arriving from the events page's Register button (/events/:slug#register):
  // wait for the page to load and the route cross-fade to settle, then scroll.
  const loaded = data.slug === slug && Boolean(data.event)
  useEffect(() => {
    if (!loaded || hash !== '#register') return undefined
    const id = setTimeout(scrollToRegister, 450)
    return () => clearTimeout(id)
  }, [loaded, hash])

  if (loading) return <div className="article-loading" aria-busy="true" />
  if (!data.event) return <NotFound />

  const e = data.event
  const upcoming = isUpcoming(e)
  const meta = types.find((t) => t.key === e.type)
  const canRegister = upcoming && Boolean(e.registration?.whatsappUrl)
  const imageUrl = e.image ? new URL(e.image, SITE).href : undefined

  // endsAt, city and capacity are optional: a missing one is left out
  // rather than rendering "undefined".
  const facts = [
    { icon: Calendar, label: 'Date', value: formatDate(e.startsAt) },
    { icon: Clock, label: 'Time', value: formatTimeRange(e.startsAt, e.endsAt) },
    { icon: MapPin, label: 'Location', value: e.city ? `${e.venue}, ${e.city}` : e.venue },
    e.capacity ? { icon: Users, label: 'Capacity', value: `${e.capacity} places` } : null,
  ].filter(Boolean)

  return (
    <div className={`event-page brand--${e.brand}`}>
      <Seo
        title={`${e.title} | Viverst Global Limited`}
        description={e.excerpt}
        path={`/events/${e.slug}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: e.title,
          description: e.excerpt,
          startDate: e.startsAt,
          ...(e.endsAt ? { endDate: e.endsAt } : {}),
          ...(imageUrl ? { image: [imageUrl] } : {}),
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode:
            e.mode === 'online'
              ? 'https://schema.org/OnlineEventAttendanceMode'
              : e.mode === 'hybrid'
                ? 'https://schema.org/MixedEventAttendanceMode'
                : 'https://schema.org/OfflineEventAttendanceMode',
          location:
            e.mode === 'online'
              ? { '@type': 'VirtualLocation', url: `${SITE}/events/${e.slug}` }
              : { '@type': 'Place', name: e.venue, address: { '@type': 'PostalAddress', addressLocality: e.city } },
          organizer: { '@type': 'Organization', name: 'Viverst Global Limited', url: 'https://www.viverst.com/' },
          ...(e.capacity ? { maximumAttendeeCapacity: e.capacity } : {}),
        }}
      />

      <header className="event-hero">
        <span className="event-hero-glow drift" aria-hidden="true" />
        <span className="event-hero-ring spin-slow" aria-hidden="true" />

        <div className="container event-hero-inner">
          <Reveal>
            <Link to="/events" className="sub-back">
              <ArrowLeft size={15} aria-hidden="true" /> Events
            </Link>
          </Reveal>

          <div className="event-hero-top">
            <Float distance={-6} duration={8}>
              <div className="event-bigdate">
                <strong>{dayNumber(e.startsAt)}</strong>
                <span>{monthShort(e.startsAt)}</span>
                <em>{yearOf(e.startsAt)}</em>
              </div>
            </Float>

            <div>
              <motion.span className="chip chip--type"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                {meta?.icon && <Icon name={meta.icon} size={13} />} {meta?.label ?? e.type}
                <span className={`mode mode--${e.mode}`}>{e.mode}</span>
                {!upcoming && <span className="mode mode--past">past</span>}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}>
                {e.title}
              </motion.h1>

              <motion.p className="article-excerpt"
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}>
                {e.excerpt}
              </motion.p>

              {canRegister && (
                <motion.div className="event-hero-cta"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}>
                  <Magnetic>
                    <a className="btn btn--primary event-register-btn" href="#register"
                       onClick={(ev) => { ev.preventDefault(); scrollToRegister() }}>
                      Register now <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </Magnetic>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          <div className={`grid ${facts.length === 4 ? 'grid--4' : 'grid--3'}`}>
            {facts.map((f, i) => {
              const FIcon = f.icon
              return (
                <Reveal key={f.label} delay={i * 0.06}>
                  <Float delay={i * 0.7} duration={7 + i * 0.5} distance={-6}>
                    <div className="fact-card">
                      <span className="fact-icon"><FIcon size={18} aria-hidden="true" /></span>
                      <span className="fact-label">{f.label}</span>
                      <span className="fact-value">{f.value}</span>
                    </div>
                  </Float>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section--tight">
        <div className={`container ${e.image ? 'event-content' : 'article-body'}`}>
          {e.image && (
            <Reveal className="event-flyer-wrap">
              <figure className="event-flyer">
                <img src={e.image} alt={e.imageAlt || e.title} width="1200" height="1200"
                     loading="eager" decoding="async" />
              </figure>
            </Reveal>
          )}
          <Reveal className={e.image ? 'article-body event-content-body' : undefined}>
            <Blocks blocks={e.body} />
          </Reveal>
        </div>
      </section>

      {canRegister ? (
        <section className="section--tight">
          <div className="container">
            <Reveal><RegisterForm event={e} /></Reveal>
          </div>
        </section>
      ) : (
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="sub-next">
              <div>
                <h2>{upcoming ? 'Want a place?' : 'Missed this one?'}</h2>
                <p>{upcoming ? 'Places are limited. Tell us you\u2019re coming.' : 'Tell us what you\u2019d like to see next.'}</p>
              </div>
              <div className="sub-next-actions">
                <Magnetic>
                  <Link className="btn btn--primary" to="/contact">
                    {upcoming ? 'Register interest' : 'Get in touch'} <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Magnetic><Link className="btn" to="/events">All events</Link></Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      )}
    </div>
  )
}
