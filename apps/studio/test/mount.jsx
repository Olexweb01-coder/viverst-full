/* Headless check: mounts the real Studio app in jsdom, walks every route,
   drives the interactive code, and audits accessibility. */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import {
  FOCUS_AREAS, DELIVERABLES, PAINS, PROCESS, REASONS, AUDIENCE,
  COMMITMENTS, CONTACT_TOPICS, PROJECTS, ROLES, STATEMENT, PROMISE,
} from '../src/data/studio.js'

const ROUTES = ['/', '/about', '/services', '/work', '/careers', '/contact', '/not-a-real-page']

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

  for (const path of ROUTES) {
    navigate(path)
    await wait(1100)

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
    for (const a of host.querySelectorAll('a[href^="http"]')) {
      const h = a.getAttribute('href')
      if (!/^https:\/\/(www|agro|studio)\.viverst\.com/.test(h)) {
        problems.push(`${path}: unexpected external link "${h}"`)
      }
    }
    // every internal route must be one the router actually answers
    const known = new Set(['/', '/about', '/services', '/work', '/careers', '/contact'])
    for (const a of host.querySelectorAll('a[href^="/"]')) {
      const h = a.getAttribute('href').split('#')[0]
      if (!known.has(h)) problems.push(`${path}: link to "${h}" has no route`)
    }
  }

  /* ---- the mark is the hero: real geometry, looping, eight strokes ---- */
  navigate('/')
  await wait(1100)
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
  const commits = document.querySelectorAll('.commitments li').length
  if (stackCards !== FOCUS_AREAS.length) problems.push(`stack shows ${stackCards} areas, data has ${FOCUS_AREAS.length}`)
  if (gets !== DELIVERABLES.length) problems.push(`${gets} deliverables rendered, data has ${DELIVERABLES.length}`)
  if (arts !== DELIVERABLES.length) problems.push(`${arts} artefact drawings for ${DELIVERABLES.length} deliverables`)
  if (pains !== PAINS.length) problems.push(`${pains} pain points, data has ${PAINS.length}`)
  if (steps !== PROCESS.length) problems.push(`${steps} process steps, data has ${PROCESS.length}`)
  if (tiles !== REASONS.length) problems.push(`${tiles} reasons, data has ${REASONS.length}`)
  if (chips !== AUDIENCE.length) problems.push(`${chips} audience chips, data has ${AUDIENCE.length}`)
  if (commits !== COMMITMENTS.length) problems.push(`${commits} commitments, data has ${COMMITMENTS.length}`)
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
    if (drawerLinks !== 6) problems.push(`drawer rendered ${drawerLinks} links, expected 6`)
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
  navigate('/services')
  await wait(1100)
  const areas = document.querySelectorAll('.area').length
  if (areas !== FOCUS_AREAS.length) problems.push(`services page lists ${areas} areas, expected ${FOCUS_AREAS.length}`)
  rows.push({ path: '(services)', chars: areas, links: document.querySelectorAll('.gets .get').length, h1: 'areas / deliverables' })

  /* ---- work: every project rendered, and samples labelled on screen ---- */
  navigate('/work')
  await wait(1100)
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

  /* ---- careers: empty state + form that starts disabled ---- */
  navigate('/careers')
  await wait(1100)
  const emptyRoles = document.querySelector('.empty-roles')
  const roleCards = document.querySelectorAll('.role').length
  const roleNotice = document.querySelector('.sample-note')
  const careerFields = document.querySelectorAll('.apply-form input, .apply-form textarea').length
  const careerSubmit = document.querySelector('.apply-submit')
  if (ROLES.length === 0 && !emptyRoles) problems.push('careers page has no empty state for zero open roles')
  if (roleCards !== ROLES.length) problems.push(`careers lists ${roleCards} roles, data has ${ROLES.length}`)
  if (ROLES.some((r) => r.sample) && !roleNotice) {
    problems.push('careers renders sample listings with no notice saying they are samples')
  }
  if (careerFields < 4) problems.push(`careers form has ${careerFields} fields, expected 4`)
  if (!careerSubmit?.disabled) problems.push('careers submit should start disabled')
  rows.push({ path: '(careers)', chars: careerFields, links: 0, h1: `emptyState=${!!emptyRoles} disabled=${!!careerSubmit?.disabled}` })

  /* ---- contact: topics select, submit starts disabled ---- */
  navigate('/contact')
  await wait(1100)
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

  /* ---- the statement is one sentence, word-split for the fill ---- */
  navigate('/')
  await wait(1100)
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
