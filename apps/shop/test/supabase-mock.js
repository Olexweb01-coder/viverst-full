/* Stand-in for @supabase/supabase-js for the headless shop test. */
export const state = { rpcs: [], invokes: [], paystack: false, user: null, writes: [], zones: typeof window !== 'undefined' && /[?&]zones=1/.test(window.location.search), empty: typeof window !== 'undefined' && /[?&]seed=1/.test(window.location.search) }
const PRODUCTS = [
  { id: 'p1', slug: 'yellow-maize', name: 'Yellow maize', unit: '50 kg bag', price_kobo: 4500000, compare_at_kobo: 5000000, summary: 'Dried and graded', description: 'Stores well.\n\nMills cleanly.', images: ['products/a.webp', 'products/b.webp'], featured: true, sort: 0, product_categories: { slug: 'grain', name: 'Grains' }, stock: { in_stock: true, available: 7 } },
  { id: 'p2', slug: 'red-palm-oil', name: 'Red palm oil', unit: '25 L keg', price_kobo: 5500000, compare_at_kobo: null, summary: '', description: '', images: [], featured: false, sort: 1, product_categories: { slug: 'processed', name: 'Processed' }, stock: { in_stock: false, available: 0 } },
]
const SETTINGS = [
  { key: 'shop', value: { name: 'Viverst Agro Shop' } },
  { key: 'delivery', get value() { return state.zones ? { mode: 'zones', home_state: 'Lagos', home_default_kobo: 250000, areas: [{ name: 'Ikeja', fee_kobo: 200000 }, { name: 'Lekki', fee_kobo: 350000 }], outside_default_kobo: 800000, state_fees: { Ogun: 500000 }, note: 'We call to confirm.' } : { flat_fee_kobo: 150000, note: 'Lagos only for now.' } } },
  { key: 'payments', get value() { return { transfer: { enabled: true, bank_name: 'GTBank', account_name: 'Viverst Agro', account_number: '0123456789', instructions: 'Pay and send the reference.' }, paystack: { enabled: state.paystack, public_key: 'pk_test_x' } } } },
  { key: 'contact', value: { email: 'agro@viverst.com', whatsapp: '2348000000000' } },
]
function builder(table) {
  const f = []; let single = false
  const self = new Proxy({}, { get(_t, k) {
    if (k === 'then') return (res, rej) => run().then(res, rej)
    if (k === 'maybeSingle' || k === 'single') return () => { single = true; return self }
    if (k === 'eq') return (c, v) => { f.push([c, v]); return self }
    if (k === 'update' || k === 'upsert' || k === 'insert') return (row) => { state.writes.push({ table, op: k, row }); return self }
    return () => self
  } })
  async function run() {
    let rows = table === 'products' ? (state.empty ? [] : PRODUCTS) : table === 'public_settings' ? SETTINGS
      : table === 'customers' ? (state.user ? [{ user_id: state.user.id, name: 'Ada Obi', phone: '0801', email: state.user.email }] : [])
      : table === 'addresses' ? (state.user ? [{ customer_id: state.user.id, line1: '12 Harvest Rd', line2: '', city: 'Ikeja', state: 'Lagos', is_default: true }] : [])
      : table === 'orders' ? (state.user ? [{ id: 'o9', number: 'VA-1009', status: 'delivered', total_kobo: 4500000, created_at: '2026-10-01T10:00:00Z', payment_method: 'transfer' }] : []) : []
    for (const [c, v] of f) rows = rows.filter((r) => ['active', 'user_id', 'customer_id'].includes(c) || r[c] === v)
    return { data: single ? rows[0] ?? null : rows, error: null }
  }
  return self
}
export function createClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: state.user ? { user: state.user } : null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async ({ email }) => email === 'bad@x.com' ? { error: { message: 'Invalid login credentials' } } : { data: {}, error: null },
      signUp: async () => ({ data: { session: null }, error: null }),
      resetPasswordForEmail: async () => ({ error: null }), signOut: async () => { state.user = null },
    },
    from: builder,
    functions: { invoke: async (name, { body }) => { state.invokes.push({ name, body }); if (name === 'paystack/init') return { data: { ok: true, url: 'https://checkout.paystack.com/x', reference: 'VA-1042-abc' }, error: null }; if (name === 'paystack/verify') return { data: { ok: true, paid: body.reference === 'VA-1042-abc' }, error: null }; return { data: null, error: { message: 'unknown' } } } },
    rpc: async (name, args) => {
      state.rpcs.push({ name, args })
      if (args.p_items.some((i) => i.qty > 7)) return { data: null, error: { message: 'one of the items is out of stock' } }
      return { data: { id: 'o-new', number: 'VA-1042', total_kobo: 150000 + args.p_items.reduce((s, i) => s + i.qty * 4500000, 0) }, error: null }
    },
  }
}
