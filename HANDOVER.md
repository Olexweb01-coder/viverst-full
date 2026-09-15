# Viverst — Project Handover

Everything needed to pick this work up in a fresh conversation. If you have
lost the original chat, paste this file in and the context is restored.

---

## 1. What this is

Three websites for **Viverst Global Limited**, a diversified holding company in
Lagos, Nigeria, built as one repository that deploys as three independent sites.

| Site | Domain | Status |
|---|---|---|
| Viverst Global Limited | `viverst.com` | **Built** |
| Viverst Agro | `agro.viverst.com` | **Built** |
| Viverst Studio | `studio.viverst.com` | **Built** |
| Admin backend | — | Later, after Studio |

---

## 2. Repository layout

```
viverst/
├─ package.json            npm workspaces root
├─ verify.mjs              regression audit — run with `node verify.mjs`
├─ packages/
│  ├─ brand/               tokens, self-hosted fonts, all logo and image assets
│  │  ├─ src/base.css      shared reset, layout, buttons, cards
│  │  ├─ src/motion.css    ambient motion utilities
│  │  ├─ src/main.css      parent tokens + fonts
│  │  ├─ src/agro.css      Agro tokens + fonts
│  │  ├─ src/studio.css    Studio tokens + fonts (ready, unused)
│  │  └─ assets/           main/ agro/ studio/ — logos, icons, imagery
│  └─ ui/                  shared components, no motion library
│     └─ src/              Reveal Float Tilt Magnetic Parallax Counter
│                          Marquee Blocks Seo Icon ScrollProgress
│                          ScrollToTop hooks.js
└─ apps/
   ├─ main/                viverst.com
   ├─ agro/                agro.viverst.com
   └─ studio/              (to be created)
```

### Commands

```bash
npm install                      # once, at the root

npm run dev:main                 # localhost:5173
npm run dev:agro                 # localhost:5174

npm run build -w @viverst/main   # production build
npm run test  -w @viverst/main   # headless route + interaction + a11y suite
npm run test  -w @viverst/agro
npm run lint                     # oxlint across the workspace
node verify.mjs                  # regression audit, 29 checks

npm run build:singlefile -w @viverst/agro   # one self-contained dist/index.html
```

`build:singlefile` swaps `BrowserRouter` for `MemoryRouter`, because preview
frames have a `null` origin and history routing cannot build a URL from
`about:srcdoc`. Production builds are unaffected.

---

## 3. Brand rules — measured, not guessed

All three palettes come from the client's developer guideline. The contrast
figures below were computed; several of the client's original colour
assignments fail and were reassigned for that reason.

### Viverst Global Limited — parent
`#06065d` `#0464de` `#a2dae0` `#f5faff` `#8cff89` `#ed0101` `#a70107`
**Bricolage Grotesque + JetBrains Mono.**

- `--ink-soft` `#a2dae0` is **1.5:1** on the background. Graphic only, never text.
- Body copy uses a derived `--ink-muted` `#5b6b86`.

### Viverst Agro
`#18542a` `#9abc05` `#fefefe` `#ffc926` `#f96015` `#d52518` `#f3e8cc`
**Roboto Flex for body + Fraunces for display.**

- `#18542a` carries all text — 8.9:1.
- `#9abc05` is **2.18:1** on white. Graphic only: gradients, icon plates,
  underlines, large numerals. Never small text.
- `#ffc926` buttons carry **`#18542a` labels**. White on that yellow is 1.54:1.
- Footer `#18542a` with `#f3e8cc` text, 7.36:1. Cream also breaks up white as
  alternating section backgrounds.
- `#d52518` is the alert colour — 5.07:1 as text, takes white at 5.11:1.

### Viverst Studio — not yet built
`#8338ec` `#411d77` `#e9ecef` `#fb5607` `#212529`
**Poppins** (the wordmark is Poppins, so the display face is settled).

- `#8338ec` primary text, 4.73:1 on `#e9ecef`.
- `#411d77` supporting, 10.62:1 — better suited to long-form body copy.
- `#fb5607` buttons carry **`#212529` labels**. White on that orange is 3.26:1 and fails.
- In the `#212529` footer, purple is graphics only — footer text must be `#e9ecef`.

---

## 4. Content architecture

The client confirmed this split:

| Where | Which list | Count |
|---|---|---|
| viverst.com | corporate brand architecture (org chart) | 9 business units |
| agro.viverst.com | Agro's areas of focus (service menu) | 7 |
| studio.viverst.com | Studio's areas of focus | 8 |

Both source documents are correct — they answer different questions.

---

## 5. Site maps

**viverst.com** — Home · About · Our Story · Journal (`/blog`, `/blog/:slug`) ·
Events (`/events`, `/events/:slug`) · Contact · 404.
`/agro` and `/studio` 301 to their subdomains.

**agro.viverst.com** — Home · About · What we do (`/solutions`) · Careers ·
Contact · 404.

**studio.viverst.com** (planned) — Home · About · Services · Work · Careers ·
Contact. The client has no client work yet: build the Work route but do not let
the homepage depend on case studies, and use an honest empty state, same as
Agro's Careers page.

---

## 6. Blog, events and the admin backend

Content lives in `apps/main/src/content/`. **No page imports it directly.**
Everything goes through `apps/main/src/lib/cms.js`, the only file that knows
where content comes from.

When the backend exists, add one line to `.env`:

```
VITE_API_URL=https://api.viverst.com
```

and it fetches instead. Expected endpoints:

```
GET /posts   /posts/:slug   /events   /events/:slug
```

Already built for that: every function returns a Promise even locally; `status:
'draft'` items are filtered out everywhere; bodies are **typed block arrays,
not HTML strings**, so nothing from the backend can inject markup; upcoming vs
past is derived from the clock, never stored.

---

## 7. Standing instructions from the client

- No broken code. Test everything before handing it over.
- Minimum effort to open in VS Code, push to GitHub, deploy to Vercel.
- Maximum SEO: semantic markup, structured data, real meta.
- Plain language. The audience is Nigerian farmers, processors, distributors
  and investors. No jargon, no consultant vocabulary.
- No generic or overused phrasing. Nothing that reads as templated.
- **Nothing anywhere may state how the site was made.** Audited by `verify.mjs`.
- Motion throughout. Nothing static.
- The homepage introduces; the dedicated pages explain. Do not restate.

---

## 8. Decisions already settled — do not relitigate

**Text over photography.** No single colour clears 4.5:1 on both the bright and
dark frames in the Agro image set — white is 1.14:1 on the pale sky, deep green
is 1.73:1 on the dark store. Contrast runs one way only. The client tried and
rejected: a full plate behind the text, and per-line backing. **Final: no
backing at all, scrim on the image at 0.84**, which puts white at 5.8:1 over the
palest frame. If the photography needs to be brighter, backing must return —
there is no third option.

**Hero headline.** Two lines maximum, stepped across the centre, Fraunces.
A test fails the build if it exceeds two lines. Short words beat big type.

**Image rotation.** Fully automatic, zoom **in**, cross-fading mid-travel. No
dots, arrows or manual controls.

**The imagery is generated, not photographic.** Real photography could not be
sourced. The client will replace it. Drop files into
`packages/brand/assets/agro/img/` with the same names and every slot updates:
`farmland` `irrigation` `orchard` `harvest` `store` `silos` `soil`.

---

## 9. Bugs found and fixed — the audit guards all of these

`node verify.mjs` runs 29 checks. Each one exists because something broke.

1. **`.container` used the `padding` shorthand**, silently zeroing the vertical
   padding of every component that also used it — the footer logo sat flush
   against the top edge. Now `padding-inline` on the container and
   `padding-block` on components, which cannot collide.
2. **`/companies`** was linked from the homepage hero but had no route, and
   there was no catch-all — it rendered a blank page.
3. **`ScrollToTop` used `behavior: 'auto'`**, which resolves to the CSS
   `scroll-behavior: smooth`, so every navigation animated a long scroll.
4. **The mobile drawer was hidden with `max-height: 0`**, leaving its links
   focusable. Now conditionally rendered.
5. **Brand pills lost their accessible name** below 560px, because
   `display: none` removes text from the accessibility tree.
6. **`VALUES` and `REPUTATION` were duplicated** across two pages and had
   already drifted — five items in one, six in the other.
7. **`og:image` pointed at a square favicon.** Both sites now have real
   1200×630 cards.
8. **`IMG.terrain` referenced a deleted file**, rendering `src={undefined}` as
   an empty white box. The suite now fails on any empty or `undefined` src.
9. **The split headline had no spaces** in its text content — a flex `column-gap`
   looked correct but left the h1 as one run-on string. Spaces must be real text
   nodes *between* the word spans; inside an `overflow: hidden` span they are
   clipped. Asserted three ways.
10. **A blanket regex replaced every `</Link>` with `</a>`** while rewiring
    subsidiary links, leaving files with unbalanced tags. Recovered from the
    pre-edit copy and redone with an explicit `BrandLink` component.
11. **Duplicated components** between `apps/main` and `packages/ui` — the exact
    condition that caused bug 6. Migrated and deleted.

---

## 10. Current state

```
lint            0 warnings, 0 errors
verify.mjs      29/29 checks passed
main tests      13 routes · 0 problems · 0 accessibility issues
agro tests       6 routes · 0 problems · 0 accessibility issues
```

Performance work already done: fonts self-hosted via Fontsource (no
render-blocking third-party requests), all imagery WebP, route chunks
prefetched on idle, `packages/ui` built on IntersectionObserver and CSS rather
than a motion library.

**Known outstanding:** `apps/main` still uses framer-motion for `AnimatePresence`
and `layoutId`; Agro uses GSAP for the hero only. Both sites are client-rendered,
so crawlers receive an empty `<body>` — the JSON-LD in each `index.html` is the
mitigation, but prerendering is the real fix if organic search matters.

---

## 11. Deploying

Three Vercel projects, one repository.

| Project | Root directory | Domain |
|---|---|---|
| viverst-main | `apps/main` | `viverst.com` |
| viverst-agro | `apps/agro` | `agro.viverst.com` |
| viverst-studio | `apps/studio` | `studio.viverst.com` |

Build command `npm run build`, output `dist`, install at the repository root so
workspaces resolve. `vercel.json` and `public/_redirects` are in every app —
SPA rewrites, plus the 301s from `/agro` and `/studio` on the main site.

---

## 12. Next session

1. Build **Viverst Studio** — palette and fonts are already in
   `packages/brand/src/studio.css`; logo, icon and favicons are in
   `packages/brand/assets/studio/`. It needs its own signature hero, distinct
   from the parent's orbiting mark and Agro's farm-to-buyer chain.
2. Add `/careers` to the main site.
3. Then the admin backend across all three.
