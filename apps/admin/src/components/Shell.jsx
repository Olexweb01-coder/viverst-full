import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, Boxes, ShoppingBag, Settings, Users, LogOut, Newspaper, CalendarDays, Sparkles, MessageSquare, Bell, BarChart3, Menu, X, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/hooks.js'
import logoLight from '@brand-assets/main/logo-light.webp'
import { isOps } from '../lib/constants.js'
import vMark from '@brand-assets/main/v-mark.webp'

const NAV = [
  { to: '/',           label: 'Today',      icon: LayoutDashboard, end: true },
  { to: '/assistant',  label: 'Assistant',  icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { group: 'Content' },
  { to: '/posts',      label: 'Blog',       icon: Newspaper, badge: 'posts_in_review' },
  { to: '/events',     label: 'Events',     icon: CalendarDays, ops: true },
  { to: '/automation', label: 'Automation', icon: Sparkles },
  { group: 'Shop', ops: true },
  { to: '/orders',     label: 'Orders',     icon: ShoppingBag, ops: true },
  { to: '/products',   label: 'Products',   icon: Package, ops: true },
  { to: '/inventory',  label: 'Stock',      icon: Boxes, ops: true },
  { to: '/food-package', label: 'Food package', icon: Gift, ops: true },
  { group: 'Admin', ops: true },
  { to: '/analytics',  label: 'Analytics',  icon: BarChart3, ops: true },
  { to: '/settings',   label: 'Settings',   icon: Settings, ops: true },
  { to: '/staff',      label: 'Staff',      icon: Users, owner: true },
]

function useCounts() {
  const [counts, setCounts] = useState({})
  useEffect(() => {
    let alive = true
    const tick = async () => {
      const [{ data: c }, { data: n }] = await Promise.all([supabase.rpc('content_counts'), supabase.rpc('notification_counts')])
      if (alive) setCounts({ ...(c || {}), ...(n || {}) })
    }
    tick(); const t = setInterval(tick, 60000)
    window.addEventListener('viverst:refresh-counts', tick)
    return () => { alive = false; clearInterval(t); window.removeEventListener('viverst:refresh-counts', tick) }
  }, [])
  return counts
}

export default function Shell() {
  const { staff, signOut } = useAuth()
  const counts = useCounts()
  const { pathname } = useLocation()
  const [openPath, setOpenPath] = useState(null)   // drawer is open only on the route it was opened on
  const open = openPath === pathname
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpenPath(null) }
    window.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])
  const unread = counts.unread || 0
  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="topbar-btn" onClick={() => setOpenPath(open ? null : pathname)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
        <img src={logoLight} alt="Viverst" className="topbar-logo" />
        <NavLink to="/notifications" className="topbar-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}><Bell aria-hidden="true" />{unread > 0 && <span className="badge">{unread}</span>}</NavLink>
      </header>
      {open && <div className="rail-backdrop" onClick={() => setOpenPath(null)} aria-hidden="true" />}
      <aside className={`rail${open ? ' open' : ''}`}>
        <div className="rail-brand"><img src={logoLight} alt="Viverst" /><small>Admin</small><img className="rail-mark" src={vMark} alt="" aria-hidden="true" /></div>
        <nav aria-label="Main">
          {NAV.filter((n) => (!n.owner || staff?.role === 'owner') && (!n.ops || isOps(staff?.role))).map((n) => n.group
            ? <span key={n.group} className="rail-group">{n.group}</span>
            : <NavLink key={n.to} to={n.to} end={n.end}><n.icon aria-hidden="true" />{n.label}{n.badge && counts[n.badge] > 0 && <span className="badge" aria-label={`${counts[n.badge]} waiting`}>{counts[n.badge]}</span>}</NavLink>
          )}
        </nav>
        <div className="rail-foot">
          <strong>{staff?.name || staff?.email}</strong>
          {staff?.role}
          <div><button type="button" className="btn btn-quiet btn-sm" onClick={signOut}><LogOut aria-hidden="true" />Sign out</button></div>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
