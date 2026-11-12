/**
 * Registration: checking the form, and sending it.
 *
 * Registrations go to the same Google Apps Script that takes event
 * registrations on viverst.com (apps/main/src/lib/register.js). One script
 * serves everything: each `eventId` gets its own tab in the registrations
 * sheet, created on its first registration, so the community has its own tab.
 *
 * The request is sent as text/plain on purpose. A JSON content type makes the
 * browser send a preflight request first, which Apps Script cannot answer.
 *
 * If the script is ever redeployed as a NEW deployment its URL changes and
 * must be updated here and in apps/main/src/lib/register.js.
 */

export const REGISTRATION_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzGt6RX1Kx1MJvQB6YdkLzraO75KxbAzaBF3qVnbymZa0Ugjn5_kC6Noj1iQugdw4U/exec'

/* The tab this page's registrations are filed under. */
export const REGISTRATION_ID = 'agricultural-value-chain-community'
export const REGISTRATION_TITLE = 'The Agricultural Value Chain Community'

const TIMEOUT_MS = 25000

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const EMPTY = {
  name: '', email: '', phone: '', country: 'Nigeria', location: '', organisation: '',
  role: '', interests: [], goal: '', source: '', consent: false,
  website: '',   // left empty by people; a filled value marks an automated submission
}

/** Returns { field: message } for anything wrong. An empty object means valid. */
export function validate(f) {
  const e = {}
  const name = f.name.trim()
  if (!name) e.name = 'Enter your full name.'
  else if (name.length < 2) e.name = 'That name looks too short.'

  const email = f.email.trim()
  if (!email) e.email = 'Enter your email address.'
  else if (!EMAIL.test(email)) e.email = 'Enter a valid email address, like name@example.com.'

  const phone = f.phone.trim()
  const digits = phone.replace(/\D/g, '')
  if (!phone) e.phone = 'Enter your phone or WhatsApp number.'
  else if (!/^[+\d\s().-]+$/.test(phone)) e.phone = 'Use digits only, like 0803 123 4567.'
  else if (digits.length < 7 || digits.length > 15) e.phone = 'Check the number. It should have 7 to 15 digits.'

  if (!f.country) e.country = 'Choose your country.'
  if (!f.location.trim()) e.location = 'Enter your state or location.'
  if (!f.role) e.role = 'Choose the option that best describes you.'
  if (!f.interests.length) e.interests = 'Choose at least one area.'
  if (!f.consent) e.consent = 'Tick the box to agree before you register.'
  return e
}

/** The order fields appear in, so the first one with a problem gets the focus. */
export const FIELD_ORDER = ['name', 'email', 'phone', 'country', 'location', 'role', 'interests', 'consent']

/* The sheet stores numbers as +<country code><number>. A Nigerian number typed
   the local way (0803...) is given its code; anything typed with a + is kept. */
export function tidyPhone(raw, country) {
  const text = String(raw || '').trim()
  const digits = text.replace(/\D/g, '')
  if (text.startsWith('+')) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (country === 'Nigeria' && digits.length === 11 && digits.startsWith('0')) return `+234${digits.slice(1)}`
  if (country === 'Nigeria' && digits.length === 13 && digits.startsWith('234')) return `+${digits}`
  return digits
}

/* The first eight fields are the ones the script already files for events;
   the rest are this form's own answers. */
export function toPayload(f) {
  return {
    eventId: REGISTRATION_ID,
    eventTitle: REGISTRATION_TITLE,
    name: f.name.trim(),
    phone: tidyPhone(f.phone, f.country),
    email: f.email.trim().toLowerCase(),
    country: f.country,
    website: f.website || '',
    page: typeof window !== 'undefined' ? window.location.href : '',
    location: f.location.trim(),
    organisation: f.organisation.trim(),
    role: f.role,
    interests: f.interests.join(', '),
    goal: f.goal.trim(),
    source: f.source,
    consent: 'Yes',
  }
}

/**
 * Resolves to { ok: true, duplicate } or throws an Error whose message is safe
 * to show to the person filling the form.
 */
export async function sendRegistration(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

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
    throw new Error('We could not reach the registration service. Check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }

  let data = null
  try { data = await res.json() } catch { /* handled below */ }

  if (!res.ok || !data) throw new Error('Something went wrong on our side. Please try again in a moment.')
  if (data.ok) return { ok: true, duplicate: Boolean(data.duplicate) }
  if (data.error === 'email') throw new Error('That email address does not look right. Please check it.')
  if (data.error === 'missing') throw new Error('Please fill in your name, phone number and email.')
  throw new Error('Something went wrong on our side. Please try again in a moment.')
}
