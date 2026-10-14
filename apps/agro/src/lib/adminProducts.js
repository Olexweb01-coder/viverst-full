/**
 * Products from the admin's database, in the shape the Products page already
 * uses. The publishable key can only read active products, prices and stock;
 * nothing else. If the admin can't be reached the page shows the seed list.
 */
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://puuouftwclqkrrnnzkay.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_4g1ggURteogjrNMHtLx0NA_eY1K6yjD'
const IMG = `${URL}/storage/v1/object/public/product-images/`

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
export const money = (kobo) => naira.format((Number(kobo) || 0) / 100)
const imageUrl = (p) => !p ? undefined : p.startsWith('http') ? p : IMG + p

export function mapProduct(r) {
  return {
    slug: r.slug, name: r.name, category: r.product_categories?.slug || 'other',
    categoryLabel: r.product_categories?.name || 'Products',
    form: r.unit, minOrder: '1', price: money(r.price_kobo), price_kobo: r.price_kobo,
    body: r.summary || r.description || '', img: imageUrl(r.images?.[0]),
    inStock: r.stock ? r.stock.in_stock : true, sample: false, fromAdmin: true,
  }
}

let cache = null
export function fetchAdminProducts() {
  if (cache) return cache
  cache = (async () => {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000)
    try {
      const res = await fetch(`${URL}/rest/v1/products?select=slug,name,unit,price_kobo,summary,description,images,sort,product_categories(slug,name),stock(in_stock)&active=is.true&order=sort.asc,name.asc`, { headers: { apikey: KEY, Accept: 'application/json' }, signal: ctrl.signal })
      if (!res.ok) throw new Error(`products ${res.status}`)
      const rows = await res.json()
      const products = rows.map(mapProduct)
      const seen = new Map()
      for (const p of products) if (!seen.has(p.category)) seen.set(p.category, { key: p.category, label: p.categoryLabel })
      return { products, categories: [...seen.values()] }
    } finally { clearTimeout(t) }
  })()
  return cache
}
