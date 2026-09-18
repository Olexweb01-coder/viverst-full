/**
 * Every piece of copy and structured content lives here.
 * Pages import from this file so a change is made once, not in three places.
 * Source: VIVERST GLOBAL LIMITED — CORPORATE BRAND STRATEGY
 */

import industry from '@brand-assets/main/img/industry.webp'
import production from '@brand-assets/main/img/production.webp'
import logistics from '@brand-assets/main/img/logistics.webp'
import city from '@brand-assets/main/img/city.webp'
import growth from '@brand-assets/main/img/growth.webp'

export const COMPANY = {
  legalName: "Viverst Global Limited",
  shortName: "Viverst",
  city: "Lagos",
  country: "Nigeria",
  email: "hello@viverst.com",
  phone: "+234 000 000 0000",
  domain: "https://www.viverst.com",
};

/* ── Brand architecture ─────────────────────────────────────── */

export const SUBSIDIARIES = [
  {
    key: "agro",
    path: "https://agro.viverst.com",
    external: true,
    name: "Viverst Agro",
    short: "Agro",
    tagline: "Strengthening food systems and agricultural value chains.",
    summary: "Agricultural solutions built for the field, not the spreadsheet.",
    blurb: "Agri-tech · processing · packaging · B2B",
    units: [
      { name: "Agricultural Technology", icon: "cpu" },
      { name: "Agro Processing", icon: "factory" },
      { name: "Packaging Solutions", icon: "package" },
      { name: "B2B Services", icon: "truck" },
    ],
    theme: {
      deep: "#18542a",
      bright: "#9abc05",
      accent: "#ffc926",
      warm: "#f96015",
      paper: "#f3e8cc",
      font: '"Roboto Flex", "Bricolage Grotesque", sans-serif',
      rgb: "154, 188, 5",
    },
  },
  {
    key: "studio",
    path: "https://studio.viverst.com",
    external: true,
    name: "Viverst Studio",
    short: "Studio",
    tagline: "Building brands that are strong and memorable.",
    summary: "Design for businesses that want to be remembered, not just seen.",
    blurb: "Branding · print · 3D · creative strategy",
    units: [
      { name: "Branding", icon: "gem" },
      { name: "Graphic Design", icon: "pen" },
      { name: "Print Design", icon: "printer" },
      { name: "3D Design", icon: "box" },
      { name: "Creative Strategy", icon: "compass" },
    ],
    theme: {
      deep: "#411d77",
      bright: "#8338ec",
      accent: "#fb5607",
      warm: "#fb5607",
      paper: "#e9ecef",
      font: '"Poppins", "Bricolage Grotesque", sans-serif',
      rgb: "131, 56, 236",
    },
  },
];

/* ── Who we are ─────────────────────────────────────────────── */

export const VISION =
  "To build a globally respected portfolio of businesses that drive innovation, create sustainable economic value, and improve lives across industries and generations.";

export const MISSION =
  "To identify opportunities, build and invest in high-potential businesses, and provide the strategic leadership, resources, and governance they need to achieve sustainable growth and lasting impact.";

export const PURPOSE =
  "To build businesses that create lasting value for people, industries, and society — transforming ideas into sustainable enterprises and empowering each one to solve meaningful challenges.";

export const POSITIONING =
  "Unlike organisations focused on a single industry, Viverst is a diversified enterprise committed to identifying opportunities, developing market-leading brands, and building an ecosystem of businesses that work together to drive economic progress.";

export const VALUES = [
  { name: "Leadership", icon: "crown" },
  { name: "Innovation", icon: "lightbulb" },
  { name: "Excellence", icon: "award" },
  { name: "Collaboration", icon: "users" },
  { name: "Integrity", icon: "shield" },
  { name: "Proactiveness", icon: "zap" },
  { name: "Adaptability", icon: "shuffle" },
  { name: "Resilience", icon: "anchor" },
  { name: "Problem Solving", icon: "puzzle" },
  { name: "Customer Centricity", icon: "heart" },
];

export const REPUTATION = [
  { icon: "shield",     title: "Trusted",     body: "Integrity, transparency, responsible governance." },
  { icon: "building",   title: "A builder",   body: "Quality and growth that hold over time." },
  { icon: "trending",   title: "Long-term",   body: "Enduring value over short-term gains." },
  { icon: "lightbulb",  title: "Innovating",  body: "Change and technology, adopted early." },
  { icon: "zap",        title: "A catalyst",  body: "Jobs, entrepreneurs, stronger industries." },
  { icon: "network",    title: "A parent",    body: "Subsidiaries that lead their own markets." },
];

/* What the parent actually supplies to each company — the reason it exists */
export const PROVIDES = [
  { icon: "compass",  title: "Vision",     body: "One direction, measured across every company." },
  { icon: "shield",   title: "Governance", body: "The oversight that carrying the name demands." },
  { icon: "layers",   title: "Resources",  body: "Talent, systems and capital, shared." },
  { icon: "network",  title: "Leadership", body: "Long-term calls made once, at group level." },
];

export const STATS = [
  { value: 2, suffix: "", label: "Companies operating" },
  { value: 9, suffix: "", label: "Business units" },
  { value: 10, suffix: "", label: "Core values" },
  { value: 1, suffix: "", label: "Name behind it all" },
];


/* ── Navigation ─────────────────────────────────────────────── */

/* Hero imagery. Five slots, rotated in order. These are placeholder graphics,
   not photographs — drop a real photo in with the same filename and every place
   it appears updates. The admin backend edits this list rather than the page. */
export const IMG = { industry, production, logistics, city, growth }

export const HERO_FRAMES = [
  { key: 'industry', img: industry, alt: '' },
  { key: 'production', img: production, alt: '' },
  { key: 'logistics', img: logistics, alt: '' },
  { key: 'city', img: city, alt: '' },
  { key: 'growth', img: growth, alt: '' },
]

/* Two lines, stepped, centred. Two is the maximum: a third turns the hero into
   a paragraph. The test asserts it. */
export const HERO_LINES = [
  { text: 'We build businesses', shift: '-2%' },
  { text: 'that shape industries.', shift: '3%' },
]

export const HERO_SUMMARY =
  'Identifying opportunities, building businesses and developing solutions that '
  + 'create lasting value.'

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/blog", label: "Journal" },
  { to: "/events", label: "Events" },
  { to: "/businesses", label: "Our Businesses" },
  { to: "/contact", label: "Contact" },
];
