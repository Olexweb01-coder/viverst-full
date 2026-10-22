/**
 * Every piece of copy and structured content lives here.
 * Pages import from this file so a change is made once, not in three places.
 * Source: VIVERST GLOBAL LIMITED — CORPORATE BRAND STRATEGY
 */

import growth from '@brand-assets/main/img/growth.webp'
import partnership from '@brand-assets/main/img/partnership.webp'
import boardroom from '@brand-assets/main/img/boardroom.webp'
import city from '@brand-assets/main/img/city.webp'
import agroIcon from '@brand-assets/agro/icon-small.webp'
import studioIcon from '@brand-assets/studio/icon-small.webp'

export const COMPANY = {
  legalName: "Viverst Global Limited",
  shortName: "Viverst",
  city: "Lagos",
  country: "Nigeria",
  email: "info@viverst.com",
  hrEmail: "hr@viverst.com",
  phone: "+234 906 034 2734",
  domain: "https://www.viverst.com",
};

/* ── Social profiles and WhatsApp ─────────────────────────────
   Profile pages, not share links: share links are tied to the session that
   created them and can stop working; these addresses do not change.
   WHATSAPP is the full international number. */
export const SOCIALS = [
  { network: "facebook", url: "https://www.facebook.com/viverstglobal" },
  { network: "instagram", url: "https://www.instagram.com/viverstglobal/" },
  { network: "linkedin", url: "https://www.linkedin.com/company/viverstglobal/" },
];
export const WHATSAPP = "+2349060342734";

/* ── Brand architecture ─────────────────────────────────────── */

export const SUBSIDIARIES = [
  {
    key: "agro",
    path: "https://agro.viverst.com",
    external: true,
    name: "Viverst Agro",
    logo: agroIcon,
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
    logo: studioIcon,
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

/* The four things the group does with every business it holds. The homepage
   introduces them one line each; the About page explains who we are. */
export const WHAT_WE_DO = [
  { icon: "building", title: "Build",  body: "New companies, started where we see a real gap." },
  { icon: "compass",  title: "Manage", body: "Direction and oversight for every company in the group." },
  { icon: "trending", title: "Invest", body: "Capital and backing for businesses with room to grow." },
  { icon: "sprout",   title: "Grow",   body: "Taking each company further than it would get alone." },
];

export const STATS = [
  { value: 2, suffix: "", label: "Companies operating" },
  { value: 9, suffix: "", label: "Business units" },
  { value: 10, suffix: "", label: "Core values" },
  { value: 1, suffix: "", label: "Name behind it all" },
];


/* ── Navigation ─────────────────────────────────────────────── */

/* Hero photography. Four slots, rotated in order. To swap one, drop a new
   1600x1100 file in with the same filename. The rotation in Home.css is timed
   for this count: 6 seconds each, so change both if the count changes. */
export const IMG = { growth, partnership, boardroom, city }

export const HERO_FRAMES = [
  { key: 'growth', img: growth, alt: '' },
  { key: 'partnership', img: partnership, alt: '' },
  { key: 'boardroom', img: boardroom, alt: '' },
  { key: 'city', img: city, alt: '' },
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
  { to: "/businesses", label: "Our Businesses" },
  { to: "/blog", label: "Blog" },
  { to: "/events", label: "Events" },
  { to: "/careers", label: "Careers" },
  { to: "/contact", label: "Contact" },
];

/* ── Careers ────────────────────────────────────────────────── */

/* Open roles across the whole group are listed here and nowhere else. Empty
   means empty: the page shows an honest notice and the application form.
   Each role: { slug, title, company, type, place, summary }. The admin
   backend fills this same shape. */
export const ROLES = []

/* The application form. Every answer is written into the email that reaches
   HR, so the options here are the ones HR wants to sort by. */
export const CAREER_PLACES = [
  "Anywhere in the group",
  "Viverst Global Limited",
  "Viverst Agro",
  "Viverst Studio",
]
export const CAREER_AREAS = [
  "Agriculture and agro-processing",
  "Design and creative",
  "Technology and engineering",
  "Sales and business development",
  "Finance, admin and operations",
  "Other",
]
export const CAREER_EXPERIENCE = ["0–2 years", "3–5 years", "6–10 years", "More than 10 years"]
export const CAREER_TYPES = ["Full time", "Part time", "Contract", "Internship"]
export const CAREER_AVAILABILITY = ["Immediately", "Within a month", "In 1–3 months", "Later"]

/* Why work here. Three short points; the page says the rest. */
export const CAREER_REASONS = [
  { icon: "trending", title: "Room to grow", body: "A group that is still expanding has more openings than one that is finished." },
  { icon: "network",  title: "More than one industry", body: "Agriculture, design and whatever comes next. Skills can move between companies." },
  { icon: "anchor",   title: "A long view", body: "Businesses built to last, which means careers built the same way." },
]
