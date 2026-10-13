import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { money, when } from '../lib/format.js'
import { PageHead, Note } from '../components/ui.jsx'
import HostingNotice from '../components/HostingNotice.jsx'

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [awaiting, today, low, recent] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_payment'),
        supabase.from('orders').select('total_kobo').gte('created_at', todayStart()).not('status', 'in', '("cancelled","refunded")'),
        supabase.from('inventory').select('product_id, on_hand, low_stock_at, products!inner(name, active)').eq('products.active', true),
        supabase.from('orders').select('id, number, name, status, total_kobo, created_at').order('created_at', { ascending: false }).limit(8),
      ])
      if (!alive) return
      const err = awaiting.error || today.error || low.error || recent.error
      if (err) { setError(err.message); return }
      const lowRows = (low.data || []).filter((r) => r.on_hand <= r.low_stock_at)
      setData({
        awaiting: awaiting.count || 0,
        todayCount: today.data.length,
        todayKobo: today.data.reduce((s, o) => s + Number(o.total_kobo), 0),
        low: lowRows,
        recent: recent.data,
      })
    })()
    return () => { alive = false }
  }, [])

  return (
    <div className="page">
      <PageHead title="Today" lede="What needs attention, then what came in." />
      <HostingNotice />
      <Note kind="error">{error}</Note>
      {data && (
        <>
          <div className="figures">
            <Link to="/orders?status=awaiting_payment" className={`panel figure${data.awaiting ? ' warn' : ''}`} style={{ textDecoration: 'none' }}>
              <b>{data.awaiting}</b><span>awaiting payment</span>
            </Link>
            <div className="panel figure"><b>{data.todayCount}</b><span>orders today</span></div>
            <div className="panel figure"><b>{money(data.todayKobo)}</b><span>taken today</span></div>
            <Link to="/inventory" className={`panel figure${data.low.length ? ' alert' : ''}`} style={{ textDecoration: 'none' }}>
              <b>{data.low.length}</b><span>low or out of stock</span>
            </Link>
          </div>

          {data.low.length > 0 && (
            <div className="panel">
              <div className="panel-head"><h2>Running low</h2><Link className="btn btn-sm" to="/inventory">Receive stock</Link></div>
              <div className="table-wrap"><table>
                <thead><tr><th>Product</th><th className="num">On hand</th><th className="num">Alert at</th></tr></thead>
                <tbody>{data.low.map((r) => (
                  <tr key={r.product_id} data-status={r.on_hand === 0 ? 'out' : 'low'}>
                    <td>{r.products.name}</td><td className="num">{r.on_hand}</td><td className="num muted">{r.low_stock_at}</td>
                  </tr>))}</tbody>
              </table></div>
            </div>
          )}

          <div className="panel">
            <div className="panel-head"><h2>Latest orders</h2><Link className="btn btn-sm" to="/orders">All orders</Link></div>
            {data.recent.length === 0
              ? <div className="empty"><strong>No orders yet</strong>They’ll appear here the moment the shop takes one.</div>
              : <div className="table-wrap"><table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th><th>Placed</th></tr></thead>
                  <tbody>{data.recent.map((o) => (
                    <tr key={o.id} data-status={o.status}>
                      <td><Link to={`/orders?open=${o.id}`}>{o.number}</Link></td><td>{o.name}</td>
                      <td>{o.status.replace('_', ' ')}</td><td className="num">{money(o.total_kobo)}</td><td className="muted small">{when(o.created_at)}</td>
                    </tr>))}</tbody>
                </table></div>}
          </div>
        </>
      )}
    </div>
  )
}
