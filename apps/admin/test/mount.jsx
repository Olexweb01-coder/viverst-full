/* Headless check: mounts the admin in jsdom with a mocked Supabase, walks
   every route as the owner, drives the product form, and audits accessibility. */
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { state, rpcCalls } from './supabase-mock.js'

const ROUTES = [
  ['/', 'Good'],
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
  ['/settings', 'Settings'],
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

console.log('\n HOSTING NOTICE')
go('/'); await waitFor(() => h1().startsWith('Good') && document.querySelector('.hosting-notice'), 'notice on Today')
document.querySelector('.hosting-notice button').click(); await sleep(40)
console.log(`  shown on Today, dismissed → ${document.querySelector('.hosting-notice') ? 'STILL VISIBLE' : 'hidden'}; stored=${!!window.localStorage.getItem('viverst-admin:hosting-notice-dismissed')}`)
if (document.querySelector('.hosting-notice')) problems.push('hosting notice did not hide on dismiss')

console.log('\n PRODUCTS LIST')
go('/products'); await waitFor(() => h1() === 'Products' && document.querySelectorAll('.filters button').length === 3, 'products page with filters')
await waitFor(() => document.querySelectorAll('tbody tr').length === 2, 'two product rows')
console.log(`  ${document.querySelectorAll('tbody tr').length} product rows`)
const hidden = [...document.querySelectorAll('.filters button')].find((b) => b.textContent === 'Hidden')
hidden.click(); await sleep(60)
const rowsAfter = document.querySelectorAll('tbody tr').length
console.log(`  filter "Hidden" → ${rowsAfter} row(s)`); if (rowsAfter !== 1) problems.push('hidden filter did not narrow to 1 row')
const row = document.querySelector('tbody tr'); row.click(); await waitFor(() => h1().includes('Hidden one'), 'row click opens editor')
console.log(`  row click → ${h1()}`)

console.log('\n PRODUCT FORM')
go('/products/new'); await waitFor(() => h1() === 'New product', 'new product page')
const setVal = (el, v) => { const d = Object.getOwnPropertyDescriptor(el.__proto__, 'value'); d.set.call(el, v); el.dispatchEvent(new window.Event('input', { bubbles: true })) }
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
document.querySelector('form').requestSubmit(); await sleep(150)
const w = state.writes.find((x) => x.table === 'products' && x.op === 'insert')
console.log(`  submit valid → insert ${w ? 'sent' : 'MISSING'}; price_kobo=${w?.row.price_kobo}`)
if (!w || w.row.price_kobo !== 1850000) problems.push('product insert missing or wrong price')
await waitFor(() => window.location.pathname === '/products/new-id', 'redirect to the created product')
console.log(`  after create → ${window.location.pathname}`)

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
go('/settings'); await waitFor(() => h1() === 'Settings' && document.querySelectorAll('section.panel').length === 5, 'five settings panels')
const bank = [...document.querySelectorAll('input.input')].find((i) => i.value === 'GTB')
console.log(`  loaded: bank=${bank ? 'GTB' : 'MISSING'}, fee=${[...document.querySelectorAll('.input-prefix input')][0]?.value}`)
state.writes.length = 0
const saveBtns = [...document.querySelectorAll('.panel-head .btn')]; saveBtns[1].click(); await sleep(100)
const up = state.writes.find((w) => w.table === 'settings')
console.log(`  save delivery → upsert ${up ? `${up.row.key} flat_fee_kobo=${up.row.value.flat_fee_kobo}` : 'MISSING'}`)
if (!up || up.row.value.flat_fee_kobo !== 150000) problems.push('delivery save wrong')
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
go('/automation'); await waitFor(() => h1() === 'Automation' && document.querySelectorAll('section.panel').length === 4, 'four panels')
const keyStatus = [...document.querySelectorAll('section.panel')][1].textContent
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
const dayBtn = [...document.querySelectorAll('section.panel button')].find((b) => b.textContent === 'Tue'); dayBtn.click(); await sleep(30)
state.writes.length = 0
document.querySelector('section.panel .panel-head .btn').click(); await sleep(100)
const sched = state.writes.find((w) => w.table === 'settings')
console.log(`  toggle Tue + save → days=${JSON.stringify(sched?.row.value.days)}`)
if (!sched || !sched.row.value.days.includes(2)) problems.push('schedule save did not include Tuesday')
state.invokes.length = 0
const dn = [...document.querySelectorAll('tbody .btn')].find((b) => b.textContent === 'Draft now'); dn.click(); await sleep(150)
console.log(`  "Draft now" on queued topic → invoke ${state.invokes[0]?.name} topic_id=${state.invokes[0]?.body.topic_id}; message: ${document.querySelector('.note-ok')?.textContent.slice(0, 60)}`)
if (state.invokes[0]?.body.topic_id !== 7) problems.push('draft now did not invoke with topic id')

console.log('\n EVENTS')
go('/events'); await waitFor(() => h1() === 'Events' && document.querySelector('tbody tr'), 'events list')
console.log(`  upcoming filter → ${document.querySelectorAll('tbody tr').length} row(s), registered=${document.querySelector('tbody tr td.num').textContent}`)
if (document.querySelectorAll('tbody tr').length !== 1) problems.push('upcoming filter wrong')
go('/events/e1'); await waitFor(() => h1() === 'Reimagining Agriculture' && document.querySelectorAll('.panel')[1], 'event editor')
await waitFor(() => document.querySelectorAll('.panel tbody tr').length === 2, 'two registrations')
console.log(`  registrations table → ${document.querySelectorAll('.panel tbody tr').length} rows; CSV button ${[...document.querySelectorAll('button')].some((b) => b.textContent.includes('Download CSV')) ? 'present' : 'MISSING'}`)
const ev = [...document.querySelectorAll('input.input')]; const starts = document.querySelector('input[type=datetime-local]')
setVal(ev.find((i) => i.required), 'Reimagining Agriculture 2'); setVal(starts, ''); document.querySelector('form').requestSubmit(); await sleep(80)
console.log(`  save with no start → ${document.querySelector('.note-error')?.textContent.slice(0, 40) ?? 'no message (native required)'}`)
setVal(starts, '2026-11-20T10:00'); state.writes.length = 0
const unpub = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Unpublish'); unpub.click(); await sleep(120)
const evw = state.writes.find((w) => w.table === 'events' && w.op === 'update')
console.log(`  unpublish → update status=${evw?.row.status}, site=${evw?.row.site}, starts_at=${evw?.row.starts_at?.slice(0, 10)}`)
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

console.log('\n SIGNED OUT')
state.session = null
root.unmount(); const root2 = createRoot(document.getElementById('root')); root2.render(<App />)
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
