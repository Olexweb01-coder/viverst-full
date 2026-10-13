import { supabase } from './supabase.js'

/* Registrations live in a Google Sheet, written by the Apps Script the public
   sites post to. The admin only reads a summary from it: per event, how many
   signed up and a link to that tab. Names and emails never leave the sheet. */
let cache = null

export async function loadRegistrationSummary(force = false) {
  if (cache && !force) return cache
  const { data } = await supabase.from('settings').select('value').eq('key', 'integrations').maybeSingle()
  const url = data?.value?.registrations_script_url
  if (!url) return (cache = { ok: false, reason: 'No registrations script is set in Settings → Integrations.', events: [] })
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000)
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal })
    clearTimeout(t)
    const j = await r.json()
    if (!j?.ok || !Array.isArray(j.events)) throw new Error('unexpected reply')
    return (cache = { ok: true, url: j.url, events: j.events, bySlug: Object.fromEntries(j.events.map((e) => [e.eventId, e])) })
  } catch (e) {
    return (cache = { ok: false, reason: `Could not reach the registrations sheet (${e.message}).`, events: [] })
  }
}

export const tabLink = (summary, ev) => ev?.gid != null && summary?.url ? `${summary.url.replace(/\/edit.*$/, '')}/edit#gid=${ev.gid}` : summary?.url
