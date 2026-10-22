import { supabase } from './supabase.js'
import { IMAGE_BASE } from './config.js'
import { SEED_PRODUCTS } from './seed.js'
import flyer from '@brand-assets/agro/img/food-package-december.webp'

export const imageUrl = (p) => !p ? null : p.startsWith('http') ? p : IMAGE_BASE + p

const SELECT = 'id, slug, name, unit, price_kobo, compare_at_kobo, summary, description, images, featured, sort, product_categories(slug, name), stock(in_stock, available)'
/* a product entered in the admin without photos borrows the stock photo of the
   same name from the starter set, so the shop never shows an empty tile */
// the food package products (migration 019) show the December flyer until a photo is uploaded
const PACKAGE_PHOTOS = { 'merry-package': flyer, 'jolly-package': flyer, 'berekete-package': flyer }
const seedImage = (slug) => SEED_PRODUCTS.find((p) => p.slug === slug)?.image || PACKAGE_PHOTOS[slug] || null
const shape = (r) => {
  const own = (r.images || []).map(imageUrl)
  const fallback = own.length ? null : seedImage(r.slug)
  return { ...r, category: r.product_categories, inStock: r.stock?.in_stock ?? true, available: r.stock?.available ?? 99, image: own[0] || fallback, gallery: own.length ? own : fallback ? [fallback] : [] }
}

/* Until products exist in the admin, the placeholder catalogue shows. A sample
   product can be browsed but not bought: checkout is for real stock. */
let listCache = null
export const resetCatalog = () => { listCache = null }
export async function getProducts() {
  if (!listCache) listCache = supabase.from('products').select(SELECT).eq('active', true).order('sort').order('name')
    .then(({ data, error }) => { if (error) throw error; return data.length ? data.map(shape) : SEED_PRODUCTS })
    .catch(() => SEED_PRODUCTS)
  return listCache
}
export async function getProduct(slug) {
  const all = await getProducts()
  return all.find((p) => p.slug === slug) ?? null
}
export async function getSettings() {
  const { data } = await supabase.from('public_settings').select('key, value')
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]))
}
