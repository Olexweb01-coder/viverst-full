/* Headless check: mounts the shop in jsdom with a mocked Supabase, browses,
   buys, checks out by bank transfer and reads the confirmation. */
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { state } from './supabase-mock.js'
import { resetCatalog } from '../src/lib/catalog.js'
import { SOCIALS } from '../src/lib/config.js'

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
for (const [path, expect] of [['/', 'Good produce'], ['/products', 'Everything we sell'], ['/products/yellow-maize', 'Yellow maize'], ['/products/nope', 'don’t have that one'], ['/cart', 'Your cart'], ['/checkout', 'empty'], ['/account', 'Sign in'], ['/foodpackage', 'December Food Package'], ['/no-such', 'Nothing on that shelf']]) {
  go(path); await waitFor(() => h1().includes(expect), `${path} → "${expect}"`); await sleep(120); audit(path)
  console.log(`  ${path.padEnd(24)} ${h1().slice(0, 44)}`)
}

console.log('\n STOREFRONT')
go('/'); await waitFor(() => document.querySelectorAll('.cat-tile').length === 4 && document.querySelectorAll('.pcard').length >= 1, 'tiles and cards')
console.log(`  home → ${document.querySelectorAll('.cat-tile').length} category tiles, ${document.querySelectorAll('.pcard').length} product cards, ${document.querySelectorAll('.step').length} steps, bulk band ${document.querySelector('.bulk') ? 'yes' : 'NO'}`)
go('/products?c=processed'); await waitFor(() => document.querySelectorAll('.pcard').length === 1 && document.querySelector('.pcard--out'), 'processed filter')
console.log(`  /products?c=processed → ${document.querySelectorAll('.pcard').length} card, sold-out styling ${document.querySelector('.pcard--out') ? 'yes' : 'NO'}, Add button disabled=${document.querySelector('.pcard button').disabled}, borrowed stock photo ${document.querySelector('.pcard img') ? 'yes' : 'NO'}`)
if (!document.querySelector('.pcard img')) problems.push('product without photos did not borrow the stock photo')
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

console.log('\n PAYSTACK (keys present)')
state.paystack = true; window.localStorage.removeItem('viverst-shop:cart')
root.unmount(); const rp = createRoot(document.getElementById('root')); rp.render(<App />)
go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product'); [...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(40)
go('/checkout'); await waitFor(() => document.querySelector('.checkout') && !document.querySelectorAll('.pay-opt')[1].classList.contains('disabled'), 'card option enabled')
console.log(`  with keys → card option ${document.querySelectorAll('.pay-opt')[1].classList.contains('disabled') ? 'STILL DISABLED' : 'enabled'}`)
document.querySelectorAll('.pay-opt input')[1].click(); await sleep(30)
const in3 = [...document.querySelectorAll('.checkout-form input.input')]; const bl3 = (t) => in3.find((i) => i.closest('label')?.textContent.startsWith(t))
setVal(bl3('Full name'), 'Ada'); setVal(bl3('Phone'), '1'); setVal(bl3('Email'), 'a@x.com'); setVal(bl3('Street'), 'x'); setVal(bl3('Town'), 'y')
let redirectedTo = ''; window.__viverstRedirect = (u) => { redirectedTo = u }
state.rpcs.length = 0; state.invokes.length = 0
document.querySelector('.checkout').requestSubmit(); await waitFor(() => redirectedTo, 'redirect to Paystack')
console.log(`  pay by card → place_order(${state.rpcs[0]?.args.p_payment_method}) then invoke ${state.invokes[0]?.name} for order ${state.invokes[0]?.body.order_id} → redirected to ${redirectedTo}`)
if (state.rpcs[0]?.args.p_payment_method !== 'paystack' || !redirectedTo.startsWith('https://checkout.paystack.com')) problems.push('paystack checkout flow wrong')
go('/order/VA-1042?ref=VA-1042-abc'); await waitFor(() => document.body.textContent.includes('Payment received'), 'verified on return')
console.log(`  back from Paystack → invoke ${state.invokes.pop()?.name} → "${[...document.querySelectorAll('h2')].map((h) => h.textContent).find((t) => t.includes('Payment'))}"`)
rp.unmount(); state.paystack = false; window.localStorage.removeItem('viverst-shop:cart')

console.log('\n ACCOUNT')
const r0 = createRoot(document.getElementById('root')); r0.render(<App />)
go('/account'); await waitFor(() => h1() === 'Sign in', 'sign in page')
const ai = [...document.querySelectorAll('.auth-form input')]; setVal(ai[0], 'bad@x.com'); setVal(ai[1], 'password1'); document.querySelector('.auth-form').requestSubmit(); await waitFor(() => document.querySelector('.shop-error'), 'bad login message')
console.log(`  wrong password → "${document.querySelector('.shop-error')?.textContent}"`)
state.user = { id: 'u1', email: 'ada@x.com' }
r0.unmount(); const ra = createRoot(document.getElementById('root')); ra.render(<App />)
await waitFor(() => h1().startsWith('Hello'), 'signed-in account page')
await waitFor(() => document.querySelector('.order-list a'), 'order history')
console.log(`  signed in → "${h1()}", ${document.querySelectorAll('.order-list a').length} past order(s), profile name "${document.querySelector('.auth-form input').value}"`)
if (document.querySelectorAll('.order-list a').length !== 1) problems.push('order history missing')
window.localStorage.removeItem('viverst-shop:cart'); go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product'); [...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(40)
go('/checkout'); await waitFor(() => [...document.querySelectorAll('.checkout-form input.input')].find((i) => i.value === '12 Harvest Rd'), 'checkout prefilled from account')
console.log(`  checkout prefilled → name "${[...document.querySelectorAll('.checkout-form input.input')][0].value}", street "${[...document.querySelectorAll('.checkout-form input.input')].find((i) => i.value === '12 Harvest Rd')?.value}"`)
state.writes.length = 0; state.rpcs.length = 0
document.querySelector('.checkout').requestSubmit(); await waitFor(() => h1().includes('Order placed'), 'order placed signed in')
console.log(`  order as signed-in customer → address upsert ${state.writes.some((w) => w.table === 'addresses' && w.op === 'upsert') ? 'saved' : 'MISSING'}`)
if (!state.writes.some((w) => w.table === 'addresses')) problems.push('address not saved for signed-in customer')
ra.unmount(); state.user = null

console.log('\n FOOD PACKAGE')
{
  const txt = (a) => (a ? new URL(a.href).searchParams.get('text') || '' : '')
  const rf = createRoot(document.getElementById('root')); rf.render(<App />)
  go('/'); await waitFor(() => document.querySelector('.fp-promo'), 'food package card on the homepage')
  const promo = document.querySelector('.fp-promo')
  console.log(`  homepage card → ${promo?.getAttribute('href')} · "${promo?.querySelector('.fp-promo-title')?.textContent}" · "${promo?.querySelector('.fp-promo-text')?.textContent}"`)
  if (promo?.getAttribute('href') !== '/foodpackage') problems.push('food package card does not lead to /foodpackage')
  if (!promo?.textContent.includes('3 packages from ₦49,999')) problems.push('food package card should say 3 packages from ₦49,999')
  promo?.click(); await waitFor(() => h1() === 'December Food Package', 'the card opens the page')
  const cards = [...document.querySelectorAll('.fp-card')]
  console.log(`  page → ${cards.map((c) => `${c.querySelector('h3')?.textContent} ${c.querySelector('.fp-price')?.textContent} (${c.querySelectorAll('.fp-items li').length} items)`).join(' · ')}`)
  const want = [['Merry Package', '₦49,999'], ['Jolly Package', '₦74,999'], ['Berekete Package', '₦124,999']]
  if (cards.length !== 3) problems.push(`expected 3 packages, found ${cards.length}`)
  want.forEach(([n, pr], i) => {
    const c = cards[i]
    if (c?.querySelector('h3')?.textContent !== n || c?.querySelector('.fp-price')?.textContent !== pr || c?.querySelectorAll('.fp-items li').length !== 4) problems.push(`package ${i + 1} should be ${n} at ${pr} with 4 items`)
    const a = c?.querySelector('a[href^="https://wa.me/"]')
    if (!a?.href.startsWith('https://wa.me/2348000000000?text=')) problems.push(`${n}: booking link goes to ${a?.href}`)
    else if (!txt(a).includes(`book the ${n} (${pr}) from the December Food Package`) || !txt(a).includes('instalments')) problems.push(`${n}: booking message is "${txt(a)}"`)
    if (a && (a.target !== '_blank' || !/noopener/.test(a.rel))) problems.push(`${n}: booking link must open a new tab with rel="noopener"`)
  })
  console.log(`  booking message → "${txt(cards[1]?.querySelector('a[href^="https://wa.me/"]')).replace(/\n+/g, ' / ')}"`)
  if (/create of eggs/i.test(document.body.textContent)) problems.push('the flyer typo "create of eggs" is on the page')
  if (!document.querySelector('.fp-instalment')?.textContent.includes('Instalment payment available')) problems.push('instalment note missing')
  if (!document.querySelector('.fp-season')?.textContent.includes('This offer is for December')) problems.push('season note missing')
  if (document.querySelector('.fp-actions button')) problems.push('Pay online shown while checkout is off')
  if (!document.querySelector('.fp-flyer img')?.getAttribute('src')?.includes('food-package-december')) problems.push('the December flyer is not the page image')
  audit('/foodpackage (default)')

  go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-ask'), 'ask on WhatsApp on the product page')
  const ask = document.querySelector('.product-ask')
  console.log(`  product page → "${ask?.textContent.trim()}" → "${txt(ask).replace(/\n+/g, ' / ')}"`)
  if (!ask?.href.startsWith('https://wa.me/2348000000000?text=') || !txt(ask).includes('I would like to ask about Yellow maize (50 kg bag, ₦45,000).') || !txt(ask).includes('(shopagro.viverst.com)')) problems.push('product WhatsApp message wrong')
  const fwa = [...document.querySelectorAll('.shop-footer a')].find((a) => a.textContent === 'Chat on WhatsApp')
  console.log(`  footer → "${txt(fwa).replace(/\n+/g, ' / ')}"`)
  if (!fwa?.href.startsWith('https://wa.me/2348000000000?text=') || !txt(fwa).startsWith('Hello Viverst Agro Shop, I am contacting you from your website (shopagro.viverst.com).')) problems.push('footer WhatsApp link wrong')
  rf.unmount()

  // edited in the admin: a new season, homepage card off, checkout on
  state.foodPackage = { title: 'Easter Food Package', short: 'EFP', home_card: false, checkout: true, instalment: false, season_note: '',
    packages: [{ name: 'Small Box', price_kobo: 4500000, product_slug: 'yellow-maize', items: ['Rice'] }, { name: 'Big Box', price_kobo: 9000000, product_slug: 'red-palm-oil', items: ['Oil'] }, { name: '', price_kobo: 100, items: [] }] }
  window.localStorage.removeItem('viverst-shop:cart')
  const rf2 = createRoot(document.getElementById('root')); rf2.render(<App />)
  go('/'); await waitFor(() => document.querySelectorAll('.cat-tile').length === 4, 'homepage'); await sleep(250)
  if (document.querySelector('.fp-promo')) problems.push('homepage card shown while switched off')
  go('/foodpackage'); await waitFor(() => h1() === 'Easter Food Package' && document.querySelector('.fp-actions button'), 'the edited package with Buy now')
  const buys = [...document.querySelectorAll('.fp-card')].map((c) => !!c.querySelector('.fp-actions button'))
  console.log(`  edited in the admin → "${h1()}", ${buys.length} packages (nameless one dropped), Buy now: ${buys.join(', ')}`)
  if (buys.join() !== 'true,false') problems.push(`Buy now should show for the in-stock linked package only, got ${buys}`)
  const big = [...document.querySelectorAll('.fp-card')][1]
  console.log(`  linked but sold out → "${big?.querySelector('.fp-soldout')?.textContent}" + ${big?.querySelector('a[href^="https://wa.me/"]')?.textContent.trim()}`)
  if (!big?.querySelector('.fp-soldout') || !big?.querySelector('a[href^="https://wa.me/"]')) problems.push('a sold-out package should say so and offer WhatsApp booking')
  if (document.querySelector('.fp-instalment') || document.querySelector('.fp-season') || document.querySelector('.fp-instalment-link')) problems.push('instalment or season note shown while switched off')
  if (document.querySelector('.fp-hero-cta a')?.getAttribute('href') !== '#fp-packages') problems.push('with a package for sale, the top button should lead to the packages')
  document.querySelector('.fp-actions button')?.click()
  await waitFor(() => h1() === 'Checkout' && document.querySelector('.checkout'), 'Buy now goes straight to checkout')
  console.log(`  Buy now → "${h1()}", holding ${document.querySelector('.checkout')?.textContent.includes('Yellow maize') ? '"Yellow maize", the linked product' : 'the wrong item'}`)
  if (!document.querySelector('.checkout')?.textContent.includes('Yellow maize')) problems.push('Buy now did not check out the linked product')
  rf2.unmount(); window.localStorage.removeItem('viverst-shop:cart')

  // the December package for sale: Buy now, and instalments on WhatsApp
  state.foodPackage = { checkout: true, packages: [{ name: 'Merry Package', price_kobo: 4500000, product_slug: 'yellow-maize', items: ['10 kg of rice'] }] }
  const rf3 = createRoot(document.getElementById('root')); rf3.render(<App />)
  go('/foodpackage'); await waitFor(() => document.querySelector('.fp-instalment-link'), 'instalment link beside Buy now')
  const inst = document.querySelector('.fp-instalment-link')
  console.log(`  for sale → "${document.querySelector('.fp-actions button')?.textContent.trim()}" + "${inst?.textContent.trim()}" → "${txt(inst).split('\n').pop()}"`)
  if (!inst?.href.startsWith('https://wa.me/2348000000000?text=') || !txt(inst).includes('I would like to buy the Merry Package (₦45,000) from the December Food Package and pay in instalments.')) problems.push('instalment WhatsApp message wrong')
  if (document.querySelector('.fp-card a[aria-label^="Book the"]')) problems.push('Book on WhatsApp shown although the package can be bought online')
  audit('/foodpackage (for sale)')
  rf3.unmount(); state.foodPackage = undefined; window.localStorage.removeItem('viverst-shop:cart')

  // Paystack only: bank transfer switched off in Settings
  state.paystack = true; state.transferOff = true
  const rf4 = createRoot(document.getElementById('root')); rf4.render(<App />)
  go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product'); [...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(40)
  go('/checkout'); await waitFor(() => document.querySelector('.checkout') && document.querySelector('.pay-opt.active'), 'checkout with Paystack chosen')
  const opts = [...document.querySelectorAll('.pay-opt')]
  console.log(`  Paystack only → ${opts.length} payment option: "${opts[0]?.querySelector('strong')?.textContent}", ${opts[0]?.classList.contains('active') ? 'already selected' : 'NOT selected'}`)
  if (opts.length !== 1 || !opts[0].classList.contains('active') || !opts[0].querySelector('input[value="paystack"]')?.checked) problems.push('with transfer off, Paystack should be the only, selected option')
  const rows4 = () => Object.fromEntries([...document.querySelectorAll('.checkout-summary .cart-sum-row')].map((r) => [r.children[0].textContent, r.children[1].textContent]))
  console.log(`  Paystack charges → ${JSON.stringify(rows4())} · warning: "${document.querySelector('.checkout-warn')?.textContent.slice(0, 48)}…"`)
  // once per payment, on items + delivery: ₦45,000 + ₦1,500 = ₦46,500 → ₦810, the smallest that leaves ₦46,500 after Paystack's cut
  if (rows4()['Paystack charges'] !== '₦810' || rows4()['Total'] !== '₦47,310') problems.push(`Paystack charges on ₦46,500 should be ₦810 (total ₦47,310), got ${JSON.stringify(rows4())}`)
  if (!document.querySelector('.checkout-warn')?.textContent.includes('Please pay the full amount shown, including Paystack charges')) problems.push('no full-payment warning with Paystack')
  const in4 = [...document.querySelectorAll('.checkout-form input.input')]; const bl4 = (t) => in4.find((i) => i.closest('label')?.textContent.startsWith(t))
  setVal(bl4('Full name'), 'Ada'); setVal(bl4('Phone'), '1'); setVal(bl4('Email'), 'a@x.com'); setVal(bl4('Street'), 'x'); setVal(bl4('Town'), 'y')
  let sentTo = ''; window.__viverstRedirect = (u) => { sentTo = u }
  state.rpcs.length = 0; state.invokes.length = 0
  document.querySelector('.checkout').requestSubmit(); await waitFor(() => sentTo, 'off to Paystack')
  console.log(`  place order → place_order(${state.rpcs[0]?.args.p_payment_method}) → ${sentTo.slice(0, 32)}…`)
  if (state.rpcs[0]?.args.p_payment_method !== 'paystack' || !sentTo.startsWith('https://checkout.paystack.com')) problems.push('Paystack-only checkout did not pay through Paystack')

  rf4.unmount(); state.paystack = false; state.transferOff = false; window.localStorage.removeItem('viverst-shop:cart')
  // bank transfer back on and chosen: no Paystack charges, no warning
  state.paystack = true
  const rf5 = createRoot(document.getElementById('root')); rf5.render(<App />)
  go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product'); [...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(40)
  go('/checkout'); await waitFor(() => document.querySelectorAll('.pay-opt').length === 2, 'both payment options')
  document.querySelector('input[value="transfer"]').click(); await sleep(60)
  const tRows = Object.fromEntries([...document.querySelectorAll('.checkout-summary .cart-sum-row')].map((r) => [r.children[0].textContent, r.children[1].textContent]))
  console.log(`  bank transfer → ${JSON.stringify(tRows)}, warning ${document.querySelector('.checkout-warn') ? 'SHOWN' : 'not shown'}`)
  if ('Paystack charges' in tRows || tRows['Total'] !== '₦46,500' || document.querySelector('.checkout-warn')) problems.push('bank transfer should have no Paystack charges or warning')
  document.querySelector('input[value="paystack"]').click(); await sleep(60)
  if (!document.querySelector('.checkout-warn')) problems.push('switching to Paystack should show the charges and warning')
  rf5.unmount(); state.paystack = false; window.localStorage.removeItem('viverst-shop:cart')
}

console.log('\n DELIVERY ZONES')
state.zones = true; window.localStorage.removeItem('viverst-shop:cart')
const rz = createRoot(document.getElementById('root')); rz.render(<App />)
go('/products/yellow-maize'); await waitFor(() => document.querySelector('.product-buy'), 'product'); [...document.querySelectorAll('.product-buy .btn')][0].click(); await sleep(40)
go('/cart'); await waitFor(() => document.querySelector('.cart-item'), 'cart')
console.log(`  cart → delivery "${[...document.querySelectorAll('.cart-sum-row')][1].textContent}"`)
go('/checkout'); await waitFor(() => document.querySelector('.checkout') && [...document.querySelectorAll('.checkout-form select')].length === 2, 'area picker for Lagos')
const total = () => document.querySelector('.cart-sum-total span:last-child').textContent
const dRow = () => [...document.querySelectorAll('.cart-sum-row')].find((r) => r.textContent.startsWith('Delivery')).textContent
console.log(`  Lagos, no area yet → "${dRow()}", total ${total()}`)
const areaSel = [...document.querySelectorAll('.checkout-form select')][1]
setVal(areaSel, 'Lekki'); await sleep(30); console.log(`  Lekki → "${dRow()}", total ${total()}`)
if (!total().includes('48,500')) problems.push('Lekki total wrong')
setVal(areaSel, '__other'); await sleep(30); console.log(`  somewhere else in Lagos → "${dRow()}", total ${total()}`)
if (!total().includes('47,500')) problems.push('Lagos default total wrong')
const stateSel = [...document.querySelectorAll('.checkout-form select')][0]
setVal(stateSel, 'Ogun'); await sleep(30); console.log(`  Ogun → "${dRow()}", total ${total()}, area picker ${[...document.querySelectorAll('.checkout-form select')].length === 1 ? 'hidden' : 'STILL SHOWN'}`)
if (!total().includes('50,000')) problems.push('Ogun total wrong')
setVal(stateSel, 'Kano'); await sleep(30); console.log(`  Kano → "${dRow()}", total ${total()}`)
if (!total().includes('53,000')) problems.push('Kano total wrong')
setVal(stateSel, 'Lagos'); await sleep(30); setVal([...document.querySelectorAll('.checkout-form select')][1], 'Ikeja'); await sleep(30)
const inz = [...document.querySelectorAll('.checkout-form input.input')]; const blz = (t) => inz.find((i) => i.closest('label')?.textContent.startsWith(t))
setVal(blz('Full name'), 'Z'); setVal(blz('Phone'), '1'); setVal(blz('Email'), 'z@x.com'); setVal(blz('Street'), 'x'); setVal(blz('Town'), 'Allen')
state.rpcs.length = 0; document.querySelector('.checkout').requestSubmit(); await waitFor(() => state.rpcs.length, 'order sent')
console.log(`  order → address sent { state: ${state.rpcs[0]?.args.p_address.state}, area: ${state.rpcs[0]?.args.p_address.area} } — fee left to the server`)
if (state.rpcs[0]?.args.p_address.area !== 'Ikeja') problems.push('area not sent with the order')
await sleep(100); rz.unmount(); state.zones = false; window.localStorage.removeItem('viverst-shop:cart')

console.log('\n EMPTY ADMIN → PLACEHOLDERS')
state.empty = true; resetCatalog()
const r2 = createRoot(document.getElementById('root')); r2.render(<App />)
go('/products'); await waitFor(() => document.querySelectorAll('.pcard').length === 7, 'seven placeholder products')
console.log(`  no products in admin → ${document.querySelectorAll('.pcard').length} placeholder cards with photos (${[...document.querySelectorAll('.pcard img')].filter((i) => i.getAttribute('src')).length} images)`)

// the shop is Viverst Agro's, so its footer links to Agro's profiles, exactly
{
  const social = [...document.querySelectorAll('.shop-social-link')]
  const hrefs = social.map((a) => a.getAttribute('href'))
  if (hrefs.join(' ') !== SOCIALS.map((s) => s.url).join(' ')) problems.push(`footer social links are ${hrefs.join(', ') || 'missing'}`)
  for (const a of social) {
    if (a.target !== '_blank' || !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)) problems.push(`${a.href} must open in a new tab with rel="noopener noreferrer"`)
    if (!a.getAttribute('aria-label')?.startsWith('Viverst Agro on ')) problems.push(`${a.href} has no spoken name`)
  }
  console.log(`  footer → ${social.map((a) => a.title).join(' · ')} (${social.length} profiles)`)
}

console.log(`\n ACCESSIBILITY: ${a11y.length} issue(s)`); for (const x of a11y) console.log('  ✗', x)
console.log(`\n PROBLEMS: ${problems.length}`); for (const x of problems) console.log('  ✗', x)
if (!problems.length && !a11y.length) console.log('  ✓ browse, buy, check out and confirm all behave; no runtime errors')
process.exitCode = problems.length || a11y.length ? 1 : 0
