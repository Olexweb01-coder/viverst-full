import { Link } from 'react-router-dom'
import { ArrowRight, Trash2, Minus, Plus } from 'lucide-react'
import { Seo } from '@viverst/ui'
import { money } from '../lib/format.js'
import { useCart } from '../lib/cartContext.js'

export default function Cart({ shopName, delivery }) {
  const { items, subtotal, setQty, remove } = useCart()
  const fee = Number(delivery?.flat_fee_kobo) || 0
  return (
    <section className="section shop-page">
      <Seo title={`Cart | ${shopName}`} description="Your cart." />
      <div className="container cart-page">
        <h1>Your cart</h1>
        {items.length === 0 ? (
          <div className="cart-empty"><p className="lede">Nothing in it yet.</p><Link to="/products" className="btn btn--primary">Shop products <ArrowRight size={16} aria-hidden="true" /></Link></div>
        ) : (
          <div className="cart-grid">
            <ul className="cart-list">{items.map((it) => (
              <li key={it.id} className="cart-item">
                <Link to={`/products/${it.slug}`} className="cart-item-media">{it.image ? <img src={it.image} alt="" width="200" height="140" /> : <span className="pcard-noimg" />}</Link>
                <div className="cart-item-body">
                  <Link to={`/products/${it.slug}`}><strong>{it.name}</strong></Link>
                  <div className="muted small">{it.unit} · {money(it.price_kobo)} each</div>
                  <div className="cart-item-row">
                    <div className="qty" role="group" aria-label={`Quantity of ${it.name}`}>
                      <button type="button" onClick={() => setQty(it.id, it.qty - 1)} aria-label="Fewer"><Minus size={14} /></button>
                      <input type="number" min="1" max="99" value={it.qty} onChange={(e) => setQty(it.id, Number(e.target.value) || 1)} aria-label="Quantity" />
                      <button type="button" onClick={() => setQty(it.id, it.qty + 1)} aria-label="More"><Plus size={14} /></button>
                    </div>
                    <strong className="cart-line">{money(it.qty * it.price_kobo)}</strong>
                    <button type="button" className="cart-remove" onClick={() => remove(it.id)} aria-label={`Remove ${it.name}`}><Trash2 size={16} /></button>
                  </div>
                </div>
              </li>))}</ul>
            <aside className="cart-summary">
              <h2>Summary</h2>
              <div className="cart-sum-row"><span>Items</span><span>{money(subtotal)}</span></div>
              <div className="cart-sum-row"><span>Delivery</span><span>{fee ? money(fee) : 'Confirmed by phone'}</span></div>
              <div className="cart-sum-row cart-sum-total"><span>Total</span><span>{money(subtotal + fee)}</span></div>
              {delivery?.note && <p className="small muted">{delivery.note}</p>}
              <Link to="/checkout" className="btn btn--primary btn--block">Checkout <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to="/products" className="cart-continue">Keep shopping</Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
