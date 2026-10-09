/** Shared date/time helpers so every page formats identically. */

const LOCALE = 'en-GB'

/* Every date and time is shown in Lagos time, labelled WAT, so a visitor in
   another country sees the same hour as the flyer instead of a silently
   converted one. */
const TZ = 'Africa/Lagos'

export const formatDate = (iso, opts) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ, ...opts })

export const formatShort = (iso) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', timeZone: TZ })

/** "6:00 PM" */
export const formatTime = (iso) =>
  new Date(iso)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ })

/** "6:00 PM WAT", or "6:00 PM – 8:00 PM WAT" when an end time is given. */
export const formatTimeRange = (startIso, endIso) =>
  endIso ? `${formatTime(startIso)} – ${formatTime(endIso)} WAT` : `${formatTime(startIso)} WAT`

export const dayNumber = (iso) =>
  Number(new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', timeZone: TZ }))
export const monthShort = (iso) =>
  new Date(iso).toLocaleDateString(LOCALE, { month: 'short', timeZone: TZ }).toUpperCase()
export const yearOf = (iso) =>
  Number(new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', timeZone: TZ }))

/** Whole days, hours and minutes remaining. Returns null once the time passes. */
export function countdown(iso, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}
