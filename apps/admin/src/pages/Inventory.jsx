import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { when } from '../lib/format.js'
import { useAuth, useFlash } from '../lib/hooks.js'
import { PageHead, Note, Empty, Field, Group } from '../components/ui.jsx'

const REASONS = [
  ['received', 'Received (delivery in)', +1],
  ['returned', 'Returned by customer', +1],
  ['damaged', 'Damaged or spoiled', -1],
  ['adjustment', 'Stock count adjustment', 0],
  ['correction', 'Correcting a mistake', 0],
]
const REASON_LABEL = Object.fromEntries(REASONS.map(([k, l]) => [k, l]))
REASON_LABEL.sold = 'Sold'

export default function Inventory() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const [filter, setFilter] = useState('all')
  const [flash, setFlash] = useFlash()
  const [ask, setAsk] = useState(null)      // null | true (mark all out) | false (mark all available)
  const [busy, setBusy] = useState(false)
  const [switchReady, setSwitchReady] = useState(true)

  const load = useCallback(async () => {
    const q = (cols) => supabase.from('inventory')
      .select(`product_id, on_hand, low_stock_at, updated_at, products!inner(${cols})`)
      .order('name', { referencedTable: 'products' })
    let { data, error } = await q('name, unit, active, out_of_stock')
    // before migration 020 the switch does not exist yet: show the counts, without it
    if (error && /out_of_stock/.test(error.message)) {
      setSwitchReady(false); ({ data, error } = await q('name, unit, active'))
    }
    if (error) setError(error.message); else setRows(data)
  }, [])

  /* The out-of-stock switch: the product stays in the shop, shown as sold out,
     and cannot be ordered. Its stock count is kept, so switching it back puts
     it on sale with the same number. One update: all of them, or none. */
  async function markOut(ids, out) {
    setBusy(true); setError('')
    const { error } = await supabase.from('products').update({ out_of_stock: out }).in('id', ids)
    setBusy(false); setAsk(null)
    if (error) { setError(`Nothing was changed: ${error.message}`); return }
    const n = ids.length === 1 ? '1 product' : `${ids.length} products`
    setFlash(out ? `${n} marked out of stock. The shop shows ${ids.length === 1 ? 'it' : 'them'} as sold out; the stock count is kept.` : `${n} back on sale.`)
    load()
  }
  const marked = (r) => !!r.products.out_of_stock
  const toMarkOut = (rows || []).filter((r) => !marked(r)).map((r) => r.product_id)
  const toMarkIn = (rows || []).filter(marked).map((r) => r.product_id)
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  const level = (r) => r.on_hand === 0 || marked(r) ? 'out' : r.on_hand <= r.low_stock_at ? 'low' : 'ok'
  const shown = (rows || []).filter((r) => filter === 'all' || level(r) === filter)
  const close = useCallback(() => setOpen(null), [])

  return (
    <div className="page">
      <PageHead title="Stock" lede="What's on hand. Every change is recorded with a reason, so the count can always be explained.">
        {switchReady && ask === null && toMarkOut.length > 0 && <button type="button" className="btn btn-sm" onClick={() => setAsk(true)}>Mark all out of stock</button>}
        {switchReady && ask === null && toMarkIn.length > 0 && <button type="button" className="btn btn-sm" onClick={() => setAsk(false)}>Mark all available</button>}
      </PageHead>
      <Note kind="error">{error}</Note>
      <Note kind="ok">{flash}</Note>
      {!switchReady && <Note kind="info">To mark products out of stock, run supabase/migrations/020_out_of_stock_switch.sql once in Supabase → SQL Editor, then reload this page.</Note>}
      {ask !== null && (
        <div className="panel stock-ask" role="alertdialog" aria-labelledby="stock-ask-q">
          <div className="panel-body">
            {ask
              ? <p id="stock-ask-q"><strong>Mark {toMarkOut.length} product{toMarkOut.length === 1 ? '' : 's'} out of stock?</strong> Customers will see {toMarkOut.length === 1 ? 'it' : 'them'} as sold out and can’t order {toMarkOut.length === 1 ? 'it' : 'them'}. Stock counts are kept.</p>
              : <p id="stock-ask-q"><strong>Put {toMarkIn.length} product{toMarkIn.length === 1 ? '' : 's'} back on sale?</strong> Each one that has stock can be ordered again.</p>}
            <div className="row-actions">
              <button type="button" className="btn btn-sm btn-primary" disabled={busy}
                      onClick={() => markOut(ask ? toMarkOut : toMarkIn, ask)}>
                {busy ? 'Saving…' : ask ? 'Yes, mark all out of stock' : 'Yes, mark all available'}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setAsk(null)} disabled={busy}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {rows && rows.length === 0 ? (
        <div className="panel"><Empty title="No products yet" body="Add products first; each one gets a stock line automatically." /></div>
      ) : rows && (
        <>
          <div className="filters" role="group" aria-label="Filter">
            {[['all', 'All'], ['low', 'Running low'], ['out', 'Out of stock']].map(([k, l]) => (
              <button key={k} type="button" className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>))}
          </div>
          <div className="panel"><div className="table-wrap"><table>
            <thead><tr><th>Product</th><th className="num">On hand</th><th className="num">Alert at</th>{switchReady && <th>In the shop</th>}<th>Last change</th><th></th></tr></thead>
            <tbody>{shown.map((r) => (
              <tr key={r.product_id} className="row-link" data-status={level(r) === 'ok' ? undefined : level(r)} onClick={() => setOpen(r)}>
                <td><strong>{r.products.name}</strong><div className="muted small">{r.products.unit}{r.products.active ? '' : ' · hidden from shop'}{marked(r) ? ' · marked out of stock' : ''}</div></td>
                <td className="num">{r.on_hand}</td>
                <td className="num muted">{r.low_stock_at}</td>
                {switchReady && (
                  <td>
                    <button type="button" className={`btn btn-sm avail-switch${marked(r) ? ' is-out' : ''}`} disabled={busy} aria-pressed={!marked(r)}
                            aria-label={`${r.products.name}: ${marked(r) ? 'out of stock. Put back on sale' : 'available. Mark out of stock'}`}
                            onClick={(e) => { e.stopPropagation(); markOut([r.product_id], !marked(r)) }}>
                      {marked(r) ? 'Out of stock' : 'Available'}
                    </button>
                  </td>
                )}
                <td className="muted small">{when(r.updated_at)}</td>
                <td><button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(r) }}>Adjust</button></td>
              </tr>))}</tbody>
          </table></div></div>
        </>
      )}
      {open && <StockPanel row={open} onClose={close} onChanged={load} />}
    </div>
  )
}

function StockPanel({ row, onClose, onChanged }) {
  const { staff } = useAuth()
  const [reason, setReason] = useState('received')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [alertAt, setAlertAt] = useState(String(row.low_stock_at))
  const [history, setHistory] = useState(null)
  const [onHand, setOnHand] = useState(row.on_hand)
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from('inventory_movements').select('id, delta, reason, note, order_id, created_at')
      .eq('product_id', row.product_id).order('created_at', { ascending: false }).limit(30)
    setHistory(data || [])
    const { data: inv } = await supabase.from('inventory').select('on_hand').eq('product_id', row.product_id).maybeSingle()
    if (inv) setOnHand(inv.on_hand)
  }, [row.product_id])
  useEffect(() => { const t = setTimeout(loadHistory, 0); return () => clearTimeout(t) }, [loadHistory])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sign = REASONS.find((r) => r[0] === reason)?.[2] ?? 0

  async function apply(e) {
    e.preventDefault()
    const n = parseInt(qty, 10)
    if (!n) { setError('Enter a quantity.'); return }
    let delta = n
    if (sign > 0) delta = Math.abs(n)
    else if (sign < 0) delta = -Math.abs(n)
    if (onHand + delta < 0) { setError(`That would take stock below zero (on hand is ${onHand}).`); return }
    setBusy(true); setError('')
    const { error } = await supabase.from('inventory_movements').insert({ product_id: row.product_id, delta, reason, note: note.trim(), created_by: staff?.user_id })
    setBusy(false)
    if (error) { setError(error.message); return }
    setQty(''); setNote(''); setFlash(delta > 0 ? `Added ${delta}.` : `Removed ${-delta}.`)
    await loadHistory(); onChanged()
  }

  async function saveAlert() {
    const n = parseInt(alertAt, 10)
    if (Number.isNaN(n) || n < 0) { setError('Alert level must be 0 or more.'); return }
    const { error } = await supabase.from('inventory').update({ low_stock_at: n }).eq('product_id', row.product_id)
    if (error) setError(error.message); else { setFlash('Alert level saved.'); onChanged() }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="stock-title" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2 id="stock-title">{row.products.name}</h2>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button>
        </div>
        <Note kind="error">{error}</Note>
        <Note kind="ok">{flash}</Note>
        <div className="drawer-body">
          <div className="figures" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="panel figure"><b>{onHand}</b><span>on hand · {row.products.unit}</span></div>
            <div className="panel figure" style={{ padding: 12 }}>
              <Group label="Alert me at">
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="input" type="number" min="0" aria-label="Alert me at" value={alertAt} onChange={(e) => setAlertAt(e.target.value)} />
                  <button type="button" className="btn btn-sm" onClick={saveAlert} disabled={alertAt === String(row.low_stock_at)}>Save</button>
                </div>
              </Group>
            </div>
          </div>

          <form className="form" onSubmit={apply}>
            <h3>Record a change</h3>
            <Field label="What happened">
              <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <div className="form-row">
              <Field label={sign > 0 ? 'Quantity in' : sign < 0 ? 'Quantity out' : 'Change (use − to remove)'} hint={sign === 0 ? 'e.g. 12 adds twelve, -3 removes three.' : undefined}>
                <input className="input" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
              </Field>
              <Field label="Note" hint="Optional: supplier, invoice number, who counted.">
                <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>
            <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Record'}</button></div>
          </form>

          <h3>History</h3>
          {history && history.length === 0 && <p className="muted">No movements recorded yet.</p>}
          {history && history.length > 0 && (
            <table className="order-items">
              <tbody>{history.map((m) => (
                <tr key={m.id}>
                  <td>{REASON_LABEL[m.reason] || m.reason}{m.note && <div className="muted small">{m.note}</div>}</td>
                  <td className="num" style={{ color: m.delta < 0 ? 'var(--alert)' : 'var(--ok)' }}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="muted small">{when(m.created_at)}</td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
      </aside>
    </div>
  )
}
