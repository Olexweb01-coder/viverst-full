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

export const IMG = { farmland, irrigation, orchard, harvest, store, silos, soil }

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

export const PROMISE = 'Grow more, waste less, earn better.'

/**
 * The headline, broken where it should break.
 * Each line is stepped across the centre rather than stacked against one
 * edge, so the block reads as a composition instead of a column.
 * `shift` is a percentage of the line's own width.
 */
export const HEADLINE_LINES = [
  { text: 'Grow more, waste less,', shift: -4 },
  { text: 'earn better.', shift: 9 },
]
export const SUMMARY =
  'From the farm to the buyer, we work with farmers and agribusinesses to find the steps that quietly cost money — and fix them.'

export const MISSION =
  'To provide farming solutions that are practical, dependable and built to last — so productivity and value improve at every step from the farm to the buyer.'

/** The five steps, in the order produce actually moves. */
export const CHAIN = [
  { key: 'farm', stage: 'Farming', icon: 'sprout', img: soil,
    headline: 'Better farming, better harvest',
    body: 'What you harvest is decided long before harvest day. We work at the seed, soil and method stage, where the money is really made or lost.',
    loss: 'Small harvest' },
  { key: 'tools', stage: 'Tools', icon: 'cpu', img: irrigation,
    headline: 'Tools that work where you farm',
    body: 'Built for the network, power and conditions that actually exist on the ground — not the ones a brochure assumes.',
    loss: 'No access to tools' },
  { key: 'process', stage: 'Processing', icon: 'factory', img: silos,
    headline: 'Processing that matches your demand',
    body: 'A line sized against what you can truly sell, so it keeps running instead of standing idle.',
    loss: 'Waste after harvest' },
  { key: 'package', stage: 'Packaging', icon: 'package', img: store,
    headline: 'Packaging chosen early, not last',
    body: 'It decides how long produce lasts, how much freight costs, and what a buyer thinks before tasting anything.',
    loss: 'Weak packaging' },
  { key: 'market', stage: 'Getting to market', icon: 'truck', img: harvest,
    headline: 'Routes that hold in a bad season',
    body: 'Supply deals and distribution built to survive a difficult year, not only a good one.',
    loss: 'Broken supply routes' },
]

/** The seven areas we work in. */
export const FOCUS_AREAS = [
  { icon: 'cpu', title: 'Farm technology', body: 'Tools that change the harvest, not just the paperwork.' },
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

export const COMMITMENTS = [
  { k: '01', title: 'Lead with better tools', body: 'Invest in technology that raises what a farm can produce.' },
  { k: '02', title: 'Cover more of the chain', body: 'Move into the steps where we can genuinely add value.' },
  { k: '03', title: 'Run a tight operation', body: 'Systems and standards that hold quality as we grow.' },
  { k: '04', title: 'Build real partnerships', body: 'With farmers, suppliers, researchers and institutions.' },
  { k: '05', title: 'Make a visible difference', body: 'Impact you can point at, not only describe.' },
  { k: '06', title: 'Stay ready to grow', body: 'People and systems that survive a new market.' },
]

export const STATS = [
  { value: 7, label: 'Areas we work in' },
  { value: 5, label: 'Steps we cover' },
  { value: 1, label: 'Group behind us' },
]

/** The rotating hero images. Swap these for your own photographs. */
export const SHOWCASE = [
  { img: farmland,   label: 'On the farm',   caption: 'Crops planted and spaced for the harvest you actually want.' },
  { img: irrigation, label: 'Water',         caption: 'Irrigation planned and run from one place.' },
  { img: orchard,    label: 'From above',    caption: 'Seeing the whole farm before deciding anything.' },
  { img: silos,      label: 'Storage',       caption: 'Stored properly, so a good harvest stays good.' },
  { img: store,      label: 'Bagged',        caption: 'Bagged and ready to move to the buyer.' },
  { img: harvest,    label: 'Harvest',       caption: 'Cleaned and graded before quality starts costing money.' },
]

/** Grid of imagery. Replace with your own photographs. */
export const GALLERY = [
  { img: orchard,    label: 'Farm from above', meta: 'Planning' },
  { img: soil,       label: 'Ploughed land',   meta: 'Farming' },
  { img: irrigation, label: 'Irrigation',      meta: 'Water' },
  { img: store,      label: 'Bagged and ready', meta: 'Packaging' },
  { img: silos,      label: 'Storage',         meta: 'Processing' },
  { img: harvest,    label: 'Cleaned grain',   meta: 'Harvest' },
]

export const ROLES = []

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/solutions', label: 'What we do' },
  { to: '/careers', label: 'Careers' },
  { to: '/contact', label: 'Contact' },
]
