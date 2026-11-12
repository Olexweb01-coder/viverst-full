/**
 * What search engines and link previews are told about the food package page.
 *
 * Plain data, no imports, because it is read in two places: the page itself
 * (pages/FoodPackage.jsx) and the build (vite.config.js), which writes a
 * ready-made HTML file for /foodpackage so that search engines and link
 * previews get this page's title, text and picture without running JavaScript.
 *
 * The page's wording and prices are edited in the admin. These lines describe
 * the package in general terms and carry no prices, so they stay true when the
 * prices change. If the package is renamed in the admin, rename it here too.
 */
const SITE = 'https://shopagro.viverst.com'

export const FOOD_PACKAGE_SEO = {
  path: '/foodpackage',
  url: `${SITE}/foodpackage`,
  siteName: 'Viverst Agro Shop',
  title: 'December Food Package | Viverst Agro Shop',
  description: 'December Food Package from Viverst Agro: rice, a live chicken, groundnut oil and eggs, packed together for the festive season. Choose your package and book it.',
  image: `${SITE}/og-foodpackage.jpg`,
  imageAlt: 'December Food Package from Viverst Agro: rice, groundnut oil, eggs and a live chicken for the festive season.',
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE}/foodpackage#webpage`,
        url: `${SITE}/foodpackage`,
        name: 'December Food Package',
        description: 'Rice, a live chicken, groundnut oil and eggs, packed together for the festive season.',
        inLanguage: 'en-NG',
        primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/og-foodpackage.jpg`, width: 1200, height: 630 },
        publisher: { '@type': 'Organization', name: 'Viverst Agro', url: 'https://agro.viverst.com/' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Viverst Agro Shop', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'December Food Package', item: `${SITE}/foodpackage` },
        ],
      },
    ],
  },
}

/* The same page in plain words, for readers that do not run JavaScript. */
FOOD_PACKAGE_SEO.summaryHtml = `      <h1>December Food Package</h1>
      <p>The December Food Package from Viverst Agro packs rice, a live chicken, groundnut oil and eggs together for the festive season. Choose your package and book it with Viverst Agro Shop, Lagos, Nigeria.</p>
      <h2>Packages</h2>
      <ul>
        <li>Merry Package: 10 kg of rice, 1 live chicken, groundnut oil (1 L), half crate of eggs.</li>
        <li>Jolly Package: half bag of rice (25 kg), 1 live chicken, groundnut oil (2 L), 1 crate of eggs.</li>
        <li>Berekete Package: full bag of rice (50 kg), 1 live chicken, groundnut oil (5 L), 1 crate of eggs.</li>
      </ul>
      <p>Current prices and ordering are on this page: <a href="${SITE}/foodpackage">${SITE}/foodpackage</a>. To book or ask a question, call or WhatsApp +234 906 034 2734, or email agro@viverst.com.</p>
      <p><a href="${SITE}/">Viverst Agro Shop</a> is part of <a href="https://agro.viverst.com/">Viverst Agro</a>.</p>`

export const ROUTE_HEADS = [FOOD_PACKAGE_SEO]
