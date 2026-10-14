/**
 * ============================================================
 * CONTENT CLIENT
 * ============================================================
 *
 * This is the ONLY file that knows where content comes from.
 * Every page calls these functions and awaits a result — none of them import
 * the seed data directly.
 *
 * The source is the admin's database (see lib/adminContent.js), merged with
 * the local seed files in `src/content/`. No page, component or route needs
 * to know which is which.
 *
 * Everything returns a Promise even in local mode, so swapping the source
 * later cannot surprise a component that was written against sync data.
 */

import { POSTS, CATEGORIES } from '../content/posts.js'
import { EVENTS, EVENT_TYPES } from '../content/events.js'
import { fetchAdminPosts, fetchAdminEvents } from './adminContent.js'

/* The admin (admin.viverst.com) is the source now. Local seed content stays
   as a fallback and for anything not yet moved into the admin: the two are
   merged by slug, and an admin record wins. If the admin can't be reached
   the seed content shows on its own, so the site never breaks. */
let postsCache = null
let eventsCache = null
async function allPosts() {
  if (!postsCache) postsCache = fetchAdminPosts().then((admin) => merge(POSTS, admin)).catch(() => POSTS)
  return postsCache
}
async function allEvents() {
  if (!eventsCache) eventsCache = fetchAdminEvents().then((admin) => merge(EVENTS, admin)).catch(() => EVENTS)
  return eventsCache
}
function merge(seed, admin) {
  const bySlug = new Map(seed.map((x) => [x.slug, x]))
  for (const x of admin) bySlug.set(x.slug, x)
  return [...bySlug.values()]
}

/* Only published items are ever shown, so the admin can save drafts safely. */
const published = (items) => items.filter((i) => i.status !== 'draft')

const byNewest = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
const byDate = (a, b) => new Date(a.startsAt) - new Date(b.startsAt)

/* ── Posts ─────────────────────────────────────────────── */

export async function getPosts() {
  return published(await allPosts()).slice().sort(byNewest)
}

export async function getPost(slug) {
  return (await allPosts()).find((p) => p.slug === slug) ?? null
}

export async function getRelatedPosts(post, limit = 3) {
  const all = await getPosts()
  const sameCategory = all.filter((p) => p.slug !== post.slug && p.category === post.category)
  const rest = all.filter((p) => p.slug !== post.slug && p.category !== post.category)
  return [...sameCategory, ...rest].slice(0, limit)
}

export function getCategories() {
  return CATEGORIES
}

/* ── Events ────────────────────────────────────────────── */

export async function getEvents() {
  return published(await allEvents()).slice().sort(byDate)
}

export async function getEvent(slug) {
  return (await allEvents()).find((e) => e.slug === slug) ?? null
}

export function getEventTypes() {
  return EVENT_TYPES
}

/**
 * Upcoming vs past is derived from the clock, never stored — otherwise the
 * page goes stale the moment a date passes and nobody edits the record.
 */
export function splitByTime(events, now = Date.now()) {
  const upcoming = []
  const past = []
  for (const e of events) {
    const end = new Date(e.endsAt || e.startsAt).getTime()
    if (end >= now) upcoming.push(e)
    else past.push(e)
  }
  return { upcoming, past: past.reverse() }
}

export const isUpcoming = (e, now = Date.now()) =>
  new Date(e.endsAt || e.startsAt).getTime() >= now
