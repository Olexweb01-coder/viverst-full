import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, CreditCard, Lock } from 'lucide-react'
import { Seo } from '@viverst/ui'
import { supabase } from '../lib/supabase.js'
import { money } from '../lib/format.js'
import { useCart } from '../lib/cartContext.js'

const STATES = ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Kogi', 'Edo', 'Delta', 'Rivers', 'Bayelsa', 'Akwa Ibom', 'Cross River', 'Abia', 'Imo', 'Anambra', 'Enugu', 'Ebonyi', 'Benue', 'Nasarawa', 'Plateau', 'FCT', 'Niger', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Jigawa', 'Bauchi', 'Gombe', 'Yobe', 'Borno', 'Adamawa', 'Taraba']

export default function Checkout({ shopName, settings }) {
  const nav = useNavigate()
  const { items, subtotal, clear } = useCart()
  const [f, setF] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', state: 'Lagos', note: '' })
  const [payChoice, setPay] = useState('transfer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const paystackOn = !!settings?.payments?.paystack?.enabled
  const transferOn = settings?.payments?.transfer?.enabled !== false
  const fee = Number(settings?.delivery?.flat_fee_kobo) || 0
  const hasSample = items.some((i) => String(i.id).startsWith('seed-'))
  const pay = paystackOn ? payChoice : 'transfer'   // card can only be chosen while Paystack is on

  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!items.length) return
    setBusy(true); setError('')
    const { data, error } = await supabase.rpc('place_order', {
      p_items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
      p_contact: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() },
      p_address: { name: f.name.trim(), phone: f.phone.trim(), line1: f.line1.trim(), line2: f.line2.trim(), city: f.city.trim(), state: f.state },
      p_payment_method: pay, p_note: f.note.trim(),
    })
    setBusy(false)
    if (error) { setError(friendly(error.message)); return }
    try { window.sessionStorage.setItem('viverst-shop:last-order', JSON.stringify({ ...data, email: f.email.trim(), pay, items, subtotal, fee })) } catch { /* ignore */ }
    clear()
    nav(`/order/${data.number}`, { replace: true, state: { ...data, email: f.email.trim(), pay, items, subtotal, fee } })
  }

  if (items.length === 0) return (
    <section className="section shop-page"><div className="container"><Seo title={`Checkout | ${shopName}`} description="" /><h1>Your cart is empty.</h1><Link to="/products" className="btn btn--primary">Shop products</Link></div></section>)

  return (
    <section className="section shop-page">
      <Seo title={`Checkout | ${shopName}`} description="Checkout" />
      <div className="container">
        <Link to="/cart" className="product-back"><ArrowLeft size={14} aria-hidden="true" /> Back to cart</Link>
        <h1>Checkout</h1>
        {hasSample && <p className="shop-error">The sample products are for display only. Real products will be available to order very soon.</p>}
        <form className="checkout" onSubmit={submit}>
          <div className="checkout-form">
            <fieldset><legend>Your details</legend>
              <label>Full name<input className="input" required autoComplete="name" value={f.name} onChange={set('name')} /></label>
              <div className="row2">
                <label>Phone<input className="input" required type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="0801 234 5678" /></label>
                <label>Email<input className="input" required type="email" autoComplete="email" value={f.email} onChange={set('email')} /></label>
              </div>
            </fieldset>
            <fieldset><legend>Deliver to</legend>
              <label>Street address<input className="input" required autoComplete="address-line1" value={f.line1} onChange={set('line1')} /></label>
              <label>Landmark or extra directions <span className="muted">(optional)</span><input className="input" autoComplete="address-line2" value={f.line2} onChange={set('line2')} /></label>
              <div className="row2">
                <label>Town or area<input className="input" required autoComplete="address-level2" value={f.city} onChange={set('city')} /></label>
                <label>State<select className="input" value={f.state} onChange={set('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
              </div>
              <label>Note for us <span className="muted">(optional)</span><textarea className="input" rows="2" value={f.note} onChange={set('note')} placeholder="Best time to deliver, gate instructions…" /></label>
            </fieldset>
            <fieldset><legend>How you’ll pay</legend>
              <div className="pay-options">
                {transferOn && <label className={`pay-opt${pay === 'transfer' ? ' active' : ''}`}><input type="radio" name="pay" value="transfer" checked={pay === 'transfer'} onChange={() => setPay('transfer')} /><Building2 size={20} aria-hidden="true" /><span><strong>Bank transfer</strong><small>We show you the account details after you order.</small></span></label>}
                <label className={`pay-opt${pay === 'paystack' ? ' active' : ''}${paystackOn ? '' : ' disabled'}`}><input type="radio" name="pay" value="paystack" disabled={!paystackOn} checked={pay === 'paystack'} onChange={() => setPay('paystack')} /><CreditCard size={20} aria-hidden="true" /><span><strong>Card, bank or USSD</strong><small>{paystackOn ? 'Secure payment through Paystack.' : 'Coming soon.'}</small></span></label>
              </div>
            </fieldset>
            {error && <p className="shop-error" role="alert">{error}</p>}
          </div>
          <aside className="cart-summary checkout-summary">
            <h2>Your order</h2>
            <ul className="checkout-items">{items.map((i) => <li key={i.id}><span>{i.qty} × {i.name}<small>{i.unit}</small></span><span>{money(i.qty * i.price_kobo)}</span></li>)}</ul>
            <div className="cart-sum-row"><span>Items</span><span>{money(subtotal)}</span></div>
            <div className="cart-sum-row"><span>Delivery</span><span>{fee ? money(fee) : 'Confirmed by phone'}</span></div>
            <div className="cart-sum-row cart-sum-total"><span>Total</span><span>{money(subtotal + fee)}</span></div>
            <button type="submit" className="btn btn--primary btn--block" disabled={busy || hasSample}><Lock size={15} aria-hidden="true" /> {busy ? 'Placing order…' : 'Place order'}</button>
            <p className="small muted">Prices are confirmed by our system when you place the order. We call before delivery.</p>
          </aside>
        </form>
      </div>
    </section>
  )
}

function friendly(msg) {
  if (/out of stock/i.test(msg)) return 'One of the items just sold out. Remove it from the cart and try again.'
  if (/unavailable/i.test(msg)) return 'One of the items is no longer available. Remove it and try again.'
  if (/card payment is not enabled/i.test(msg)) return 'Card payment isn’t available yet. Please choose bank transfer.'
  if (/required|incomplete/i.test(msg)) return msg
  return `We couldn’t place the order (${msg}). Please try again or email us.`
}
