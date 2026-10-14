/* A stand-in for @supabase/supabase-js used only by the headless test. It
   answers the queries the admin makes with fixed data and records writes. */
const OWNER = { id: '11111111-1111-1111-1111-111111111111', email: 'owner@viverst.com' }
export const state = { session: { user: OWNER }, writes: [], uploads: [], invokes: [] }

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
  events: [
    { id: 'e1', site: 'agro', slug: 'reimagining', title: 'Reimagining Agriculture', summary: 'A day on the chain', body: 'Details', location: 'Lagos', starts_at: new Date(Date.now() + 86400000 * 3).toISOString(), ends_at: null, cover: null, registration: true, capacity: 100, status: 'published', event_registrations: [{ count: 2 }] },
    { id: 'e2', site: 'studio', slug: 'old-show', title: 'Old showcase', summary: '', body: '', location: 'Online', starts_at: new Date(Date.now() - 86400000 * 30).toISOString(), ends_at: null, cover: null, registration: false, capacity: null, status: 'draft', event_registrations: [{ count: 0 }] },
  ],
  event_registrations: [
    { id: 1, event_id: 'e1', name: 'Ada', email: 'ada@x.com', phone: '0801', organisation: 'Farmers Co', created_at: new Date().toISOString() },
    { id: 2, event_id: 'e1', name: 'Bola', email: 'bola@x.com', phone: '', organisation: '', created_at: new Date().toISOString() },
  ],
  posts: [
    { id: 'post1', slug: 'cassava-prices', title: 'Cassava prices this season', arm: 'agro', excerpt: 'Why they moved', body: 'Body text', cover: null, tags: ['prices'], status: 'review', author_kind: 'ai', author_id: null, sources: [{ title: 'FAO', url: 'https://fao.org' }], review_until: new Date(Date.now() + 36e5 * 20).toISOString(), held: false, publish_at: null, published_at: null, updated_at: new Date().toISOString() },
    { id: 'post2', slug: 'brand-refresh', title: 'Our brand refresh', arm: 'studio', excerpt: '', body: '', cover: null, tags: [], status: 'published', author_kind: 'staff', author_id: OWNER.id, sources: [], review_until: null, held: false, publish_at: null, published_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  review_notes: [],
  notifications: [{ id: 1, kind: 'order', title: 'New order VA-1001', body: 'Ada · ₦135,000', link: '/orders?open=o1', created_at: new Date().toISOString() }, { id: 2, kind: 'stock_low', title: 'Running low: Yellow maize', body: '2 left', link: '/inventory', created_at: new Date().toISOString() }],
  notification_reads: [{ notification_id: 2, staff_id: OWNER.id }],
  assistant_chats: [{ id: 'chat1', title: 'Orders this week', messages: [{ role: 'user', content: 'orders?' }, { role: 'assistant', content: 'Two orders.', actions: [], sources: [] }], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
  ai_topics: [{ id: 7, topic: 'How to store maize through the rains', arm: 'agro', status: 'queued', post_id: null, error: null, created_at: new Date().toISOString() }],
  ai_runs: [{ id: 3, started_at: new Date().toISOString(), finished_at: new Date().toISOString(), trigger: 'manual', provider: 'groq', ok: true, detail: '4 source(s)', post_id: 'post1' }],
  settings: [
    { key: 'shop', value: { name: 'Viverst Agro Shop', currency: 'NGN' } },
    { key: 'delivery', value: { flat_fee_kobo: 150000, note: 'Lagos only' } },
    { key: 'payments', value: { transfer: { enabled: true, bank_name: 'GTB', account_name: 'Viverst', account_number: '0123', instructions: 'Pay' }, paystack: { enabled: false } } },
    { key: 'contact', value: { email: 'info@viverst.com', phone: '', whatsapp: '' } },
    { key: 'notifications', value: { email_enabled: true, email_to: '', from: 'Viverst Admin <admin@viverst.com>' } },
    { key: 'integrations', value: { registrations_script_url: 'https://script.test/exec' } },
    { key: 'automation', value: { enabled: false, arms: ['global', 'agro'], days: [1, 3, 5], hour: 9, review_hours: 24, self_find: true } },
  ],
}
export const rpcCalls = []
const RPC = {
  has_secret: () => false,
  ai_keys_present: () => ({ groq_api_key: true, cerebras_api_key: false, gemini_api_key: false, tavily_api_key: true }),
  analytics_summary: () => ({ weeks: [{ week: '29 Sep', orders: 0, revenue_kobo: 0 }, { week: '06 Oct', orders: 2, revenue_kobo: 9000000 }, { week: '13 Oct', orders: 1, revenue_kobo: 13500000 }], top_products: [{ name: 'Yellow maize', qty: 5, kobo: 22500000 }], by_status: { awaiting_payment: 1, paid: 2 }, posts: [{ arm: 'agro', status: 'review', n: 1 }, { arm: 'studio', status: 'published', n: 1 }], totals: { orders_all: 3, revenue_paid_kobo: 9000000, awaiting: 1, customers: 2, posts_published: 1, events_upcoming: 1, registrations_30d: 2 } }),
  notification_counts: () => ({ unread: 1 }),
  mark_all_read: () => null,
  content_counts: () => ({ posts_in_review: 1, posts_held: 0, events_upcoming: 1, registrations_7d: 2 }),
  send_post_to_review: () => ({ status: 'review' }),
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
      const id = q._write === 'insert' ? (table === 'assistant_chats' ? 'chat-new' : 'new-id') : (q._f.find((f) => f[0] === 'id')?.[1] ?? 'id')
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
    functions: { invoke: async (name, { body }) => {
      state.invokes.push({ name, body })
      if (name === 'assistant') return { data: { ok: true, provider: 'groq', answer: 'One order is **awaiting payment** [1].\n\n- VA-1001 from Ada', sources: [{ title: 'Orders', url: 'https://x/orders' }], actions: [{ type: 'queue_topic', topic: 'Storing maize through the rains', arm: 'agro' }, { type: 'open', path: '/orders?status=awaiting_payment', label: 'See awaiting payment' }] }, error: null }
      return { data: { ok: true, post: { id: 'post9', title: 'Storing maize well' }, provider: 'groq', sources: 3 }, error: null } } },
    rpc: async (name, args) => { rpcCalls.push({ name, args }); const r = RPC[name]?.(args); return r && (r.error || 'data' in r) ? r : { data: r ?? null, error: null } },
    storage: { from: () => ({
      getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn.test/${p}` } }),
      upload: async (path) => { state.uploads.push(path); return { error: null } },
      remove: async () => ({ error: null }),
    }) },
  }
}
