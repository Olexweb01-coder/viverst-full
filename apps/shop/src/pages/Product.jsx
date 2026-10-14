import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Seo } from '@viverst/ui'
import { getProduct } from '../lib/catalog.js'
import { money } from '../lib/format.js'
import { useCart } from '../lib/cartContext.js'

export default function Product({ shopName }) {
  const { slug } = useParams()
  return <ProductView key={slug} slug={slug} shopName={shopName} />
}

function ProductView({ slug, shopName }) {
  const { add } = useCart()
  const [p, setP] = useState(undefined)
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const [added, setAdded] = useState(false)
  useEffect(() => { let alive = true; getProduct(slug).then((x) => alive && setP(x)).catch(() => alive && setP(null)); return () => { alive = false } }, [slug])
  useEffect(() => { if (!added) return; const t = setTimeout(() => setAdded(false), 2500); return () => clearTimeout(t) }, [added])

  if (p === undefined) return <section className="section shop-page"><div className="container"><p className="muted">Loading…</p></div></section>
  if (p === null) return (
    <section className="section shop-page"><div className="container">
      <Seo title={`Not found | ${shopName}`} description="" />
      <h1>We don’t have that one.</h1><p className="lede">It may have been removed or renamed.</p><Link className="btn" to="/products"><ArrowLeft size={16} aria-hidden="true" /> All products</Link>
    </div></section>)

  const paras = String(p.description || '').split(/\n{2,}/).filter(Boolean)
  return (
    <section className="section shop-page">
      <Seo title={`${p.name} | ${shopName}`} description={p.summary || `${p.name}, ${p.unit}, from Viverst Agro.`} />
      <div className="container product-page">
        <div className="product-gallery">
          <div className="product-main">{p.gallery[img] ? <img src={p.gallery[img]} alt={p.name} width="1120" height="788" decoding="async" /> : <span className="pcard-noimg" aria-hidden="true" />}</div>
          {p.gallery.length > 1 && <div className="product-thumbs">{p.gallery.map((u, i) => <button key={u} type="button" className={i === img ? 'active' : ''} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}><img src={u} alt="" width="100" height="70" /></button>)}</div>}
        </div>
        <div className="product-info">
          <Link to="/products" className="product-back"><ArrowLeft size={14} aria-hidden="true" /> All products</Link>
          {p.category?.name && <span className="eyebrow">{p.category.name}</span>}
          <h1>{p.name}</h1>
          <p className="product-unit">Sold as <strong>{p.unit}</strong></p>
          <p className="product-price">{money(p.price_kobo)}{p.compare_at_kobo > p.price_kobo && <s>{money(p.compare_at_kobo)}</s>}</p>
          {p.summary && <p className="lede">{p.summary}</p>}
          {p.inStock ? (
            <div className="product-buy">
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer"><Minus size={14} /></button>
                <input type="number" min="1" max="99" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} aria-label="Quantity" />
                <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="More"><Plus size={14} /></button>
              </div>
              <button type="button" className="btn btn--primary" onClick={() => { add(p, qty); setAdded(true) }}><ShoppingBag size={16} aria-hidden="true" /> {added ? 'Added to cart' : 'Add to cart'}</button>
              {added && <Link to="/cart" className="btn">View cart</Link>}
            </div>
          ) : <p className="product-out">Sold out for now. Check back soon or <a href="mailto:agro@viverst.com">ask us when it’s in</a>.</p>}
          {p.available < 10 && p.inStock && <p className="product-low">Only {p.available} left.</p>}
          {paras.length > 0 && <div className="product-desc">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>}
        </div>
      </div>
    </section>
  )
}
