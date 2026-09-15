/* Regression audit. Every check here corresponds to something that was
   actually found broken during the build, so none of them can quietly return. */
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => { try { return fs.readFileSync(p, 'utf8') } catch { return '' } }
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'test-dist', '.git'].includes(e.name)) continue
    const f = path.join(dir, e.name)
    if (e.isDirectory()) walk(f, out)
    else out.push(f)
  }
  return out
}
const files = walk('.')
const src = files.filter((f) => /\.(jsx?|css|html|json|md)$/.test(f))
const all = src.map((f) => [f, read(f)])

const checks = []
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail })

/* ── cascade bug: the footer logo sat flush against the top edge ── */
const base = read('packages/brand/src/base.css')
ok('.container uses padding-inline, not the shorthand',
   /\.container\s*\{[^}]*padding-inline/.test(base) && !/\.container\s*\{[^}]*padding:\s*0 /.test(base))
ok('components use padding-block so nothing can flatten them',
   read('apps/agro/src/components/Footer.css').includes('padding-block'))

/* ── dead links and missing routes ── */
for (const app of ['main', 'agro']) {
  const appFiles = all.filter(([f]) => f.startsWith(`apps/${app}/src`))
  const joined = appFiles.map(([, c]) => c).join('\n')
  ok(`${app}: has a catch-all route`, /path="\*"/.test(joined))
  ok(`${app}: no link to /companies`, !joined.includes('"/companies"'))
  ok(`${app}: ScrollToTop is not used locally (comes from @viverst/ui)`,
     !appFiles.some(([f]) => f.endsWith('ScrollToTop.jsx')))
}
ok('ScrollToTop jumps instantly rather than smooth-scrolling',
   read('packages/ui/src/ScrollToTop.jsx').includes("behavior: 'instant'"))

/* ── subsidiary links leave the group site ── */
const siteData = read('apps/main/src/data/site.js')
ok('main points at agro.viverst.com', siteData.includes('https://agro.viverst.com'))
ok('main points at studio.viverst.com', siteData.includes('https://studio.viverst.com'))
ok('main 301s /agro and /studio', read('apps/main/vercel.json').includes('agro.viverst.com')
   && read('apps/main/public/_redirects').includes('301'))
ok('external brand links render as anchors, not router links',
   read('apps/main/src/components/BrandLink.jsx').includes('<a href={to}'))

/* ── every referenced image resolves ── */
let imgProblems = []
for (const app of ['main', 'agro']) {
  const data = read(`apps/${app}/src/data/${app === 'main' ? 'site' : 'agro'}.js`)
  const keys = [...data.matchAll(/^import (\w+) from '@brand-assets\/([^']+)'/gm)]
  for (const [, , rel] of keys) {
    if (!fs.existsSync(path.join('packages/brand/assets', rel))) imgProblems.push(rel)
  }
  const used = [...all.filter(([f]) => f.startsWith(`apps/${app}/src`))
    .flatMap(([, c]) => [...c.matchAll(/IMG\.(\w+)/g)].map((m) => m[1]))]
  const declared = (data.match(/export const IMG = \{([^}]*)\}/)?.[1] ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)
  for (const u of new Set(used)) if (!declared.includes(u)) imgProblems.push(`IMG.${u} (${app})`)
}
ok('every image reference resolves to a real file', imgProblems.length === 0, imgProblems.join(', '))

/* ── accessibility and SEO fundamentals ── */
for (const app of ['main', 'agro']) {
  const html = read(`apps/${app}/index.html`)
  ok(`${app}: JSON-LD in the static HTML`, html.includes('application/ld+json'))
  ok(`${app}: og:image is a real 1200x630 card`,
     html.includes('og:image:width') && fs.existsSync(`apps/${app}/public/og-image.png`))
  ok(`${app}: robots.txt and sitemap.xml`,
     fs.existsSync(`apps/${app}/public/robots.txt`) && fs.existsSync(`apps/${app}/public/sitemap.xml`))
  ok(`${app}: SPA fallback configured`,
     read(`apps/${app}/vercel.json`).includes('index.html') && read(`apps/${app}/public/_redirects`).includes('index.html'))
}

/* ── typography the brand actually specified ── */
ok('main uses Bricolage Grotesque, not Lato',
   read('packages/brand/src/main.css').includes('Bricolage Grotesque') &&
   !read('packages/brand/src/main.css').includes('Lato'))
ok('agro uses Roboto Flex plus Fraunces for display',
   read('packages/brand/src/agro.css').includes('roboto-flex') &&
   read('packages/brand/src/agro.css').includes('fraunces'))
ok('studio tokens are ready for tomorrow',
   read('packages/brand/src/studio.css').includes('#8338ec'))

/* ── colour rules that were measured, not guessed ── */
const agroCss = read('packages/brand/src/agro.css')
ok('agro buttons carry deep-green labels, never white',
   /--on-accent:\s*#18542a/.test(agroCss))
ok('studio orange buttons carry near-black labels',
   /--on-accent:\s*#212529/.test(read('packages/brand/src/studio.css')))

/* ── fonts are self-hosted, no third-party render blocking ── */
ok('no Google Fonts requests anywhere',
   !all.some(([f, c]) => /\.(html|css)$/.test(f) && c.includes('fonts.googleapis.com')))

/* ── nothing states how this was made ── */
const attributed = all.filter(([f, c]) =>
  /(claude|anthropic|chatgpt|copilot|generated by (an )?ai|written by an ai)/i.test(c) && !f.includes('verify.mjs'))
ok('no tooling attribution in any shipped file', attributed.length === 0,
   attributed.map(([f]) => f).join(', '))

/* ── report ── */
const failed = checks.filter((c) => !c.pass)
for (const c of checks) console.log(` ${c.pass ? '✓' : '✗'} ${c.name}${c.detail ? '  → ' + c.detail : ''}`)
console.log(`\n ${checks.length - failed.length}/${checks.length} passed`)
process.exit(failed.length ? 1 : 0)
