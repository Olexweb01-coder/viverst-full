import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, Boxes, ShoppingBag, Settings, Users, LogOut, Newspaper, CalendarDays, Sparkles, MessageSquare, Bell, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/hooks.js'
import logoLight from '@brand-assets/main/logo-light.webp'
import vMark from '@brand-assets/main/v-mark.webp'

const NAV = [
  { to: '/',           label: 'Today',      icon: LayoutDashboard, end: true },
  { to: '/assistant',  label: 'Assistant',  icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { group: 'Content' },
  { to: '/posts',      label: 'Blog',       icon: Newspaper, badge: 'posts_in_review' },
  { to: '/events',     label: 'Events',     icon: CalendarDays },
  { to: '/automation', label: 'Automation', icon: Sparkles },
  { group: 'Shop' },
  { to: '/orders',     label: 'Orders',     icon: ShoppingBag },
  { to: '/products',   label: 'Products',   icon: Package },
  { to: '/inventory',  label: 'Stock',      icon: Boxes },
  { group: 'Admin' },
  { to: '/analytics',  label: 'Analytics',  icon: BarChart3 },
  { to: '/settings',   label: 'Settings',   icon: Settings },
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
  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand"><img src={logoLight} alt="Viverst" /><small>Admin</small><img className="rail-mark" src={vMark} alt="" aria-hidden="true" /></div>
        <nav aria-label="Main">
          {NAV.filter((n) => !n.owner || staff?.role === 'owner').map((n) => n.group
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
