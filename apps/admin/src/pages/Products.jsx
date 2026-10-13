import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { money } from '../lib/format.js'
import { imageUrl } from '../lib/images.js'
import { PageHead, Note, Empty, Chip } from '../components/ui.jsx'

export default function Products() {
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let alive = true
    supabase.from('products')
      .select('id, slug, name, unit, price_kobo, images, active, featured, sort, product_categories(name), inventory(on_hand)')
      .order('sort').order('name')
      .then(({ data, error }) => { if (!alive) return; if (error) setError(error.message); else setRows(data) })
    return () => { alive = false }
  }, [])

  const shown = rows?.filter((p) => filter === 'all' || (filter === 'active' ? p.active : !p.active)) ?? []

  return (
    <div className="page">
      <PageHead title="Products" lede="What the shop sells. Only active products are visible to customers.">
        <Link className="btn btn-primary" to="/products/new"><Plus aria-hidden="true" />New product</Link>
      </PageHead>
      <Note kind="error">{error}</Note>
      {rows && rows.length === 0 ? (
        <div className="panel"><Empty title="No products yet" body="Add your first product and it can be on the shop in a minute.">
          <Link className="btn btn-primary" to="/products/new">New product</Link></Empty></div>
      ) : rows && (
        <>
          <div className="filters" role="group" aria-label="Filter">
            {[['all', 'All'], ['active', 'Active'], ['inactive', 'Hidden']].map(([k, l]) => (
              <button key={k} type="button" className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>))}
          </div>
          <div className="panel"><div className="table-wrap"><table className="products-table">
            <thead><tr><th></th><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Shown</th></tr></thead>
            <tbody>{shown.map((p) => (
              <tr key={p.id} className="row-link" data-status={p.active ? undefined : 'inactive'} onClick={() => nav(`/products/${p.id}`)}>
                <td style={{ width: 60 }}>{p.images?.[0] ? <img className="thumb" src={imageUrl(p.images[0])} alt="" /> : <div className="thumb" />}</td>
                <td><strong>{p.name}</strong><div className="muted small">{p.unit}</div></td>
                <td className="muted">{p.product_categories?.name || '—'}</td>
                <td className="num">{money(p.price_kobo)}</td>
                <td className="num">{p.inventory?.on_hand ?? 0}</td>
                <td><Chip kind={p.active ? 'ok' : 'dim'}>{p.active ? 'In shop' : 'Hidden'}</Chip></td>
              </tr>))}</tbody>
          </table></div></div>
        </>
      )}
    </div>
  )
}
