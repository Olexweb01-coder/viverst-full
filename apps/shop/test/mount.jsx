/* Headless check: mounts the shop in jsdom with a mocked Supabase, browses,
   buys, checks out by bank transfer and reads the confirmation. */
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { state } from './supabase-mock.js'
import { resetCatalog } from '../src/lib/catalog.js'

const problems = []; const a11y = []
const origError = console.error
console.error = (...a) => { const m = a.map((x) => (x && x.message) || String(x)).join(' '); problems.push(m); origError('   [console.error]', m.slice(0, 200)) }
window.addEventListener('error', (e) => problems.push(`window error: ${e.message}`))
window.addEventListener('unhandledrejection', (e) => problems.push(`rejection: ${e.reason}`))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(fn, label, ms = 3000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(25) } problems.push(`timed out waiting for ${label}`); return false }
const h1 = () => document.querySelector('h1')?.textContent ?? ''
const go = (p) => { window.history.pushState({}, '', p); window.dispatchEvent(new window.PopStateEvent('popstate')) }
const setVal = (el, v) => { const d = Object.getOwnPropertyDescriptor(el.__proto__, 'value'); d.set.call(el, v); el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })) }
function audit(route) {
  for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) a11y.push(`${route}: img without alt`)
  for (const b of document.querySelectorAll('button')) if (!b.textContent.trim() && !b.getAttribute('aria-label')) a11y.push(`${route}: unnamed button`)
  for (const i of document.querySelectorAll('input:not([type=hidden]):not([type=radio]), select, textarea')) { if (!(i.closest('label') || i.getAttribute('aria-label'))) a11y.push(`${route}: unlabelled field ${i.name || i.type}`) }
  if (document.querySelectorAll('h1').length !== 1) a11y.push(`${route}: expected one h1, found ${document.querySelectorAll('h1').length}`)
}

const root = createRoot(document.getElementById('root')); root.render(<App />)

console.log('\n ROUTES')
for (const [path, expect] of [['/', 'Good produce'], ['/products', 'Everything we sell'], ['/products/yellow-maize', 'Yellow maize'], ['/products/nope', 'don’t have that one'], ['/cart', 'Your cart'], ['/checkout', 'empty'], ['/no-such', 'Nothing on that shelf']]) {
  go(path); await waitFor(() => h1().includes(expect), `${path} → "${expect}"`); await sleep(120); audit(path)
  console.log(`  ${path.padEnd(24)} ${h1().slice(0, 44)}`)
}

console.log('\n STOREFRONT')
go('/'); await waitFor(() => document.querySelectorAll('.cat-tile').length === 4 && document.querySelectorAll('.pcard').length >= 1, 'tiles and cards')
console.log(`  home → ${document.querySelectorAll('.cat-tile').length} category tiles, ${document.querySelectorAll('.pcard').length} product cards, ${document.querySelectorAll('.step').length} steps, bulk band ${document.querySelector('.bulk') ? 'yes' : 'NO'}`)
go('/products?c=processed'); await waitFor(() => document.querySelectorAll('.pcard').length === 1 && document.querySelector('.pcard--out'), 'processed filter')
console.log(`  /products?c=processed → ${document.querySelectorAll('.pcard').length} card, sold-out styling ${document.querySelector('.pcard--out') ? 'yes' : 'NO'}, Add button disabled=${document.querySelector('.pcard button').disabled}`)
if (!document.querySelector('.pcard button').disabled) problems.push('sold-out product is addable')

console.log('\n PRODUCT → CART')
go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product page')
console.log(`  product page → price ${document.querySelector('.product-price').textContent.trim().slice(0, 30)}, ${document.querySelectorAll('.product-thumbs button').length} thumbs, low-stock note "${document.querySelector('.product-low')?.textContent}"`)
;[...document.querySelectorAll('.qty button')].pop().click(); await sleep(30)
;[...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(60)
const badge = document.querySelector('.cart-count')?.textContent
console.log(`  qty 2 + add → cart badge ${badge}; stored=${JSON.parse(window.localStorage.getItem('viverst-shop:cart'))?.[0]?.qty}`)
if (badge !== '2') problems.push('cart count wrong after add')
go('/cart'); await waitFor(() => document.querySelector('.cart-item'), 'cart page')
console.log(`  cart → total ${document.querySelector('.cart-sum-total span:last-child').textContent} (items + ₦1,500 delivery)`)
if (!document.querySelector('.cart-sum-total').textContent.includes('91,500')) problems.push('cart total wrong')

console.log('\n CHECKOUT')
go('/checkout'); await waitFor(() => document.querySelector('.checkout'), 'checkout form')
const payOpts = [...document.querySelectorAll('.pay-opt')]
console.log(`  pay options → transfer ${payOpts[0]?.classList.contains('active') ? 'selected' : 'NOT'}, paystack ${payOpts[1]?.classList.contains('disabled') ? 'disabled (no keys)' : 'ENABLED?'}`)
if (!payOpts[1]?.classList.contains('disabled')) problems.push('paystack should be disabled without keys')
const inputs = [...document.querySelectorAll('.checkout-form input.input, .checkout-form select.input')]
const byLabel = (t) => inputs.find((i) => i.closest('label')?.textContent.startsWith(t))
setVal(byLabel('Full name'), 'Ada Obi'); setVal(byLabel('Phone'), '08012345678'); setVal(byLabel('Email'), 'ada@example.com'); setVal(byLabel('Street'), '12 Harvest Road'); setVal(byLabel('Town'), 'Ikeja')
state.rpcs.length = 0
document.querySelector('.checkout').requestSubmit(); await waitFor(() => h1().includes('Order placed'), 'confirmation page')
const rpc = state.rpcs[0]
console.log(`  place order → rpc ${rpc?.name}(${rpc?.args.p_items[0].qty} × ${rpc?.args.p_items[0].product_id}, ${rpc?.args.p_payment_method}, ${rpc?.args.p_address.city}/${rpc?.args.p_address.state}); no price sent: ${rpc && !JSON.stringify(rpc.args).includes('price') ? 'correct' : 'PRICE LEAKED'}`)
if (!rpc || rpc.args.p_items[0].qty !== 2) problems.push('place_order not called correctly')
console.log(`  confirmation → ${h1()}; number ${document.querySelector('.order-number')?.textContent}; bank box ${document.querySelector('.bank-box') ? 'shown with ' + document.querySelector('.bank-box dd strong')?.textContent : 'MISSING'}; cart now ${JSON.parse(window.localStorage.getItem('viverst-shop:cart')).length} items`)
if (!document.querySelector('.bank-box') || JSON.parse(window.localStorage.getItem('viverst-shop:cart')).length !== 0) problems.push('confirmation or cart clear wrong')
audit('/order')

console.log('\n OVERSELL')
go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product again')
setVal(document.querySelector('.qty input'), '9'); [...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(50)
go('/checkout'); await waitFor(() => document.querySelector('.checkout'), 'checkout again')
const inputs2 = [...document.querySelectorAll('.checkout-form input.input')]; const bl = (t) => inputs2.find((i) => i.closest('label')?.textContent.startsWith(t))
setVal(bl('Full name'), 'B'); setVal(bl('Phone'), '1'); setVal(bl('Email'), 'b@x.com'); setVal(bl('Street'), 'x'); setVal(bl('Town'), 'y')
document.querySelector('.checkout').requestSubmit(); await waitFor(() => document.querySelector('.shop-error'), 'friendly error')
console.log(`  qty 9 (stock 7) → "${document.querySelector('.shop-error')?.textContent}"`)
if (!/sold out/i.test(document.querySelector('.shop-error')?.textContent || '')) problems.push('oversell error not friendly')

console.log('\n EMPTY ADMIN → PLACEHOLDERS')
state.empty = true; resetCatalog()
root.unmount(); const r2 = createRoot(document.getElementById('root')); r2.render(<App />)
go('/products'); await waitFor(() => document.querySelectorAll('.pcard').length === 7, 'seven placeholder products')
console.log(`  no products in admin → ${document.querySelectorAll('.pcard').length} placeholder cards with photos (${[...document.querySelectorAll('.pcard img')].filter((i) => i.getAttribute('src')).length} images)`)

console.log(`\n ACCESSIBILITY: ${a11y.length} issue(s)`); for (const x of a11y) console.log('  ✗', x)
console.log(`\n PROBLEMS: ${problems.length}`); for (const x of problems) console.log('  ✗', x)
if (!problems.length && !a11y.length) console.log('  ✓ browse, buy, check out and confirm all behave; no runtime errors')
process.exitCode = problems.length || a11y.length ? 1 : 0
