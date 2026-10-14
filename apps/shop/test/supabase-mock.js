/* Stand-in for @supabase/supabase-js for the headless shop test. */
export const state = { rpcs: [], empty: typeof window !== 'undefined' && /[?&]seed=1/.test(window.location.search) }
const PRODUCTS = [
  { id: 'p1', slug: 'yellow-maize', name: 'Yellow maize', unit: '50 kg bag', price_kobo: 4500000, compare_at_kobo: 5000000, summary: 'Dried and graded', description: 'Stores well.\n\nMills cleanly.', images: ['products/a.webp', 'products/b.webp'], featured: true, sort: 0, product_categories: { slug: 'grain', name: 'Grains' }, stock: { in_stock: true, available: 7 } },
  { id: 'p2', slug: 'palm-oil', name: 'Red palm oil', unit: '25 L keg', price_kobo: 5500000, compare_at_kobo: null, summary: '', description: '', images: [], featured: false, sort: 1, product_categories: { slug: 'processed', name: 'Processed' }, stock: { in_stock: false, available: 0 } },
]
const SETTINGS = [
  { key: 'shop', value: { name: 'Viverst Agro Shop' } },
  { key: 'delivery', value: { flat_fee_kobo: 150000, note: 'Lagos only for now.' } },
  { key: 'payments', value: { transfer: { enabled: true, bank_name: 'GTBank', account_name: 'Viverst Agro', account_number: '0123456789', instructions: 'Pay and send the reference.' }, paystack: { enabled: false } } },
  { key: 'contact', value: { email: 'agro@viverst.com', whatsapp: '2348000000000' } },
]
function builder(table) {
  const f = []; let single = false
  const self = new Proxy({}, { get(_t, k) {
    if (k === 'then') return (res, rej) => run().then(res, rej)
    if (k === 'maybeSingle' || k === 'single') return () => { single = true; return self }
    if (k === 'eq') return (c, v) => { f.push([c, v]); return self }
    return () => self
  } })
  async function run() {
    let rows = table === 'products' ? (state.empty ? [] : PRODUCTS) : table === 'public_settings' ? SETTINGS : []
    for (const [c, v] of f) rows = rows.filter((r) => c === 'active' || r[c] === v)
    return { data: single ? rows[0] ?? null : rows, error: null }
  }
  return self
}
export function createClient() {
  return {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: builder,
    rpc: async (name, args) => {
      state.rpcs.push({ name, args })
      if (args.p_items.some((i) => i.qty > 7)) return { data: null, error: { message: 'one of the items is out of stock' } }
      return { data: { id: 'o-new', number: 'VA-1042', total_kobo: 150000 + args.p_items.reduce((s, i) => s + i.qty * 4500000, 0) }, error: null }
    },
  }
}
