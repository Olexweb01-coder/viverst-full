/* Headless smoke test: mounts the real app in jsdom, walks every route,
   drives the pointer/drag/hover code, and reports anything that throws. */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { HERO_FRAMES, HERO_LINES, SUBSIDIARIES } from '../src/data/site.js'
import { normalizePhone } from '../src/lib/register.js'

/* Each route states the heading it expects. A flat wait proves nothing: if the
   page has not swapped yet the walk measures the one it just left, and the
   suite still reports green because it never checks which page it got. */
const ROUTES = [
  ['/', 'We build businesses'],
  ['/about', 'Who we are'],
  ['/blog', 'thinking about'],
  ['/blog/why-we-put-our-name-on-every-company', 'Why we put our name'],
  ['/events', 'Come and see the work'],
  ['/events/reimagining-agriculture-digital-economy', 'Reimagining Agriculture'],
  ['/contact', 'gap'],
  ['/careers', 'Build your career'],
  ['/businesses', 'Each company runs its own industry'],
  ['/definitely-not-a-page', 'part of the group'],
  ['/blog/no-such-post', 'part of the group'],
  ['/events/no-such-event', 'part of the group'],
]

// the admin's database is not reachable in this headless run: content must fall back to the seed files
globalThis.fetch = async () => { throw new Error('adminContent offline') }

const problems = []

/* Never let the suite reach the live registrations sheet. Any request to
   Google Apps Script that isn't intercepted by a test's own fake fails loudly. */
{
  const guard = (orig) => async (url, ...rest) => {
    if (String(url).includes('script.google.com')) {
      problems.push(`test tried to contact the live registration sheet: ${url}`)
      throw new Error('blocked in tests')
    }
    return orig ? orig(url, ...rest) : Promise.reject(new Error('no fetch'))
  }
  globalThis.fetch = guard(globalThis.fetch)
  if (typeof window !== 'undefined') window.fetch = guard(window.fetch)
}
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

  /* ---- the hero: every frame, two stepped lines, nothing behind the type ----
     The orbiting mark that used to live here was removed when the hero became
     photographic. Its drag and keyboard assertions went with it. */
  navigate('/')
  await wait(1800)

  const frames = document.querySelectorAll('.hero-frame').length
  const scrim = document.querySelector('.hero-scrim')
  const heroImgs = [...document.querySelectorAll('.hero-frame img')]
  if (frames !== HERO_FRAMES.length) problems.push(`hero has ${frames} frames, data has ${HERO_FRAMES.length}`)
  if (!scrim) problems.push('hero scrim missing — the type would sit on bare picture')
  for (const img of heroImgs) {
    const src = img.getAttribute('src')
    if (!src || src === 'undefined') problems.push(`hero frame has a broken src (${src})`)
  }
  // each frame is offset by its index, or they would all cross-fade together
  const offsets = [...document.querySelectorAll('.hero-frame')].map((f) => f.style.getPropertyValue('--i'))
  if (new Set(offsets).size !== HERO_FRAMES.length) problems.push(`hero frames share offsets (${offsets.join(' ')})`)

  const heroH1 = document.querySelector('.hero-title')
  const heroLines = document.querySelectorAll('.hero-line')
  if (heroLines.length !== 2) problems.push(`hero headline has ${heroLines.length} lines, expected 2`)
  const wanted = HERO_LINES.map((l) => l.text).join(' ')
  if ((heroH1?.textContent || '').replace(/\s+/g, ' ').trim() !== wanted) {
    problems.push(`hero h1 reads "${heroH1?.textContent.trim().slice(0, 60)}", expected the headline`)
  }
  // a space held inside a clipped span renders joined, so it must be a real node
  const heroSpaces = [...(heroH1?.childNodes || [])].filter((n) => n.nodeType === 3 && /\s/.test(n.textContent)).length
  if (heroSpaces < 1) problems.push('hero headline lines run together — no space text node between them')
  const heroShifts = [...heroLines].map((l) => l.style.getPropertyValue('--shift'))
  if (new Set(heroShifts).size < 2) problems.push(`hero lines share offsets (${heroShifts.join(', ')}) — not stepped`)

  // the company count was removed from the hero deliberately: it goes stale
  const heroText = document.querySelector('.hero')?.textContent || ''
  if (/two companies/i.test(heroText)) problems.push('the hero still counts the companies')

  results.push({ path: '(hero)', chars: frames, links: heroLines.length,
                 h1: `frames · lines, scrim=${!!scrim}`, canvases: 0 })

  // window-level parallax still runs on the page
  for (let i = 0; i < 10; i++) pointer('pointermove', window, 200 + i * 40, 260 + i * 12)
  window.dispatchEvent(new window.Event('resize'))
  await wait(160)

  /* ---- the businesses page is the one stop out to each company ---- */
  navigate('/businesses')
  for (let i = 0; i < 120; i++) {
    await wait(50)
    if (document.querySelector('.biz-card')) break
  }
  await wait(220)
  const bizCards = document.querySelectorAll('.biz-card').length
  if (bizCards !== SUBSIDIARIES.length) {
    problems.push(`businesses page shows ${bizCards} companies, data has ${SUBSIDIARIES.length}`)
  }
  // each company must link straight to its own site, not back through viverst.com
  for (const s of SUBSIDIARIES) {
    if (!host.querySelector(`a[href="${s.path}"]`)) {
      problems.push(`businesses page has no link to ${s.path}`)
    }
  }
  const unitCount = document.querySelectorAll('.biz-units li').length
  const expectedUnits = SUBSIDIARIES.reduce((n, s) => n + s.units.length, 0)
  if (unitCount !== expectedUnits) problems.push(`${unitCount} units listed, data has ${expectedUnits}`)
  results.push({ path: '(businesses)', chars: bizCards, links: unitCount,
                 h1: 'companies / units, each linking out', canvases: 0 })

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
  // Only checked while an event is upcoming, so the suite doesn't start
  // failing on its own the day the last scheduled event passes.
  if (document.querySelector('.next-event') && cells !== 4)
    problems.push(`countdown rendered ${cells} cells, expected 4`)
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

  navigate('/events/reimagining-agriculture-digital-economy')
  await wait(1800)
  const eventLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((n) => { try { return JSON.parse(n.textContent) } catch { return null } })
    .filter(Boolean)
  if (!eventLd.some((d) => d['@type'] === 'Event')) problems.push('event page is missing Event JSON-LD')
  results.push({ path: '(structured data)', chars: articleLd.length + eventLd.length,
                 h1: 'BlogPosting + Event verified', links: 0, canvases: 0 })

  /* ---- phone numbers: every way of typing a number reads the same ---- */
  {
    const same = ['7011172532', '07011172532', '2347011172532', '+2347011172532',
                  '+234 (0) 701 117 2532', '00234 701 117 2532', '0701-117-2532']
    for (const raw of same) {
      const r = normalizePhone(raw, 'NG')
      if (!r.ok || r.e164 !== '+2347011172532') problems.push(`phone "${raw}" should read as +2347011172532`)
    }
    for (const raw of ['162561626871', '0123456789', '070111725', '070111725321', 'abc', ''])
      if (normalizePhone(raw, 'NG').ok) problems.push(`phone "${raw}" should be rejected`)
    const intl = [['+44 7700 900123', 'GB', '+447700900123'], ['+1 415 555 0123', 'US', '+14155550123'],
                  ['+233 24 123 4567', 'GH', '+233241234567'], ['+39 312 345 6789', 'IT', '+393123456789']]
    for (const [raw, iso, e164] of intl) {
      const r = normalizePhone(raw, 'NG')
      if (!r.ok || r.iso !== iso || r.e164 !== e164) problems.push(`phone "${raw}" should read as ${e164} (${iso})`)
    }
    results.push({ path: '(phone numbers)', chars: same.length + 6 + intl.length, h1: 'NG variants · rejects · intl', links: 0, canvases: 0 })
  }

  /* ---- event registration form + success dialog ---- */
  {
    const form = document.querySelector('.reg-form')
    if (!form) {
      results.push({ path: '(registration)', chars: 0, h1: 'skipped: no upcoming event with registration', links: 0, canvases: 0 })
    } else {
      const setValue = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(el, v)
        el.dispatchEvent(new window.Event('input', { bubbles: true }))
      }
      const q = (n) => form.querySelector(`input[name="${n}"]`)
      const visible = [...form.querySelectorAll('input')].filter((i) => !i.closest('.reg-trap')).length
      if (visible !== 4) problems.push(`registration form has ${visible} fields, expected 4`)
      for (const n of ['name', 'phone', 'email']) if (!q(n)?.required) problems.push(`registration ${n} should be required`)
      if (q('country')?.required) problems.push('registration country should be optional')

      // The runner exposes Node's own fetch as a global, so the fake has to
      // replace BOTH globalThis.fetch and window.fetch, or the test would
      // post to the real registrations sheet.
      const realGlobalFetch = globalThis.fetch
      const realWindowFetch = window.fetch
      let calls = []
      let mode = 'fail'
      const fakeFetch = async (url, opts) => {
        calls.push({ url, opts })
        if (mode === 'fail') throw new Error('offline')
        return { ok: true, json: async () => ({ ok: true }) }
      }
      globalThis.fetch = fakeFetch
      window.fetch = fakeFetch

      // 0. phone: the code picker defaults to Nigeria and follows a typed +code
      const picker = form.querySelector('.reg-cc select')
      if (!picker || picker.value !== 'NG') problems.push('phone country code should default to Nigeria')
      setValue(q('phone'), '+44 7700 900123')
      await wait(100)
      if (form.querySelector('.reg-cc select')?.value !== 'GB') problems.push('typing +44 did not switch the code picker to the UK')
      setValue(q('phone'), '')
      {
        const sel = form.querySelector('.reg-cc select')
        const setSel = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
        setSel.call(sel, 'NG')
        sel.dispatchEvent(new window.Event('change', { bubbles: true }))
      }
      await wait(100)

      // 1. empty submit: three errors, nothing sent
      form.querySelector('.reg-submit').click()
      await wait(300)
      const errs = form.querySelectorAll('.reg-error').length
      if (errs !== 3) problems.push(`empty registration showed ${errs} errors, expected 3`)
      if (calls.length) problems.push('empty registration was sent to the sheet')

      // 2. network failure: friendly message, no dialog
      setValue(q('name'), 'Test Person')
      setValue(q('phone'), '0803 123 4567')
      setValue(q('email'), 'test@example.com')
      await wait(100)
      form.querySelector('.reg-submit').click()
      await wait(600)
      if (!document.querySelector('.reg-server-error')) problems.push('failed registration showed no error message')
      if (document.querySelector('.reg-dialog')) problems.push('success dialog opened after a failed registration')

      // 3. success: dialog with the WhatsApp button, scroll locked
      mode = 'ok'
      calls = []
      document.querySelector('.reg-form .reg-submit').click()
      await wait(900)
      const dialog = document.querySelector('.reg-dialog')
      const wa = dialog?.querySelector('a.reg-wa-btn')
      let payload = {}
      try { payload = JSON.parse(calls[0]?.opts?.body || '{}') } catch { /* reported below */ }
      if (calls.length !== 1) problems.push(`registration sent ${calls.length} requests, expected 1`)
      if (calls[0]?.opts?.headers?.['Content-Type']?.startsWith('text/plain') !== true)
        problems.push('registration must be sent as text/plain or Apps Script rejects it')
      if (payload.eventId !== 'reimagining-agriculture-digital-economy' || payload.name !== 'Test Person' || payload.country !== '')
        problems.push('registration payload is wrong')
      if (payload.phone !== '+2348031234567')
        problems.push(`phone should be saved as +2348031234567, got ${payload.phone}`)
      if (!dialog) problems.push('success dialog did not open')
      if (!wa || !wa.href.startsWith('https://chat.whatsapp.com/') || wa.target !== '_blank')
        problems.push('success dialog is missing the WhatsApp group button')
      if (!dialog?.textContent.includes('Required')) problems.push('WhatsApp step is not labelled as required')
      const locked = document.body.style.overflow === 'hidden'
      if (!locked) problems.push('success dialog did not lock body scroll')

      window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }))
      await wait(300)
      if (document.querySelector('.reg-dialog')) problems.push('success dialog did not close on Escape')
      if (document.body.style.overflow === 'hidden') problems.push('body scroll not released after the dialog closed')
      if (!document.querySelector('.reg-done a.reg-wa-btn')) problems.push('WhatsApp button not kept on the page after closing the dialog')

      globalThis.fetch = realGlobalFetch
      window.fetch = realWindowFetch
      results.push({ path: '(registration)', chars: visible, h1: `errors=${errs} dialog=${Boolean(dialog)} locked=${locked}`, links: wa ? 1 : 0, canvases: 0 })
    }
  }

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
