/* Headless check: mounts the real Agro app in jsdom, walks every route,
   drives the interactive code, and audits accessibility. */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { SHOWCASE, SOCIALS, WHATSAPP, BUSINESS } from '../src/data/agro.js'

/* Each route states the heading it expects. A flat wait proves nothing: if the
   page has not swapped yet the walk measures the one it just left, and the
   suite still reports green because it never checks which page it got. */
const ROUTES = [
  ['/', 'Transforming agriculture'],
  ['/about', 'Viverst Agro works across'],
  ['/solutions', 'Seven areas'],
  ['/contact', 'where you are losing money'],
  ['/not-a-real-page', 'Nothing growing here'],
]

// the admin's database is not reachable in this headless run: the seed product list must show
globalThis.fetch = async () => { throw new Error('adminProducts offline') }

const problems = []
const a11y = []
const origError = console.error
console.error = (...a) => {
  const msg = a.map((x) => (x && x.message) || String(x)).join(' ')
  problems.push(msg)
  origError('   [console.error]', msg.slice(0, 240))
}
window.addEventListener('error', (e) => problems.push(`window error: ${e.message}`))
window.addEventListener('unhandledrejection', (e) => problems.push(`rejection: ${e.reason}`))

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const navigate = (p) => {
  window.history.pushState({}, '', p)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const run = async () => {
  const host = document.getElementById('root')
  const root = createRoot(host)
  root.render(React.createElement(App))
  await wait(900)

  const rows = []

  let lastExpected = null
  for (const [path, expected] of ROUTES) {
    const before = document.querySelector('h1')?.textContent ?? ''
    navigate(path)
    // poll for the heading this route promises rather than trusting a constant
    for (let i = 0; i < 120; i++) {
      await wait(50)
      const now = document.querySelector('h1')?.textContent ?? ''
      if (now.includes(expected) && (expected === lastExpected || now !== before)) break
    }
    await wait(220)
    const got = document.querySelector('h1')?.textContent ?? ''
    if (!got.includes(expected)) {
      problems.push(`${path} rendered "${got.trim().slice(0, 48)}", expected a heading containing "${expected}"`)
    }
    lastExpected = expected

    const text = host.textContent || ''
    const h1s = [...host.querySelectorAll('h1')].map((h) => h.textContent.trim())
    rows.push({
      path,
      chars: text.length,
      links: host.querySelectorAll('a[href]').length,
      h1: h1s[0] || '(none)',
    })

    if (h1s.length !== 1) a11y.push(`${path}: ${h1s.length} <h1> elements (want exactly 1)`)
    for (const img of host.querySelectorAll('img')) {
      if (img.getAttribute('alt') === null) a11y.push(`${path}: <img> has no alt attribute`)
      // a missing or undefined src renders as an empty box, which is worse
      // than no image at all — catch it here rather than in a screenshot
      const src = img.getAttribute('src')
      if (!src || src === 'undefined' || src === 'null') {
        problems.push(`${path}: <img alt="${img.getAttribute('alt')}"> has a broken src (${src})`)
      }
    }
    const name = (el) =>
      (el.getAttribute('aria-label') || el.textContent || '').trim() ||
      (el.getAttribute('aria-labelledby') ? 'labelledby' : '')
    for (const a of host.querySelectorAll('a[href]')) {
      if (!name(a)) a11y.push(`${path}: link to "${a.getAttribute('href')}" has no accessible name`)
    }
    for (const b of host.querySelectorAll('button')) {
      if (!name(b)) a11y.push(`${path}: <button> has no accessible name`)
    }
    for (const i of host.querySelectorAll('input, textarea, select')) {
      if (!i.closest('label') && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')) {
        a11y.push(`${path}: form control "${i.getAttribute('placeholder') || i.type}" has no label`)
      }
    }
    // every outbound group link must point at a real subdomain, never a dead path
    // the group's own sites, this site's social profiles, and its WhatsApp chat; nothing else
    const allowed = new Set(SOCIALS.map((s) => s.url))
    const wa = `https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=`
    for (const a of host.querySelectorAll('a[href^="http"]')) {
      const h = a.getAttribute('href')
      if (!/^https:\/\/(www|agro|studio|shopagro)\.viverst\.com/.test(h) && !allowed.has(h) && !h.startsWith(wa)) {
        problems.push(`${path}: unexpected external link "${h}"`)
      }
    }
  }

  /* ---- the value chain is the hero: it must advance and respond ---- */
  navigate('/')
  await wait(1100)
  const nodes = [...document.querySelectorAll('.chain-node')]
  const firstHeadline = document.querySelector('.chain-headline')?.textContent
  if (nodes.length !== 5) problems.push(`value chain rendered ${nodes.length} stages, expected 5`)

  // clicking a later stage must change the panel
  nodes[3]?.querySelector('button')?.click()
  await wait(500)
  const afterClick = document.querySelector('.chain-headline')?.textContent
  if (afterClick === firstHeadline) problems.push('clicking a chain stage did not change the panel')
  const activeCount = document.querySelectorAll('.chain-node.is-active').length
  if (activeCount !== 1) problems.push(`${activeCount} active chain stages, expected exactly 1`)
  const passed = document.querySelectorAll('.chain-node.is-passed').length
  if (passed !== 3) problems.push(`${passed} stages marked passed after selecting the 4th, expected 3`)
  rows.push({ path: '(value chain)', chars: nodes.length, links: passed, h1: `active=${activeCount} panel changed` })

  /* ---- the rotating image stage ---- */
  navigate('/')
  await wait(1100)
  const stage = document.querySelector('.hero-bg')
  const slides = document.querySelectorAll('.hero-layer img').length
  if (!stage) problems.push('hero image backdrop did not render')
  if (slides !== SHOWCASE.length) problems.push(`hero has ${slides} frames, data has ${SHOWCASE.length}`)
  if (document.querySelector('.stage-dot')) problems.push('hero should have no manual controls')
  // the headline must be split into words for the staggered rise
  const words = document.querySelectorAll('.hero-word').length
  if (words < 5) problems.push(`hero headline split into ${words} words, expected the full line`)
  // The headline is split for the stagger. Three things must survive that:
  const h1 = document.querySelector('h1')
  const h1Text = h1?.textContent || ''
  if (h1Text.trim() !== 'Transforming agriculture through technology & processing.') {
    problems.push(`hero h1 text does not match the headline: "${h1Text.trim().slice(0, 60)}"`)
  }
  // a headline that needs more than two lines is too long, not too small
  const lineCount = document.querySelectorAll('.hero-line').length
  if (lineCount > 2) problems.push(`headline runs to ${lineCount} lines — it should fit in two`)
  // 1. the spaces must be real text nodes between the word spans, not a gap
  //    property — the words live inside centred lines
  const lines = [...document.querySelectorAll('.hero-line')]
  if (lines.length !== 2) problems.push(`headline has ${lines.length} lines, expected 2`)
  let gaps = 0
  for (const ln of lines) {
    gaps += [...ln.childNodes].filter((n) => n.nodeType === 3 && /\s/.test(n.textContent)).length
  }
  if (gaps < 3) problems.push(`headline has ${gaps} space text nodes between words, expected at least 3`)
  // the lines are centred: no line may carry a sideways offset, or it lands
  // off-centre on some widths and past the edge on narrow ones
  const shifts = lines.map((l) => parseFloat(l.style.getPropertyValue('--shift')) || 0)
  if (shifts.some((v) => v !== 0)) problems.push(`headline lines carry offsets (${shifts.join(', ')}) — they must sit centred`)
  // 2. a space held inside an overflow:hidden span is clipped and renders joined
  for (const w of document.querySelectorAll('.hero-word')) {
    if (w.textContent !== w.textContent.trim()) {
      problems.push(`hero word "${w.textContent}" carries its own whitespace — it will render joined`)
    }
  }
  // 3. no word may be empty
  for (const w of document.querySelectorAll('.hero-word')) {
    if (!w.textContent.trim()) problems.push('hero contains an empty word span')
  }

  // every frame must carry real alt text, since these are content images
  // hero pictures are decorative: the headline carries the meaning, so they
  // take empty alt and must not be announced
  for (const img of document.querySelectorAll('.hero-layer img')) {
    if (img.getAttribute('alt') !== '') a11y.push('hero backdrop image should have empty alt')
    if (!img.getAttribute('src')) problems.push('hero backdrop image has no src')
  }

  // Nothing may sit behind the type — no plate, no per-line backing, and by
  // the client's decision no scrim either: the photographs show as shot.
  if (document.querySelector('.hero-plate')) problems.push('a full plate is back behind the type')
  if (document.querySelector('.hero-scrim')) problems.push('a scrim is back over the photographs')
  if (document.querySelector('.hero-lede > span')) {
    problems.push('the supporting line still has a backing wrapper')
  }

  // the counts belong under the hero, not on top of the photograph
  const heroEl = document.querySelector('.hero')
  if (heroEl?.querySelector('.figure, .hero-stats')) {
    problems.push('counts are still sitting inside the hero over the image')
  }
  const figures = document.querySelectorAll('.figures .figure').length
  if (figures !== 3) problems.push(`figures band has ${figures} entries, expected 3`)
  rows.push({ path: '(hero backdrop)', chars: slides, links: words, h1: `${lines.length} centred lines · ${gaps} spaces · no scrim` })
  rows.push({ path: '(figures band)', chars: figures, links: 0, h1: 'counts sit below the hero' })

  /* ---- chain imagery swaps with the stage ---- */
  navigate('/')
  await wait(1100)
  const shotBefore = document.querySelector('.chain-shot img')?.getAttribute('src')
  document.querySelectorAll('.chain-node button')[2]?.click()
  await wait(450)
  const shotAfter = document.querySelector('.chain-shot img')?.getAttribute('src')
  if (!shotBefore) problems.push('value chain panel has no image')
  else if (shotBefore === shotAfter) problems.push('chain image did not change with the stage')
  rows.push({ path: '(chain image)', chars: 1, links: 0, h1: 'image swaps with the stage' })

  /* ---- the homepage should introduce, not repeat the whole site ---- */
  navigate('/')
  await wait(1100)
  const homeSections = document.querySelectorAll('main section').length
  const homeCards = document.querySelectorAll('.focus-card, .pillar-card').length
  // hero · figures · chain · doors · closing ask. More than this and the
  // homepage has started restating the pages it exists to point at.
  if (homeSections > 5) problems.push(`homepage has ${homeSections} sections — it is repeating the inner pages`)
  if (homeCards > 0) problems.push('homepage is re-listing detail that belongs on a dedicated page')
  rows.push({ path: '(home is lean)', chars: homeSections, links: homeCards, h1: 'sections / repeated cards' })

  /* ---- mobile drawer ---- */
  const toggle = document.querySelector('.nav-toggle')
  if (!toggle) problems.push('nav toggle not found')
  else {
    toggle.click()
    await wait(500)
    const drawerLinks = document.querySelectorAll('.nav-drawer-link').length
    const locked = document.body.style.overflow === 'hidden'
    if (drawerLinks !== 5) problems.push(`drawer rendered ${drawerLinks} links, expected 5`)
    if (!locked) problems.push('drawer did not lock body scroll')
    rows.push({ path: '(drawer)', chars: drawerLinks, links: 0, h1: `bodyLocked=${locked}` })
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }))
    await wait(600)
    if (document.querySelectorAll('.nav-drawer-link').length !== 0) {
      problems.push('drawer links still present after Escape — still focusable')
    }
    if (document.body.style.overflow === 'hidden') problems.push('body scroll not released')
  }

  /* ---- contact form ---- */
  navigate('/contact')
  await wait(1100)
  const topics = document.querySelectorAll('.topic').length
  const contactSubmit = document.querySelector('.apply-submit')
  if (topics !== 5) problems.push(`contact has ${topics} topic options, expected 5`)
  if (!contactSubmit?.disabled) problems.push('contact submit should start disabled')
  document.querySelectorAll('.topic')[2]?.click()
  await wait(300)
  if (document.querySelectorAll('.topic.is-on').length !== 1) problems.push('selecting a topic did not mark exactly one active')
  rows.push({ path: '(contact)', chars: topics, links: 0, h1: 'topic selection works' })

  /* ---- footer: this site's own social profiles, exactly, on every page ---- */
  {
    const social = [...document.querySelectorAll('.footer-social-link')]
    const hrefs = social.map((a) => a.getAttribute('href'))
    if (hrefs.join(' ') !== SOCIALS.map((s) => s.url).join(' ')) problems.push(`footer social links are ${hrefs.join(', ') || 'missing'}`)
    for (const a of social) {
      if (a.target !== '_blank' || !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)) problems.push(`${a.href} must open in a new tab with rel="noopener noreferrer"`)
      if (!a.getAttribute('aria-label')?.startsWith(BUSINESS.name + ' on ')) problems.push(`${a.href} has no spoken name`)
    }
    rows.push({ path: '(footer social)', chars: social.length, links: social.length, h1: social.map((a) => a.title).join(' · ') })
  }

  /* ---- contact: WhatsApp opens a chat that says where the visitor came from ---- */
  {
    const waBase = `https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=`
    const text = (a) => new URL(a.href).searchParams.get('text') || ''
    const hello = [...document.querySelectorAll('a[href^="https://wa.me/"]')].find((a) => !a.classList.contains('contact-wa'))
    if (!hello?.href.startsWith(waBase)) problems.push(`WhatsApp contact link is ${hello?.href || 'missing'}`)
    else if (!text(hello).includes('from your website (agro.viverst.com)')) problems.push(`WhatsApp greeting does not say it came from the website: ${text(hello)}`)
    if (!document.querySelector('button.contact-wa:disabled')) problems.push('Send on WhatsApp should start disabled, before anything is typed')
    const setVal = (el, v) => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v)
      el.dispatchEvent(new window.Event('input', { bubbles: true }))
    }
    setVal(document.querySelector('.apply-form input[type="text"]'), 'Ada Obi')
    setVal(document.querySelector('.apply-form textarea'), 'Twenty bags of maize & a quote, delivered to Ikeja #1?')
    await wait(300)
    const send = document.querySelector('a.contact-wa')
    const msg = send ? text(send) : ''
    if (!send?.href.startsWith(waBase)) problems.push('Send on WhatsApp did not become a link once name and message were filled')
    else {
      for (const part of ['Hello ' + BUSINESS.name, 'from your website (agro.viverst.com)', 'Name: Ada Obi', 'About: ', 'What I need: Twenty bags of maize & a quote, delivered to Ikeja #1?']) {
        if (!msg.includes(part)) problems.push(`WhatsApp message is missing "${part}"`)
      }
      if (send.target !== '_blank' || !/noopener/.test(send.rel)) problems.push('Send on WhatsApp must open in a new tab with rel="noopener"')
    }
    rows.push({ path: '(contact whatsapp)', chars: msg.length, links: send ? 1 : 0, h1: msg.split('\n')[0].slice(0, 46) })
  }

  /* ---- structured data ---- */
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((n) => { try { return JSON.parse(n.textContent) } catch { return null } })
    .filter(Boolean)
  rows.push({ path: '(structured data)', chars: ld.length, links: 0, h1: ld.map((d) => d['@type']).join(', ') || '(none)' })

  root.unmount()
  await wait(100)

  console.log('\n ROUTE                 chars  links  h1 / detail')
  console.log(' ' + '-'.repeat(84))
  for (const r of rows) {
    console.log(` ${r.path.padEnd(20)} ${String(r.chars).padStart(6)} ${String(r.links).padStart(6)}  ${r.h1.slice(0, 46)}`)
  }

  console.log(`\n ACCESSIBILITY: ${a11y.length} issue(s)`)
  if (a11y.length) a11y.slice(0, 15).forEach((x) => console.log('  ✗ ' + x))
  else console.log('  ✓ one h1 per route, alt on every image, names on all links, buttons and fields')

  const real = problems.filter((p) => !/not implemented: HTMLCanvasElement/i.test(p))
  console.log(`\n PROBLEMS: ${real.length}`)
  real.slice(0, 15).forEach((p) => console.log('  ✗ ' + p.slice(0, 260)))
  if (!real.length) console.log('  ✓ no runtime errors across any route or interaction')
  if (real.length || a11y.length) process.exitCode = 1
}

run().catch((e) => { console.log('HARNESS THREW:', e && e.stack); process.exitCode = 1 })
