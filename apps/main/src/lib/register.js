/**
 * ============================================================
 * EVENT REGISTRATION
 * ============================================================
 *
 * Sends a registration to the Google Apps Script attached to the
 * registrations spreadsheet. One script serves every event: each event gets
 * its own tab, created on its first registration from the event's slug and
 * title, so the admin page can reuse this unchanged.
 *
 * The request is sent as text/plain on purpose. A JSON content type makes
 * the browser send a preflight request first, which Apps Script cannot
 * answer, and the registration would fail.
 *
 * If the script is ever redeployed as a NEW deployment, its URL changes and
 * must be updated here. Updating the existing deployment keeps the URL.
 */

import { COUNTRIES } from '../data/countries.js'

export const REGISTRATION_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzGt6RX1Kx1MJvQB6YdkLzraO75KxbAzaBF3qVnbymZa0Ugjn5_kC6Noj1iQugdw4U/exec'

const TIMEOUT_MS = 25000

/* ── Phone numbers ─────────────────────────────────────────── */

export const DEFAULT_PHONE_COUNTRY = 'NG'

const BY_ISO = new Map(COUNTRIES.map(([iso, name, dial, trunk, lengths, main]) =>
  [iso, { iso, name, dial, trunk, lengths, main }]))

export const PHONE_COUNTRIES = [...BY_ISO.values()]

/* Nigerian mobile numbers start with 7, 8 or 9 after the leading 0. Other
   countries are checked on length only, so a newly issued range is never
   wrongly rejected. */
const EXTRA_RULES = { NG: /^[789]/ }

export const phoneCountry = (iso) => BY_ISO.get(iso) || BY_ISO.get(DEFAULT_PHONE_COUNTRY)

/**
 * Works out the country from a number typed with + or 00 in front.
 * Where several countries share a code (+1, +44), the selected one is kept
 * if it matches, otherwise the main country for that code.
 */
export function detectPhoneCountry(raw, selectedIso) {
  const t = String(raw).trim().replace(/[\s().-]/g, '')
  const intl = t.startsWith('+') ? t.slice(1) : t.startsWith('00') ? t.slice(2) : null
  if (intl === null || !/^\d/.test(intl)) return null
  for (let n = 3; n >= 1; n--) {
    const code = intl.slice(0, n)
    const matches = PHONE_COUNTRIES.filter((c) => c.dial === code)
    if (!matches.length) continue
    return (matches.find((c) => c.iso === selectedIso) || matches.find((c) => c.main) || matches[0]).iso
  }
  return null
}

const fits = (c, national) =>
  c.lengths.includes(national.length) && (!EXTRA_RULES[c.iso] || EXTRA_RULES[c.iso].test(national))

/**
 * Accepts the number however it was typed, for example for Nigeria:
 * 7011172532, 07011172532, 2347011172532, +2347011172532, +234 (0) 701 117 2532.
 * Returns { ok, e164, iso, pretty } or { ok: false, error }.
 */
export function normalizePhone(raw, selectedIso = DEFAULT_PHONE_COUNTRY) {
  const text = String(raw || '').trim()
  if (!text) return { ok: false, error: 'Enter your phone number.' }
  if (!/^[+\d\s().-]+$/.test(text)) return { ok: false, error: 'Use digits only, e.g. 0803 123 4567.' }

  const detected = detectPhoneCountry(text, selectedIso)
  const c = phoneCountry(detected || selectedIso)
  let digits = text.replace(/\D/g, '')
  if (detected) digits = digits.replace(/^00/, '').slice(c.dial.length)
  else if (digits.startsWith(c.dial) && fits(c, stripTrunk(c, digits.slice(c.dial.length))))
    digits = digits.slice(c.dial.length) // typed the country code without the +

  const national = stripTrunk(c, digits)
  if (!fits(c, national)) {
    return {
      ok: false,
      error: c.iso === 'NG'
        ? 'Enter a valid Nigerian number, e.g. 0803 123 4567.'
        : `That doesn\u2019t look like a ${c.name} mobile number. Check the country code and the number.`,
    }
  }
  return { ok: true, iso: c.iso, e164: `+${c.dial}${national}`, pretty: `+${c.dial} ${group(national)}` }
}

/* Drop the leading 0 (or 1 in North America) only when what is left is a
   valid length, so countries that keep the 0, like Italy, stay correct. */
function stripTrunk(c, digits) {
  if (c.trunk && digits.startsWith(c.trunk) && !fits(c, digits)) return digits.slice(c.trunk.length)
  return digits
}

function group(n) {
  if (n.length === 10) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
  return n.replace(/(\d{3})(?=\d)/g, '$1 ')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Returns { field: message } for anything wrong. Empty object = valid. */
export function validateRegistration(form) {
  const errors = {}
  const name = form.name.trim()

  if (!name) errors.name = 'Enter your full name.'
  else if (name.length < 2) errors.name = 'That name looks too short.'

  const phone = normalizePhone(form.phone, form.phoneCountry)
  if (!phone.ok) errors.phone = phone.error

  if (!form.email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.'

  return errors
}

/**
 * Resolves to { ok: true, duplicate?: boolean } or throws an Error whose
 * message is safe to show to the person filling the form.
 */
export async function submitRegistration(event, form) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const payload = {
    eventId: event.slug,
    eventTitle: event.title,
    name: form.name.trim(),
    phone: normalizePhone(form.phone, form.phoneCountry).e164, // always +<code><number>
    email: form.email.trim(),
    country: form.country.trim(),
    website: form.website || '', // hidden spam trap, empty for real people
    page: typeof window !== 'undefined' ? window.location.href : '',
  }

  let res
  try {
    res = await fetch(REGISTRATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    })
  } catch {
    throw new Error('We couldn\u2019t reach the registration service. Check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }

  let data = null
  try { data = await res.json() } catch { /* handled below */ }

  if (!res.ok || !data) throw new Error('Something went wrong on our side. Please try again in a moment.')
  if (data.ok) return { ok: true, duplicate: Boolean(data.duplicate) }
  if (data.error === 'email') throw new Error('That email address doesn\u2019t look right. Please check it.')
  if (data.error === 'missing') throw new Error('Please fill in your name, phone number and email.')
  throw new Error('Something went wrong on our side. Please try again in a moment.')
}
