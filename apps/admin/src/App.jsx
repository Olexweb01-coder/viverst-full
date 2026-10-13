import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { useAuth } from './lib/hooks.js'
import Shell from './components/Shell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import ProductEdit from './pages/ProductEdit.jsx'
import Inventory from './pages/Inventory.jsx'
import Orders from './pages/Orders.jsx'
import Settings from './pages/Settings.jsx'
import Staff from './pages/Staff.jsx'

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
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductEdit />} />
            <Route path="products/:id" element={<ProductEdit />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="staff" element={<Staff />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
