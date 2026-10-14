import { useLocation, useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { CheckCircle2, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Seo } from '@viverst/ui'
import { money } from '../lib/format.js'

export default function OrderPlaced({ shopName, settings }) {
  const { number } = useParams()
  const { state } = useLocation()
  let order = state
  if (!order) { try { const s = JSON.parse(window.sessionStorage.getItem('viverst-shop:last-order') || 'null'); if (s?.number === number) order = s } catch { /* ignore */ } }
  const bank = settings?.payments?.transfer || {}
  const [copied, setCopied] = useState('')
  const [params] = useSearchParams()
  const ref = params.get('ref') || params.get('reference')
  const [verify, setVerify] = useState(ref ? 'checking' : null)   // back from Paystack: confirm with the server
  useEffect(() => {
    if (!ref) return
    let alive = true
    supabase.functions.invoke('paystack/verify', { body: { reference: ref } }).then(({ data, error }) => {
      if (!alive) return
      setVerify(error || !data?.ok ? 'error' : data.paid ? 'paid' : 'pending')
    })
    return () => { alive = false }
  }, [ref])
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
        {verify === 'checking' && <p className="lede">Confirming your payment…</p>}
        {verify === 'paid' && <div className="bank-box"><h2>Payment received</h2><p>Your card payment went through. We’ll call before delivery.</p></div>}
        {verify === 'pending' && <div className="bank-box"><h2>Payment not completed</h2><p>Paystack didn’t confirm the payment. If money left your account, don’t worry — it will reflect within a few minutes and we’ll email you. Otherwise you can pay by bank transfer below.</p></div>}
        {verify === 'error' && <p className="lede">We couldn’t confirm the payment right now. We’ll check it and email you.</p>}
        {!verify && order?.pay === 'paystack' && <p className="lede">Your card payment is being confirmed. We’ll email you the moment it clears.</p>}
        {(verify === 'pending' || verify === 'error') && bank.account_number && (
          <div className="bank-box"><h2>Pay by bank transfer instead</h2><dl><div><dt>Bank</dt><dd>{bank.bank_name}</dd></div><div><dt>Account name</dt><dd>{bank.account_name}</dd></div><div><dt>Account number</dt><dd><strong>{bank.account_number}</strong></dd></div><div><dt>Reference</dt><dd><strong>{number}</strong></dd></div></dl></div>)}
        {order?.items?.length > 0 && <ul className="checkout-items order-done-items">{order.items.map((i) => <li key={i.id}><span>{i.qty} × {i.name}<small>{i.unit}</small></span><span>{money(i.qty * i.price_kobo)}</span></li>)}</ul>}
        <Link to="/products" className="btn">Keep shopping</Link>
      </div>
    </section>
  )
}
