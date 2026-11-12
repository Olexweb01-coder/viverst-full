/**
 * A Vite build plugin: gives chosen addresses their own <head>.
 *
 * Each site here is a single-page app, so every address is answered with the
 * same index.html and its <head> describes the homepage. Search engines that
 * run JavaScript cope, but link previews (WhatsApp, Facebook, LinkedIn, X)
 * never do, and a search engine's first read of the page is the raw file.
 *
 * For each page given, this writes dist/<path>/index.html after the build: a
 * copy of index.html with that page's own title, description, canonical
 * address, preview picture and structured data. The host serves a real file
 * before it falls back to index.html, so those addresses get their own head
 * and every other address behaves exactly as before. The app itself is the
 * same; only the <head> of the file differs.
 *
 * A page is { path, url, title, description, image, imageAlt, siteName, jsonLd?, summaryHtml? }.
 * summaryHtml, if given, is placed in a <noscript> block after the app's root: people never see
 * it (the app draws the real page), but a crawler that does not run JavaScript, as most AI
 * assistants' crawlers do not, gets the page's content in words instead of an empty file.
 * If index.html has no <title> or description to replace, the build fails
 * here rather than quietly shipping the wrong head.
 */
import fs from 'node:fs'
import path from 'node:path'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const REQUIRED = ['path', 'url', 'title', 'description', 'image', 'imageAlt', 'siteName']

export function headFor(base, page) {
  for (const key of REQUIRED) {
    if (!page[key]) throw new Error(`route-heads: the page at ${page.path || '(no path)'} has no ${key}`)
  }
  let html = base
  const swap = (pattern, replacement, label) => {
    if (!pattern.test(html)) throw new Error(`route-heads: could not find ${label} in index.html`)
    html = html.replace(pattern, () => replacement)
  }
  swap(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`, '<title>')
  swap(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(page.description)}" />`, 'the description')

  // the homepage's own link-preview tags go; this page's are written fresh below
  html = html
    .replace(/[ \t]*<link rel="canonical"[^>]*>\r?\n?/g, '')
    .replace(/[ \t]*<meta property="og:[^"]*"[^>]*>\r?\n?/g, '')
    .replace(/[ \t]*<meta name="twitter:[^"]*"[^>]*>\r?\n?/g, '')

  const tags = [
    `<link rel="canonical" href="${esc(page.url)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${esc(page.siteName)}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(page.url)}" />`,
    `<meta property="og:image" content="${esc(page.image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(page.imageAlt)}" />`,
    '<meta property="og:locale" content="en_NG" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(page.image)}" />`,
  ]
  if (page.jsonLd) tags.push(`<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`)
  swap(/[ \t]*<\/head>/, `    ${tags.join('\n    ')}\n  </head>`, '</head>')
  if (page.summaryHtml) {
    swap(/<div id="root"><\/div>/, `<div id="root"></div>\n    <noscript>\n${page.summaryHtml}\n    </noscript>`, 'the root element')
  }
  return html
}

export function routeHeads(pages) {
  let outDir = null
  return {
    name: 'viverst-route-heads',
    apply: 'build',
    configResolved(config) { outDir = config.build.ssr ? null : path.resolve(config.root, config.build.outDir) },
    closeBundle() {
      if (!outDir) return
      const indexFile = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexFile)) return
      const base = fs.readFileSync(indexFile, 'utf8')
      for (const page of pages) {
        const file = path.join(outDir, ...page.path.split('/').filter(Boolean), 'index.html')
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, headFor(base, page))
      }
    },
  }
}
