import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { money } from '../lib/format.js'
import { PageHead, Note, Empty } from '../components/ui.jsx'
import { ARMS } from '../lib/constants.js'
import { loadRegistrationSummary } from '../lib/registrations.js'

/* a small bar chart drawn as SVG: no library to load, prints and scales cleanly */
function Bars({ data, valueKey, labelKey, format = (v) => v, color = 'var(--brand)', height = 160 }) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0))
  const w = 100 / data.length
  return (
    <div className="bars">
      <svg viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" aria-hidden="true">
        {data.map((d, i) => { const v = Number(d[valueKey]) || 0; const h = (v / max) * (height / 4 - 4); return (
          <rect key={i} x={i * w + w * 0.18} y={height / 4 - h} width={w * 0.64} height={h} rx="0.6" fill={color} opacity={v ? 1 : 0.18} />) })}
      </svg>
      <div className="bars-labels">{data.map((d, i) => <span key={i} title={format(d[valueKey])}>{d[labelKey]}</span>)}</div>
      <div className="bars-values">{data.map((d, i) => <span key={i}>{Number(d[valueKey]) ? format(d[valueKey]) : ''}</span>)}</div>
    </div>
  )
}

const STATUS_LABEL = { awaiting_payment: 'Awaiting payment', paid: 'Paid', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' }

export default function Analytics() {
  const [a, setA] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [weeks, setWeeks] = useState(12)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [{ data, error }, s] = await Promise.all([supabase.rpc('analytics_summary', { p_weeks: weeks }), loadRegistrationSummary()])
      if (!alive) return
      if (error) setError(error.message); else setA(data)
      setSheet(s)
    })()
    return () => { alive = false }
  }, [weeks])

  const t = a?.totals || {}
  const postsByArm = Object.keys(ARMS).map((arm) => ({ arm, label: ARMS[arm], published: (a?.posts || []).filter((p) => p.arm === arm && p.status === 'published').reduce((s, p) => s + Number(p.n), 0), other: (a?.posts || []).filter((p) => p.arm === arm && p.status !== 'published').reduce((s, p) => s + Number(p.n), 0) }))
  const sheetSignups = sheet?.ok ? sheet.events.reduce((s, e) => s + Number(e.count || 0), 0) : null

  return (
    <div className="page">
      <PageHead title="Analytics" lede="Sales, products, content and events — all time, and the last few weeks.">
        <div className="filters" style={{ marginBottom: 0 }}>{[4, 12, 26].map((n) => <button key={n} type="button" className={weeks === n ? 'active' : ''} onClick={() => setWeeks(n)}>{n} weeks</button>)}</div>
      </PageHead>
      <Note kind="error">{error}</Note>
      {a && (
        <>
          <div className="figures">
            <div className="panel figure ok"><b className="money">{money(t.revenue_paid_kobo)}</b><span>paid revenue, all time</span></div>
            <div className="panel figure"><b>{t.orders_all ?? 0}</b><span>orders, all time</span></div>
            <div className="panel figure"><b>{t.customers ?? 0}</b><span>customer accounts</span></div>
            <div className="panel figure"><b>{t.posts_published ?? 0}</b><span>posts published</span></div>
            <div className="panel figure"><b>{t.events_upcoming ?? 0}</b><span>upcoming events</span></div>
            <div className="panel figure"><b>{sheetSignups ?? t.registrations_30d ?? 0}</b><span>{sheetSignups != null ? 'event signups (sheet)' : 'registrations, 30 days'}</span></div>
          </div>

          <div className="panel"><div className="panel-head"><h2>Revenue by week</h2></div><div className="panel-body">
            {(a.weeks || []).every((w) => !Number(w.revenue_kobo)) ? <Empty title="No sales yet" body="Revenue appears here once the shop takes paid orders." /> : <Bars data={a.weeks} valueKey="revenue_kobo" labelKey="week" format={money} color="var(--ok)" />}
          </div></div>

          <div className="panel"><div className="panel-head"><h2>Orders by week</h2></div><div className="panel-body">
            {(a.weeks || []).every((w) => !Number(w.orders)) ? <Empty title="No orders yet" /> : <Bars data={a.weeks} valueKey="orders" labelKey="week" />}
          </div></div>

          <div className="figures" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="panel"><div className="panel-head"><h2>Top products, 90 days</h2></div>
              {(a.top_products || []).length === 0 ? <Empty title="Nothing sold yet" /> : <div className="table-wrap"><table>
                <thead><tr><th>Product</th><th className="num">Units</th><th className="num">Revenue</th></tr></thead>
                <tbody>{a.top_products.map((p) => <tr key={p.name}><td>{p.name}</td><td className="num">{p.qty}</td><td className="num">{money(p.kobo)}</td></tr>)}</tbody></table></div>}
            </div>
            <div className="panel"><div className="panel-head"><h2>Orders by status</h2></div>
              {Object.keys(a.by_status || {}).length === 0 ? <Empty title="No orders yet" /> : <div className="table-wrap"><table>
                <tbody>{Object.entries(a.by_status).sort((x, y) => y[1] - x[1]).map(([s, n]) => <tr key={s}><td>{STATUS_LABEL[s] || s}</td><td className="num">{n}</td></tr>)}</tbody></table></div>}
            </div>
            <div className="panel"><div className="panel-head"><h2>Blog by arm</h2></div>
              <div className="table-wrap"><table>
                <thead><tr><th>Arm</th><th className="num">Published</th><th className="num">In progress</th></tr></thead>
                <tbody>{postsByArm.map((r) => <tr key={r.arm}><td>{r.label}</td><td className="num">{r.published}</td><td className="num muted">{r.other}</td></tr>)}</tbody></table></div>
            </div>
            {sheet?.ok && sheet.events.length > 0 && <div className="panel"><div className="panel-head"><h2>Event signups</h2></div>
              <div className="table-wrap"><table>
                <tbody>{sheet.events.map((e) => <tr key={e.eventId}><td>{e.title || e.eventId}</td><td className="num">{e.count}</td></tr>)}</tbody></table></div>
            </div>}
          </div>
        </>
      )}
    </div>
  )
}
