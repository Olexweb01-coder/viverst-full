import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ScrollToTop } from '@viverst/ui'
import { CartProvider } from './lib/cart.jsx'
import { getSettings } from './lib/catalog.js'
import { SHOP } from './lib/config.js'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderPlaced from './pages/OrderPlaced.jsx'
import NotFound from './pages/NotFound.jsx'

function Frame() {
  const { pathname } = useLocation()
  const [settings, setSettings] = useState({})
  useEffect(() => { getSettings().then(setSettings).catch(() => {}) }, [])
  const shopName = settings.shop?.name || SHOP.name
  return (
    <>
      <Header />
      <main id="main" data-path={pathname}>
        <Routes>
          <Route path="/" element={<Home shopName={shopName} contact={settings.contact} />} />
          <Route path="/products" element={<Products shopName={shopName} />} />
          <Route path="/products/:slug" element={<Product shopName={shopName} />} />
          <Route path="/cart" element={<Cart shopName={shopName} delivery={settings.delivery} />} />
          <Route path="/checkout" element={<Checkout shopName={shopName} settings={settings} />} />
          <Route path="/order/:number" element={<OrderPlaced shopName={shopName} settings={settings} />} />
          <Route path="*" element={<NotFound shopName={shopName} />} />
        </Routes>
      </main>
      <Footer contact={settings.contact} />
    </>
  )
}
export default function App() {
  return <CartProvider><BrowserRouter><ScrollToTop /><Frame /></BrowserRouter></CartProvider>
}
