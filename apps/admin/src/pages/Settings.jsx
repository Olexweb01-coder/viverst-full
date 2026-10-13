import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { fromKobo, toKobo } from '../lib/format.js'
import { useAuth, useFlash } from '../lib/hooks.js'
import { PageHead, Note, Field, Group } from '../components/ui.jsx'

/* Non-secret settings live in the settings table (one JSON row per area).
   Secret keys go through set_secret() and can never be read back here. */
export default function Settings() {
  const { staff } = useAuth()
  const canEdit = staff?.role === 'owner' || staff?.role === 'manager'
  const isOwner = staff?.role === 'owner'
  const [s, setS] = useState(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)
  const [paystackReady, setPaystackReady] = useState(null)
  const [secretKey, setSecretKey] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [resendReady, setResendReady] = useState(null)
  const [resendKey, setResendKey] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (!alive) return
      if (error) { setError(error.message); return }
      const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
      setS({
        shop: { name: '', currency: 'NGN', ...map.shop },
        delivery: { flat_fee: fromKobo(map.delivery?.flat_fee_kobo ?? 0), note: map.delivery?.note ?? '' },
        payments: { transfer: { enabled: true, bank_name: '', account_name: '', account_number: '', instructions: '', ...map.payments?.transfer }, paystack: { enabled: false, public_key: '', ...map.payments?.paystack } },
        contact: { email: '', phone: '', whatsapp: '', ...map.contact },
        integrations: { registrations_script_url: '', ...map.integrations },
        notifications: { email_enabled: true, email_to: '', from: 'Viverst Admin <admin@viverst.com>', ...map.notifications },
      })
      setPublicKey(map.payments?.paystack?.public_key || '')
      const { data: has } = await supabase.rpc('has_secret', { p_key: 'paystack_secret_key' })
      if (alive) setPaystackReady(!!has)
      const { data: hasResend } = await supabase.rpc('has_secret', { p_key: 'resend_api_key' })
      if (alive) setResendReady(!!hasResend)
    })()
    return () => { alive = false }
  }, [])

  const set = (area, key) => (e) => setS((o) => ({ ...o, [area]: { ...o[area], [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } }))
  const setT = (key) => (e) => setS((o) => ({ ...o, payments: { ...o.payments, transfer: { ...o.payments.transfer, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } } }))

  async function saveArea(area) {
    setBusy(true); setError('')
    let value = s[area]
    if (area === 'delivery') value = { flat_fee_kobo: toKobo(s.delivery.flat_fee), note: s.delivery.note }
    if (area === 'payments') value = { transfer: s.payments.transfer, paystack: { enabled: paystackReady && !!publicKey, public_key: publicKey.trim() } }
    const { error } = await supabase.from('settings').upsert({ key: area, value }, { onConflict: 'key' })
    setBusy(false)
    if (error) setError(error.message); else setFlash('Saved.')
  }

  async function savePaystack(e) {
    e.preventDefault()
    if (!secretKey.trim().startsWith('sk_')) { setError('The secret key starts with sk_test_ or sk_live_. Copy it from Paystack → Settings → API Keys.'); return }
    if (!publicKey.trim().startsWith('pk_')) { setError('The public key starts with pk_test_ or pk_live_.'); return }
    setBusy(true); setError('')
    const { error } = await supabase.rpc('set_secret', { p_key: 'paystack_secret_key', p_value: secretKey.trim() })
    if (error) { setBusy(false); setError(error.message); return }
    const value = { transfer: s.payments.transfer, paystack: { enabled: true, public_key: publicKey.trim() } }
    const { error: e2 } = await supabase.from('settings').upsert({ key: 'payments', value }, { onConflict: 'key' })
    setBusy(false)
    if (e2) { setError(e2.message); return }
    setSecretKey(''); setPaystackReady(true); setFlash('Paystack is on. Card and bank payments are now offered at checkout.')
  }

  async function disablePaystack() {
    if (!window.confirm('Turn card payments off? Customers will only see bank transfer until you enter keys again.')) return
    setBusy(true)
    await supabase.rpc('set_secret', { p_key: 'paystack_secret_key', p_value: '' })
    const value = { transfer: s.payments.transfer, paystack: { enabled: false, public_key: '' } }
    await supabase.from('settings').upsert({ key: 'payments', value }, { onConflict: 'key' })
    setBusy(false); setPaystackReady(false); setPublicKey(''); setFlash('Paystack turned off.')
  }

  if (!s) return <div className="page"><PageHead title="Settings" /><Note kind="error">{error}</Note>{!error && <p className="muted">Loading…</p>}</div>

  return (
    <div className="page">
      <PageHead title="Settings" lede={canEdit ? 'Shop name, delivery fee, how customers pay you, and contact details.' : 'Only owners and managers can change settings.'} />
      <Note kind="error">{error}</Note>
      <Note kind="ok">{flash}</Note>
      <fieldset disabled={!canEdit || busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

        <section className="panel">
          <div className="panel-head"><h2>Shop</h2><button type="button" className="btn btn-sm" onClick={() => saveArea('shop')}>Save</button></div>
          <div className="panel-body form">
            <Field label="Shop name" hint="Shown in the shop's header and on receipts."><input className="input" value={s.shop.name} onChange={set('shop', 'name')} /></Field>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Delivery</h2><button type="button" className="btn btn-sm" onClick={() => saveArea('delivery')}>Save</button></div>
          <div className="panel-body form">
            <div className="form-row">
              <Field label="Flat delivery fee" hint="Added to every order. Leave at 0 to agree delivery by phone after the order.">
                <div className="input-prefix"><span>₦</span><input inputMode="decimal" value={s.delivery.flat_fee} onChange={set('delivery', 'flat_fee')} /></div>
              </Field>
              <Field label="Delivery note" hint="Shown at checkout under the fee."><input className="input" value={s.delivery.note} onChange={set('delivery', 'note')} /></Field>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Bank transfer</h2><button type="button" className="btn btn-sm" onClick={() => saveArea('payments')}>Save</button></div>
          <div className="panel-body form">
            <label className="check"><input type="checkbox" checked={!!s.payments.transfer.enabled} onChange={setT('enabled')} />Offer bank transfer at checkout</label>
            <div className="form-row">
              <Field label="Bank"><input className="input" value={s.payments.transfer.bank_name} onChange={setT('bank_name')} /></Field>
              <Field label="Account name"><input className="input" value={s.payments.transfer.account_name} onChange={setT('account_name')} /></Field>
              <Field label="Account number"><input className="input" inputMode="numeric" value={s.payments.transfer.account_number} onChange={setT('account_number')} /></Field>
            </div>
            <Field label="Instructions shown to the customer"><textarea className="textarea" style={{ minHeight: 70 }} value={s.payments.transfer.instructions} onChange={setT('instructions')} /></Field>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Card payments (Paystack)</h2>{paystackReady !== null && <span className={`small ${paystackReady ? '' : 'muted'}`}>{paystackReady ? '● On' : '○ Off'}</span>}</div>
          <div className="panel-body form">
            {!isOwner ? <p className="muted">Only the owner can enter or change Paystack keys.</p> : paystackReady ? (
              <>
                <p>Paystack is connected. Customers can pay by card, bank transfer or USSD and orders are confirmed automatically.</p>
                <Field label="Public key" hint="Safe to show; it identifies your Paystack account in the shop."><input className="input" value={publicKey} readOnly /></Field>
                <div className="form-actions"><button type="button" className="btn btn-danger" onClick={disablePaystack}>Turn Paystack off</button></div>
              </>
            ) : (
              <form className="form" onSubmit={savePaystack}>
                <p className="muted">Until keys are entered, checkout offers bank transfer only. Get both keys from Paystack → Settings → API Keys &amp; Webhooks. Use the <strong>test</strong> pair first; swap to live when you're ready.</p>
                <div className="form-row">
                  <Field label="Public key"><input className="input" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="pk_test_…" autoComplete="off" /></Field>
                  <Field label="Secret key" hint="Stored where only the payment server can read it. Not even this screen can show it again."><input className="input" type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="sk_test_…" autoComplete="off" /></Field>
                </div>
                <div className="form-actions"><button className="btn btn-primary" type="submit">Turn Paystack on</button></div>
              </form>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Contact</h2><button type="button" className="btn btn-sm" onClick={() => saveArea('contact')}>Save</button></div>
          <div className="panel-body form">
            <div className="form-row">
              <Field label="Email" hint="Where order alerts and customer replies go."><input className="input" type="email" value={s.contact.email} onChange={set('contact', 'email')} /></Field>
              <Field label="Phone"><input className="input" value={s.contact.phone} onChange={set('contact', 'phone')} /></Field>
              <Field label="WhatsApp" hint="Number only, e.g. 2348012345678."><input className="input" value={s.contact.whatsapp} onChange={set('contact', 'whatsapp')} /></Field>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Notifications by email</h2><button type="button" className="btn btn-sm" onClick={() => saveArea('notifications')}>Save</button></div>
          <div className="panel-body form">
            <label className="check"><input type="checkbox" checked={!!s.notifications.email_enabled} onChange={set('notifications', 'email_enabled')} />Email me a digest of new notifications</label>
            <div className="form-row">
              <Field label="Send to" hint="Leave blank to use the Contact email."><input className="input" type="email" value={s.notifications.email_to} onChange={set('notifications', 'email_to')} /></Field>
              <Field label="From" hint="Must be on a domain verified in Resend, e.g. Viverst Admin <admin@viverst.com>."><input className="input" value={s.notifications.from} onChange={set('notifications', 'from')} /></Field>
            </div>
            <Group label={`Resend API key — ${resendReady ? '● set' : '○ not set'}`} hint="resend.com → API Keys. Free tier covers thousands of emails a month. Owner only.">
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="password" aria-label="Resend API key" autoComplete="off" placeholder="re_…" value={resendKey} onChange={(e) => setResendKey(e.target.value)} disabled={!isOwner} />
                <button type="button" className="btn" disabled={!isOwner || busy || resendKey.trim().length < 10} onClick={async () => { const { error } = await supabase.rpc('set_secret', { p_key: 'resend_api_key', p_value: resendKey.trim() }); if (error) setError(error.message); else { setResendKey(''); setResendReady(true); setFlash('Resend key saved. Digests start with the next notification.') } }}>{resendReady ? 'Replace' : 'Save'}</button>
              </div>
            </Group>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Integrations</h2><button type="button" className="btn btn-sm" onClick={() => saveArea('integrations')}>Save</button></div>
          <div className="panel-body form">
            <Field label="Event registrations script" hint="The Google Apps Script web-app URL (ends in /exec) that the sites post registrations to. The admin reads signup counts from it.">
              <input className="input" value={s.integrations.registrations_script_url} onChange={set('integrations', 'registrations_script_url')} placeholder="https://script.google.com/macros/s/…/exec" />
            </Field>
          </div>
        </section>
      </fieldset>
    </div>
  )
}
