/**
 * All Viverst Agro content.
 * Plain language throughout — the reader is a farmer, processor, distributor
 * or investor in Nigeria, not a consultant.
 */
import farmland from '@brand-assets/agro/img/farmland.webp'
import irrigation from '@brand-assets/agro/img/irrigation.webp'
import orchard from '@brand-assets/agro/img/orchard.webp'
import harvest from '@brand-assets/agro/img/harvest.webp'
import store from '@brand-assets/agro/img/store.webp'
import silos from '@brand-assets/agro/img/silos.webp'
import soil from '@brand-assets/agro/img/soil.webp'
/* Hero photography. */
import crates from '@brand-assets/agro/img/crates.webp'
import tomatoes from '@brand-assets/agro/img/tomatoes.webp'
import agtech from '@brand-assets/agro/img/agtech.webp'
import drone from '@brand-assets/agro/img/drone.webp'
import greenhouse from '@brand-assets/agro/img/greenhouse.webp'
/* The value chain's own photographs, one per step. */
import chainFarming from '@brand-assets/agro/img/chain-farming.webp'
import chainTools from '@brand-assets/agro/img/chain-tools.webp'
import chainProcessing from '@brand-assets/agro/img/chain-processing.webp'
import chainPackaging from '@brand-assets/agro/img/chain-packaging.webp'
import chainMarket from '@brand-assets/agro/img/chain-market.webp'
/* The seven-areas diagram (homepage door) and the About page photograph.
   farm-from-above.webp: StockSnap, CC0 1.0 (public domain, no credit
   required) — https://stocksnap.io/photo/farming-fields-VRZVVGVJN4 */
import sevenAreas from '@brand-assets/agro/img/seven-areas.webp'
import farmFromAbove from '@brand-assets/agro/img/farm-from-above.webp'
/* Homepage doors. StockSnap, CC0 1.0 (public domain, no credit required):
   door-group.webp   https://stocksnap.io/photo/business-people-IS1XRUWYW4
   door-contact.webp https://stocksnap.io/photo/people-business-VMBHOPBDVR */
import doorGroup from '@brand-assets/agro/img/door-group.webp'
import doorContact from '@brand-assets/agro/img/door-contact.webp'
/* Product cards. All CC0 1.0 (public domain, no credit required).
   product-maize.webp    Wikimedia Commons https://commons.wikimedia.org/wiki/File:Maize_(Cone)_Seed2.jpg
   product-soybeans.webp Wikimedia Commons https://commons.wikimedia.org/wiki/File:Dried_soybeans.jpg
   product-rice.webp     WordPress Photo Directory https://wordpress.org/photos/photo/868696b43a/
   product-cassava.webp  Wikimedia Commons https://commons.wikimedia.org/wiki/File:White_garri_made_from_cassava.jpg
   product-palm-oil.webp Wikimedia Commons https://commons.wikimedia.org/wiki/File:RED_OIL_(Manja).jpg
   product-chilli.webp   Wikimedia Commons https://commons.wikimedia.org/wiki/File:Heap_of_Dried_Chili_Peppers_02.jpg
   product-seed.webp     Wikimedia Commons https://commons.wikimedia.org/wiki/File:Maize_seed_in_big_tray.jpg */
import productMaize from '@brand-assets/agro/img/product-maize.webp'
import productSoybeans from '@brand-assets/agro/img/product-soybeans.webp'
import productRice from '@brand-assets/agro/img/product-rice.webp'
import productCassava from '@brand-assets/agro/img/product-cassava.webp'
import productPalmOil from '@brand-assets/agro/img/product-palm-oil.webp'
import productChilli from '@brand-assets/agro/img/product-chilli.webp'
import productSeed from '@brand-assets/agro/img/product-seed.webp'

export const IMG = { farmland, irrigation, orchard, harvest, store, silos, soil, sevenAreas, farmFromAbove, doorGroup, doorContact }

export const BUSINESS = {
  name: 'Viverst Agro',
  parent: 'Viverst Global Limited',
  parentUrl: 'https://www.viverst.com',
  siblingName: 'Viverst Studio',
  siblingUrl: 'https://studio.viverst.com',
  site: 'https://agro.viverst.com',
  email: 'agro@viverst.com',
  city: 'Lagos',
  country: 'Nigeria',
  industry: 'Agriculture and agribusiness',
}

/* Profile pages, not share links: share links are tied to the session that
   created them and can stop working; these addresses do not change.
   WHATSAPP is the full international number. */
export const SOCIALS = [
  { network: 'instagram', url: 'https://www.instagram.com/viverstagro/' },
  { network: 'facebook', url: 'https://www.facebook.com/viverstagro/' },
  { network: 'linkedin', url: 'https://www.linkedin.com/company/viverstagro/' },
]
export const WHATSAPP = '+2349060342734'

export const PROMISE = 'Grow more, waste less, earn better.'

/**
 * The headline, broken where it should break.
 * Each line is stepped across the centre rather than stacked against one
 * edge, so the block reads as a composition instead of a column.
 * `shift` is a percentage of the line's own width.
 */
export const HEADLINE_LINES = [
  { text: 'Transforming agriculture', shift: 0 },
  { text: 'through technology & processing.', shift: 0 },
]

/** Under the headline on the homepage only. SUMMARY below says the same
    thing in other words, for the About page and the search descriptions, so
    one sentence is not repeated across the site. */
export const HERO_SUMMARY =
  'Viverst Agro is built to improve productivity, efficiency, quality and profitability across the agricultural value chain.'

export const SUMMARY =
  'We help farmers and agribusinesses raise output, cut waste and improve returns at every step from the farm to the buyer.'

export const MISSION =
  'To provide farming solutions that are practical, dependable and built to last — so productivity and value improve at every step from the farm to the buyer.'

/** The five steps, in the order produce actually moves. */
export const CHAIN = [
  { key: 'farm', stage: 'Farming', icon: 'sprout', img: chainFarming,
    headline: 'Better farming, better harvest',
    body: 'What you harvest is decided long before harvest day. We work at the seed, soil and method stage, where the money is really made or lost.',
    loss: 'Small harvest' },
  { key: 'tools', stage: 'Tools', icon: 'cpu', img: chainTools,
    headline: 'Tools that work where you farm',
    body: 'Built for the network, power and conditions that actually exist on the ground — not the ones a brochure assumes.',
    loss: 'No access to tools' },
  { key: 'process', stage: 'Processing', icon: 'factory', img: chainProcessing,
    headline: 'Processing that matches your demand',
    body: 'A line sized against what you can truly sell, so it keeps running instead of standing idle.',
    loss: 'Waste after harvest' },
  { key: 'package', stage: 'Packaging', icon: 'package', img: chainPackaging,
    headline: 'Packaging chosen early, not last',
    body: 'It decides how long produce lasts, how much freight costs, and what a buyer thinks before tasting anything.',
    loss: 'Weak packaging' },
  { key: 'market', stage: 'Getting to market', icon: 'truck', img: chainMarket,
    headline: 'Routes that hold in a bad season',
    body: 'Supply deals and distribution built to survive a difficult year, not only a good one.',
    loss: 'Broken supply routes' },
]

/** The seven areas we work in. */
export const FOCUS_AREAS = [
  { icon: 'cpu', title: 'Agricultural technology', body: 'Tools that change the harvest, not just the paperwork.' },
  { icon: 'sprout', title: 'Crop production', body: 'Seed, soil and method that lift yield and cut cost together.' },
  { icon: 'factory', title: 'Processing', body: 'Turning raw harvest into something worth more.' },
  { icon: 'link', title: 'Farm to buyer', body: 'Joining the steps where value usually disappears.' },
  { icon: 'package', title: 'Packaging', body: 'Longer shelf life, cheaper freight, better first impression.' },
  { icon: 'wrench', title: 'Farm services', body: 'Practical support for farmers, processors and agro-dealers.' },
  { icon: 'leaf', title: 'Sustainable farming', body: 'A stronger sector that is still here in twenty years.' },
]

export const VALUE_PILLARS = [
  { icon: 'wrench', title: 'Practical', body: 'We solve the problem in front of you.' },
  { icon: 'lightbulb', title: 'Inventive', body: 'New thinking, used where it pays.' },
  { icon: 'shield', title: 'Dependable', body: 'The same result every time.' },
  { icon: 'gauge', title: 'Efficient', body: 'Less waste, lower cost, more output.' },
  { icon: 'users', title: 'On your side', body: 'Built around your needs, not ours.' },
  { icon: 'trending', title: 'Long-term', body: 'Value that keeps paying.' },
]

export const AUDIENCE = [
  'Farmers', 'Agribusiness owners', 'Processors', 'Food brands',
  'Agro-dealers', 'Distributors', 'Institutions', 'Investors',
]

/** The seven areas of work, as shown on the About page. */
export const AREAS_OF_WORK = [
  { k: '01', title: 'Agricultural Technology (AgTech)', body: 'Applying technology to improve how agricultural operations are managed, monitored, and scaled.' },
  { k: '02', title: 'Agricultural Production', body: 'Supporting efficient, productive agricultural operations from the ground up.' },
  { k: '03', title: 'Agro-processing', body: 'Converting raw agricultural produce into higher-value products.' },
  { k: '04', title: 'Processing & Packaging', body: 'Delivering agricultural products safely, efficiently, and market-ready.' },
  { k: '05', title: 'Agricultural Solutions & Services', body: 'Practical support for the day-to-day challenges agribusinesses face.' },
  { k: '06', title: 'Food & Agricultural Value Chains', body: 'Strengthening every link, from farm to final product.' },
  { k: '07', title: 'Innovation & Sustainable Agriculture', body: 'Building agricultural practices that are efficient today and sustainable over the long term.' },
]

export const STATS = [
  { value: 7, label: 'Areas we work in' },
  { value: 5, label: 'Steps we cover' },
  { value: 1, label: 'Group behind us' },
]

/** The rotating hero photographs, in order. Each holds 6 seconds. To swap
    one, drop a 1120x788 file in with the same filename. */
export const SHOWCASE = [
  { key: 'agtech',     img: agtech },
  { key: 'crates',     img: crates },
  { key: 'drone',      img: drone },
  { key: 'tomatoes',   img: tomatoes },
  { key: 'greenhouse', img: greenhouse },
]

/**
 * Products. These are SAMPLE listings, not stock — every record carries
 * `sample: true`, and the Products page shows a notice while any of them do.
 * Delete the flag, or the record, as real products come on. The admin backend
 * fills this same shape.
 *
 *   category  one of PRODUCT_CATEGORIES below
 *   form      how it is supplied
 *   minOrder  the smallest order taken
 */
export const PRODUCT_CATEGORIES = [
  { key: 'grain',     label: 'Grains and legumes' },
  { key: 'processed', label: 'Processed' },
  { key: 'fresh',     label: 'Fresh produce' },
  { key: 'inputs',    label: 'Farm inputs' },
]

export const PRODUCTS = [
  { slug: 'yellow-maize', sample: true, category: 'grain', img: productMaize,
    name: 'Yellow maize',
    form: 'Dried, cleaned and graded · 50 kg bags',
    minOrder: '5 tonnes',
    body: 'Moisture held at 13% or below, so it stores without spoiling and mills without clogging.' },
  { slug: 'soybeans', sample: true, category: 'grain', img: productSoybeans,
    name: 'Soybeans',
    form: 'Cleaned, sorted · 50 kg bags',
    minOrder: '5 tonnes',
    body: 'Graded for feed mills and oil pressers. Sample sent before any order is confirmed.' },
  { slug: 'parboiled-rice', sample: true, category: 'processed', img: productRice,
    name: 'Parboiled rice',
    form: 'Destoned, polished · 25 kg and 50 kg bags',
    minOrder: '2 tonnes',
    body: 'Long grain, stone-free, packed on the line rather than repacked later. Own-label bags on request.' },
  { slug: 'cassava-flour', sample: true, category: 'processed', img: productCassava,
    name: 'Cassava flour',
    form: 'Fine milled, low moisture · 25 kg bags',
    minOrder: '2 tonnes',
    body: 'Milled within two days of harvest to keep the colour white and the taste clean.' },
  { slug: 'palm-oil', sample: true, category: 'processed', img: productPalmOil,
    name: 'Red palm oil',
    form: 'Filtered · 25 litre jerrycans',
    minOrder: '500 litres',
    body: 'Pressed and settled, with the water and sediment taken out before it is filled.' },
  { slug: 'dried-pepper', sample: true, category: 'fresh', img: productChilli,
    name: 'Dried chilli pepper',
    form: 'Sun-dried, stemmed · 20 kg sacks',
    minOrder: '1 tonne',
    body: 'Dried on raised racks rather than the ground, so the batch arrives without grit.' },
  { slug: 'improved-seed', sample: true, category: 'inputs', img: productSeed,
    name: 'Improved maize seed',
    form: 'Certified, treated · 10 kg bags',
    minOrder: '20 bags',
    body: 'Varieties chosen for the rainfall and soil of the area, with the germination rate on the bag.' },
]

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/solutions', label: 'What we do' },
  { to: '/products', label: 'Products' },
  { to: '/contact', label: 'Contact' },
]
