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
/* The inner pages load lazily, so on a direct visit their sections arrive after
   the reveal script has looked. A list taken once was empty, and /contact,
   /about, /services and /work showed blank bands to anyone arriving from a link. */
ok('studio: sections that arrive after a direct visit are still revealed',
   reveals.includes('new MutationObserver') && reveals.includes(':not([data-rv="on"])') && !/let pending = Array\.from/.test(reveals))

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

/* ── social profiles: each site links to its OWN accounts. The three sets of
      handles differ by one word, so a copy-paste between sites is easy to make
      and hard to see. ── */
{
  const SOC = [
    ['main', 'apps/main/src/data/site.js', 'viverstglobal', 'apps/main/src/components/Footer.jsx', 'apps/main/index.html'],
    ['agro', 'apps/agro/src/data/agro.js', 'viverstagro', 'apps/agro/src/components/Footer.jsx', 'apps/agro/index.html'],
    ['studio', 'apps/studio/src/data/studio.js', 'viverststudio', 'apps/studio/src/components/Footer.jsx', 'apps/studio/index.html'],
    ['shop', 'apps/shop/src/lib/config.js', 'viverstagro', 'apps/shop/src/components/Footer.jsx', null],
  ]
  for (const [app, dataFile, handle, footer, html] of SOC) {
    const block = read(dataFile).match(/export const SOCIALS = \[([\s\S]*?)\]/)?.[1] ?? ''
    const urls = [...block.matchAll(/url:\s*["']([^"']+)["']/g)].map((m) => m[1])
    const nets = [...block.matchAll(/network:\s*["']([^"']+)["']/g)].map((m) => m[1]).sort().join(',')
    ok(`${app}: footer links to Instagram, Facebook and LinkedIn`, nets === 'facebook,instagram,linkedin', nets || 'no SOCIALS')
    ok(`${app}: every social link is ${handle}'s own profile`,
       urls.length === 3 && urls.every((u) => new RegExp(`^https://www\\.(instagram|facebook|linkedin)\\.com/(company/)?${handle}/?$`).test(u)),
       urls.join(', '))
    ok(`${app}: the footer renders those links`, /<SocialLinks[^>]*links=\{SOCIALS\}/.test(read(footer)))
    if (html) {
      const ld = read(html).match(/"sameAs":\s*\[([\s\S]*?)\]/)?.[1] ?? ''
      ok(`${app}: structured data names the same profiles`, urls.length > 0 && urls.every((u) => ld.includes(`"${u}"`)))
    }
  }
  const social = read('packages/ui/src/Social.jsx')
  ok('social links open in a new tab that cannot reach back into the site',
     social.includes('target="_blank"') && social.includes('rel="noopener noreferrer"'))
}

/* ── WhatsApp: one number, written in full international form, on every
      contact page; the chat opens saying the visitor came from the website ── */
{
  const nums = ['apps/main/src/data/site.js', 'apps/agro/src/data/agro.js', 'apps/studio/src/data/studio.js']
    .map((f) => read(f).match(/export const WHATSAPP = ["']([^"']+)["']/)?.[1])
  ok('every site uses the same WhatsApp number, +2349060342734', nums.every((n) => n === '+2349060342734'), nums.join(', '))
  for (const app of APPS) {
    const page = read(`apps/${app}/src/pages/Contact.jsx`)
    ok(`${app}: contact page offers WhatsApp with the visitor's message`,
       page.includes('whatsappUrl(WHATSAPP') && page.includes('whatsappMessage(') && page.includes('contact-wa'))
  }
  ok('the WhatsApp message says it came from the website',
     read('packages/ui/src/whatsapp.js').includes('I am contacting you from your website'))
  /* The studio form once called preventDefault and nothing else: every
     enquiry typed into it went nowhere. */
  ok('studio: the contact form actually sends', /onSubmit=\{submit\}/.test(read('apps/studio/src/pages/Contact.jsx'))
     && read('apps/studio/src/pages/Contact.jsx').includes('mailto:'))
}

/* ── found in a visual sweep of every page, laptop and phone ── */
/* A rail with a falling dot, built for the old light hero. On the photographic
   hero the rail vanished and only the blue dot showed, sliding on its own. */
ok('main: no stray scroll-cue dot on the homepage hero',
   !/scroll-cue/.test(read('apps/main/src/pages/Home.jsx')) && !/scroll-cue/.test(read('apps/main/src/pages/Home.css')))
/* Over the dark hero the menu icon turns white; the button kept its white
   surface, so on phones the menu showed as a blank white circle. */
ok('main: the phone menu button is visible over the dark hero',
   /\.nav--onDark \.nav-toggle \{[^}]*background:/.test(read('apps/main/src/components/Navbar.css')))
/* Agro's own Products page duplicated the shop, so it was retired: the menu's
   "Shop" and a homepage card go to the shop, and the old address forwards
   there permanently so no link or search result lands on a missing page. */
{
  const agroVercel = JSON.parse(read('apps/agro/vercel.json'))
  const fwd = (src) => agroVercel.redirects?.find((r) => r.source === src)
  ok('agro: /products forwards permanently to the shop',
     fwd('/products')?.destination === 'https://shopagro.viverst.com/products' && fwd('/products')?.permanent === true
     && fwd('/products/:path*')?.destination === 'https://shopagro.viverst.com/products/:path*')
  ok('agro: the Products page is gone and nothing links to it',
     !fs.existsSync('apps/agro/src/pages/Products.jsx') && !fs.existsSync('apps/agro/src/lib/adminProducts.js')
     && !/["']\/products["']/.test(read('apps/agro/src/App.jsx') + read('apps/agro/src/data/agro.js') + read('apps/agro/src/pages/Home.jsx'))
     && !read('apps/agro/public/sitemap.xml').includes('/products'))
  ok('agro: the menu and a homepage card lead to the shop',
     /\{ href: 'https:\/\/shopagro\.viverst\.com', label: 'Shop' \}/.test(read('apps/agro/src/data/agro.js'))
     && /href: BUSINESS\.shopUrl/.test(read('apps/agro/src/pages/Home.jsx')))
}

/* The phone number sits after the email in every footer and on each contact page. */
for (const [app, files] of Object.entries({
  main: ['apps/main/src/components/Footer.jsx', 'apps/main/src/pages/Contact.jsx'],
  agro: ['apps/agro/src/components/Footer.jsx', 'apps/agro/src/pages/Contact.jsx'],
  studio: ['apps/studio/src/components/Footer.jsx', 'apps/studio/src/pages/Contact.jsx'],
  shop: ['apps/shop/src/components/Footer.jsx'],
})) {
  ok(`${app}: phone number follows the email in the footer${files[1] ? ' and on the contact page' : ''}`,
     files.every((f) => { const c = read(f); const e = c.indexOf('mailto:'), t = c.indexOf('tel:'); return e > -1 && t > e }))
}
ok('every site shows the same phone number, +234 906 034 2734',
   ['apps/main/src/data/site.js', 'apps/agro/src/data/agro.js', 'apps/studio/src/data/studio.js', 'apps/shop/src/lib/config.js']
     .every((f) => /phone: ["']\+234 906 034 2734["']/.test(read(f))))
/* Below ~800px the shop header could not fit on one line: the Shop badge ran
   into "Home" and the account and cart buttons were squeezed into ovals. */
{
  const shopCss = read('apps/shop/src/index.css')
  ok('shop: on phones and small tablets the header links take their own line',
     /@media \(max-width: 800px\) \{[^@]*\.shop-nav \{ order: 3; width: 100%/.test(shopCss)
     && /\.shop-brand \{ flex-shrink: 0; \}/.test(shopCss))
  ok('shop: "All products" sits on its own line above the category',
     /\.product-back \{ display: flex; width: fit-content;/.test(shopCss))
}

/* ── food package: /foodpackage in the shop, edited in the admin ── */
{
  const mig = 'supabase/migrations/018_food_package.sql'
  const sql = fs.existsSync(mig) ? read(mig) : ''
  ok('migration 018 lets the shop read the food package',
     /where key in \('payments','delivery','shop','contact','food_package'\)/.test(sql) && /on conflict \(key\) do nothing/.test(sql))
  /* The December content lives in three places: the shop's fallback, the
     admin's starting form and the migration. They must say the same thing. */
  const literal = (file) => {
    const src = read(file); const at = src.indexOf('FOOD_PACKAGE_DEFAULT = {')
    if (at < 0) return null
    const body = src.slice(src.indexOf('{', at), src.indexOf('\n}\n', at) + 2)
    try { return new Function(`return (${body})`)() } catch { return null }
  }
  const fromShop = literal('apps/shop/src/lib/foodPackage.js')
  const fromAdmin = literal('apps/admin/src/pages/FoodPackage.jsx')
  let fromSql = null
  try { fromSql = JSON.parse(sql.slice(sql.indexOf("('food_package', '") + 18, sql.indexOf("'::jsonb)"))) } catch { /* reported below */ }
  const same = fromShop && fromAdmin && fromSql && JSON.stringify(fromShop) === JSON.stringify(fromAdmin) && JSON.stringify(fromShop) === JSON.stringify(fromSql)
  ok('food package: shop, admin and migration hold the same December content', !!same)
  ok('food package: the three packages and prices match the flyer',
     JSON.stringify(fromShop?.packages?.map((p) => [p.name, p.price_kobo])) === JSON.stringify([['Merry Package', 4999900], ['Jolly Package', 7499900], ['Berekete Package', 12499900]]))
  /* the flyer says "create of eggs" and "INSTALL MENTAL PAYMENT"; the page must not */
  ok('food package: the flyer typos are corrected on the page',
     !/create of eggs|install ?mental/i.test(read('apps/shop/src/lib/foodPackage.js') + read('apps/admin/src/pages/FoodPackage.jsx') + sql))
  const flyerFile = 'packages/brand/assets/agro/img/food-package-december.webp'
  ok('food package: the December flyer is a light web image', fs.existsSync(flyerFile) && fs.statSync(flyerFile).size < 200 * 1024)
  ok('shop: /foodpackage is a page, with a homepage card that can be switched off',
     read('apps/shop/src/App.jsx').includes('path="/foodpackage"') && /\{fp\.home_card && \(/.test(read('apps/shop/src/pages/Home.jsx')))
  ok('shop: Pay online only for a linked, real, in-stock product',
     /p\.slug === slug && !p\.sample && p\.inStock/.test(read('apps/shop/src/pages/FoodPackage.jsx')))
  ok('admin: Food package page in the shop menu, for owners and managers',
     read('apps/admin/src/App.jsx').includes('path="food-package" element={<Ops><FoodPackage /></Ops>}')
     && read('apps/admin/src/components/Shell.jsx').includes("to: '/food-package'")
     && read('apps/admin/src/pages/FoodPackage.jsx').includes("staff?.role === 'owner' || staff?.role === 'manager'"))
  const shopVercel = JSON.parse(read('apps/shop/vercel.json'))
  ok('sa.viverst.com forwards to the same page on shopagro.viverst.com',
     shopVercel.redirects?.some((r) => r.has?.[0]?.value === 'sa.viverst.com' && r.destination === 'https://shopagro.viverst.com/:path*' && r.permanent === true))
}
/* ── food packages bought online through Paystack (migration 019) ── */
{
  const f19 = 'supabase/migrations/019_food_package_products.sql'
  const s19 = fs.existsSync(f19) ? read(f19) : ''
  const fn = (s) => (s.match(/create or replace function public\.place_order\([\s\S]*?\nend \$\$;/) || [''])[0]
  const guard = /  -- with bank transfer switched off in Settings, only Paystack is accepted\n[\s\S]*?raise exception 'bank transfer is not offered right now';\n  end if;\n/
  ok('migration 019: the three packages are products with 50 in stock each, added once',
     ['merry-package', 'jolly-package', 'berekete-package'].every((s) => s19.includes(`('${s}',`))
     && /select id, 50, 'received', 'opening stock' from fresh/.test(s19) && /on conflict \(slug\) do nothing\s+returning id/.test(s19))
  ok('migration 019: each package is linked to its product, without undoing a link made in the admin',
     /when coalesce\(p->>'product_slug', ''\) <> '' then p/.test(s19) && /jsonb_build_object\('checkout', true\)/.test(s19))
  ok('migration 019: place_order is 017’s, plus only the bank-transfer-off check',
     guard.test(fn(s19)) && fn(s19).replace(guard, '') === fn(read('supabase/migrations/017_delivery_zones.sql')))
  const co = read('apps/shop/src/pages/Checkout.jsx')
  ok('checkout: with bank transfer off, Paystack is the payment used',
     co.includes("const pay = paystackOn ? (transferOn ? payChoice : 'paystack') : 'transfer'") && /bank transfer is not offered/.test(co))
  const fpPage = read('apps/shop/src/pages/FoodPackage.jsx')
  ok('food package: Buy now goes to the checkout; WhatsApp is for instalments',
     fpPage.includes("add(product, 1); navigate('/checkout')") && fpPage.includes('Want to pay in instalments? Chat on WhatsApp')
     && fpPage.includes('and pay in instalments. Please tell me how it works.'))
  ok('food package products show the December flyer until a photo is uploaded',
     ['apps/shop/src/lib/catalog.js', 'apps/admin/src/lib/stockPhotos.js'].every((f) => /'merry-package': flyer, 'jolly-package': flyer, 'berekete-package': flyer/.test(read(f))))
}

/* Out of stock switch (migration 020): shown as sold out, not orderable, count kept */
{
  const f20 = 'supabase/migrations/020_out_of_stock_switch.sql'
  const s20 = fs.existsSync(f20) ? read(f20) : ''
  const fn = (s) => (s.match(/create or replace function public\.place_order\([\s\S]*?\nend \$\$;/) || [''])[0]
  const line = /    -- marked out of stock on the Stock page: shown in the shop, but not for sale\n    if v_product\.out_of_stock then raise exception 'one of the items is out of stock'; end if;\n/
  ok('migration 020: products get an out-of-stock switch that the shop’s stock view obeys',
     /add column if not exists out_of_stock boolean not null default false/.test(s20)
     && /i\.on_hand > 0 and not p\.out_of_stock as in_stock/.test(s20) && /when p\.out_of_stock then 0/.test(s20))
  ok('migration 020: place_order is 019’s, plus only the out-of-stock refusal',
     line.test(fn(s20)) && fn(s20).replace(line, '') === fn(read('supabase/migrations/019_food_package_products.sql')))
  const inv = read('apps/admin/src/pages/Inventory.jsx')
  ok('admin: Stock marks products out of stock one at a time or all at once, without touching counts',
     inv.includes("update({ out_of_stock: out }).in('id', ids)") && inv.includes('Yes, mark all out of stock') && inv.includes('Yes, mark all available')
     && !/inventory_movements'\)\.insert\(\w+\.map/.test(inv))
  ok('admin: Stock still works before migration 020 is run', /error && \/out_of_stock\/\.test\(error\.message\)/.test(inv))
  ok('shop: a sold-out product cannot be added to the cart',
     /disabled=\{!p\.inStock\}/.test(read('apps/shop/src/components/ProductCard.jsx')) && /\{p\.inStock \? \(/.test(read('apps/shop/src/pages/Product.jsx')))
}

/* Paystack charges paid by the customer (migration 021): once per payment */
{
  const f21 = 'supabase/migrations/021_paystack_charges.sql'
  const s21 = fs.existsSync(f21) ? read(f21) : ''
  const { paystackCharge } = await import('./apps/shop/src/lib/paystack.js')
  const table = [[4999900, 86300], [7499900, 124400], [12499900, 200000]].map(([net, want]) => paystackCharge(net) === want)
  ok('Paystack charges: Merry ₦863, Jolly ₦1,244, Berekete ₦2,000 (capped)', table.every(Boolean), table.join(', '))
  ok('Paystack charges: 1.5% + ₦100, waived under ₦2,500, capped at ₦2,000, in shop and database alike',
     /least\(ceil\(p_gross \* 15 \/ 1000\.0\)::bigint \+ case when p_gross >= 250000 then 10000 else 0 end, 200000\)/.test(s21)
     && read('apps/shop/src/lib/paystack.js').includes('Math.min(Math.ceil((gross * 15) / 1000) + (gross >= 250000 ? 10000 : 0), 200000)'))
  const fn = (s) => (s.match(/create or replace function public\.place_order\([\s\S]*?\nend \$\$;/) || [''])[0]
  ok('place_order adds the charge once, on the whole order, for Paystack only',
     /if p_payment_method = 'paystack' then v_fee := public\.paystack_charge\(v_subtotal \+ v_delivery\); end if;/.test(fn(s21))
     && fn(s21).includes('v_subtotal, v_delivery, v_fee, v_subtotal + v_delivery + v_fee,'))
  ok('analytics and today’s takings count what the shop keeps, not the charges',
     (s21.match(/total_kobo - fee_kobo/g) || []).length === 2 && read('apps/admin/src/pages/Dashboard.jsx').includes("Number(o.total_kobo) - Number(o.fee_kobo || 0)"))
  ok('checkout shows the charges and the full-payment warning with Paystack',
     read('apps/shop/src/pages/Checkout.jsx').includes("const charges = pay === 'paystack' && !needArea ? paystackCharge(subtotal + fee) : 0")
     && read('apps/shop/src/pages/Checkout.jsx').includes('Please pay the full amount shown, including Paystack charges.'))
  ok('the order email and the admin order show the charges',
     read('supabase/functions/notify-email/index.ts').includes('Paystack charges') && read('apps/admin/src/pages/Orders.jsx').includes('Paystack charges') && /drop view if exists public\.order_detail;/.test(s21))
}

/* WhatsApp in every footer, and on each shop product */
for (const [app, file] of [['main', 'apps/main/src/components/Footer.jsx'], ['agro', 'apps/agro/src/components/Footer.jsx'], ['studio', 'apps/studio/src/components/Footer.jsx'], ['shop', 'apps/shop/src/components/Footer.jsx']]) {
  const c = read(file)
  ok(`${app}: footer has a WhatsApp chat that names the branch, after the phone`,
     c.includes('whatsappMessage({ business:') && c.indexOf('tel:') > -1 && c.indexOf('whatsappUrl(') > c.indexOf('tel:'))
}
ok('shop: every product can be asked about on WhatsApp',
   /I would like to ask about \$\{p\.name\} \(\$\{p\.unit\}, \$\{money\(p\.price_kobo\)\}\)/.test(read('apps/shop/src/pages/Product.jsx')))

/* An unclosed comment silently disables every rule after it until the next
   comment closes. It happened once in the admin and turned all filter bars
   into plain grey buttons; no test noticed because jsdom ignores styling. */
{
  const { execSync } = await import('node:child_process')
  const cssFiles = execSync('git ls-files "*.css"', { encoding: 'utf8' }).split('\n').filter(Boolean)
  const bad = cssFiles.filter((f) => {
    const t = read(f); let i = 0; let open = false
    while (i < t.length) {
      if (!open && t.startsWith('/*', i)) { open = true; i += 2; continue }
      if (open && t.startsWith('*/', i)) { open = false; i += 2; continue }
      if (open && t.startsWith('/*', i)) return true   // a comment opened inside another: the first was never closed
      i++
    }
    return open
  })
  ok('every stylesheet closes its comments', bad.length === 0, bad.join(', '))
}

/* ── report ── */
const failed = checks.filter((c) => !c.pass)
for (const c of checks) console.log(` ${c.pass ? '✓' : '✗'} ${c.name}${c.detail ? '  → ' + c.detail : ''}`)
console.log(`\n ${checks.length - failed.length}/${checks.length} passed`)
process.exit(failed.length ? 1 : 0)
