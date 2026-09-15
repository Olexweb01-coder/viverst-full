/**
 * ============================================================
 * CONTENT CLIENT
 * ============================================================
 *
 * This is the ONLY file that knows where content comes from.
 * Every page calls these functions and awaits a result — none of them import
 * the seed data directly.
 *
 * Right now the source is the local files in `src/content/`. When the admin
 * backend exists, set VITE_API_URL in `.env` and this file starts fetching
 * instead. No page, component or route needs to change.
 *
 *   VITE_API_URL=https://api.viverst.com
 *
 * Expected endpoints, matching the shapes in src/content/:
 *   GET  /posts                → Post[]
 *   GET  /posts/:slug          → Post
 *   GET  /events               → Event[]
 *   GET  /events/:slug         → Event
 *
 * Everything returns a Promise even in local mode, so swapping the source
 * later cannot surprise a component that was written against sync data.
 */

import { POSTS, CATEGORIES } from '../content/posts.js'
import { EVENTS, EVENT_TYPES } from '../content/events.js'

const API = import.meta.env.VITE_API_URL || ''

async function fromApi(path) {
  const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Content request failed: ${res.status} ${path}`)
  return res.json()
}

/* Only published items are ever shown, so the admin can save drafts safely. */
const published = (items) => items.filter((i) => i.status !== 'draft')

const byNewest = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
const byDate = (a, b) => new Date(a.startsAt) - new Date(b.startsAt)

/* ── Posts ─────────────────────────────────────────────── */

export async function getPosts() {
  const posts = API ? await fromApi('/posts') : POSTS
  return published(posts).slice().sort(byNewest)
}

export async function getPost(slug) {
  if (API) return fromApi(`/posts/${slug}`)
  return POSTS.find((p) => p.slug === slug) ?? null
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
  const events = API ? await fromApi('/events') : EVENTS
  return published(events).slice().sort(byDate)
}

export async function getEvent(slug) {
  if (API) return fromApi(`/events/${slug}`)
  return EVENTS.find((e) => e.slug === slug) ?? null
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
