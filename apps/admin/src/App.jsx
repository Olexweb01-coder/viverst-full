import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { useAuth } from './lib/hooks.js'
import { isOps } from './lib/constants.js'
import Shell from './components/Shell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import ProductEdit from './pages/ProductEdit.jsx'
import Inventory from './pages/Inventory.jsx'
import Orders from './pages/Orders.jsx'
import Settings from './pages/Settings.jsx'
import FoodPackage from './pages/FoodPackage.jsx'
import Staff from './pages/Staff.jsx'
import Events, { EventEdit } from './pages/Events.jsx'
import Posts, { PostEdit } from './pages/Posts.jsx'
import Automation from './pages/Automation.jsx'
import Assistant from './pages/Assistant.jsx'
import Notifications from './pages/Notifications.jsx'
import Analytics from './pages/Analytics.jsx'

/* pages a writer may not open redirect to the blog */
function Ops({ children }) {
  const { staff } = useAuth()
  return isOps(staff?.role) ? children : <Navigate to="/posts" replace />
}

function Gate() {
  const { session, staff } = useAuth()
  if (session === null || (session && staff === null)) {
    return <div className="login"><p className="muted">Loading…</p></div>
  }
  if (!session || !staff) return <Login notStaff={!!session && staff === false} />
  return <Shell />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Gate />}>
            <Route index element={<Dashboard />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="orders" element={<Ops><Orders  /></Ops>} />
            <Route path="products" element={<Ops><Products  /></Ops>} />
            <Route path="products/new" element={<Ops><ProductEdit  /></Ops>} />
            <Route path="products/:id" element={<Ops><ProductEdit  /></Ops>} />
            <Route path="inventory" element={<Ops><Inventory  /></Ops>} />
            <Route path="food-package" element={<Ops><FoodPackage /></Ops>} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/new" element={<PostEdit />} />
            <Route path="posts/:id" element={<PostEdit />} />
            <Route path="automation" element={<Automation />} />
            <Route path="events" element={<Ops><Events  /></Ops>} />
            <Route path="events/new" element={<Ops><EventEdit  /></Ops>} />
            <Route path="events/:id" element={<Ops><EventEdit  /></Ops>} />
            <Route path="analytics" element={<Ops><Analytics  /></Ops>} />
            <Route path="settings" element={<Ops><Settings  /></Ops>} />
            <Route path="staff" element={<Ops><Staff  /></Ops>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
