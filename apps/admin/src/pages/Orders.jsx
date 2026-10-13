import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { money, when } from '../lib/format.js'
import { PageHead, Note, Empty, Field } from '../components/ui.jsx'
import { useFlash } from '../lib/hooks.js'

const STATUSES = ['awaiting_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']
const LABEL = { awaiting_payment: 'Awaiting payment', paid: 'Paid', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' }
/* the only moves that make sense from each status */
const NEXT = { awaiting_payment: ['paid'], paid: ['packed', 'refunded'], packed: ['shipped'], shipped: ['delivered'], delivered: ['refunded'] }
const CANCELLABLE = ['awaiting_payment', 'paid', 'packed', 'shipped']

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'all'
  const openId = params.get('open')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    let q = supabase.from('orders').select('id, number, name, email, phone, status, payment_method, total_kobo, created_at').order('created_at', { ascending: false }).limit(200)
    if (status !== 'all') q = q.eq('status', status)
    const { data, error } = await q
    if (error) setError(error.message); else setRows(data)
  }, [status])
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  const setStatus = (s) => setParams((p) => { const n = new URLSearchParams(p); if (s === 'all') n.delete('status'); else n.set('status', s); return n })
  const open = useCallback((id) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('open', id); else n.delete('open'); return n }), [setParams])
  const close = useCallback(() => open(null), [open])

  return (
    <div className="page">
      <PageHead title="Orders" lede="Every order the shop takes. Open one to update payment and delivery." />
      <Note kind="error">{error}</Note>
      <div className="filters" role="group" aria-label="Filter by status">
        <button type="button" className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>All</button>
        {STATUSES.map((s) => <button key={s} type="button" className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{LABEL[s]}</button>)}
      </div>
      {rows && rows.length === 0 ? (
        <div className="panel"><Empty title={status === 'all' ? 'No orders yet' : `No orders ${LABEL[status]?.toLowerCase()}`} body="Orders appear here the moment the shop takes one." /></div>
      ) : rows && (
        <div className="panel"><div className="table-wrap"><table className="orders-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Paid by</th><th className="num">Total</th><th>Placed</th></tr></thead>
          <tbody>{rows.map((o) => (
            <tr key={o.id} className="row-link" data-status={o.status} onClick={() => open(o.id)}>
              <td><span className="order-number">{o.number}</span></td>
              <td><strong>{o.name}</strong><div className="muted small">{o.phone}</div></td>
              <td>{LABEL[o.status]}</td>
              <td className="muted">{o.payment_method === 'paystack' ? 'Card / Paystack' : 'Bank transfer'}</td>
              <td className="num">{money(o.total_kobo)}</td>
              <td className="muted small">{when(o.created_at)}</td>
            </tr>))}</tbody>
        </table></div></div>
      )}
      {openId && <OrderPanel id={openId} onClose={close} onChanged={load} />}
    </div>
  )
}

function OrderPanel({ id, onClose, onChanged }) {
  const [o, setO] = useState(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('order_detail').select('*').eq('id', id).maybeSingle()
    if (error) setError(error.message)
    else if (!data) setError('That order could not be found.')
    else { setO(data); setRef(data.payment_ref || ''); setNote(data.staff_note || '') }
  }, [id])
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function move(to) {
    setBusy(true); setError('')
    const patch = { status: to }
    if (to === 'paid') { patch.paid_at = new Date().toISOString(); patch.payment_ref = ref.trim() || null }
    const { error } = await supabase.from('orders').update(patch).eq('id', id)
    setBusy(false)
    if (error) { setError(error.message); return }
    setFlash(`Marked ${LABEL[to].toLowerCase()}.`); await load(); onChanged()
  }

  async function cancel() {
    const reason = window.prompt('Cancel this order and return its stock. Reason (optional):')
    if (reason === null) return
    setBusy(true); setError('')
    const { error } = await supabase.rpc('cancel_order', { p_order_id: id, p_reason: reason })
    setBusy(false)
    if (error) { setError(error.message); return }
    setFlash('Cancelled; stock returned.'); await load(); onChanged()
  }

  async function saveNote() {
    setBusy(true)
    const { error } = await supabase.from('orders').update({ staff_note: note }).eq('id', id)
    setBusy(false)
    if (error) setError(error.message); else setFlash('Note saved.')
  }

  const a = o?.delivery_address || {}
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="order-title" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2 id="order-title">{o ? <span className="order-number">{o.number}</span> : 'Order'}</h2>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button>
        </div>
        <Note kind="error">{error}</Note>
        <Note kind="ok">{flash}</Note>
        {o && (
          <div className="drawer-body">
            <div className="order-status" data-status={o.status}>
              <strong>{LABEL[o.status]}</strong>
              <span className="muted small">{o.payment_method === 'paystack' ? 'Card / Paystack' : 'Bank transfer'} · placed {when(o.created_at)}{o.paid_at ? ` · paid ${when(o.paid_at)}` : ''}</span>
            </div>

            <div className="order-actions">
              {o.status === 'awaiting_payment' && (
                <Field label="Payment reference" hint="Optional: the transfer reference or bank narration.">
                  <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} />
                </Field>
              )}
              <div className="form-actions">
                {(NEXT[o.status] || []).map((to) => (
                  <button key={to} type="button" className={`btn${to === 'refunded' ? ' btn-danger' : ' btn-primary'}`} disabled={busy} onClick={() => move(to)}>
                    Mark {LABEL[to].toLowerCase()}
                  </button>))}
                {CANCELLABLE.includes(o.status) && <button type="button" className="btn btn-danger right" disabled={busy} onClick={cancel}>Cancel order</button>}
              </div>
            </div>

            <h3>Items</h3>
            <table className="order-items">
              <tbody>{o.items.map((i) => (
                <tr key={i.id}><td>{i.name}<div className="muted small">{i.unit}</div></td><td className="num">{i.qty} × {money(i.unit_price_kobo)}</td><td className="num">{money(i.line_kobo)}</td></tr>))}
              </tbody>
              <tfoot>
                <tr><td colSpan="2">Items</td><td className="num">{money(o.subtotal_kobo)}</td></tr>
                <tr><td colSpan="2">Delivery</td><td className="num">{money(o.delivery_kobo)}</td></tr>
                <tr><td colSpan="2"><strong>Total</strong></td><td className="num"><strong>{money(o.total_kobo)}</strong></td></tr>
              </tfoot>
            </table>

            <h3>Customer</h3>
            <p>{o.name}<br /><a href={`tel:${o.phone}`}>{o.phone}</a> · <a href={`mailto:${o.email}`}>{o.email}</a></p>

            <h3>Deliver to</h3>
            <p>{a.name && a.name !== o.name ? <>{a.name}<br /></> : null}{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />{a.city}, {a.state}{a.phone && a.phone !== o.phone ? <><br />{a.phone}</> : null}</p>

            {o.customer_note && <><h3>Customer’s note</h3><p className="muted">{o.customer_note}</p></>}

            <h3>Internal note</h3>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Internal note" style={{ minHeight: 70 }} />
            <div className="form-actions"><button type="button" className="btn btn-sm" disabled={busy || note === (o.staff_note || '')} onClick={saveNote}>Save note</button></div>
          </div>
        )}
      </aside>
    </div>
  )
}
