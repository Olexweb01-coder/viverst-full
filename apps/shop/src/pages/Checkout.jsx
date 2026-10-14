import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, CreditCard, Lock } from 'lucide-react'
import { Seo } from '@viverst/ui'
import { supabase } from '../lib/supabase.js'
import { money } from '../lib/format.js'
import { useCart } from '../lib/cartContext.js'
import { redirectTo } from '../lib/redirect.js'
import { deliveryFee, zoned } from '../lib/delivery.js'
import { useAuth } from '../lib/authContext.js'

const STATES = ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Kogi', 'Edo', 'Delta', 'Rivers', 'Bayelsa', 'Akwa Ibom', 'Cross River', 'Abia', 'Imo', 'Anambra', 'Enugu', 'Ebonyi', 'Benue', 'Nasarawa', 'Plateau', 'FCT', 'Niger', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Jigawa', 'Bauchi', 'Gombe', 'Yobe', 'Borno', 'Adamawa', 'Taraba']

export default function Checkout({ shopName, settings }) {
  const nav = useNavigate()
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const [f, setF] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', area: '', state: 'Lagos', note: '' })
  const [payChoice, setPay] = useState('transfer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const paystackOn = !!settings?.payments?.paystack?.enabled
  const transferOn = settings?.payments?.transfer?.enabled !== false
  const d = settings?.delivery
  const homeAreas = zoned(d) && f.state === d.home_state ? (d.areas || []) : []
  const needArea = homeAreas.length > 0 && !f.area
  const fee = needArea ? 0 : deliveryFee(d, f.state, f.area === '__other' ? '' : f.area)
  const pay = paystackOn ? payChoice : 'transfer'   // card can only be chosen while Paystack is on

  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }))
  // signed in: fill what we already know, once
  useEffect(() => {
    if (!user) return
    let alive = true
    ;(async () => {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from('customers').select('name, phone, email').eq('user_id', user.id).maybeSingle(),
        supabase.from('addresses').select('line1, line2, city, state').eq('customer_id', user.id).order('is_default', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (!alive) return
      setF((o) => ({ ...o, name: o.name || c?.name || '', email: o.email || c?.email || user.email || '', phone: o.phone || c?.phone || '', line1: o.line1 || a?.line1 || '', line2: o.line2 || a?.line2 || '', city: o.city || a?.city || '', state: a?.state || o.state }))
    })()
    return () => { alive = false }
  }, [user])

  async function submit(e) {
    e.preventDefault()
    if (!items.length) return
    setBusy(true); setError('')
    const { data, error } = await supabase.rpc('place_order', {
      p_items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
      p_contact: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() },
      p_address: { name: f.name.trim(), phone: f.phone.trim(), line1: f.line1.trim(), line2: f.line2.trim(), city: f.city.trim(), area: homeAreas.length && f.area !== '__other' ? f.area : '', state: f.state },
      p_payment_method: pay, p_note: f.note.trim(),
    })
    setBusy(false)
    if (error) { setError(friendly(error.message)); return }
    const summary = { ...data, email: f.email.trim(), pay, items, subtotal, fee }
    if (user) {   // remember the address for next time (best effort)
      supabase.from('addresses').upsert({ customer_id: user.id, label: 'Home', name: f.name.trim(), phone: f.phone.trim(), line1: f.line1.trim(), line2: f.line2.trim(), city: f.city.trim(), state: f.state, is_default: true }, { onConflict: 'customer_id,label' }).then(() => {})
      supabase.from('customers').update({ name: f.name.trim(), phone: f.phone.trim() }).eq('user_id', user.id).then(() => {})
    }
    try { window.sessionStorage.setItem('viverst-shop:last-order', JSON.stringify(summary)) } catch { /* ignore */ }
    clear()
    if (pay === 'paystack') {
      // the server creates the Paystack transaction; the browser only gets a page to go to
      setBusy(true)
      const { data: ps, error: psErr } = await supabase.functions.invoke('paystack/init', { body: { order_id: data.id } })
      setBusy(false)
      if (psErr || !ps?.ok) { setError(`We saved your order as ${data.number} but couldn’t start the card payment (${ps?.error || psErr?.message}). You can pay by transfer instead — we’ll call you.`); nav(`/order/${data.number}`, { replace: true, state: { ...summary, pay: 'transfer' } }); return }
      redirectTo(ps.url)
      return
    }
    nav(`/order/${data.number}`, { replace: true, state: summary })
  }

  if (items.length === 0) return (
    <section className="section shop-page"><div className="container"><Seo title={`Checkout | ${shopName}`} description="" /><h1>Your cart is empty.</h1><Link to="/products" className="btn btn--primary">Shop products</Link></div></section>)

  return (
    <section className="section shop-page">
      <Seo title={`Checkout | ${shopName}`} description="Checkout" />
      <div className="container">
        <Link to="/cart" className="product-back"><ArrowLeft size={14} aria-hidden="true" /> Back to cart</Link>
        <h1>Checkout</h1>
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
                <label>State<select className="input" value={f.state} onChange={(e) => setF((o) => ({ ...o, state: e.target.value, area: '' }))}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
              </div>
              {homeAreas.length > 0 && (
                <label>Delivery area<select className="input" required value={f.area} onChange={set('area')}>
                  <option value="" disabled>Choose your area</option>
                  {homeAreas.map((a) => <option key={a.name} value={a.name}>{a.name} — {money(a.fee_kobo)}</option>)}
                  <option value="__other">Somewhere else in {d.home_state} — {money(d.home_default_kobo)}</option>
                </select></label>
              )}
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
            <div className="cart-sum-row"><span>Delivery{zoned(d) ? ` to ${homeAreas.length && f.area && f.area !== '__other' ? f.area : f.state}` : ''}</span><span>{needArea ? 'Choose your area' : fee ? money(fee) : 'Confirmed by phone'}</span></div>
            <div className="cart-sum-row cart-sum-total"><span>Total</span><span>{money(subtotal + fee)}</span></div>
            {d?.note && <p className="small muted">{d.note}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}><Lock size={15} aria-hidden="true" /> {busy ? 'Placing order…' : 'Place order'}</button>
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
