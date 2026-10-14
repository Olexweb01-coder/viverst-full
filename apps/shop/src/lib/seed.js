/* Placeholder catalogue, shown until products are entered in the admin.
   Photos are the CC0 stock images already in the brand package. */
import maize from '@brand-assets/agro/img/product-maize.webp'
import soybeans from '@brand-assets/agro/img/product-soybeans.webp'
import rice from '@brand-assets/agro/img/product-rice.webp'
import cassava from '@brand-assets/agro/img/product-cassava.webp'
import palm from '@brand-assets/agro/img/product-palm-oil.webp'
import chilli from '@brand-assets/agro/img/product-chilli.webp'
import seed from '@brand-assets/agro/img/product-seed.webp'

const cat = (slug, name) => ({ slug, name })
const C = { grain: cat('grain', 'Grains and legumes'), processed: cat('processed', 'Processed'), fresh: cat('fresh', 'Fresh produce'), inputs: cat('inputs', 'Farm inputs') }

export const SEED_PRODUCTS = [
  { id: 'seed-maize', slug: 'yellow-maize', name: 'Yellow maize', unit: '50 kg bag', price_kobo: 4500000, category: C.grain, image: maize, featured: true, summary: 'Dried, cleaned and graded. Moisture held at 13% or below, so it stores without spoiling.', description: 'Stores well and mills without clogging. Sold by the 50 kg bag.' },
  { id: 'seed-soy', slug: 'soybeans', name: 'Soybeans', unit: '50 kg bag', price_kobo: 6200000, category: C.grain, image: soybeans, featured: true, summary: 'Cleaned and sorted. Suited to feed mills and oil pressing.', description: 'A sample is sent before any bulk order is confirmed.' },
  { id: 'seed-rice', slug: 'parboiled-rice', name: 'Parboiled rice', unit: '25 kg bag', price_kobo: 3900000, category: C.processed, image: rice, featured: true, summary: 'Long grain, destoned and polished, packed on the line rather than repacked later.', description: 'Own-label bags available on request.' },
  { id: 'seed-cassava', slug: 'cassava-flour', name: 'Cassava flour', unit: '25 kg bag', price_kobo: 1800000, category: C.processed, image: cassava, featured: false, summary: 'Fine, white and dry. Milled from fresh roots within a day of harvest.', description: 'For fufu, baking blends and industrial use.' },
  { id: 'seed-palm', slug: 'red-palm-oil', name: 'Red palm oil', unit: '25 L keg', price_kobo: 5500000, category: C.processed, image: palm, featured: true, summary: 'Pressed from fresh fruit, settled and filtered. No water added.', description: 'Sealed kegs; also available in 5 L.' },
  { id: 'seed-chilli', slug: 'dried-chilli', name: 'Dried chilli pepper', unit: '10 kg bag', price_kobo: 2400000, category: C.fresh, image: chilli, featured: false, summary: 'Sun-dried and stemmed. Bright colour, strong heat.', description: 'Sorted by size before bagging.' },
  { id: 'seed-maizeseed', slug: 'improved-maize-seed', name: 'Improved maize seed', unit: '10 kg bag', price_kobo: 2900000, category: C.inputs, image: seed, featured: false, summary: 'Certified open-pollinated variety, treated and bagged for the coming season.', description: 'Germination tested. Plant within the season on the bag.' },
].map((p) => ({ ...p, compare_at_kobo: null, inStock: true, available: 99, gallery: [p.image], sample: true }))

export const CATEGORY_TILES = [
  { ...C.grain, image: maize, blurb: 'Maize, soybeans and more' },
  { ...C.processed, image: rice, blurb: 'Rice, flour, oil' },
  { ...C.fresh, image: chilli, blurb: 'Dried and fresh produce' },
  { ...C.inputs, image: seed, blurb: 'Seed and farm inputs' },
]
