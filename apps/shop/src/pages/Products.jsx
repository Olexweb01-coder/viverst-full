import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Seo, Reveal } from '@viverst/ui'
import { getProducts } from '../lib/catalog.js'
import ProductCard from '../components/ProductCard.jsx'

export default function Products({ shopName }) {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [params, setParams] = useSearchParams()
  const cat = params.get('c') || 'all'
  useEffect(() => { getProducts().then(setProducts).catch((e) => setError(e.message)) }, [])
  const cats = []
  for (const p of products || []) if (p.category && !cats.some((c) => c.slug === p.category.slug)) cats.push(p.category)
  const shown = (products || []).filter((p) => cat === 'all' || p.category?.slug === cat)
  return (
    <>
      <Seo title={`Products | ${shopName}`} description="All products from Viverst Agro: grains, flour, oil, inputs." />
      <section className="section shop-page">
        <div className="container">
          <Reveal><span className="eyebrow">Products</span><h1>Everything we sell.</h1></Reveal>
          {error && <p className="shop-error">We couldn’t load products right now. Please refresh.</p>}
          {cats.length > 1 && (
            <div className="shop-filters" role="group" aria-label="Category">
              <button type="button" className={cat === 'all' ? 'active' : ''} onClick={() => setParams({})}>All</button>
              {cats.map((c) => <button key={c.slug} type="button" className={cat === c.slug ? 'active' : ''} onClick={() => setParams({ c: c.slug })}>{c.name}</button>)}
            </div>)}
          {products && shown.length === 0 && <p className="shop-empty">Nothing in this category yet.</p>}
          <div className="pgrid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </div>
      </section>
    </>
  )
}
