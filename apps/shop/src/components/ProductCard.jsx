import { Link } from 'react-router-dom'
import { money } from '../lib/format.js'
import { useCart } from '../lib/cartContext.js'

export default function ProductCard({ p }) {
  const { add } = useCart()
  return (
    <article className={`pcard${p.inStock ? '' : ' pcard--out'}`}>
      <Link to={`/products/${p.slug}`} className="pcard-media">
        {p.image ? <img src={p.image} alt="" width="1120" height="788" loading="lazy" decoding="async" /> : <span className="pcard-noimg" aria-hidden="true" />}
        {!p.inStock && <span className="pcard-badge">Sold out</span>}
        {p.inStock && p.compare_at_kobo > p.price_kobo && <span className="pcard-badge pcard-badge--deal">Offer</span>}
      </Link>
      <div className="pcard-body">
        {p.category?.name && <span className="eyebrow">{p.category.name}</span>}
        <h3><Link to={`/products/${p.slug}`}>{p.name}</Link></h3>
        <p className="pcard-unit">{p.unit}</p>
        <div className="pcard-foot">
          <span className="pcard-price">{money(p.price_kobo)}{p.compare_at_kobo > p.price_kobo && <s>{money(p.compare_at_kobo)}</s>}</span>
          <button type="button" className="btn btn--primary btn--sm" disabled={!p.inStock} onClick={() => add(p)}>{p.inStock ? 'Add' : 'Sold out'}</button>
        </div>
      </div>
    </article>
  )
}
