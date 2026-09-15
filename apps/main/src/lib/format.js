/** Shared date/time helpers so every page formats identically. */

const LOCALE = 'en-GB'

export const formatDate = (iso, opts) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', ...opts })

export const formatShort = (iso) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })

export const dayNumber = (iso) => new Date(iso).getDate()
export const monthShort = (iso) =>
  new Date(iso).toLocaleDateString(LOCALE, { month: 'short' }).toUpperCase()
export const yearOf = (iso) => new Date(iso).getFullYear()

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
