import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ShoppingBag, Wallet, PackageOpen, Newspaper, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { money, when } from '../lib/format.js'
import { Note, Empty, Chip } from '../components/ui.jsx'
import HostingNotice from '../components/HostingNotice.jsx'
import { useAuth } from '../lib/hooks.js'

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const STATUS_CHIP = { awaiting_payment: ['warn', 'Awaiting payment'], paid: ['brand', 'Paid'], packed: ['brand', 'Packed'], shipped: ['brand', 'Shipped'], delivered: ['ok', 'Delivered'], cancelled: ['alert', 'Cancelled'], refunded: ['alert', 'Refunded'] }

export default function Dashboard() {
  const { staff } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [awaiting, today, low, recent, content] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_payment'),
        supabase.from('orders').select('total_kobo').gte('created_at', todayStart()).not('status', 'in', '("cancelled","refunded")'),
        supabase.from('inventory').select('product_id, on_hand, low_stock_at, products!inner(name, active)').eq('products.active', true),
        supabase.from('orders').select('id, number, name, status, total_kobo, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.rpc('content_counts'),
      ])
      if (!alive) return
      const err = awaiting.error || today.error || low.error || recent.error
      if (err) { setError(err.message); return }
      const lowRows = (low.data || []).filter((r) => r.on_hand <= r.low_stock_at)
      setData({
        awaiting: awaiting.count || 0,
        todayCount: today.data.length,
        todayKobo: today.data.reduce((s, o) => s + Number(o.total_kobo), 0),
        low: lowRows, recent: recent.data, content: content.data || {},
      })
    })()
    return () => { alive = false }
  }, [])

  const firstName = (staff?.name || '').split(' ')[0]
  const todo = data ? [
    data.awaiting && `${data.awaiting} order${data.awaiting > 1 ? 's' : ''} waiting for payment`,
    data.low.length && `${data.low.length} product${data.low.length > 1 ? 's' : ''} running low`,
    data.content.posts_in_review && `${data.content.posts_in_review} blog draft${data.content.posts_in_review > 1 ? 's' : ''} in review`,
  ].filter(Boolean) : []

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-date">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1>{greeting()}{firstName ? `, ${firstName}` : ''}.</h1>
        <p>{!data ? 'Pulling today’s numbers…' : todo.length ? `On your plate: ${todo.join(' · ')}.` : 'Nothing is waiting on you. Orders, stock and content are all clear.'}</p>
      </section>
      <HostingNotice />
      <Note kind="error">{error}</Note>
      {data && (
        <>
          <div className="figures">
            <Link to="/orders?status=awaiting_payment" className={`panel figure${data.awaiting ? ' warn' : ''}`}>
              <b>{data.awaiting}</b><span>awaiting payment</span><span className="ico"><Clock aria-hidden="true" /></span>
            </Link>
            <div className="panel figure"><b>{data.todayCount}</b><span>orders today</span><span className="ico"><ShoppingBag aria-hidden="true" /></span></div>
            <div className="panel figure ok"><b className="money">{money(data.todayKobo)}</b><span>taken today</span><span className="ico"><Wallet aria-hidden="true" /></span></div>
            <Link to="/inventory" className={`panel figure${data.low.length ? ' alert' : ''}`}>
              <b>{data.low.length}</b><span>low or out of stock</span><span className="ico"><PackageOpen aria-hidden="true" /></span>
            </Link>
            <Link to="/posts" className={`panel figure${data.content.posts_in_review ? ' warn' : ''}`}>
              <b>{data.content.posts_in_review ?? 0}</b><span>posts in review</span><span className="ico"><Newspaper aria-hidden="true" /></span>
            </Link>
            <Link to="/events" className="panel figure">
              <b>{data.content.events_upcoming ?? 0}</b><span>upcoming events</span><span className="ico"><CalendarDays aria-hidden="true" /></span>
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
              ? <Empty title="No orders yet" body="They’ll appear here the moment the shop takes one." />
              : <div className="table-wrap"><table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th><th>Placed</th></tr></thead>
                  <tbody>{data.recent.map((o) => (
                    <tr key={o.id} data-status={o.status}>
                      <td><Link to={`/orders?open=${o.id}`} className="order-number">{o.number}</Link></td><td>{o.name}</td>
                      <td><Chip kind={STATUS_CHIP[o.status]?.[0]}>{STATUS_CHIP[o.status]?.[1] || o.status}</Chip></td>
                      <td className="num">{money(o.total_kobo)}</td><td className="muted small">{when(o.created_at)}</td>
                    </tr>))}</tbody>
                </table></div>}
          </div>
        </>
      )}
    </div>
  )
}
