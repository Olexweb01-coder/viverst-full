/**
 * Reads published posts and events from the admin's database and returns them
 * in exactly the shapes src/content/ uses, so pages don't change.
 *
 * Uses the database's public REST endpoint with the publishable key. That key
 * is meant to ship in a website: the database's own rules only let it read
 * published items, nothing else. If the request fails for any reason the
 * caller falls back to the local seed content, so the site never goes blank.
 */

const URL = import.meta.env.VITE_SUPABASE_URL || 'https://puuouftwclqkrrnnzkay.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_4g1ggURteogjrNMHtLx0NA_eY1K6yjD'
const IMG = `${URL}/storage/v1/object/public/content-images/`

async function rest(path) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: KEY, Accept: 'application/json' }, signal: ctrl.signal })
    if (!res.ok) throw new Error(`content ${res.status}`)
    return await res.json()
  } finally { clearTimeout(t) }
}

export const imageUrl = (path) => !path ? undefined : path.startsWith('http') ? path : IMG + path

/* ── Markdown → the site's block shape ───────────────────────── */
export function markdownToBlocks(md) {
  const blocks = []
  const paras = String(md || '').replace(/\r/g, '').split(/\n{2,}/)
  for (const raw of paras) {
    const para = raw.trim()
    if (!para) continue
    const lines = para.split('\n')
    if (/^#{1,6}\s/.test(lines[0])) { blocks.push({ type: 'h', text: strip(lines[0].replace(/^#{1,6}\s+/, '')) }); const rest = lines.slice(1).join('\n').trim(); if (rest) blocks.push(...markdownToBlocks(rest)); continue }
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) { blocks.push({ type: 'list', items: lines.map((l) => strip(l.replace(/^\s*[-*•]\s+/, ''))) }); continue }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) { blocks.push({ type: 'list', items: lines.map((l) => strip(l.replace(/^\s*\d+[.)]\s+/, ''))) }); continue }
    if (lines.every((l) => /^\s*>/.test(l))) { blocks.push({ type: 'quote', text: strip(lines.map((l) => l.replace(/^\s*>\s?/, '')).join(' ')) }); continue }
    blocks.push({ type: 'p', text: strip(lines.join(' ')) })
  }
  return blocks
}
/* inline markdown the block renderer doesn't understand is reduced to text;
   citation markers like [3] are dropped, links keep their words */
const strip = (s) => s
  .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1')
  .replace(/\s*\[\d+\]/g, '').trim()

const ARM_CATEGORY = { global: 'group', agro: 'agro', studio: 'studio' }
const ARM_AUTHOR = { global: 'Viverst Global', agro: 'Viverst Agro', studio: 'Viverst Studio' }
const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length

export function mapPost(r) {
  const body = markdownToBlocks(r.body)
  return {
    slug: r.slug, title: r.title, excerpt: r.excerpt || '',
    category: ARM_CATEGORY[r.arm] || 'group', tags: r.tags || [],
    author: { name: ARM_AUTHOR[r.arm] || 'Viverst Global', role: 'Editorial' },
    publishedAt: (r.published_at || r.updated_at || '').slice(0, 10),
    readMinutes: Math.max(1, Math.round(words(r.body) / 200)),
    featured: false, status: 'published', body,
    image: imageUrl(r.cover), fromAdmin: true,
  }
}

const SITE_BRAND = { main: 'group', agro: 'agro', studio: 'studio' }
export function mapEvent(r) {
  return {
    slug: r.slug, title: r.title, excerpt: r.summary || '',
    type: r.kind || 'webinar', brand: SITE_BRAND[r.site] || 'group', mode: r.mode || 'online',
    venue: r.location || (r.mode === 'online' ? 'Online' : ''), city: r.city || undefined,
    startsAt: r.starts_at, endsAt: r.ends_at || undefined,
    capacity: r.capacity || undefined,
    image: imageUrl(r.cover), imageAlt: r.cover ? `${r.title} flyer` : undefined,
    registration: r.registration ? { whatsappUrl: r.whatsapp_url || undefined } : undefined,
    status: 'published', body: markdownToBlocks(r.body), fromAdmin: true,
  }
}

export async function fetchAdminPosts() {
  const rows = await rest('site_posts?select=*&order=published_at.desc&limit=200')
  return rows.map(mapPost)
}
export async function fetchAdminEvents() {
  const rows = await rest('site_events?select=*&order=starts_at.asc&limit=200')
  return rows.map(mapEvent)
}
