/* The food package page and its homepage card.
   The content is edited in the admin (Food package) and stored in the
   settings table under `food_package`. Until that row exists, or if it cannot
   be read, the December Food Package below is shown, taken from the flyer. */
import flyer from '@brand-assets/agro/img/food-package-december.webp'
import { imageUrl } from './catalog.js'

export const FOOD_PACKAGE_PATH = '/foodpackage'

export const FOOD_PACKAGE_DEFAULT = {
  title: 'December Food Package',
  short: 'DFP',
  intro: 'Rice, a live chicken, groundnut oil and eggs, packed together for the festive season. Choose your package and book it on WhatsApp.',
  season_note: 'This offer is for December. Food packages are still available after December, so message us for the current packages.',
  instalment: true,
  instalment_note: 'Instalment payment available. Ask us how when you book.',
  image: '',
  image_alt: 'December Food Package from Viverst Agro: a bag of Viverst Agro rice, groundnut oil and a live chicken, with a smiling man in a Santa hat holding a DFP box.',
  home_card: true,
  checkout: false,
  packages: [
    { name: 'Merry Package', price_kobo: 4999900, product_slug: '',
      items: ['10 kg of rice', '1 live chicken', 'Groundnut oil (1 L)', 'Half crate of eggs'] },
    { name: 'Jolly Package', price_kobo: 7499900, product_slug: '',
      items: ['Half bag of rice (25 kg)', '1 live chicken', 'Groundnut oil (2 L)', '1 crate of eggs'] },
    { name: 'Berekete Package', price_kobo: 12499900, product_slug: '',
      items: ['Full bag of rice (50 kg)', '1 live chicken', 'Groundnut oil (5 L)', '1 crate of eggs'] },
  ],
}

const text = (v, fallback) => (typeof v === 'string' && v.trim() ? v.trim() : fallback)
const flag = (v, fallback) => (typeof v === 'boolean' ? v : fallback)

/* Whatever the admin saved, shaped so the page never meets a missing field.
   A package needs a name and a price above zero to be shown. */
export function foodPackage(saved) {
  const s = saved && typeof saved === 'object' ? saved : {}
  const d = FOOD_PACKAGE_DEFAULT
  const packages = Array.isArray(s.packages)
    ? s.packages
      .map((p) => ({
        name: text(p?.name, ''),
        price_kobo: Math.max(0, Math.round(Number(p?.price_kobo) || 0)),
        product_slug: text(p?.product_slug, ''),
        items: (Array.isArray(p?.items) ? p.items : []).map((x) => String(x).trim()).filter(Boolean),
      }))
      .filter((p) => p.name && p.price_kobo > 0)
    : null
  return {
    title: text(s.title, d.title),
    short: text(s.short, d.short),
    intro: text(s.intro, d.intro),
    season_note: typeof s.season_note === 'string' ? s.season_note.trim() : d.season_note,
    instalment: flag(s.instalment, d.instalment),
    instalment_note: text(s.instalment_note, d.instalment_note),
    image: s.image ? imageUrl(s.image) : flyer,
    image_alt: text(s.image_alt, d.image_alt),
    home_card: flag(s.home_card, d.home_card),
    checkout: flag(s.checkout, d.checkout),
    packages: packages && packages.length ? packages : d.packages,
  }
}

/* the lowest price, for "from ₦49,999" on the homepage card */
export const fromPrice = (fp) => Math.min(...fp.packages.map((p) => p.price_kobo))
