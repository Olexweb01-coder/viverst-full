/**
 * Seed blog content.
 *
 * The shape here is deliberately the shape an API would return, so when the
 * admin backend lands, `lib/cms.js` swaps its source and nothing else changes.
 * Body is an array of typed blocks rather than an HTML string — that maps
 * cleanly onto a block editor and keeps rendering safe.
 */

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'group', label: 'The Group', icon: 'network' },
  { key: 'agro', label: 'Agro', icon: 'factory' },
  { key: 'studio', label: 'Studio', icon: 'gem' },
  { key: 'governance', label: 'Governance', icon: 'shield' },
]

export const POSTS = [
  {
    slug: 'why-we-put-our-name-on-every-company',
    title: 'Why we put our name on every company',
    excerpt: 'A branded house is a constraint, not a logo decision.',
    category: 'group',
    tags: ['brand architecture', 'strategy'],
    author: { name: 'Viverst Global', role: 'Corporate Communications' },
    publishedAt: '2026-08-18',
    readMinutes: 4,
    featured: true,
    status: 'published',
    body: [
      { type: 'p', text: 'Every company we build carries the parent name. Viverst Agro. Viverst Studio. That is a branded house, and it is a harder choice than it looks.' },
      { type: 'h', text: 'The constraint' },
      { type: 'p', text: 'A holding company with unrelated brand names can quietly absorb a failure. One that shares its name cannot. If a subsidiary underdelivers, the parent wears it.' },
      { type: 'list', items: ['One standard of governance, not two', 'Shared reputation, shared consequence', 'No hiding a weak business behind a different name'] },
      { type: 'quote', text: 'Our reputation is defined not only by the businesses we own, but by the legacy we create through ethical leadership.' },
      { type: 'p', text: 'We chose it because it forces the discipline we want anyway.' },
    ],
  },
  {
    slug: 'what-a-parent-company-actually-supplies',
    title: 'What a parent company actually supplies',
    excerpt: 'Vision, governance, resources, leadership. In that order.',
    category: 'governance',
    tags: ['governance', 'operating model'],
    author: { name: 'Viverst Global', role: 'Office of the Group' },
    publishedAt: '2026-08-02',
    readMinutes: 3,
    featured: false,
    status: 'published',
    body: [
      { type: 'p', text: 'A parent that only holds equity is a shareholder. A parent that supplies something is an operator of a different kind.' },
      { type: 'h', text: 'Four things' },
      { type: 'list', items: ['Vision — one direction, measured across every company', 'Governance — oversight the name demands', 'Resources — talent, systems and capital, shared', 'Leadership — long-term calls made once, at group level'] },
      { type: 'p', text: 'Anything beyond that belongs to the subsidiary. The parent sets the standard; the company decides how to meet it in its own market.' },
    ],
  },
  {
    slug: 'agri-tech-distribution-problem',
    title: 'Agri-tech has a distribution problem',
    excerpt: 'The technology mostly works. Getting it to the field does not.',
    category: 'agro',
    tags: ['agri-tech', 'food systems'],
    author: { name: 'Viverst Agro', role: 'Agricultural Technology' },
    publishedAt: '2026-07-21',
    readMinutes: 5,
    featured: true,
    status: 'published',
    body: [
      { type: 'p', text: 'Most agricultural technology fails at the last twenty kilometres, not in the lab.' },
      { type: 'h', text: 'Where it breaks' },
      { type: 'list', items: ['Tools designed for connectivity that is not there', 'Training that assumes a literacy level that varies', 'Service models with no route to a rural cooperative'] },
      { type: 'p', text: 'We build for the field first and the dashboard second. That ordering changes what gets built.' },
    ],
  },
  {
    slug: 'brand-systems-that-survive-a-printer',
    title: 'Brand systems that survive a printer',
    excerpt: 'A palette that only works on a screen is half a system.',
    category: 'studio',
    tags: ['branding', 'print'],
    author: { name: 'Viverst Studio', role: 'Creative Strategy' },
    publishedAt: '2026-07-04',
    readMinutes: 4,
    featured: false,
    status: 'published',
    body: [
      { type: 'p', text: 'A brand system is tested the first time it leaves the screen. Fluorescents shift. Thin weights close up. Gradients band.' },
      { type: 'h', text: 'What we check before sign-off' },
      { type: 'list', items: ['Every colour has a coated and uncoated equivalent', 'The mark reads at 12mm and at three metres', 'The type holds at the smallest legal size on a label'] },
      { type: 'p', text: 'A system that has not been printed has not been finished.' },
    ],
  },
  {
    slug: 'packaging-quiet-lever-agro-processing',
    title: 'Packaging is the quietest lever in agro processing',
    excerpt: 'Shelf life, freight cost and trust, all decided upstream.',
    category: 'agro',
    tags: ['packaging', 'processing'],
    author: { name: 'Viverst Agro', role: 'Packaging Solutions' },
    publishedAt: '2026-06-15',
    readMinutes: 3,
    featured: false,
    status: 'published',
    body: [
      { type: 'p', text: 'Packaging is usually the last decision and one of the most expensive to get wrong.' },
      { type: 'list', items: ['It sets shelf life before distribution begins', 'It determines pallet economics and freight cost', 'It is the first quality signal a buyer receives'] },
      { type: 'p', text: 'Decided early, it pays for itself. Decided late, it caps the margin of everything upstream.' },
    ],
  },
  {
    slug: 'building-long-term-in-a-short-term-market',
    title: 'Building long-term in a short-term market',
    excerpt: 'Patience is a strategy, provided the balance sheet agrees.',
    category: 'group',
    tags: ['investment', 'strategy'],
    author: { name: 'Viverst Global', role: 'Corporate Strategy' },
    publishedAt: '2026-05-28',
    readMinutes: 4,
    featured: false,
    status: 'published',
    body: [
      { type: 'p', text: 'Long-term thinking is easy to claim and expensive to practise. It requires the ability to decline good short-term revenue.' },
      { type: 'quote', text: 'We make long-term decisions that create value for customers, employees, partners, investors and the communities we serve.' },
      { type: 'p', text: 'A diversified portfolio makes that possible: one company can invest through a slow year because another is carrying the group.' },
    ],
  },
]
