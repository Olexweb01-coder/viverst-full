import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PhoneCall, Truck, ShoppingBag, ShieldCheck, Scale, CreditCard } from 'lucide-react'
import { Seo, Reveal } from '@viverst/ui'
import { getProducts } from '../lib/catalog.js'
import { CATEGORY_TILES } from '../lib/seed.js'
import ProductCard from '../components/ProductCard.jsx'
import hero from '@brand-assets/agro/img/chain-market.webp'
import bulk from '@brand-assets/agro/img/farm-from-above.webp'

export default function Home({ shopName, contact }) {
  const [products, setProducts] = useState(null)
  useEffect(() => { getProducts().then(setProducts) }, [])
  const featured = (products || []).filter((p) => p.featured).slice(0, 4)
  const show = featured.length ? featured : (products || []).slice(0, 4)
  return (
    <>
      <Seo title={`${shopName} | Grains, flour, oil and inputs, delivered`} description="Buy cleaned, graded produce and farm inputs from Viverst Agro. Retail quantities, delivered across Lagos and beyond." />
      <section className="shop-hero">
        <img src={hero} alt="" width="1120" height="788" fetchPriority="high" decoding="async" />
        <div className="container shop-hero-inner">
          <Reveal>
            <span className="eyebrow shop-hero-eyebrow">Viverst Agro · online shop</span>
            <h1>Good produce,<br /><em>properly packed</em>,<br />delivered to you.</h1>
            <p className="lede">Grains, flour, oil and farm inputs — cleaned, graded and sold by the bag or keg. Order online, pay by transfer or card, and we deliver.</p>
            <div className="shop-hero-cta">
              <Link to="/products" className="btn btn--primary">Shop all products <ArrowRight size={16} aria-hidden="true" /></Link>
              <a href="#how" className="btn btn--ghost">How it works</a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <Reveal className="shop-section-head"><div><span className="eyebrow">Shop by category</span><h2>What are you after?</h2></div></Reveal>
          <div className="cat-grid">{CATEGORY_TILES.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.06}><Link to={`/products?c=${c.slug}`} className="cat-tile"><img src={c.image} alt="" width="1120" height="788" loading="lazy" decoding="async" /><span className="cat-tile-text"><strong>{c.name}</strong><span>{c.blurb}</span></span></Link></Reveal>))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <Reveal className="shop-section-head"><div><span className="eyebrow">{featured.length ? 'Featured' : 'This week'}</span><h2>Popular this week</h2></div><Link to="/products" className="btn btn--sm">All products <ArrowRight size={14} aria-hidden="true" /></Link></Reveal>
          <div className="pgrid">{show.map((p, i) => <Reveal key={p.id} delay={i * 0.06}><ProductCard p={p} /></Reveal>)}</div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <Reveal className="shop-section-head"><div><span className="eyebrow">How ordering works</span><h2>Three steps, no surprises.</h2></div></Reveal>
          <div className="steps">
            {[[ShoppingBag, 'Order online', 'Add what you need to the cart and check out with your delivery address.'], [PhoneCall, 'We call to confirm', 'Within the day we confirm your order, the delivery fee and when it arrives.'], [Truck, 'Delivered and checked', 'You check the bags before you sign for them. Not right? We take it back.']].map(([I, t, b], i) => (
              <Reveal key={t} delay={i * 0.08} className="step"><span className="step-n">{i + 1}</span><I size={22} aria-hidden="true" /><h3>{t}</h3><p>{b}</p></Reveal>))}
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="container trust-inner">
          {[[ShieldCheck, 'Cleaned and graded', 'Sorted and checked before sealing.'], [Scale, 'Honest weights', 'Standard bags and kegs, filled right.'], [CreditCard, 'Pay your way', 'Bank transfer now; card and USSD via Paystack.']].map(([I, t, b]) => (
            <div key={t}><I size={20} aria-hidden="true" /><div><strong>{t}</strong><span>{b}</span></div></div>))}
        </div>
      </section>

      <section className="bulk">
        <img src={bulk} alt="" width="1120" height="788" loading="lazy" decoding="async" />
        <div className="container bulk-inner">
          <Reveal>
            <span className="eyebrow shop-hero-eyebrow">Buying in tonnes?</span>
            <h2>Bulk and trade orders are a conversation.</h2>
            <p className="lede">Processors, feed mills and traders: tell us the volume and the month, and we quote with a sample first.</p>
            <a className="btn btn--primary" href={`mailto:${contact?.email || 'agro@viverst.com'}?subject=Bulk%20order%20enquiry`}>Ask for a quote <ArrowRight size={16} aria-hidden="true" /></a>
          </Reveal>
        </div>
      </section>
    </>
  )
}
