import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag, ArrowUpRight } from 'lucide-react'
import lockup from '@brand-assets/agro/lockup.webp'
import { useCart } from '../lib/cartContext.js'
import { SHOP } from '../lib/config.js'

export default function Header() {
  const { count } = useCart()
  return (
    <header className="shop-header">
      <div className="container shop-header-inner">
        <Link to="/" className="shop-brand" aria-label={`${SHOP.name} home`}><img src={lockup} alt="Viverst Agro" width="150" height="40" /><span className="shop-brand-tag">Shop</span></Link>
        <nav className="shop-nav" aria-label="Shop">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <a href={SHOP.parentUrl} className="shop-nav-ext">Viverst Agro <ArrowUpRight size={14} aria-hidden="true" /></a>
        </nav>
        <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
          <ShoppingBag size={20} aria-hidden="true" />{count > 0 && <span className="cart-count">{count}</span>}
        </Link>
      </div>
    </header>
  )
}
