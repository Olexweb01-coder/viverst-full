import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, Check, Phone, ShoppingBag, Wallet } from 'lucide-react'
import { Seo, Reveal, SocialIcon, whatsappUrl, whatsappMessage } from '@viverst/ui'
import { getProducts } from '../lib/catalog.js'
import { money } from '../lib/format.js'
import { useCart } from '../lib/cartContext.js'
import { SHOP } from '../lib/config.js'
import { foodPackage } from '../lib/foodPackage.js'

/* A package linked to a real, in-stock shop product is bought online: Buy now
   goes to the checkout, and the order is paid through Paystack and lands in
   Orders. WhatsApp is then only for paying in instalments. A package that
   cannot be bought online (checkout off, not linked, sold out) is booked on
   WhatsApp instead, so the page never leads nowhere. */
export default function FoodPackage({ shopName, settings = {} }) {
  const fp = foodPackage(settings.food_package)
  const { add } = useCart()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  useEffect(() => {
    if (!fp.checkout) return
    let alive = true
    getProducts().then((list) => { if (alive) setProducts(list) }).catch(() => {})
    return () => { alive = false }
  }, [fp.checkout])

  const whatsapp = settings.contact?.whatsapp || SHOP.whatsapp
  const phone = settings.contact?.phone || SHOP.phone
  const business = settings.shop?.name || SHOP.name
  const book = (say) => whatsappUrl(whatsapp, whatsappMessage({ business, site: SHOP.url, say }))
  const forSale = (slug) => fp.checkout && slug
    ? products.find((p) => p.slug === slug && !p.sample && p.inStock) || null
    : null
  const soldOut = (slug) => fp.checkout && slug && products.some((p) => p.slug === slug && !p.sample && !p.inStock)
  const anyForSale = fp.packages.some((p) => forSale(p.product_slug))

  return (
    <>
      <Seo title={`${fp.title} | ${shopName}`}
           description={`${fp.packages.map((p) => `${p.name} ${money(p.price_kobo)}`).join(', ')}. ${fp.instalment ? 'Instalment payment available. ' : ''}Book on WhatsApp.`} />

      <section className="section fp-hero">
        <div className="container fp-hero-inner">
          <Reveal className="fp-hero-copy">
            <span className="eyebrow">Viverst Agro · {fp.short}</span>
            <h1>{fp.title}</h1>
            <p className="lede">{fp.intro}</p>
            {fp.instalment && <p className="fp-instalment"><Wallet size={17} aria-hidden="true" /> {fp.instalment_note}</p>}
            <div className="fp-hero-cta">
              {anyForSale ? (
                <a className="btn btn--primary" href="#fp-packages">Choose a package <ArrowDown size={16} aria-hidden="true" /></a>
              ) : (
                <a className="btn btn--primary" href={book(`I would like to book from the ${fp.title}. Which package is right for me?`)}
                   target="_blank" rel="noopener noreferrer">
                  <SocialIcon name="whatsapp" size={17} /> Book on WhatsApp
                </a>
              )}
              <a className="btn" href={`tel:${phone.replace(/[^\d+]/g, '')}`}><Phone size={16} aria-hidden="true" /> Call {phone}</a>
            </div>
            {fp.season_note && <p className="fp-season">{fp.season_note}</p>}
          </Reveal>
          <Reveal className="fp-flyer" delay={0.08}>
            <img src={fp.image} alt={fp.image_alt} width="1200" height="1200" fetchPriority="high" decoding="async" />
          </Reveal>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="fp-packages">
        <div className="container">
          <Reveal className="shop-section-head"><div><span className="eyebrow">Choose a package</span><h2 id="fp-packages">What’s in each box</h2></div></Reveal>
          <div className="fp-grid">
            {fp.packages.map((p, i) => {
              const product = forSale(p.product_slug)
              const price = product ? product.price_kobo : p.price_kobo
              return (
                <Reveal key={p.name} delay={i * 0.06} className="fp-card">
                  <h3>{p.name}</h3>
                  <p className="fp-price">{money(price)}</p>
                  {p.items.length > 0 && (
                    <ul className="fp-items">{p.items.map((x) => <li key={x}><Check size={16} aria-hidden="true" /> {x}</li>)}</ul>
                  )}
                  {product ? (
                    <div className="fp-actions">
                      <button type="button" className="btn btn--primary" aria-label={`Buy the ${p.name} now`}
                              onClick={() => { add(product, 1); navigate('/checkout') }}>
                        <ShoppingBag size={16} aria-hidden="true" /> Buy now
                      </button>
                      {fp.instalment && (
                        <a className="btn fp-instalment-link" target="_blank" rel="noopener noreferrer"
                           aria-label={`Pay for the ${p.name} in instalments: chat on WhatsApp`}
                           href={book(`I would like to buy the ${p.name} (${money(price)}) from the ${fp.title} and pay in instalments. Please tell me how it works.`)}>
                          <SocialIcon name="whatsapp" size={16} /> Want to pay in instalments? Chat on WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="fp-actions">
                      {soldOut(p.product_slug) && <p className="fp-soldout">Sold out online for now. Book on WhatsApp and we will tell you when it is back.</p>}
                      <a className="btn btn--primary" target="_blank" rel="noopener noreferrer"
                         aria-label={`Book the ${p.name} on WhatsApp`}
                         href={book(`I would like to book the ${p.name} (${money(price)}) from the ${fp.title}. ${fp.instalment ? 'Please tell me how to pay, including paying in instalments.' : 'Please tell me how to pay.'}`)}>
                        <SocialIcon name="whatsapp" size={16} /> Book on WhatsApp
                      </a>
                    </div>
                  )}
                </Reveal>
              )
            })}
          </div>
          <p className="fp-contact">
            Questions first? Call or WhatsApp <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>, or <Link to="/products">browse the shop</Link>.
          </p>
        </div>
      </section>
    </>
  )
}
