import { useEffect, useMemo, useState } from 'react'
import { Float, Icon, Tilt } from '@viverst/ui'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import { getPosts, getCategories } from '../lib/cms.js'
import { formatDate } from '../lib/format.js'
import './Content.css'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [active, setActive] = useState('all')
  const categories = getCategories()

  useEffect(() => {
    let alive = true
    getPosts().then((p) => { if (alive) setPosts(p) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const featured = useMemo(() => posts.find((p) => p.featured) ?? posts[0], [posts])
  const list = useMemo(() => {
    const rest = posts.filter((p) => p.slug !== featured?.slug)
    return active === 'all' ? rest : rest.filter((p) => p.category === active)
  }, [posts, active, featured])

  const labelOf = (key) => categories.find((c) => c.key === key)?.label ?? key
  const iconOf = (key) => categories.find((c) => c.key === key)?.icon ?? 'sparkles'

  return (
    <>
      <Seo
        title="Blog | Viverst Global Limited"
        description="Writing from Viverst Global Limited on brand architecture, governance, agricultural technology and design."
        path="/blog"
      />

      <header className="page-hero page-hero--short">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">Blog</p>
            <h1>What we&rsquo;re thinking about.</h1>
            <p className="lede">Notes from across the group. Short, and only when there&rsquo;s something to say.</p>
          </Reveal>
        </div>
      </header>

      {/* ── featured ── */}
      {featured && (
        <section className="section--tight">
          <div className="container">
            <Reveal>
              <Float distance={-7} duration={9}>
                <Link to={`/blog/${featured.slug}`} className={`feature-card cat--${featured.category}`}>
                  <span className="feature-glow drift" aria-hidden="true" />
                  <span className="feature-ring spin-slow" aria-hidden="true" />
                  <div className="feature-body">
                    <span className="chip chip--cat">
                      <Icon name={iconOf(featured.category)} size={13} /> {labelOf(featured.category)}
                    </span>
                    <h2>{featured.title}</h2>
                    <p>{featured.excerpt}</p>
                    <span className="feature-meta">
                      {formatDate(featured.publishedAt)}
                      <span className="dot-sep" aria-hidden="true" />
                      <Clock size={13} aria-hidden="true" /> {featured.readMinutes} min
                    </span>
                  </div>
                  <span className="feature-arrow"><ArrowUpRight size={22} aria-hidden="true" /></span>
                </Link>
              </Float>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── filter + grid ── */}
      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="filters" role="tablist" aria-label="Filter posts by category">
              {categories.map((c) => (
                <button key={c.key} type="button" role="tab" aria-selected={active === c.key}
                        className={`filter ${active === c.key ? 'is-on' : ''}`}
                        onClick={() => setActive(c.key)}>
                  {active === c.key && (
                    <motion.span layoutId="blog-filter" className="filter-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                  <span className="filter-text">
                    {c.icon && <Icon name={c.icon} size={13} />} {c.label}
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          <motion.div layout className="grid grid--3 post-grid">
            <AnimatePresence mode="popLayout">
              {list.map((p, i) => (
                <motion.div key={p.slug} layout
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.42, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}>
                  <Float delay={i * 0.6} duration={7.5 + (i % 3) * 0.8} distance={-7}>
                    <Tilt max={5}>
                      <Link to={`/blog/${p.slug}`} className={`post-card sheen-host cat--${p.category}`}
                            style={{ '--sheen-delay': `${i * 1.3}s` }}>
                        <span className="post-band" aria-hidden="true" />
                        <span className="chip chip--cat">
                          <Icon name={iconOf(p.category)} size={13} /> {labelOf(p.category)}
                        </span>
                        <h3>{p.title}</h3>
                        <p>{p.excerpt}</p>
                        <span className="post-meta">
                          {formatDate(p.publishedAt, { month: 'short' })}
                          <span className="dot-sep" aria-hidden="true" />
                          {p.readMinutes} min
                          <ArrowUpRight className="post-arrow" size={15} aria-hidden="true" />
                        </span>
                      </Link>
                    </Tilt>
                  </Float>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {list.length === 0 && (
            <motion.p className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Nothing filed under that yet.
            </motion.p>
          )}
        </div>
      </section>
    </>
  )
}
