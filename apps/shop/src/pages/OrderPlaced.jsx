import { useLocation, useParams, Link } from 'react-router-dom'
import { CheckCircle2, Copy } from 'lucide-react'
import { useState } from 'react'
import { Seo } from '@viverst/ui'
import { money } from '../lib/format.js'

export default function OrderPlaced({ shopName, settings }) {
  const { number } = useParams()
  const { state } = useLocation()
  let order = state
  if (!order) { try { const s = JSON.parse(window.sessionStorage.getItem('viverst-shop:last-order') || 'null'); if (s?.number === number) order = s } catch { /* ignore */ } }
  const bank = settings?.payments?.transfer || {}
  const [copied, setCopied] = useState('')
  const copy = async (t, k) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(''), 1500) } catch { /* ignore */ } }
  return (
    <section className="section shop-page">
      <Seo title={`Order ${number} | ${shopName}`} description="" />
      <div className="container order-done">
        <CheckCircle2 size={44} aria-hidden="true" className="order-done-icon" />
        <h1>Order placed. Thank you.</h1>
        <p className="lede">Your order number is <strong className="order-number">{number}</strong>.{order?.email && <> We’ve noted <strong>{order.email}</strong> and will call before delivery.</>}</p>
        {order?.pay === 'transfer' && (
          <div className="bank-box">
            <h2>Pay by bank transfer</h2>
            <p>{bank.instructions || 'Pay the total to the account below and use your order number as the reference.'}</p>
            <dl>
              <div><dt>Amount</dt><dd><strong>{money(order.total_kobo ?? (order.subtotal + order.fee))}</strong></dd></div>
              {bank.bank_name && <div><dt>Bank</dt><dd>{bank.bank_name}</dd></div>}
              {bank.account_name && <div><dt>Account name</dt><dd>{bank.account_name}</dd></div>}
              {bank.account_number && <div><dt>Account number</dt><dd><strong>{bank.account_number}</strong> <button type="button" className="copy" onClick={() => copy(bank.account_number, 'acct')} aria-label="Copy account number"><Copy size={14} /></button>{copied === 'acct' && <small>copied</small>}</dd></div>}
              <div><dt>Reference</dt><dd><strong>{number}</strong> <button type="button" className="copy" onClick={() => copy(number, 'ref')} aria-label="Copy order number"><Copy size={14} /></button>{copied === 'ref' && <small>copied</small>}</dd></div>
            </dl>
            {!bank.account_number && <p className="muted small">Bank details will be sent to you by phone or email shortly.</p>}
          </div>
        )}
        {order?.pay === 'paystack' && <p className="lede">Your card payment is being confirmed. We’ll email you the moment it clears.</p>}
        {order?.items?.length > 0 && <ul className="checkout-items order-done-items">{order.items.map((i) => <li key={i.id}><span>{i.qty} × {i.name}<small>{i.unit}</small></span><span>{money(i.qty * i.price_kobo)}</span></li>)}</ul>}
        <Link to="/products" className="btn">Keep shopping</Link>
      </div>
    </section>
  )
}
