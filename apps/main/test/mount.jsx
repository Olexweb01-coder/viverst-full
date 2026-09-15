/* Headless smoke test: mounts the real app in jsdom, walks every route,
   drives the pointer/drag/hover code, and reports anything that throws. */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'

const ROUTES = [
  '/', '/about', '/our-story', '/blog', '/blog/why-we-put-our-name-on-every-company',
  '/events', '/events/agro-field-day-2026', '/contact', '/agro', '/studio',
  '/definitely-not-a-page', '/blog/no-such-post', '/events/no-such-event',
]

const problems = []
const a11y = []
const origError = console.error
console.error = (...a) => {
  const msg = a.map((x) => (x && x.message) || String(x)).join(' ')
  problems.push(msg)
  origError('   [console.error]', msg.slice(0, 300))
}
window.addEventListener('error', (e) => problems.push(`window error: ${e.message}`))
window.addEventListener('unhandledrejection', (e) => problems.push(`rejection: ${e.reason}`))

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function pointer(type, target, x = 300, y = 300) {
  const ev = new window.Event(type, { bubbles: true, cancelable: true })
  ev.clientX = x
  ev.clientY = y
  ev.pointerId = 1
  target.dispatchEvent(ev)
}

const run = async () => {
  const host = document.getElementById('root')
  const root = createRoot(host)
  root.render(React.createElement(App))
  await wait(1200)

  const results = []

  for (const path of ROUTES) {
    navigate(path)
    await wait(1800)

    const text = host.textContent || ''
    const headings = [...host.querySelectorAll('h1')].map((h) => h.textContent.trim())
    const links = host.querySelectorAll('a[href]').length
    const canvases = host.querySelectorAll('canvas').length
    results.push({ path, chars: text.length, h1: headings[0] || '(none)', links, canvases })

    /* ---- accessibility audit on this route ---- */
    if (headings.length !== 1) a11y.push(`${path}: ${headings.length} <h1> elements (want exactly 1)`)

    for (const img of host.querySelectorAll('img')) {
      if (img.getAttribute('alt') === null) a11y.push(`${path}: <img src="${img.getAttribute('src')?.slice(0, 40)}"> has no alt attribute`)
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
    for (const inp of host.querySelectorAll('input, textarea, select')) {
      const labelled = inp.closest('label') || inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby')
      if (!labelled) a11y.push(`${path}: form control "${inp.getAttribute('placeholder') || inp.type}" has no label`)
    }
  }

  /* ---- exercise the hero's interactive surfaces ---- */
  navigate('/')
  await wait(1800)

  const mark = document.querySelector('.orbit-mark')
  if (!mark) problems.push('orbit mark not found in DOM')
  else {
    pointer('pointerdown', mark, 400, 300)
    for (let i = 0; i < 8; i++) pointer('pointermove', mark, 400 + i * 22, 300 + i * 4)
    pointer('pointerup', mark, 560, 330)
    mark.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    mark.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  }

  // window-level parallax + wave pointer tracking
  for (let i = 0; i < 10; i++) pointer('pointermove', window, 200 + i * 40, 260 + i * 12)
  window.dispatchEvent(new window.Event('resize'))
  await wait(160)

  // hovering a subsidiary chip stalls the orbit and tints the wave
  const sat = document.querySelector('.orbit-sat')
  if (!sat) problems.push('orbit satellite not found in DOM')
  else {
    sat.dispatchEvent(new window.Event('mouseenter', { bubbles: false }))
    await wait(120)
    sat.dispatchEvent(new window.Event('mouseleave', { bubbles: false }))
  }

  /* ---- blog category filter ---- */
  navigate('/blog')
  await wait(1800)
  const filters = document.querySelectorAll('.filter')
  results.push({ path: '(blog filters)', chars: filters.length, h1: `cards=${document.querySelectorAll('.post-card').length}`, links: 0, canvases: 0 })
  if (filters.length < 2) problems.push('blog category filters did not render')
  if (filters.length) {
    filters[2].click()
    await wait(700)
    const after = document.querySelectorAll('.post-card').length
    if (after === 0) problems.push('filtering the blog produced an empty grid with no empty-state')
    filters[0].click()
    await wait(500)
  }

  /* ---- events tabs, filters and countdown ---- */
  navigate('/events')
  await wait(1800)
  const tabs = document.querySelectorAll('.tab')
  const cells = document.querySelectorAll('.countdown-cell').length
  const evCards = document.querySelectorAll('.event-card').length
  results.push({ path: '(events)', chars: evCards, h1: `tabs=${tabs.length} countdown=${cells}`, links: 0, canvases: 0 })
  if (tabs.length !== 2) problems.push('expected exactly two event tabs (upcoming / past)')
  if (cells !== 4) problems.push(`countdown rendered ${cells} cells, expected 4 — is the next event in the past?`)
  if (tabs.length) {
    tabs[1].click()
    await wait(700)
    if (document.querySelectorAll('.event-card').length === 0 && !document.querySelector('.empty'))
      problems.push('past events tab rendered nothing and no empty state')
    tabs[0].click()
    await wait(500)
  }

  /* ---- structured data on an article and an event ---- */
  navigate('/blog/why-we-put-our-name-on-every-company')
  await wait(1800)
  const articleLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((n) => { try { return JSON.parse(n.textContent) } catch { return null } })
    .filter(Boolean)
  if (!articleLd.some((d) => d['@type'] === 'BlogPosting')) problems.push('article is missing BlogPosting JSON-LD')

  navigate('/events/agro-field-day-2026')
  await wait(1800)
  const eventLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((n) => { try { return JSON.parse(n.textContent) } catch { return null } })
    .filter(Boolean)
  if (!eventLd.some((d) => d['@type'] === 'Event')) problems.push('event page is missing Event JSON-LD')
  results.push({ path: '(structured data)', chars: articleLd.length + eventLd.length,
                 h1: 'BlogPosting + Event verified', links: 0, canvases: 0 })

  /* ---- mobile drawer open/close ---- */
  const toggle = document.querySelector('.nav-toggle')
  if (!toggle) problems.push('nav toggle not found')
  else {
    toggle.click()
    await wait(1200)
    const drawerLinks = document.querySelectorAll('.nav-drawer-link').length
    const bodyLocked = document.body.style.overflow === 'hidden'
    results.push({ path: '(drawer open)', chars: drawerLinks, h1: `bodyLocked=${bodyLocked}`, links: drawerLinks, canvases: 0 })
    if (drawerLinks === 0) problems.push('drawer opened but rendered no links')
    if (!bodyLocked) problems.push('drawer open did not lock body scroll')
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }))
    await wait(1400)
    if (document.querySelectorAll('.nav-drawer-link').length !== 0)
      problems.push('drawer links still present after Escape — they would stay focusable')
    if (document.body.style.overflow === 'hidden') problems.push('body scroll not released after close')
  }

  /* ---- contact form ---- */
  navigate('/contact')
  await wait(1800)
  const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea').length
  const topics = document.querySelectorAll('.topic').length
  const submit = document.querySelector('.contact-submit')
  results.push({ path: '(contact form)', chars: inputs, h1: `topics=${topics}`, links: 0, canvases: 0 })
  if (inputs < 3) problems.push('contact form is missing fields')
  if (!submit || !submit.disabled) problems.push('submit should start disabled while the form is empty')
  if (topics) document.querySelectorAll('.topic')[2].click()
  await wait(80)

  /* ---- scroll behaviour ---- */
  navigate('/about')
  await wait(1500)
  window.dispatchEvent(new window.Event('scroll'))
  await wait(80)

  root.unmount()
  await wait(80)

  console.log('\n ROUTE                      chars  links  canvas  h1')
  console.log(' ' + '-'.repeat(86))
  for (const r of results) {
    console.log(
      ` ${r.path.padEnd(24)} ${String(r.chars).padStart(6)} ${String(r.links).padStart(6)} ${String(r.canvases).padStart(7)}  ${r.h1.slice(0, 44)}`,
    )
  }

  console.log(`\n ACCESSIBILITY: ${a11y.length} issue(s)`)
  if (a11y.length) a11y.slice(0, 20).forEach((x) => console.log('  ✗ ' + x))
  else console.log('  ✓ every image has alt, every link and control has an accessible name, one h1 per route')

  const real = problems.filter((p) => !/not implemented: HTMLCanvasElement/i.test(p))
  console.log(`\n PROBLEMS: ${real.length}`)
  real.slice(0, 25).forEach((p) => console.log('  ✗ ' + p.slice(0, 400)))
  if (real.length || a11y.length) process.exitCode = 1
  else console.log('  ✓ no runtime errors across any route or interaction')
}

run().catch((e) => {
  console.log('HARNESS THREW:', e && e.stack)
  process.exitCode = 1
})
