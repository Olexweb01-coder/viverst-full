/**
 * What search engines and link previews are told about the community's pages.
 *
 * Plain data, no imports, because it is read in two places:
 *   - the pages themselves (Community.jsx, Privacy.jsx), for the tags set
 *     once the page is running;
 *   - the build (vite.config.js), which writes a ready-made HTML file for
 *     each address below, so that WhatsApp, Facebook and other link previews,
 *     which do not run JavaScript, still get the right title, text and picture.
 */
const SITE = 'https://agro.viverst.com'
const NAME = 'The Agricultural Value Chain Community'
const IMAGE = `${SITE}/og-community.jpg`
const IMAGE_ALT = 'The Agricultural Value Chain Community, by Viverst Agro: connecting people, creating opportunities, growing agriculture.'

const COMMUNITY_DESCRIPTION =
  'Join The Agricultural Value Chain Community. Farmers, processors, traders, AgTech professionals, researchers and investors connect, learn and collaborate here.'

export const COMMUNITY_SEO = {
  path: '/community',
  url: `${SITE}/community`,
  title: `${NAME} | Viverst Agro`,
  description: COMMUNITY_DESCRIPTION,
  image: IMAGE,
  imageAlt: IMAGE_ALT,
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE}/community#webpage`,
        url: `${SITE}/community`,
        name: NAME,
        description: COMMUNITY_DESCRIPTION,
        inLanguage: 'en-NG',
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${SITE}/community#community` },
        primaryImageOfPage: { '@type': 'ImageObject', url: IMAGE, width: 1200, height: 630 },
        breadcrumb: { '@id': `${SITE}/community#breadcrumb` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE}/community#community`,
        name: NAME,
        alternateName: 'Agricultural Value Chain Community',
        url: `${SITE}/community`,
        description: 'A community bringing together individuals, professionals and businesses across the agricultural value chain to connect, exchange knowledge, discover opportunities and build meaningful collaborations.',
        image: IMAGE,
        email: 'agro@viverst.com',
        parentOrganization: { '@id': `${SITE}/#organization` },
        knowsAbout: [
          'Agricultural value chain', 'Crop production', 'Livestock production', 'Agro-processing',
          'Agricultural technology', 'Agricultural finance', 'Food packaging', 'Supply chain and distribution',
          'Agricultural marketing and trade', 'Agricultural research',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE}/community#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Viverst Agro', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: NAME, item: `${SITE}/community` },
        ],
      },
    ],
  },
}

export const PRIVACY_SEO = {
  path: '/community/privacy',
  url: `${SITE}/community/privacy`,
  title: `Privacy Policy | ${NAME}`,
  description: `How ${NAME}, run by Viverst Agro, handles the details you give when you register.`,
  image: IMAGE,
  imageAlt: IMAGE_ALT,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Viverst Agro', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: NAME, item: `${SITE}/community` },
      { '@type': 'ListItem', position: 3, name: 'Privacy Policy', item: `${SITE}/community/privacy` },
    ],
  },
}

export const ROUTE_HEADS = [COMMUNITY_SEO, PRIVACY_SEO]
