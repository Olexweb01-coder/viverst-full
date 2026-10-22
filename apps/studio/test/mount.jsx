/* Headless check: mounts the real Studio app in jsdom, walks every route,
   drives the interactive code, and audits accessibility. */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import {
  FOCUS_AREAS, DELIVERABLES, PAINS, PROCESS, REASONS, AUDIENCE,
  CONTACT_TOPICS, PROJECTS, STATEMENT, PROMISE,
  SOCIALS, WHATSAPP, BUSINESS,
} from '../src/data/studio.js'

/* Each route states the heading it expects. Waiting for "an h1 exists" is
   useless: the previous page's h1 is still on screen, so the wait returns
   instantly and the walk measures the page it just left. Every route lagged by
   one before this, and the suite still reported green because it never checked
   which page it had. */
const ROUTES = [
  ['/', 'We design with strategy'],
  ['/about', 'Great businesses'],
  ['/services', 'Eight areas'],
  ['/work', 'The work'],
  ['/contact', 'Tell us what'],
  ['/not-a-real-page', 'That page is not here'],
]

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

/* Navigate and then wait for the route to actually render, rather than giving
   it a fixed number of milliseconds. A lazy chunk on a loaded machine can take
   longer than any constant we pick, and a test that fails for being impatient
   is worse than no test: it teaches you to ignore red. Polls up to 6s, then
   gives the effects a moment to settle. */
const h1Has = (text) => () =>
  (document.querySelector('h1')?.textContent ?? '').includes(text)

const navigate = async (p, ready) => {
  window.history.pushState({}, '', p)
  window.dispatchEvent(new PopStateEvent('popstate'))
  const done = ready ?? (() => document.querySelector('h1'))
  for (let i = 0; i < 120; i++) {
    await wait(50)
    if (done()) break
  }
  await wait(180)
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
    // the heading must contain what this route promises, and unless the route
    // before it shares that heading, it must also have changed
    await navigate(path, () => {
      const now = document.querySelector('h1')?.textContent ?? ''
      return now.includes(expected) && (expected === lastExpected || now !== before)
    })
    const got = document.querySelector('h1')?.textContent ?? ''
    if (!got.includes(expected)) {
      problems.push(`${path} rendered "${got.trim().slice(0, 48)}", expected a heading containing "${expected}"`)
    }
    lastExpected = expected

    const text = host.textContent || ''
    const h1s = [...host.querySelectorAll('h1')].map((h) => h.textContent.trim())
    rows.push({ path, chars: text.length, links: host.querySelectorAll('a[href]').length, h1: h1s[0] || '(none)' })

    if (h1s.length !== 1) a11y.push(`${path}: ${h1s.length} <h1> elements (want exactly 1)`)
    for (const img of host.querySelectorAll('img')) {
      if (img.getAttribute('alt') === null) a11y.push(`${path}: <img> has no alt attribute`)
      const src = img.getAttribute('src')
      if (!src || src === 'undefined' || src === 'null') {
        problems.push(`${path}: <img alt="${img.getAttribute('alt')}"> has a broken src (${src})`)
      }
    }
    const name = (el) =>
      (el.getAttribute('aria-label') || el.textContent || '').trim()
      || (el.getAttribute('aria-labelledby') ? 'labelledby' : '')
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
    // the group's own sites, this site's social profiles, and its WhatsApp chat; nothing else
    const allowed = new Set(SOCIALS.map((s) => s.url))
    const wa = `https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=`
    for (const a of host.querySelectorAll('a[href^="http"]')) {
      const h = a.getAttribute('href')
      if (!/^https:\/\/(www|agro|studio)\.viverst\.com/.test(h) && !allowed.has(h) && !h.startsWith(wa)) {
        problems.push(`${path}: unexpected external link "${h}"`)
      }
    }
    // every internal route must be one the router actually answers
    const known = new Set(['/', '/about', '/services', '/work', '/contact'])
    for (const a of host.querySelectorAll('a[href^="/"]')) {
      const h = a.getAttribute('href').split('#')[0]
      if (!known.has(h)) problems.push(`${path}: link to "${h}" has no route`)
    }
  }

  /* ---- the mark is the hero: real geometry, looping, eight strokes ---- */
  await navigate('/', h1Has('We design with strategy'))
  const rays = document.querySelectorAll('.mark-ray').length
  const blob = document.querySelector('.mark-blob')
  const star = document.querySelector('.mark-star')
  if (rays !== 8) problems.push(`mark has ${rays} strokes, expected 8 — one per area of focus`)
  if (!blob || !star) problems.push('mark is missing the blob or the star')
  // 16 vertices: eight outer points alternating with eight inner ones
  const pts = (star?.getAttribute('points') || '').trim().split(/\s+/).length
  if (pts !== 16) problems.push(`star polygon has ${pts} points, expected 16`)
  // each stroke is staggered, so they travel out in sequence rather than together
  const delays = [...document.querySelectorAll('.mark-ray')]
    .map((r) => r.style.animationDelay).filter(Boolean)
  if (new Set(delays).size !== 8) problems.push(`strokes share animation delays (${delays.join(' ')})`)
  rows.push({ path: '(the mark)', chars: rays, links: pts, h1: 'eight strokes, staggered, 16-point star' })

  /* ---- headline: two lines, stepped, and one readable sentence ---- */
  const h1 = document.querySelector('h1')
  const lines = [...document.querySelectorAll('.hero-line')]
  if (lines.length !== 2) problems.push(`headline has ${lines.length} lines, expected 2`)
  if (h1?.textContent.replace(/\s+/g, ' ').trim() !== PROMISE) {
    problems.push(`hero h1 reads "${h1?.textContent.trim().slice(0, 60)}", expected the promise`)
  }
  // a space held inside an overflow:hidden span is clipped and renders joined,
  // so the gap between lines has to be a real text node outside the masks
  const spaceNodes = lines
    .flatMap((l) => [...l.childNodes])
    .filter((n) => n.nodeType === 3 && /\s/.test(n.textContent)).length
  if (spaceNodes < 1) problems.push('headline lines run together — no space text node between them')
  for (const w of document.querySelectorAll('.hero-word')) {
    if (w.textContent !== w.textContent.trim()) {
      problems.push(`hero word "${w.textContent}" carries its own whitespace — it will render joined`)
    }
    if (!w.textContent.trim()) problems.push('hero contains an empty word span')
  }
  const shifts = lines.map((l) => l.style.getPropertyValue('--shift'))
  if (new Set(shifts).size < 2) problems.push(`headline lines share offsets (${shifts.join(', ')}) — not stepped`)
  rows.push({ path: '(headline)', chars: lines.length, links: spaceNodes, h1: `stepped ${shifts.join(' / ')}` })

  /* ---- homepage content matches the data file, nothing invented ---- */
  const stackCards = document.querySelectorAll('.stack-card').length
  const gets = document.querySelectorAll('.gets-deliverables .get').length
  const arts = document.querySelectorAll('.gets-deliverables .art').length
  const pains = document.querySelectorAll('.pain').length
  const steps = document.querySelectorAll('.step').length
  const tiles = document.querySelectorAll('.tile').length
  const chips = document.querySelectorAll('.chips span').length
  if (stackCards !== FOCUS_AREAS.length) problems.push(`stack shows ${stackCards} areas, data has ${FOCUS_AREAS.length}`)
  if (gets !== DELIVERABLES.length) problems.push(`${gets} deliverables rendered, data has ${DELIVERABLES.length}`)
  if (arts !== DELIVERABLES.length) problems.push(`${arts} artefact drawings for ${DELIVERABLES.length} deliverables`)
  if (pains !== PAINS.length) problems.push(`${pains} pain points, data has ${PAINS.length}`)
  if (steps !== PROCESS.length) problems.push(`${steps} process steps, data has ${PROCESS.length}`)
  if (tiles !== REASONS.length) problems.push(`${tiles} reasons, data has ${REASONS.length}`)
  if (chips !== AUDIENCE.length) problems.push(`${chips} audience chips, data has ${AUDIENCE.length}`)
  rows.push({ path: '(home content)', chars: stackCards + gets + pains + steps + tiles, links: chips, h1: 'all counts match the data file' })

  /* ---- every artefact is drawn, not an empty frame ---- */
  const thin = [...document.querySelectorAll('.gets-deliverables .art')]
    .map((s) => s.querySelectorAll('rect, polygon, ellipse, path, line').length)
    .filter((n) => n < 10)
  if (thin.length) problems.push(`${thin.length} artefact(s) are near-empty frames (${thin.join(', ')} shapes)`)

  /* ---- sample work must be labelled wherever it renders ---- */
  const homeProjects = document.querySelectorAll('.project-meta').length
  if (PROJECTS.length > 0 && homeProjects === 0) problems.push('homepage shows no work teaser despite projects existing')
  rows.push({ path: '(work teaser)', chars: homeProjects, links: 0, h1: 'projects shown on the homepage' })

  /* ---- every section offers a way onward ---- */
  const dead = [...document.querySelectorAll('main section')]
    .filter((s) => s.querySelectorAll('a[href]').length === 0).length
  if (dead > 2) problems.push(`${dead} homepage sections dead-end with no link onward`)
  rows.push({ path: '(exits)', chars: document.querySelectorAll('main section').length, links: dead, h1: 'sections / dead ends' })

  /* ---- reveal blocks must never be left hidden ---- */
  const rv = document.querySelectorAll('[data-rv]').length
  if (rv < 4) problems.push(`only ${rv} reveal blocks found — the sweep has nothing to drive`)

  /* ---- mobile drawer: built on open, removed on close ---- */
  const toggle = document.querySelector('.nav-toggle')
  if (!toggle) problems.push('nav toggle not found')
  else {
    if (document.querySelectorAll('.nav-drawer-link').length !== 0) {
      problems.push('drawer links are in the DOM while it is closed — still focusable')
    }
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

  /* ---- services: all eight areas, all six deliverables ---- */
  await navigate('/services', h1Has('Eight areas'))
  const areas = document.querySelectorAll('.area').length
  if (areas !== FOCUS_AREAS.length) problems.push(`services page lists ${areas} areas, expected ${FOCUS_AREAS.length}`)
  rows.push({ path: '(services)', chars: areas, links: document.querySelectorAll('.gets .get').length, h1: 'areas / deliverables' })

  /* ---- work: every project rendered, and samples labelled on screen ---- */
  await navigate('/work', h1Has('The work'))
  const workCards = document.querySelectorAll('.gets .get').length
  const emptyWork = document.querySelector('.empty-state')
  const sampleCount = PROJECTS.filter((p) => p.sample).length
  const workNotice = document.querySelector('.sample-note')
  if (PROJECTS.length === 0 && !emptyWork) problems.push('work page has no empty state with zero projects')
  if (workCards !== PROJECTS.length) problems.push(`work page shows ${workCards} projects, data has ${PROJECTS.length}`)
  if (sampleCount > 0 && !workNotice) {
    problems.push('work page renders sample projects with no notice saying they are samples')
  }
  const covers = document.querySelectorAll('.gets .art').length
  if (covers !== PROJECTS.length) problems.push(`${covers} project covers for ${PROJECTS.length} projects`)
  rows.push({ path: '(work)', chars: workCards, links: covers, h1: `samples=${sampleCount} labelled=${!!workNotice}` })

  /* ---- contact: topics select, submit starts disabled ---- */
  await navigate('/contact', h1Has('Tell us what'))
  const topics = document.querySelectorAll('.topic').length
  const contactSubmit = document.querySelector('.apply-submit')
  if (topics !== CONTACT_TOPICS.length) problems.push(`contact has ${topics} topics, data has ${CONTACT_TOPICS.length}`)
  if (!contactSubmit?.disabled) problems.push('contact submit should start disabled')
  document.querySelectorAll('.topic')[2]?.click()
  await wait(300)
  if (document.querySelectorAll('.topic.is-on').length !== 1) {
    problems.push('selecting a topic did not mark exactly one active')
  }
  rows.push({ path: '(contact)', chars: topics, links: 0, h1: 'topic selection works' })

  /* ---- footer: this site's own social profiles, exactly, on every page ---- */
  {
    const social = [...document.querySelectorAll('.foot-social-link')]
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
    else if (!text(hello).includes('from your website (studio.viverst.com)')) problems.push(`WhatsApp greeting does not say it came from the website: ${text(hello)}`)
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
      for (const part of ['Hello ' + BUSINESS.name, 'from your website (studio.viverst.com)', 'Name: Ada Obi', 'About: ', 'What I need: Twenty bags of maize & a quote, delivered to Ikeja #1?']) {
        if (!msg.includes(part)) problems.push(`WhatsApp message is missing "${part}"`)
      }
      if (send.target !== '_blank' || !/noopener/.test(send.rel)) problems.push('Send on WhatsApp must open in a new tab with rel="noopener"')
    }
    rows.push({ path: '(contact whatsapp)', chars: msg.length, links: send ? 1 : 0, h1: msg.split('\n')[0].slice(0, 46) })
  }

  /* ---- the statement is one sentence, word-split for the fill ---- */
  await navigate('/', h1Has('We design with strategy'))
  const stmt = document.querySelector('.statement')
  if (stmt && stmt.textContent.replace(/\s+/g, ' ').trim() !== STATEMENT) {
    problems.push('the statement no longer reads as its own sentence after the word split')
  }
  if (document.querySelectorAll('.statement .sw.is-key').length < 1) {
    problems.push('no emphasised words in the statement')
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
