# Viverst Global Limited — Website

React 19 + Vite. Every route is animated, and the whole thing is tested
headlessly before it ships.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # production build → dist/
npm run preview      # serve the production build
npm run lint         # oxlint — currently 0 warnings, 0 errors
npm run test         # headless route + interaction + accessibility audit
npm run build:singlefile   # one self-contained dist/index.html, opens from file://
```

## Routes

| Path | Page |
|---|---|
| `/` | Home — orbit hero, what the parent supplies, the two companies, stats, values, reputation, CTA |
| `/about` | Vision / mission / purpose, positioning, brand architecture tree, values |
| `/our-story` | The name's etymology and the founding chapters |
| `/contact` | Contact details and a message form |
| `/agro` | Viverst Agro, in its own palette and typeface |
| `/studio` | Viverst Studio, in its own palette and typeface |
| `/blog` | Journal listing, filtered by category |
| `/blog/:slug` | Article, with reading progress |
| `/events` | Events, upcoming/past, with a live countdown |
| `/events/:slug` | Event detail with registration CTA |
| `*` | 404 |

## Structure

```
src/
  data/site.js          ← ALL copy and structured content lives here
  index.css             ← design tokens, base styles, buttons, cards
  components/
    OrbitMark.jsx       ← the draggable 3D mark + orbiting subsidiaries
    WaveField.jsx       ← the animated canvas background
    Navbar.jsx          ← fixed nav, animated active pill, mobile drawer
    Footer.jsx
    Reveal.jsx          ← scroll-in wrapper used by every section
    PageShell.jsx       ← route cross-fade
    Marquee.jsx         ← the values ticker
    AnimatedCounter.jsx
    ScrollProgress.jsx  ← the bar at the very top
    ScrollToTop.jsx
    Seo.jsx             ← per-route <title>/<meta>
  pages/
    Home.jsx + Home.css
    About.jsx / OurStory.jsx / Contact.jsx / Subsidiary.jsx / NotFound.jsx
    Pages.css           ← shared styles for the four above
```

**Content is centralised.** Change a value, a business unit or a tagline in
`src/data/site.js` and it updates everywhere. The previous codebase had the
`VALUES` and `REPUTATION` arrays duplicated in Home and About, and they had
already drifted — Home listed five reputation items, About listed six.

## Brand tokens

From the developer guideline. All three sets are defined in `src/index.css`.

**Parent** — `#06065d` `#0464de` `#a2dae0` `#f5faff` `#8cff89` `#ed0101` `#a70107`,
Bricolage Grotesque + JetBrains Mono.

**Viverst Agro** — `#18542a` `#9abc05` `#ffc926` `#f96015` `#f3e8cc`, Roboto Flex.

**Viverst Studio** — `#411d77` `#8338ec` `#fb5607` `#e9ecef` `#212529`, Poppins.

Two notes on usage. `--ink-soft` (`#a2dae0`) is 1.5:1 against the background,
so it cannot carry text — there's a derived `--ink-muted` (`#5b6b86`) for body
copy. And `#9abc05` (2.1:1) and `#ffc926` (1.5:1) are swatch-only for the same
reason; Agro's text colour is `#18542a` at 8.6:1.

## How the orbit hero works

`OrbitMark.jsx`. The mark is two stacked images with `backface-visibility:
hidden`, the back one at `rotateY(180deg)` — so a full drag-spin shows a
correct reverse side instead of collapsing to nothing at 90°. It idles on a
13-second turn/hold/turn cycle, accepts drag with momentum, and settles onto
the nearest whole turn so it never comes to rest edge-on. Arrow keys rotate it
for keyboard users.

The two subsidiaries travel a circular path tilted 11°, 34 seconds per
revolution. Each connector is drawn all the way to the mark's centre with the
artwork stacked above it, so the PNG's own alpha clips the line exactly at the
silhouette — the wire meets the mark perfectly at every angle with nothing to
measure. Two wire layers (front and back) keep the near company's line
crossing over the mark and the far one behind it.

Orbit radii derive from the chips' **measured** width:

```js
RX = Math.max(52, Math.min(width * 0.455, width / 2 - chipHalfWidth - 4))
```

so a label can never be pushed off-screen, at any viewport, in any font. It
re-measures on resize, on orientation change, and once webfonts load and change
the text metrics.

## Motion

One easing curve throughout (`cubic-bezier(0.16, 1, 0.3, 1)`, `--ease`).
Scroll-in reveals, route cross-fades, an animated active pill in the nav that
slides between items via `layoutId`, counters, a pausable marquee, drifting
gradient orbs, and the canvas wave.

`prefers-reduced-motion` is respected globally in `index.css` and again
per-component — `Reveal`, `PageShell`, `Marquee`, `AnimatedCounter`,
`ScrollProgress` and `WaveField` each stand down individually rather than
relying only on the CSS override.

## Testing

```bash
npm run test
```

Mounts the real app in jsdom, walks every route, and drives the interactive
code: drag-spin with momentum, arrow-key rotation, orbit hover, window
parallax, resize, the mobile drawer (open → body lock → Escape → verifies the
links are genuinely unmounted, not just hidden), and the contact form. It also
runs an accessibility audit — one `<h1>` per route, `alt` on every image, an
accessible name on every link, button and form control.

Current state: **0 runtime errors, 0 accessibility issues, 0 lint warnings.**

## Deploying

`vercel.json` and `public/_redirects` are both included, so deep links like
`/about` survive a refresh on Vercel or Netlify. On another host, point all
unmatched paths at `index.html`.

`public/robots.txt` and `public/sitemap.xml` are included.

## Blog and Events — and where the admin plugs in

Content lives in `src/content/posts.js` and `src/content/events.js`. **No page
imports those files.** Every page goes through `src/lib/cms.js`, which is the
only file that knows where content comes from.

```js
// src/lib/cms.js
const API = import.meta.env.VITE_API_URL || ''
```

When the admin backend exists, add one line to `.env`:

```
VITE_API_URL=https://api.viverst.com
```

and `cms.js` starts fetching instead of reading local files. No page,
component or route changes. The endpoints it expects:

```
GET /posts          → Post[]
GET /posts/:slug    → Post
GET /events         → Event[]
GET /events/:slug   → Event
```

Return the same shapes as the seed files and everything works.

**Things already built for a CMS:**

- Every function returns a Promise, even locally — so nothing was written
  against synchronous data and then breaks when the API lands.
- `status: 'draft'` items are filtered out everywhere, so the admin can save
  drafts safely from day one.
- Article and event bodies are **typed block arrays**, not HTML strings. They
  map onto a block editor, and nothing from the backend can inject markup into
  the page. Rendered by `components/Blocks.jsx`.
- Upcoming vs past is derived from the clock at render time, never stored —
  the events page can't go stale because nobody edited a record.
- Add a post or event and the sitemap generator picks it up.

### Admin backend — what to build

Any headless CMS or a small CRUD service works. It needs to serve the four
endpoints above and provide an authenticated editor for:

| Post | Event |
|---|---|
| `slug`, `title`, `excerpt` | `slug`, `title`, `excerpt` |
| `category`, `tags[]` | `type`, `brand`, `mode` |
| `author { name, role }` | `venue`, `city`, `capacity` |
| `publishedAt`, `readMinutes` | `startsAt`, `endsAt` (ISO) |
| `featured`, `status` | `registerUrl`, `status` |
| `body[]` (blocks) | `body[]` (blocks) |

Block types currently rendered: `p`, `h`, `list` (with `items[]`), `quote`.
Add a new type in `Blocks.jsx` and it becomes available everywhere.

## SEO

- Per-route `<title>`, description and canonical via React 19's native tag
  hoisting (`components/Seo.jsx`) — no helmet library.
- `Organization` + `WebSite` JSON-LD in `index.html`, including both
  subsidiaries as `subOrganization`. It sits in the **static** HTML on purpose:
  this is a client-rendered SPA, so that block is the one machine-readable
  thing a crawler gets without running JavaScript.
- `public/og-image.png` — a real 1200×630 social card. **Regenerate this with
  Bricolage Grotesque before launch**; the shipped one was rendered on a
  machine without the brand font, so the type is a substitute face.
- `BlogPosting` JSON-LD on every article, `Event` JSON-LD on every event page
  (including `eventAttendanceMode` for online, hybrid and in-person). Event
  markup is what gets a listing into Google's event results.
- `robots.txt`, `sitemap.xml` (19 URLs including every post and event), SPA
  rewrites for Vercel and Netlify.

**Still worth doing:** the page *body* is still only in the JavaScript. If
organic search matters, add prerendering (`vite-plugin-prerender`,
`react-snap`) or move to a framework that renders on the server.

## Motion inventory

Nothing on the site is static. Cards float on staggered loops, swatches and
dots breathe, gradient orbs drift, dashed rings turn, light sweeps cross cards,
chips bob in the marquee, buttons are magnetic, cards tilt toward the cursor,
the CTA orb is scroll-parallaxed, counters count, and the hero mark spins,
breathes and can be dragged. Every loop has its own duration so nothing falls
into sync.

Utilities live at the bottom of `index.css`: `.float`, `.breathe`, `.drift`,
`.spin-slow`, `.sheen-host`, `.livedot`, `.icon-plate`, `.tiltable`. Components:
`Float`, `Tilt`, `Magnetic`, `Parallax`.

## A cascade bug worth remembering

`.container` originally used `padding: 0 var(--gutter)`. Because `index.css`
loaded *after* component styles, that shorthand silently reset the vertical
padding of everything else using `.container` — the footer lost its 72px top
padding, which is why the logo sat flush against the top edge.

Fixed two ways: `index.css` is now imported first in `main.jsx`, and
`.container` uses `padding-inline` while components use `padding-block`. Those
two properties cannot collide.
