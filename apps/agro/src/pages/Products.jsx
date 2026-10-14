import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye } from 'lucide-react'
import { Seo, Reveal, Float, Tilt, Magnetic, Icon } from '@viverst/ui'
import { BUSINESS, PRODUCTS as SEED_PRODUCTS, PRODUCT_CATEGORIES as SEED_CATEGORIES } from '../data/agro.js'
import { fetchAdminProducts } from '../lib/adminProducts.js'
import './Pages.css'

const ALL = 'all'

/* What we grow, process and supply. The list comes from data/agro.js; the
   admin backend will fill the same shape. While any record is flagged
   `sample`, the notice at the top says so, and it disappears on its own once
   the last flag goes. */
export default function Products() {
  /* products come from the admin; the seed list shows until they load, or if the admin is unreachable */
  const [live, setLive] = useState(null)
  useEffect(() => { let alive = true; fetchAdminProducts().then((d) => { if (alive && d.products.length) setLive(d) }).catch(() => {}); return () => { alive = false } }, [])
  const PRODUCTS = live ? live.products : SEED_PRODUCTS
  const PRODUCT_CATEGORIES = live ? live.categories : SEED_CATEGORIES
  const [cat, setCat] = useState(ALL)
  const samples = PRODUCTS.filter((p) => p.sample).length
  const shown = cat === ALL ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat)
  const label = (key) => PRODUCT_CATEGORIES.find((c) => c.key === key)?.label ?? key

  return (
    <>
      <Seo
        title="Products | Viverst Agro"
        description="Grains, processed goods, fresh produce and farm inputs from Viverst Agro — cleaned, graded and packed to move. Lagos, Nigeria."
        url={BUSINESS.site + '/products'}
        siteName={BUSINESS.name}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Viverst Agro products',
          itemListElement: PRODUCTS.map((p, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: { '@type': 'Product', name: p.name, description: p.body, category: label(p.category),
                    brand: { '@type': 'Organization', name: BUSINESS.name, url: BUSINESS.site } },
          })),
        }}
      />

      <header className="page-hero">
        <span className="field-glow field-glow--a drift" aria-hidden="true" />
        <div className="container page-hero-inner">
          <Reveal as="p" className="eyebrow">Products</Reveal>
          <Reveal as="h1" delay={0.05}>What we grow, process and supply.</Reveal>
          <Reveal as="p" className="lede" delay={0.1}>
            Cleaned, graded and packed to move. Every listing says how it comes and the smallest order we take.
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          {samples > 0 && (
            <Reveal>
              <p className="sample-note">
                <Eye size={15} aria-hidden="true" />
                Sample listings. Real products replace these as they come on.
              </p>
            </Reveal>
          )}

          {PRODUCTS.length === 0 ? (
            <Reveal>
              <Float distance={-7} duration={8.5}>
                <div className="empty-roles">
                  <span className="empty-hex" aria-hidden="true"><Icon name="package" size={26} /></span>
                  <h2>Nothing listed right now.</h2>
                  <p>Products go up here as they come on. Until then, tell us what you are looking for.</p>
                </div>
              </Float>
            </Reveal>
          ) : (
            <>
              <Reveal delay={0.05}>
                <div className="topics product-filter" role="radiogroup" aria-label="Filter by category">
                  {[{ key: ALL, label: 'All' }, ...PRODUCT_CATEGORIES].map((c) => (
                    <button type="button" key={c.key} role="radio" aria-checked={cat === c.key}
                            className={`topic ${cat === c.key ? 'is-on' : ''}`}
                            onClick={() => setCat(c.key)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </Reveal>

              <div className="products" key={cat}>
                {shown.map((p, i) => (
                  <Reveal key={p.slug} delay={(i % 3) * 0.07}>
                    <Float delay={i * 0.6} duration={7.4 + (i % 3) * 0.8} distance={-7}>
                      <Tilt max={4}>
                        <article className="product">
                          <span className="product-media">
                            <img src={p.img} alt="" width="1120" height="788" loading="lazy" decoding="async" />
                          </span>
                          <div className="product-body">
                            <span className="door-kicker"><Icon name="leaf" size={14} /> {label(p.category)}</span>
                            <h2 className="product-name">{p.name}</h2>
                            <p className="product-form">{p.form}</p>
                            <p className="product-text">{p.body}</p>
                            <div className="product-foot">
                              <span className="product-min">Min. order <b>{p.minOrder}</b></span>
                              <Link className="door-go" to="/contact">
                                Enquire <ArrowRight size={15} aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      </Tilt>
                    </Float>
                  </Reveal>
                ))}
              </div>

              <p className="visually-hidden" aria-live="polite">
                {shown.length} of {PRODUCTS.length} products shown.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <span className="cta-orb drift" aria-hidden="true" />
              <div className="cta-copy">
                <h2>Need something that is not listed?</h2>
                <p>Tell us the crop, the grade and the volume. If we can source it, we will say so.</p>
              </div>
              <div className="cta-actions">
                <Magnetic>
                  <Link className="btn btn--primary" to="/contact">
                    Contact us <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link className="btn btn--onDark" to="/solutions">
                    What we do <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
