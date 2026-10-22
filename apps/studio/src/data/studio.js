/**
 * Every list here traces back to the client's corporate brand strategy
 * document. The formal source wording is put into plain language, the same way
 * Viverst Agro's content file was written, because the audience is business
 * owners rather than a marketing department.
 */

export const BUSINESS = {
  name: 'Viverst Studio',
  short: 'Studio',
  parent: 'Viverst Global Limited',
  parentUrl: 'https://www.viverst.com',
  siblingName: 'Viverst Agro',
  siblingUrl: 'https://agro.viverst.com',
  site: 'https://studio.viverst.com',
  email: 'studio@viverst.com',
  phone: '+234 906 034 2734',
  city: 'Lagos',
  country: 'Nigeria',
  industry: 'Brand, design and visual communication',
}

/* Profile pages, not share links: share links are tied to the session that
   created them and can stop working; these addresses do not change.
   WHATSAPP is the full international number. */
export const SOCIALS = [
  { network: 'instagram', url: 'https://www.instagram.com/viverststudio/' },
  { network: 'facebook', url: 'https://www.facebook.com/viverststudio/' },
  { network: 'linkedin', url: 'https://www.linkedin.com/company/viverststudio/' },
]
export const WHATSAPP = '+2349060342734'

/* The homepage headline, as one sentence and as the two lines it is set in. */
export const PROMISE = 'We design with strategy. Not just style.'
export const HEADLINE_LINES = [
  { text: 'We design with strategy.', shift: '0' },
  { text: 'Not just style.', shift: '6%', deep: true },
]

export const LEDE =
  'Great businesses deserve great visual identities. We turn ideas into brands people can '
  + 'see, understand and remember.'

export const STATEMENT = 'We turn ideas into brands people can see, understand and remember.'
export const STATEMENT_KEY = ['see,', 'understand', 'remember.']
export const STATEMENT_CAPTION = 'The reason the studio exists'

export const MISSION =
  'To transform ideas into purposeful visual experiences that help businesses build stronger '
  + 'brands, communicate better, and grow.'

export const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'What we do' },
  { to: '/work', label: 'Work' },
]

/* Core Areas of Focus — eight, exactly as the document lists them. */
export const FOCUS_AREAS = [
  { key: 'identity', title: 'Brand identity',
    body: 'The name, the mark, the colours and the rules that keep them steady once everyone starts using them.' },
  { key: 'digital', title: 'Digital and visual design',
    body: 'Screens, social and everything people meet of you online, built to hold together as a set.' },
  { key: 'graphic', title: 'Graphic design',
    body: 'The day-to-day pieces, drawn from one system instead of invented again every time.' },
  { key: 'print', title: 'Print design',
    body: 'Files built for the press, so what comes back from the printer matches what you approved.' },
  { key: 'three-d', title: '3D design and visualisation',
    body: 'See the pack, the stand or the product properly before anyone pays to manufacture it.' },
  { key: 'marketing', title: 'Marketing and promotional design',
    body: 'Campaign work that sells hard without shouting over the brand it is meant to build.' },
  { key: 'strategy', title: 'Creative strategy',
    body: 'Deciding what the business should stand for, before deciding what any of it looks like.' },
  { key: 'comms', title: 'Business communication',
    body: 'Company profiles, decks and reports that make a serious business look like one.' },
]

/* What a client receives. `art` selects the illustration in Artefacts.jsx. */
export const DELIVERABLES = [
  { art: 'identity', cat: 'Identity', title: 'A logo and the system behind it',
    body: 'The mark, the colour set, the type and the rules that stop it drifting the moment anyone else touches it.' },
  { art: 'guidelines', cat: 'Guidelines', title: 'A brand book your team can follow',
    body: 'Spacing, sizes, do and do-not pages. Your printer, your intern and your agency all get it right.' },
  { art: 'pack', cat: 'Packaging and 3D', title: 'Product seen before it is made',
    body: 'Structure, label and a render you can judge, so nobody pays for a production run to find out.' },
  { art: 'print', cat: 'Print', title: 'Cards, stationery and profiles',
    body: 'Set up for the press with bleed and colour handled, so what comes back is what you approved.' },
  { art: 'digital', cat: 'Digital', title: 'Social and screen kits',
    body: 'Post templates, banners and profile assets sized per platform, all drawn from the same system.' },
  { art: 'deck', cat: 'Decks', title: 'Company profiles and pitch decks',
    body: 'The document a bank, a buyer or an investor reads, built to make a serious business look like one.' },
]

/* Pain Points, from the target audience section. */
export const PAINS = [
  { title: 'Weak branding', body: 'A logo, and nothing behind it. No rules, no system, nothing to hold it together.' },
  { title: 'Visuals that drift', body: 'Every piece looks like it came from a different company, because it did.' },
  { title: 'Work that looks cheap', body: 'Stretched logos, wrong colours, files that fall apart the moment they are printed.' },
  { title: 'Designers who vanish', body: 'The job half done, the source files gone, and nobody answering the phone.' },
]

export const PROCESS = [
  { title: 'We ask about the business', body: 'What you sell, who buys it, and what is getting in the way. Before anything is drawn.' },
  { title: 'We agree what winning looks like', body: 'Written down, so the work is judged against the goal instead of against taste.' },
  { title: 'We design in the open', body: 'You see it while it is still cheap to change, not on the day it is finished.' },
  { title: 'We build the system', body: 'Rules, sizes and files, so the tenth piece still matches the first one.' },
  { title: 'You keep everything', body: 'Source files and a short guide. Nothing held back, nobody to chase later.' },
]

/* "Why Choose Us?" — six, from the value proposition. */
export const REASONS = [
  { icon: 'target', title: 'Design with a job to do',
    body: 'Every piece is made to achieve something. Looking good is the minimum, not the brief.' },
  { icon: 'eye', title: 'Work you cannot mistake',
    body: 'If it could carry another company\u2019s name without anyone noticing, it is not finished.' },
  { icon: 'layers', title: 'The same standard every time',
    body: 'The tenth piece matches the first. That consistency is the whole point of a system.' },
  { icon: 'cpu', title: 'Current tools, used properly',
    body: 'New methods and technology where they earn their place, not because they are new.' },
  { icon: 'users', title: 'We ask about the business',
    body: 'What you sell and who buys it comes before any conversation about colour.' },
  { icon: 'package', title: 'One studio, the whole range',
    body: 'Brand, digital, print and 3D in one place, so nothing is handed off and lost.' },
]

/* Demographics, from the target audience section. */
export const AUDIENCE = [
  'Startups', 'Small and growing businesses', 'Corporations',
  'NGOs', 'Entrepreneurs', 'Personal brands',
]

export const COMMITMENTS = [
  'Fixed scope and a fixed price agreed before we start',
  'You see the work in progress, not only at the end',
  'Source files and a written guide handed over every time',
  'Backed by Viverst Global Limited, not a one-person setup',
]

/* Sample projects. These are LAYOUT SAMPLES, not delivered client work — the
   studio has none published yet. Every one carries `sample: true`, the Work
   page renders a visible notice while any of them do, and verify.mjs fails the
   build if that notice is ever removed while samples are still present. Delete
   the flag, or the record, as real projects ship. The admin backend fills this
   same shape. */
export const PROJECTS = [
  {
    slug: 'adaeze-foods', sample: true, art: 'identity', year: '2026',
    category: 'Brand identity',
    title: 'Adaeze Foods',
    summary: 'A full identity for a food processor: the mark, the colour set, the type and the rules that hold it together across the pack and the truck.',
  },
  {
    slug: 'ikoyi-and-vine', sample: true, art: 'pack', year: '2026',
    category: 'Packaging and 3D',
    title: 'Ikoyi & Vine',
    summary: 'Pouch structure, label and a render approved before the first production run, so the shelf test happened on screen instead of on invoice.',
  },
  {
    slug: 'northbridge-capital', sample: true, art: 'deck', year: '2025',
    category: 'Business communication',
    title: 'Northbridge Capital',
    summary: 'A company profile and investor deck built to be read in ten minutes by someone deciding whether to take the next meeting.',
  },
  {
    slug: 'zuri-cosmetics', sample: true, art: 'digital', year: '2026',
    category: 'Digital and visual design',
    title: 'Zuri Cosmetics',
    summary: 'A social and screen kit: post templates, story frames and profile assets, all sized per platform and drawn from one system.',
  },
  {
    slug: 'balogun-press', sample: true, art: 'print', year: '2025',
    category: 'Print design',
    title: 'Balogun Press',
    summary: 'Stationery, cards and a company profile set up for the press with bleed and colour handled, so the proof matched the delivery.',
  },
  {
    slug: 'aurora-health', sample: true, art: 'guidelines', year: '2025',
    category: 'Guidelines',
    title: 'Aurora Health',
    summary: 'A brand book a clinical team could actually follow: spacing, sizes, do and do-not pages, and the files behind every rule.',
  },
]

export const CONTACT_TOPICS = [
  'A new brand identity',
  'Packaging or 3D',
  'Print or stationery',
  'A deck or company profile',
  'Something else',
]
