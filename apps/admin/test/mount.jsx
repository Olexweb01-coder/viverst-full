/* Headless check: mounts the admin in jsdom with a mocked Supabase, walks
   every route as the owner, drives the product form, and audits accessibility. */
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { state, rpcCalls } from './supabase-mock.js'

const ROUTES = [
  ['/', 'Good'],
  ['/assistant', 'Assistant'],
  ['/notifications', 'Notifications'],
  ['/orders', 'Orders'],
  ['/orders?open=o1', 'Orders'],
  ['/products', 'Products'],
  ['/products/new', 'New product'],
  ['/products/p1', 'Yellow maize'],
  ['/inventory', 'Stock'],
  ['/posts', 'Blog'],
  ['/posts/new', 'Write a post'],
  ['/posts/post1', 'Cassava prices this season'],
  ['/automation', 'Automation'],
  ['/events', 'Events'],
  ['/events/new', 'New event'],
  ['/events/e1', 'Reimagining Agriculture'],
  ['/analytics', 'Analytics'],
  ['/settings', 'Settings'],
  ['/food-package', 'Food package'],
  ['/staff', 'Staff'],
  ['/no-such-page', 'Good'],
]

const problems = []
const a11y = []
const origError = console.error
console.error = (...a) => {
  const msg = a.map((x) => (x && x.message) || String(x)).join(' ')
  problems.push(msg); origError('   [console.error]', msg.slice(0, 240))
}
window.addEventListener('error', (e) => problems.push(`window error: ${e.message}`))
window.addEventListener('unhandledrejection', (e) => problems.push(`rejection: ${e.reason}`))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(fn, label, ms = 3000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(25) }
  problems.push(`timed out waiting for ${label}`); return false
}
const h1 = () => document.querySelector('h1')?.textContent ?? ''
const go = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new window.PopStateEvent('popstate')) }

function audit(route) {
  for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) a11y.push(`${route}: img without alt`)
  for (const b of document.querySelectorAll('button')) if (!b.textContent.trim() && !b.getAttribute('aria-label')) a11y.push(`${route}: unnamed button`)
  for (const i of document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')) {
    const labelled = i.closest('label') || (i.id && document.querySelector(`label[for="${i.id}"]`)) || i.getAttribute('aria-label')
    if (!labelled) a11y.push(`${route}: unlabelled field ${i.name || i.type}`)
  }
  if (document.querySelectorAll('h1').length !== 1) a11y.push(`${route}: expected one h1, found ${document.querySelectorAll('h1').length}`)
}

// the registrations sheet summary comes from a Google Apps Script; fake it here
globalThis.fetch = async (url) => ({ ok: true, json: async () => url.includes('script.test')
  ? { ok: true, url: 'https://docs.google.com/spreadsheets/d/SHEET/edit', events: [{ eventId: 'reimagining', title: 'Reimagining Agriculture', tab: 'Reimagining', gid: 42, count: 10 }, { eventId: 'field-day-2027', title: 'Field day', tab: 'Field day', gid: 43, count: 3 }] }
  : { ok: false } })

const root = createRoot(document.getElementById('root'))
root.render(<App />)

console.log('\n ROUTES (owner signed in)')
for (const [path, expect] of ROUTES) {
  go(path)
  await waitFor(() => h1().includes(expect), `${path} → "${expect}"`)
  await sleep(120)
  audit(path)
  console.log(`  ${path.padEnd(16)} ${h1().slice(0, 40)}`)
}

console.log('\n PHONE MENU')
go('/'); await waitFor(() => document.querySelector('.topbar-btn'), 'topbar')
document.querySelector('.topbar-btn').click(); await sleep(40)
console.log(`  menu button → rail ${document.querySelector('.rail').classList.contains('open') ? 'open' : 'NOT open'}, backdrop ${document.querySelector('.rail-backdrop') ? 'shown' : 'MISSING'}`)
if (!document.querySelector('.rail').classList.contains('open')) problems.push('phone menu did not open')
;[...document.querySelectorAll('.rail nav a')].find((a) => a.textContent.includes('Orders')).click(); await waitFor(() => h1() === 'Orders', 'navigate from drawer')
console.log(`  tap "Orders" → ${h1()}, rail ${document.querySelector('.rail').classList.contains('open') ? 'STILL OPEN' : 'closed'}`)
if (document.querySelector('.rail').classList.contains('open')) problems.push('drawer did not close on navigation')

console.log('\n HOSTING NOTICE')
go('/'); await waitFor(() => h1().startsWith('Good') && document.querySelector('.hosting-notice'), 'notice on Today')
document.querySelector('.hosting-notice button').click(); await sleep(40)
console.log(`  shown on Today, dismissed → ${document.querySelector('.hosting-notice') ? 'STILL VISIBLE' : 'hidden'}; stored=${!!window.localStorage.getItem('viverst-admin:hosting-notice-dismissed')}`)
if (document.querySelector('.hosting-notice')) problems.push('hosting notice did not hide on dismiss')

console.log('\n PRODUCTS LIST')
go('/products'); await waitFor(() => h1() === 'Products' && document.querySelectorAll('.filters button').length === 3, 'products page with filters')
await waitFor(() => document.querySelectorAll('tbody tr').length === 2, 'two product rows')
console.log(`  ${document.querySelectorAll('tbody tr').length} product rows; stock-photo stand-in shown for the product without photos: ${document.querySelector('.thumb-stock') ? 'yes' : 'NO'}`)
if (!document.querySelector('.thumb-stock')) problems.push('stock photo stand-in missing in admin list')
const hidden = [...document.querySelectorAll('.filters button')].find((b) => b.textContent === 'Hidden')
hidden.click(); await sleep(60)
const rowsAfter = document.querySelectorAll('tbody tr').length
console.log(`  filter "Hidden" → ${rowsAfter} row(s)`); if (rowsAfter !== 1) problems.push('hidden filter did not narrow to 1 row')
const row = document.querySelector('tbody tr'); row.click(); await waitFor(() => h1().includes('Hidden one'), 'row click opens editor')
console.log(`  row click → ${h1()}`)

console.log('\n PRODUCT FORM')
go('/products/new'); await waitFor(() => h1() === 'New product', 'new product page')
const setVal = (el, v) => { const d = Object.getOwnPropertyDescriptor(el.__proto__, 'value'); d.set.call(el, v); el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })) }
const inputs = [...document.querySelectorAll('input.input, .input-prefix input')]
const name = inputs[0]; setVal(name, 'Red Palm Oil 5 L'); await sleep(30)
const slug = inputs[1]
console.log(`  typing a name auto-fills slug → "${slug.value}"`); if (slug.value !== 'red-palm-oil-5-l') problems.push(`slug was "${slug.value}"`)
state.writes.length = 0
document.querySelector('form').requestSubmit(); await sleep(80)
console.log(`  submit with no price → ${document.querySelector('.note-error')?.textContent ?? 'no error shown'}`)
if (state.writes.length) problems.push('form saved without a price')
const unit = inputs.find((i) => i.required && i !== name); setVal(unit, '5 L keg')
const price = document.querySelector('.input-prefix input'); setVal(price, '18500'); await sleep(30)
const opening = [...document.querySelectorAll('input.input')].find((i) => i.closest('label')?.textContent.startsWith('Opening stock')); setVal(opening, '20'); await sleep(20)
document.querySelector('form').requestSubmit(); await sleep(150)
const w = state.writes.find((x) => x.table === 'products' && x.op === 'insert')
console.log(`  submit valid → insert ${w ? 'sent' : 'MISSING'}; price_kobo=${w?.row.price_kobo}`)
if (!w || w.row.price_kobo !== 1850000) problems.push('product insert missing or wrong price')
await waitFor(() => window.location.pathname === '/products/new-id', 'redirect to the created product')
console.log(`  after create → ${window.location.pathname}`)
const om = state.writes.find((w) => w.table === 'inventory_movements')
console.log(`  opening stock 20 → movement ${om ? `delta=${om.row.delta}, reason=${om.row.reason}, note=${om.row.note}` : 'MISSING'}`)
if (!om || om.row.delta !== 20) problems.push('opening stock not recorded')

console.log('\n ORDERS')
go('/orders?open=o1'); await waitFor(() => document.querySelector('.drawer .order-items'), 'order drawer with items')
const drawerText = document.querySelector('.drawer').textContent
console.log(`  drawer shows ${document.querySelectorAll('.drawer .order-items tbody tr').length} item, total ${drawerText.includes('135,000.00') ? 'ok' : 'MISSING'}, customer note ${drawerText.includes('call first') ? 'ok' : 'MISSING'}`)
if (!drawerText.includes('135,000.00')) problems.push('order total not shown')
state.writes.length = 0
const markPaid = [...document.querySelectorAll('.drawer button')].find((b) => b.textContent === 'Mark paid'); markPaid.click(); await sleep(120)
const upd = state.writes.find((w) => w.table === 'orders' && w.op === 'update')
console.log(`  "Mark paid" → update ${upd ? `status=${upd.row.status}, paid_at set=${!!upd.row.paid_at}` : 'MISSING'}`)
if (!upd || upd.row.status !== 'paid' || !upd.row.paid_at) problems.push('mark paid did not update correctly')
window.prompt = () => 'changed mind'
const cancelBtn = [...document.querySelectorAll('.drawer button')].find((b) => b.textContent === 'Cancel order'); cancelBtn.click(); await sleep(120)
const cancelRpc = rpcCalls.find((c) => c.name === 'cancel_order')
console.log(`  "Cancel order" → rpc cancel_order ${cancelRpc ? `with reason "${cancelRpc.args.p_reason}"` : 'MISSING'}`)
if (!cancelRpc) problems.push('cancel did not call cancel_order')
document.querySelector('.drawer-head button').click(); await sleep(60)
console.log(`  close → drawer ${document.querySelector('.drawer') ? 'STILL OPEN' : 'closed'}, url ${window.location.search || '(clean)'}`)
if (document.querySelector('.drawer')) problems.push('drawer did not close')

console.log('\n STOCK')
go('/inventory'); await waitFor(() => h1() === 'Stock' && document.querySelector('tbody tr'), 'stock rows')
document.querySelector('tbody tr .btn').click(); await waitFor(() => document.querySelector('.drawer form'), 'stock drawer')
const stockInputs = [...document.querySelectorAll('.drawer form input.input')]
state.writes.length = 0
setVal(stockInputs[0], '12'); setVal(stockInputs[1], 'invoice 44'); document.querySelector('.drawer form').requestSubmit(); await sleep(120)
const mv = state.writes.find((w) => w.table === 'inventory_movements')
console.log(`  record "Received 12" → ${mv ? `delta=${mv.row.delta}, reason=${mv.row.reason}, note="${mv.row.note}"` : 'MISSING'}`)
if (!mv || mv.row.delta !== 12 || mv.row.reason !== 'received') problems.push('stock movement wrong')
const reasonSel = document.querySelector('.drawer select'); setVal(reasonSel, 'damaged'); reasonSel.dispatchEvent(new window.Event('change', { bubbles: true })); await sleep(30)
setVal(stockInputs[0], '99'); document.querySelector('.drawer form').requestSubmit(); await sleep(80)
console.log(`  damaged 99 (more than on hand) → ${document.querySelector('.drawer .note-error')?.textContent.slice(0, 50) ?? 'NO ERROR'}`)
if (!document.querySelector('.drawer .note-error')) problems.push('negative stock was not blocked')
document.querySelector('.drawer-head button').click(); await sleep(40)

console.log('\n SETTINGS')
go('/settings'); await waitFor(() => h1() === 'Settings' && document.querySelectorAll('section.panel').length === 7, 'seven settings panels')
const bank = [...document.querySelectorAll('input.input')].find((i) => i.value === 'GTB')
console.log(`  loaded: bank=${bank ? 'GTB' : 'MISSING'}, fee=${[...document.querySelectorAll('.input-prefix input')][0]?.value}`)
state.writes.length = 0
const saveBtns = [...document.querySelectorAll('.panel-head .btn')]; saveBtns[1].click(); await sleep(100)
const up = state.writes.find((w) => w.table === 'settings')
console.log(`  save delivery → upsert ${up ? `${up.row.key} flat_fee_kobo=${up.row.value.flat_fee_kobo}` : 'MISSING'}`)
if (!up || up.row.value.flat_fee_kobo !== 150000) problems.push('delivery save wrong')
const deliveryPanel = [...document.querySelectorAll('section.panel')].find((p) => p.querySelector('h2')?.textContent === 'Delivery')
;[...deliveryPanel.querySelectorAll('.filters button')][1].click(); await waitFor(() => [...deliveryPanel.querySelectorAll('button')].some((b) => b.textContent === 'Add an area'), 'zones editor')
const homeFee = [...deliveryPanel.querySelectorAll('input')].find((i) => i.closest('label')?.textContent.startsWith('Fee anywhere')); setVal(homeFee, '2500')
;[...deliveryPanel.querySelectorAll('button')].find((b) => b.textContent === 'Add an area').click(); await sleep(30)
setVal(deliveryPanel.querySelector('input[aria-label="Area 1 name"]'), 'Lekki'); setVal(deliveryPanel.querySelector('input[aria-label="Area 1 fee"]'), '3500')
const outFee = [...deliveryPanel.querySelectorAll('input')].find((i) => i.closest('label')?.textContent.startsWith('Fee for other states')); setVal(outFee, '8000')
;[...deliveryPanel.querySelectorAll('button')].find((b) => b.textContent === 'Add a state').click(); await sleep(30)
setVal(deliveryPanel.querySelector('select[aria-label="State 1"]'), 'Ogun'); setVal(deliveryPanel.querySelector('input[aria-label="State 1 fee"]'), '5000'); await sleep(20)
state.writes.length = 0; deliveryPanel.querySelector('.panel-head .btn').click(); await sleep(100)
const zw = state.writes.find((w) => w.table === 'settings')?.row.value
console.log(`  delivery by location → saved mode=${zw?.mode}, home ${zw?.home_state} ₦${zw?.home_default_kobo / 100}, areas ${JSON.stringify(zw?.areas)}, outside ₦${zw?.outside_default_kobo / 100}, states ${JSON.stringify(zw?.state_fees)}`)
if (zw?.mode !== 'zones' || zw?.areas?.[0]?.fee_kobo !== 350000 || zw?.state_fees?.Ogun !== 500000 || zw?.outside_default_kobo !== 800000) problems.push('delivery zones saved wrong')
const pk = [...document.querySelectorAll('input.input')].find((i) => i.placeholder === 'pk_test_…'); const sk = document.querySelector('input[type=password]')
setVal(pk, 'pk_test_abc'); setVal(sk, 'wrong'); sk.closest('form').requestSubmit(); await sleep(60)
console.log(`  bad secret key → ${document.querySelector('.note-error')?.textContent.slice(0, 40) ?? 'NO ERROR'}`)
setVal(sk, 'sk_test_xyz'); sk.closest('form').requestSubmit(); await sleep(150)
const sec = rpcCalls.find((c) => c.name === 'set_secret')
console.log(`  good keys → set_secret ${sec ? 'called' : 'MISSING'}; secret sent to settings table? ${state.writes.some((w) => JSON.stringify(w.row).includes('sk_test')) ? 'YES (BAD)' : 'no'}`)
if (!sec) problems.push('paystack keys did not call set_secret')
if (state.writes.some((w) => JSON.stringify(w.row).includes('sk_test'))) problems.push('secret key leaked into settings table')

console.log('\n BLOG')
go('/posts'); await waitFor(() => h1() === 'Blog' && document.querySelector('tbody tr'), 'review queue')
console.log(`  review tab → ${document.querySelectorAll('tbody tr').length} row(s): "${document.querySelector('tbody tr td:nth-child(4)').textContent}"`)
console.log(`  rail badge → ${document.querySelector('.rail .badge')?.textContent ?? 'MISSING'}`)
if (document.querySelector('.rail .badge')?.textContent !== '1') problems.push('blog badge not showing the review count')
go('/posts/post1'); await waitFor(() => h1() === 'Cassava prices this season' && document.querySelector('form'), 'post editor')
const banner = document.querySelector('.page > .note')?.textContent || ''
console.log(`  banner → "${banner.slice(0, 60)}…"; sources listed: ${document.querySelectorAll('ul a').length}`)
if (!banner.includes('Publishes on its own')) problems.push('review banner missing')
state.writes.length = 0
const noteInput = [...document.querySelectorAll('input.input')].pop(); setVal(noteInput, 'tighten the intro'); noteInput.closest('form').requestSubmit(); await sleep(100)
const rn = state.writes.find((w) => w.table === 'review_notes')
console.log(`  add note → insert review_notes ${rn ? `"${rn.row.note}"` : 'MISSING'}`)
if (!rn) problems.push('review note not inserted')
const pubBtn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Publish now'); pubBtn.click(); await sleep(150)
const pubW = state.writes.find((w) => w.table === 'posts' && w.op === 'update' && w.row.status === 'published')
console.log(`  publish now → ${pubW ? `status=published, published_at set=${!!pubW.row.published_at}` : 'MISSING'}`)
if (!pubW) problems.push('publish did not update post')
go('/posts/new'); await waitFor(() => h1() === 'Write a post', 'new post')
const pi = [...document.querySelectorAll('input.input')]; setVal(pi[0], 'Why soil tests pay'); await sleep(30)
rpcCalls.length = 0; state.writes.length = 0
const toReview = [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Send to review')); toReview.click(); await sleep(150)
const ins = state.writes.find((w) => w.table === 'posts' && w.op === 'insert'); const rv = rpcCalls.find((c) => c.name === 'send_post_to_review')
console.log(`  new post → send to review: insert slug="${ins?.row.slug}", rpc send_post_to_review(${rv?.args.p_hours} h) ${rv ? 'called' : 'MISSING'}`)
if (!ins || ins.row.slug !== 'why-soil-tests-pay' || !rv) problems.push('send to review flow broken')

console.log('\n AUTOMATION')
go('/automation'); await waitFor(() => h1() === 'Automation' && document.querySelectorAll('.tabs button').length === 4, 'four tabs')
console.log(`  tabs → ${[...document.querySelectorAll('.tabs button')].map((b) => b.textContent).join(' | ')}`)
if (![...document.querySelectorAll('.tabs button')][0].textContent.startsWith('Topics')) problems.push('Topics is not the first tab')
console.log(`  rail order → ${[...document.querySelectorAll('.rail nav a')].map((a) => a.textContent.replace(/\d+$/, '')).join(' · ')}`)
{ const kids = [...document.querySelector('.rail nav').children]; const i = kids.findIndex((k) => k.textContent === 'Content'); if (!(kids[i + 1]?.textContent || '').replace(/\d+$/, '').startsWith('Blog')) problems.push('Blog is not first in Content') }
;[...document.querySelectorAll('.tabs button')][3].click(); await waitFor(() => document.querySelector('input[type=password]'), 'keys tab')
const keyStatus = document.querySelector('section.panel').textContent
console.log(`  keys panel → groq ${keyStatus.includes('Groq — ● set') ? 'set' : 'MISSING'}, cerebras ${keyStatus.includes('Cerebras — ○ not set') ? 'not set' : 'WRONG'}`)
if (!keyStatus.includes('Groq — ● set')) problems.push('key presence not shown')
rpcCalls.length = 0
const keyInputs = [...document.querySelectorAll('input[type=password]')]; setVal(keyInputs[1], 'short'); keyInputs[1].closest('.form-row').querySelector('button').click(); await sleep(60)
console.log(`  too-short cerebras key → ${document.querySelector('.note-error')?.textContent.slice(0, 50) ?? 'NO ERROR'}`)
window.confirm = () => true
setVal(keyInputs[1], 'csk-abc123def456ghi789jkl'); keyInputs[1].closest('.form-row').querySelector('button').click(); await sleep(100)
const sk2 = rpcCalls.find((c) => c.name === 'set_secret')
console.log(`  good cerebras key → set_secret(${sk2?.args.p_key}) ${sk2 ? 'called' : 'MISSING'}; leaked into settings? ${state.writes.some((w) => JSON.stringify(w).includes('csk-abc123def')) ? 'YES (BAD)' : 'no'}`)
if (sk2?.args.p_key !== 'cerebras_api_key') problems.push('cerebras key not saved via set_secret')
;[...document.querySelectorAll('.tabs button')][2].click(); await waitFor(() => [...document.querySelectorAll('section.panel button')].some((b) => b.textContent === 'Tue'), 'schedule tab')
const dayBtn = [...document.querySelectorAll('section.panel button')].find((b) => b.textContent === 'Tue'); dayBtn.click(); await sleep(30)
state.writes.length = 0
document.querySelector('section.panel .panel-head .btn').click(); await sleep(100)
const sched = state.writes.find((w) => w.table === 'settings')
console.log(`  toggle Tue + save → days=${JSON.stringify(sched?.row.value.days)}`)
if (!sched || !sched.row.value.days.includes(2)) problems.push('schedule save did not include Tuesday')
state.invokes.length = 0
;[...document.querySelectorAll('.tabs button')][0].click(); await waitFor(() => document.querySelector('tbody .btn'), 'topics tab')
const dn = [...document.querySelectorAll('tbody .btn')].find((b) => b.textContent === 'Draft now'); dn.click(); await sleep(150)
console.log(`  "Draft now" on queued topic → invoke ${state.invokes[0]?.name} topic_id=${state.invokes[0]?.body.topic_id}; message: ${document.querySelector('.note-ok')?.textContent.slice(0, 60)}`)
if (state.invokes[0]?.body.topic_id !== 7) problems.push('draft now did not invoke with topic id')

console.log('\n ASSISTANT')
go('/assistant'); await waitFor(() => h1() === 'Assistant' && document.querySelector('.chat-starters button') && document.querySelector('.chat-item'), 'assistant with starters and chat list')
console.log(`  chat list → ${document.querySelectorAll('.chat-item').length} saved chat(s) under "${document.querySelector('.chat-group-label')?.textContent}"`)
document.querySelector('.chat-item-open').click(); await waitFor(() => document.querySelectorAll('.bubble').length === 2 && h1() === 'Orders this week', 'open saved chat')
console.log(`  open saved chat → title "${h1()}", ${document.querySelectorAll('.bubble').length} messages`)
;[...document.querySelectorAll('.chat-list-head .btn')][0].click(); await waitFor(() => document.querySelectorAll('.bubble').length === 0 && document.querySelector('.chat-starters'), 'new chat')
state.invokes.length = 0; state.writes.length = 0
document.querySelector('.chat-starters button').click(); await waitFor(() => document.querySelector('.bubble-assistant .bubble-actions'), 'assistant reply')
await waitFor(() => state.writes.some((w) => w.table === 'assistant_chats' && w.op === 'update' && w.row.messages?.length === 2), 'chat saved', 5000)
const sent = state.invokes.find((i) => i.name === 'assistant')
const created = state.writes.find((w) => w.table === 'assistant_chats' && w.op === 'insert'); const saved = state.writes.filter((w) => w.table === 'assistant_chats' && w.op === 'update').pop()
console.log(`  starter → invoke assistant (${sent?.body.messages.length} msg); chat created "${created?.row.title}", reply saved with ${saved?.row.messages.length} messages; citation link ${document.querySelector('.cite') ? 'rendered' : 'MISSING'}; url ${window.location.search}`)
if (!created || !saved || saved.row.messages.length !== 2) problems.push('chat was not persisted')
if (!document.querySelector('.cite')) problems.push('citation not rendered')
state.writes.length = 0
document.querySelector('.bubble-actions button').click(); await sleep(80)
const qt = state.writes.find((w) => w.table === 'ai_topics')
console.log(`  "Queue blog topic" action → insert ai_topics "${qt?.row.topic}" [${qt?.row.arm}]`)
if (!qt || qt.row.arm !== 'agro') problems.push('queue_topic action did not insert')
;[...document.querySelectorAll('.bubble-actions button')][1].click(); await waitFor(() => h1() === 'Orders', 'open action navigates')
console.log(`  "open" action → ${window.location.pathname}${window.location.search}`)
go('/assistant'); await waitFor(() => h1() === 'Assistant' && document.querySelector('.chat-list-toggle'), 'assistant again')
document.querySelector('.chat-list-toggle').click(); await sleep(40)
const collapsedNow = document.querySelector('.assistant-wrap').classList.contains('collapsed')
console.log(`  sidebar toggle → ${collapsedNow ? 'collapsed' : 'NOT collapsed'}, remembered=${window.localStorage.getItem('viverst-admin:chat-list')}`)
if (!collapsedNow) problems.push('chat sidebar did not collapse')
document.querySelector('.chat-list-toggle').click(); await sleep(40)

console.log('\n NOTIFICATIONS')
go('/notifications'); await waitFor(() => h1() === 'Notifications' && document.querySelectorAll('.notif').length === 2, 'two notifications')
console.log(`  list → ${document.querySelectorAll('.notif').length} items, ${document.querySelectorAll('.notif.unread').length} unread; rail badge ${[...document.querySelectorAll('.rail nav a')].find((a) => a.textContent.includes('Notifications'))?.querySelector('.badge')?.textContent ?? 'MISSING'}`)
if (document.querySelectorAll('.notif.unread').length !== 1) problems.push('unread state wrong')
rpcCalls.length = 0
;[...document.querySelectorAll('button')].find((b) => b.textContent === 'Mark all read').click(); await sleep(80)
console.log(`  mark all read → rpc ${rpcCalls.some((c) => c.name === 'mark_all_read') ? 'called' : 'MISSING'}, unread now ${document.querySelectorAll('.notif.unread').length}`)
if (document.querySelectorAll('.notif.unread').length !== 0) problems.push('mark all read did not clear')

console.log('\n ANALYTICS')
go('/analytics'); await waitFor(() => h1() === 'Analytics' && document.querySelectorAll('.bars').length === 2, 'two charts')
console.log(`  figures → ${[...document.querySelectorAll('.figure b')].map((b) => b.textContent).join(' · ')}; charts ${document.querySelectorAll('.bars rect').length} bars; top product ${document.querySelector('.panel tbody td')?.textContent}`)
if (document.querySelectorAll('.bars rect').length !== 6) problems.push('charts did not draw 3 weeks × 2')
if (!document.querySelector('.figure b').textContent.includes('90,000')) problems.push('paid revenue figure wrong')

console.log('\n EVENTS')
go('/events'); await waitFor(() => h1() === 'Events' && document.querySelector('tbody tr'), 'events list')
await waitFor(() => document.querySelector('tbody tr td.num a'), 'sheet count in list')
const sheetLink = document.querySelector('tbody tr td.num a')
console.log(`  upcoming filter → ${document.querySelectorAll('.panel')[0].querySelectorAll('tbody tr').length} row(s); signups from sheet = ${sheetLink.textContent.trim()} → ${sheetLink.href}`)
if (sheetLink.textContent.trim() !== '10' || !sheetLink.href.includes('gid=42')) problems.push('sheet signups/link wrong')
const sheetPanel = [...document.querySelectorAll('.panel')].find((p) => p.textContent.includes('Registrations sheet'))
console.log(`  sheet panel → ${sheetPanel.querySelectorAll('tbody tr').length} events, one flagged "${sheetPanel.textContent.includes('not yet in the admin') ? 'not yet in the admin' : 'MISSING FLAG'}"`)
if (!sheetPanel || sheetPanel.querySelectorAll('tbody tr').length !== 2) problems.push('sheet panel wrong')
go('/events/e1'); await waitFor(() => h1() === 'Reimagining Agriculture' && document.querySelectorAll('.panel')[1], 'event editor')
await waitFor(() => document.querySelectorAll('.panel tbody tr').length === 2, 'two registrations')
console.log(`  registrations table → ${document.querySelectorAll('.panel tbody tr').length} rows; CSV button ${[...document.querySelectorAll('button')].some((b) => b.textContent.includes('Download CSV')) ? 'present' : 'MISSING'}; View leads button ${[...document.querySelectorAll('a.btn')].some((a) => a.textContent.includes('View leads')) ? 'present' : 'absent'}`)
const ev = [...document.querySelectorAll('input.input')]; const starts = document.querySelector('input[type=datetime-local]')
setVal(ev.find((i) => i.required), 'Reimagining Agriculture 2'); setVal(starts, ''); document.querySelector('form').requestSubmit(); await sleep(80)
console.log(`  save with no start → ${document.querySelector('.note-error')?.textContent.slice(0, 40) ?? 'no message (native required)'}`)
setVal(starts, '2026-11-20T10:00'); state.writes.length = 0
const unpub = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Unpublish'); unpub.click(); await sleep(120)
const evw = state.writes.find((w) => w.table === 'events' && w.op === 'update')
console.log(`  unpublish → update status=${evw?.row.status}, site=${evw?.row.site}, kind=${evw?.row.kind}, mode=${evw?.row.mode}, starts_at=${evw?.row.starts_at?.slice(0, 10)}`)
if (!evw?.row.kind || !evw?.row.mode) problems.push('event type/format not saved')
if (!evw || evw.row.status !== 'draft') problems.push('unpublish did not save draft status')

console.log('\n STAFF')
go('/staff'); await waitFor(() => h1() === 'Staff' && document.querySelector('tbody tr'), 'staff list')
const st = [...document.querySelectorAll('form input.input')]
setVal(st[0], 'ghost@x.com'); document.querySelector('form').requestSubmit(); await sleep(100)
console.log(`  unknown email → ${document.querySelector('.note-error')?.textContent.slice(0, 40) ?? 'NO ERROR'}`)
setVal(st[0], 'new@x.com'); setVal(st[1], 'Nkem'); document.querySelector('form').requestSubmit(); await sleep(100)
const added = rpcCalls.filter((c) => c.name === 'add_staff').pop()
console.log(`  add → add_staff(${added?.args.p_email}, ${added?.args.p_role})`)
if (added?.args.p_email !== 'new@x.com') problems.push('add_staff not called correctly')

console.log('\n FOOD PACKAGE')
{
  go('/food-package'); await waitFor(() => h1() === 'Food package' && document.querySelectorAll('section.panel').length === 4, 'four food package panels')
  const panel = (t) => [...document.querySelectorAll('section.panel')].find((p) => p.querySelector('h2')?.textContent === t)
  const prices = () => [...document.querySelectorAll('input[inputmode="decimal"]')]
  // a save disables the form until it has also checked the shop can see the row
  const ready = (label) => waitFor(() => !document.querySelector('.page fieldset')?.disabled, label)
  const title = [...document.querySelectorAll('input.input')].find((i) => i.value === 'December Food Package')
  console.log(`  loaded, nothing saved yet → the flyer: "${title?.value}", prices ${prices().map((i) => i.value).join(', ')}`)
  if (!title || prices().map((i) => i.value).join() !== '49999.00,74999.00,124999.00') problems.push('food package does not start from the flyer')
  if (!document.querySelector('.images img')?.getAttribute('src')?.includes('food-package-december')) problems.push('admin does not preview the December flyer')

  setVal(prices()[1], '79999'); await sleep(30)
  state.writes.length = 0; panel('Packages').querySelector('.panel-head .btn').click()
  await waitFor(() => state.writes.some((w) => w.table === 'settings'), 'food package saved')
  const fw = state.writes.find((w) => w.table === 'settings')?.row
  console.log(`  change Jolly to ₦79,999 and save → ${fw?.key}: ${fw?.value.packages.map((p) => `${p.name} ₦${p.price_kobo / 100}`).join(', ')}`)
  if (fw?.key !== 'food_package' || fw.value.packages[1].price_kobo !== 7999900 || fw.value.packages[0].items.length !== 4 || fw.value.home_card !== true || fw.value.checkout !== false) problems.push('food package saved wrong')
  await waitFor(() => document.body.textContent.includes('018_food_package.sql'), 'reminder to run migration 018')
  console.log('  the shop cannot read it yet → admin says to run 018_food_package.sql')
  await ready('form ready after save')

  const file = new window.File(['x'], 'easter.png', { type: 'image/png' })
  const fileIn = panel('Image').querySelector('input[type=file]')
  Object.defineProperty(fileIn, 'files', { value: [file], configurable: true }); fileIn.dispatchEvent(new window.Event('change', { bubbles: true }))
  await waitFor(() => panel('Image').querySelector('.images img')?.getAttribute('src')?.startsWith('https://cdn.test/food-package/'), 'uploaded image previewed')
  state.writes.length = 0; panel('Image').querySelector('.panel-head .btn').click(); await waitFor(() => state.writes.some((w) => w.table === 'settings'), 'image saved')
  await ready('form ready after image save')
  const img = state.writes.find((w) => w.table === 'settings')?.row.value.image
  console.log(`  replace the image → uploaded to ${state.uploads.at(-1)}, saved as ${img}`)
  if (!img?.startsWith('food-package/') || img !== state.uploads.at(-1)) problems.push('replacement image not saved')

  const checkout = [...document.querySelectorAll('label.check')].find((l) => l.textContent.includes('pay online')).querySelector('input')
  checkout.click(); await sleep(30)
  state.writes.length = 0; panel('Booking').querySelector('.panel-head .btn').click(); await sleep(120)
  const refused = document.querySelector('.note-error')?.textContent || ''
  console.log(`  checkout on, nothing linked → refused: "${refused.slice(0, 70)}…"`)
  if (state.writes.length || !refused.includes('no package is linked')) problems.push('checkout with no linked product was not refused')
  const sel = panel('Packages').querySelector('select'); setVal(sel, 'yellow-maize'); await sleep(30)
  state.writes.length = 0; panel('Booking').querySelector('.panel-head .btn').click(); await waitFor(() => state.writes.some((w) => w.table === 'settings'), 'saved with link'); await ready('form ready after linked save')
  const lw = state.writes.find((w) => w.table === 'settings')?.row.value
  console.log(`  link Merry to Yellow maize → checkout=${lw?.checkout}, Merry product=${lw?.packages[0].product_slug}`)
  if (lw?.checkout !== true || lw?.packages[0].product_slug !== 'yellow-maize') problems.push('linked product not saved')
  if (![...document.querySelectorAll('.note-info')].some((n) => n.textContent.includes('costs ₦45,000'))) problems.push('no warning that the linked product price differs')
  audit('/food-package')
}

console.log('\n WRITER ROLE')
state.role = 'writer'
root.unmount(); const rw = createRoot(document.getElementById('root')); rw.render(<App />); go('/')
await waitFor(() => h1().startsWith('Good') && document.querySelectorAll('.rail nav a').length === 5 && document.querySelectorAll('.figure').length === 1, 'writer menu', 8000)
console.log(`  menu → ${[...document.querySelectorAll('.rail nav a')].map((a) => a.textContent.replace(/\d+$/, '')).join(' · ')}; figures ${document.querySelectorAll('.figure').length} (content only)`)
if ([...document.querySelectorAll('.rail nav a')].some((a) => /Orders|Products|Stock|Food package|Events|Settings|Staff|Analytics/.test(a.textContent))) problems.push('writer menu shows ops items')
go('/orders'); await waitFor(() => h1() === 'Blog', 'orders bounced to blog')
console.log(`  /orders as writer → "${h1()}" (${window.location.pathname})`)
go('/settings'); await waitFor(() => h1() === 'Blog', 'settings bounced'); console.log(`  /settings as writer → ${window.location.pathname}`)
go('/food-package'); await waitFor(() => h1() === 'Blog', 'food package bounced'); console.log(`  /food-package as writer → ${window.location.pathname}`)
go('/posts/new'); await waitFor(() => h1() === 'Write a post', 'writer can write'); console.log(`  /posts/new as writer → "${h1()}"`)
rw.unmount(); state.role = 'owner'

state.session = null
const root2 = createRoot(document.getElementById('root')); root2.render(<App />)
go('/products'); await waitFor(() => h1() === 'Sign in', 'login screen when signed out')
console.log(`  /products while signed out → "${h1()}"`)
audit('/login')
const login = [...document.querySelectorAll('input')]
setVal(login[0], 'bad@x.com'); setVal(login[1], 'nope'); document.querySelector('form').requestSubmit(); await sleep(80)
console.log(`  wrong password → ${document.querySelector('.note-error')?.textContent ?? 'NO MESSAGE'}`)
if (!document.querySelector('.note-error')) problems.push('bad login showed no error')

console.log(`\n ACCESSIBILITY: ${a11y.length} issue(s)`); for (const x of a11y) console.log('  ✗', x)
console.log(`\n PROBLEMS: ${problems.length}`); for (const x of problems) console.log('  ✗', x)
if (!problems.length && !a11y.length) console.log('  ✓ every route, the product form and sign-in behave; no runtime errors')
process.exitCode = problems.length || a11y.length ? 1 : 0
