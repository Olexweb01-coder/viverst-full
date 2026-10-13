import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Boxes, ShoppingBag, Settings, Users, LogOut } from 'lucide-react'
import { useAuth } from '../lib/hooks.js'
import logoLight from '@brand-assets/main/logo-light.webp'

const NAV = [
  { to: '/',          label: 'Today',     icon: LayoutDashboard, end: true },
  { to: '/orders',    label: 'Orders',    icon: ShoppingBag },
  { to: '/products',  label: 'Products',  icon: Package },
  { to: '/inventory', label: 'Stock',     icon: Boxes },
  { to: '/settings',  label: 'Settings',  icon: Settings },
  { to: '/staff',     label: 'Staff',     icon: Users, owner: true },
]

export default function Shell() {
  const { staff, signOut } = useAuth()
  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand"><img src={logoLight} alt="Viverst" /><small>Admin</small></div>
        <nav aria-label="Main">
          {NAV.filter((n) => !n.owner || staff?.role === 'owner').map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}><Icon aria-hidden="true" />{label}</NavLink>
          ))}
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
