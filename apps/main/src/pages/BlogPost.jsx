import { useEffect, useState } from 'react'
import { Blocks, Float, Icon } from '@viverst/ui'
import { Link, useParams } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Clock, Calendar } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import NotFound from './NotFound.jsx'
import { getPost, getRelatedPosts, getCategories } from '../lib/cms.js'
import { formatDate } from '../lib/format.js'
import './Content.css'

export default function BlogPost() {
  const { slug } = useParams()
  // `loading` is derived from which slug is currently loaded, so nothing is
  // set synchronously inside the effect below.
  const [data, setData] = useState({ slug: null, post: null, related: [] })
  const loading = data.slug !== slug
  const categories = getCategories()

  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    let alive = true
    getPost(slug)
      .then(async (post) => {
        if (!alive) return
        const related = post ? await getRelatedPosts(post) : []
        if (alive) setData({ slug, post, related })
      })
      .catch(() => { if (alive) setData({ slug, post: null, related: [] }) })
    return () => { alive = false }
  }, [slug])

  if (loading) return <div className="article-loading" aria-busy="true" />
  if (!data.post) return <NotFound />

  const post = data.post
  const cat = categories.find((c) => c.key === post.category)

  return (
    <>
      <Seo
        title={`${post.title} | Viverst Global Limited`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt,
          author: { '@type': 'Organization', name: post.author?.name ?? 'Viverst Global Limited' },
          publisher: { '@type': 'Organization', name: 'Viverst Global Limited', url: 'https://www.viverst.com/' },
          mainEntityOfPage: `https://www.viverst.com/blog/${post.slug}`,
          keywords: (post.tags ?? []).join(', '),
        }}
      />

      {/* reading progress */}
      <motion.div className="read-progress" style={{ scaleX: bar }} aria-hidden="true" />

      <article className={`article cat--${post.category}`}>
        <header className="article-hero">
          <span className="article-glow drift" aria-hidden="true" />
          <div className="container article-head">
            <Reveal>
              <Link to="/blog" className="sub-back">
                <ArrowLeft size={15} aria-hidden="true" /> Journal
              </Link>
            </Reveal>

            <motion.span className="chip chip--cat"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              {cat?.icon && <Icon name={cat.icon} size={13} />} {cat?.label ?? post.category}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}>
              {post.title}
            </motion.h1>

            <motion.p className="article-excerpt"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}>
              {post.excerpt}
            </motion.p>

            <motion.div className="article-meta"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.26 }}>
              <span><Calendar size={14} aria-hidden="true" /> {formatDate(post.publishedAt)}</span>
              <span className="dot-sep" aria-hidden="true" />
              <span><Clock size={14} aria-hidden="true" /> {post.readMinutes} min read</span>
              {post.author && (
                <>
                  <span className="dot-sep" aria-hidden="true" />
                  <span>{post.author.name} &middot; {post.author.role}</span>
                </>
              )}
            </motion.div>
          </div>
        </header>

        <div className="container article-body">
          <Reveal><Blocks blocks={post.body} /></Reveal>

          {post.tags?.length > 0 && (
            <Reveal delay={0.05}>
              <div className="tags">
                {post.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}
              </div>
            </Reveal>
          )}
        </div>
      </article>

      {data.related.length > 0 && (
        <section className="section--tight">
          <div className="container">
            <Reveal>
              <p className="eyebrow">Keep reading</p>
              <h2 className="page-title">More from the journal.</h2>
            </Reveal>
            <div className="grid grid--3">
              {data.related.map((r, i) => (
                <Reveal key={r.slug} delay={i * 0.07}>
                  <Float delay={i * 0.7} duration={7.5 + i * 0.6} distance={-7}>
                    <Link to={`/blog/${r.slug}`} className={`post-card cat--${r.category}`}>
                      <span className="post-band" aria-hidden="true" />
                      <h3>{r.title}</h3>
                      <p>{r.excerpt}</p>
                      <span className="post-meta">
                        {r.readMinutes} min
                        <ArrowUpRight className="post-arrow" size={15} aria-hidden="true" />
                      </span>
                    </Link>
                  </Float>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
