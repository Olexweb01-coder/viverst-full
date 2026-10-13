/* A stand-in for @supabase/supabase-js used only by the headless test. It
   answers the queries the admin makes with fixed data and records writes. */
const OWNER = { id: '11111111-1111-1111-1111-111111111111', email: 'owner@viverst.com' }
export const state = { session: { user: OWNER }, writes: [], uploads: [] }

const DATA = {
  staff: [{ user_id: OWNER.id, email: OWNER.email, name: 'Viverst', role: 'owner', active: true }],
  product_categories: [{ id: 'c1', name: 'Grains', slug: 'grains', sort: 0 }],
  products: [
    { id: 'p1', slug: 'yellow-maize', name: 'Yellow maize', unit: '50 kg bag', price_kobo: 4500000, compare_at_kobo: null, images: ['products/a.jpg'], active: true, featured: false, sort: 0, category_id: 'c1', summary: 'Dried and graded', description: '', product_categories: { name: 'Grains' }, inventory: { on_hand: 7 } },
    { id: 'p2', slug: 'hidden', name: 'Hidden one', unit: 'bag', price_kobo: 100, compare_at_kobo: null, images: [], active: false, featured: false, sort: 1, category_id: null, summary: '', description: '', product_categories: null, inventory: { on_hand: 0 } },
  ],
  inventory: [{ product_id: 'p1', on_hand: 2, low_stock_at: 5, products: { name: 'Yellow maize', active: true } }],
  orders: [{ id: 'o1', number: 'VA-1001', name: 'Ada', email: 'ada@x.com', phone: '0801', status: 'awaiting_payment', payment_method: 'transfer', total_kobo: 13500000, created_at: new Date().toISOString() }],
  order_detail: [{ id: 'o1', number: 'VA-1001', name: 'Ada', email: 'ada@x.com', phone: '0801', status: 'awaiting_payment', payment_method: 'transfer', payment_ref: null, paid_at: null,
    subtotal_kobo: 13500000, delivery_kobo: 0, total_kobo: 13500000, delivery_address: { line1: '1 Road', city: 'Lagos', state: 'Lagos' }, customer_note: 'call first', staff_note: '', created_at: new Date().toISOString(),
    items: [{ id: 1, product_id: 'p1', name: 'Yellow maize', unit: '50 kg bag', unit_price_kobo: 4500000, qty: 3, line_kobo: 13500000 }] }],
  inventory_movements: [{ id: 9, delta: 10, reason: 'received', note: 'first delivery', order_id: null, created_at: new Date().toISOString() }],
  settings: [
    { key: 'shop', value: { name: 'Viverst Agro Shop', currency: 'NGN' } },
    { key: 'delivery', value: { flat_fee_kobo: 150000, note: 'Lagos only' } },
    { key: 'payments', value: { transfer: { enabled: true, bank_name: 'GTB', account_name: 'Viverst', account_number: '0123', instructions: 'Pay' }, paystack: { enabled: false } } },
    { key: 'contact', value: { email: 'info@viverst.com', phone: '', whatsapp: '' } },
  ],
}
export const rpcCalls = []
const RPC = {
  has_secret: () => false,
  set_secret: () => null,
  cancel_order: () => null,
  add_staff: ({ p_email }) => p_email === 'ghost@x.com' ? { error: { message: 'No account with that email yet.' } } : { data: { email: p_email }, error: null },
}

function builder(table) {
  const q = { _f: [], _single: false, _count: false }
  const self = new Proxy(q, {
    get(t, k) {
      if (k === 'then') return (res, rej) => run().then(res, rej)
      if (k === 'single' || k === 'maybeSingle') return () => { t._single = true; return self }
      if (k === 'insert' || k === 'update' || k === 'delete' || k === 'upsert') return (row) => { state.writes.push({ table, op: k, row }); t._write = k; return self }
      if (k === 'select') return (_cols, opts) => { if (opts?.count) t._count = true; return self }
      if (k === 'eq') return (col, val) => { t._f.push([col, val]); return self }
      return () => self   // order, limit, gte, not, in, ...: no-op
    },
  })
  async function run() {
    if (q._write) {
      const id = q._write === 'insert' ? 'new-id' : (q._f.find((f) => f[0] === 'id')?.[1] ?? 'id')
      return { data: q._single ? { id, name: 'New', slug: 'new' } : null, error: null }
    }
    let rows = DATA[table] || []
    for (const [col, val] of q._f) rows = rows.filter((r) => r[col] === val || (col.includes('.')))
    if (q._count) return { data: null, count: rows.length, error: null }
    return { data: q._single ? (rows[0] ?? null) : rows, error: null }
  }
  return self
}

export function createClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: state.session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async ({ email }) => email === 'bad@x.com' ? { error: { message: 'Invalid login credentials' } } : { data: {}, error: null },
      signOut: async () => { state.session = null },
    },
    from: builder,
    rpc: async (name, args) => { rpcCalls.push({ name, args }); const r = RPC[name]?.(args); return r && (r.error || 'data' in r) ? r : { data: r ?? null, error: null } },
    storage: { from: () => ({
      getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn.test/${p}` } }),
      upload: async (path) => { state.uploads.push(path); return { error: null } },
      remove: async () => ({ error: null }),
    }) },
  }
}
