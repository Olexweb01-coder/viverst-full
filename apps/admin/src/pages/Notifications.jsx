import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, ShoppingBag, Newspaper, PackageOpen, CalendarDays, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { when } from '../lib/format.js'
import { useAuth } from '../lib/hooks.js'
import { PageHead, Note, Empty } from '../components/ui.jsx'

const ICON = { order: ShoppingBag, post_review: Newspaper, stock_low: PackageOpen, stock_out: PackageOpen, registration: CalendarDays, system: Bell }
const KIND = { order: 'brand', post_review: 'warn', stock_low: 'warn', stock_out: 'alert', registration: 'ok', system: 'dim' }

export default function Notifications() {
  const onRead = () => window.dispatchEvent(new window.Event('viverst:refresh-counts'))
  const { staff } = useAuth()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [{ data, error }, { data: reads }] = await Promise.all([
      supabase.from('notifications').select('id, kind, title, body, link, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('notification_reads').select('notification_id').eq('staff_id', staff?.user_id),
    ])
    if (error) { setError(error.message); return }
    const read = new Set((reads || []).map((r) => r.notification_id))
    setRows((data || []).map((n) => ({ ...n, read: read.has(n.id) })))
  }, [staff?.user_id])
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  async function markAll() {
    const { error } = await supabase.rpc('mark_all_read')
    if (error) { setError(error.message); return }
    setRows((r) => r.map((n) => ({ ...n, read: true }))); onRead()
  }
  async function markOne(id) {
    await supabase.from('notification_reads').upsert({ notification_id: id, staff_id: staff?.user_id }, { onConflict: 'notification_id,staff_id' })
    setRows((r) => r.map((n) => n.id === id ? { ...n, read: true } : n)); onRead()
  }

  const unread = rows?.filter((n) => !n.read).length ?? 0
  return (
    <div className="page">
      <PageHead title="Notifications" lede="New orders, posts waiting for review, stock alerts and registrations. Email digests go out when a Resend key is set.">
        {unread > 0 && <button type="button" className="btn btn-sm" onClick={markAll}><CheckCheck aria-hidden="true" />Mark all read</button>}
      </PageHead>
      <Note kind="error">{error}</Note>
      {rows && rows.length === 0 ? <div className="panel"><Empty title="Nothing yet" body="The first order, review post or stock alert will show here." /></div>
      : rows && (
        <div className="panel notif-list">{rows.map((n) => {
          const I = ICON[n.kind] || Bell
          return (
            <div key={n.id} className={`notif${n.read ? '' : ' unread'}`}>
              <span className={`notif-ico chip-${KIND[n.kind] || 'dim'}`}><I aria-hidden="true" /></span>
              <div className="notif-body">
                <strong>{n.title}</strong>
                {n.body && <div className="muted small">{n.body}</div>}
                <div className="small muted">{when(n.created_at)}</div>
              </div>
              <div className="notif-actions">
                {n.link && <Link className="btn btn-sm" to={n.link} onClick={() => markOne(n.id)}>Open</Link>}
                {!n.read && <button type="button" className="btn btn-sm btn-quiet" onClick={() => markOne(n.id)}>Mark read</button>}
              </div>
            </div>)
        })}</div>
      )}
    </div>
  )
}
