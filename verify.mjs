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
    // Record with forward slashes whatever the platform. path.join yields
    // backslashes on Windows, and every filter below matches on 'apps/x/src'.
    // Unnormalised, the per-app checks find no files: two of them fail outright
    // and the rest pass vacuously, because an empty list satisfies any "does
    // not contain" test. The audit then reports green while testing nothing.
    else out.push(f.split(path.sep).join('/'))
  }
  return out
}
const files = walk('.')
const src = files.filter((f) => /\.(jsx?|css|html|json|md)$/.test(f))
const all = src.map((f) => [f, read(f)])

const APPS = ['main', 'agro', 'studio']

const checks = []
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail })

/* ── cascade bug: the footer logo sat flush against the top edge ── */
const base = read('packages/brand/src/base.css')
ok('.container uses padding-inline, not the shorthand',
   /\.container\s*\{[^}]*padding-inline/.test(base) && !/\.container\s*\{[^}]*padding:\s*0 /.test(base))
ok('components use padding-block so nothing can flatten them',
   read('apps/agro/src/components/Footer.css').includes('padding-block'))

/* ── dead links and missing routes ── */
for (const app of APPS) {
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
/* With the internal subsidiary pages gone, these redirects are the only thing
   serving viverst.com/agro and viverst.com/studio. Remove them and those URLs
   404 for anyone typing them by hand or following an old link. */
const mainVercel = read('apps/main/vercel.json')
ok('main 301s /agro and /studio', mainVercel.includes('agro.viverst.com')
   && read('apps/main/public/_redirects').includes('301'))
ok('main 301s the paths beneath them too',
   mainVercel.includes('/agro/:path*') && mainVercel.includes('/studio/:path*'))
ok('the businesses page links straight out, not back through viverst.com',
   read('apps/main/src/pages/Businesses.jsx').includes('s.path')
   && !read('apps/main/src/pages/Businesses.jsx').includes('to="/agro"'))
ok('external brand links render as anchors, not router links',
   read('apps/main/src/components/BrandLink.jsx').includes('<a href={to}'))

/* ── every referenced image resolves ── */
let imgProblems = []
for (const app of APPS) {
  const data = read(`apps/${app}/src/data/${app === 'main' ? 'site' : app}.js`)
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
for (const app of APPS) {
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
ok('studio uses Poppins, the face the guideline names',
   read('packages/brand/src/studio.css').includes('poppins'))

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

/* ── studio: the mark is geometry, so it can assemble ── */
const mark = read('apps/studio/src/components/Mark.jsx')
const markPoints = (mark.match(/STAR_POINTS = '([^']+)'/)?.[1] ?? '').trim().split(/\s+/).length
ok('studio: the star is a real 16-point polygon', markPoints === 16, `${markPoints} points`)
ok('studio: eight strokes, one per area of focus',
   (mark.match(/className="mark-ray"/g) ?? []).length === 8)
ok('studio: the mark loop restarts rather than stopping',
   /animation:\s*mark-ray 7s[^;]*infinite/.test(read('apps/studio/src/index.css')))

/* ── studio: reveals are measured, not observed. An IntersectionObserver only
      fires when the intersecting state CHANGES, so a hard flick or the End key
      can carry a section past the viewport with no intersecting frame and leave
      it invisible for good. ── */
const reveals = read('apps/studio/src/components/Reveals.jsx')
ok('studio: reveals measure position instead of observing intersection',
   reveals.includes('getBoundingClientRect') && !reveals.includes('new IntersectionObserver'))

/* ── studio: sample content must never pass itself off as delivered work ── */
const studioData = read('apps/studio/src/data/studio.js')
const studioWork = read('apps/studio/src/pages/Work.jsx')
const projectCount = (studioData.match(/slug: '[^']+', sample: true/g) ?? []).length
ok('studio: every placeholder project is flagged as a sample',
   !/export const PROJECTS = \[\s*\{(?![\s\S]{0,120}sample: true)/.test(studioData))
ok('studio: the work page labels samples on screen',
   projectCount === 0 || studioWork.includes('sample-note'))
ok('studio: the work page still handles having nothing to show',
   studioWork.includes('empty-state') && studioWork.includes('PROJECTS.length === 0'))

/* ── studio: the drawings perform, they do not merely drift ── */
const studioCss = read('apps/studio/src/index.css')
const artefacts = read('apps/studio/src/components/Artefacts.jsx')
ok('studio: parts fly in, then cycle between two arrangements',
   /animation:\s*\n?\s*art-enter/.test(studioCss) && /art-cycle 5\.4s[^;]*infinite/.test(studioCss))
ok('studio: the cycle starts from the landed position, so nothing rebuilds from nothing',
   /@keyframes art-cycle \{\s*\n\s*0%, 20%\s*\{ transform: none/.test(studioCss))
ok('studio: cards are phase-offset so a grid never moves in step',
   /var\(--i, 0\) \* \.34s/.test(studioCss))
ok('studio: the choreography pauses off screen',
   studioCss.includes('.art.is-idle .part')
   && read('apps/studio/src/components/ArtefactMotion.jsx').includes("classList.toggle('is-idle'"))
ok('studio: every part carries its own fly-in and second arrangement',
   (artefacts.match(/'--fx'/g) ?? []).length === (artefacts.match(/'--bx'/g) ?? []).length
   && (artefacts.match(/'--fx'/g) ?? []).length >= 17,
   `${(artefacts.match(/'--fx'/g) ?? []).length} parts`)
ok('studio: the chart bars regrow rather than sliding',
   /@keyframes art-bar \{/.test(studioCss) && artefacts.includes("'--bh'"))

/* ── studio: content counts come from the document, not from the markup ── */
const count = (name) => (studioData.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\n\\]`))?.[1] ?? '')
  .split('\n').filter((l) => /^\s*\{/.test(l)).length
ok('studio: eight areas of focus, as the brand strategy lists', count('FOCUS_AREAS') === 8, String(count('FOCUS_AREAS')))
ok('studio: six reasons, as the value proposition lists', count('REASONS') === 6, String(count('REASONS')))

/* ── the three sites stay independent ── */
ok('studio does not reach into another app',
   !all.filter(([f]) => f.startsWith('apps/studio/src'))
        .some(([, c]) => /apps\/(main|agro)/.test(c)))
ok('all three apps are separate Vercel projects on one repo',
   APPS.every((a) => fs.existsSync(`apps/${a}/vercel.json`)))

/* ── the page must stop at the footer. Browsers rubber-band past the end and
      reveal the canvas; with no background on html, body's colour propagated
      there and showed as a white band under the footer on iOS. ── */
ok('the overscroll area matches the footer rather than showing white',
   /html \{[^}]*background:\s*var\(--footer-bg\)/s.test(base))
ok('scrolling behaviour itself is left alone, so pull-to-refresh still works',
   !/overscroll-behavior/.test(base))
/* The body arrives empty, so without a height it paints nothing and the canvas
   colour above fills the screen — a flash of the footer colour on every cold
   load. Caught on a PageSpeed filmstrip, not by any test. */
ok('the body covers the viewport, so the canvas never flashes before the app renders',
   /body \{[^}]*min-height:\s*100svh/s.test(base))

/* ── report ── */
const failed = checks.filter((c) => !c.pass)
for (const c of checks) console.log(` ${c.pass ? '✓' : '✗'} ${c.name}${c.detail ? '  → ' + c.detail : ''}`)
console.log(`\n ${checks.length - failed.length}/${checks.length} passed`)
process.exit(failed.length ? 1 : 0)
