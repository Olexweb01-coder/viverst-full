/**
 * Seed event content. Same principle as posts: this is the shape an API
 * would return, so the admin backend can replace the source without any
 * page needing to change.
 *
 * `startsAt` / `endsAt` are ISO strings. Whether an event is upcoming or past
 * is derived from the clock at render time, never stored — otherwise the site
 * goes stale the moment a date passes.
 */

export const EVENT_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'field-day', label: 'Field Day', icon: 'factory' },
  { key: 'workshop', label: 'Workshop', icon: 'puzzle' },
  { key: 'briefing', label: 'Briefing', icon: 'trending' },
  { key: 'masterclass', label: 'Masterclass', icon: 'award' },
]

export const EVENTS = [
  {
    slug: 'agro-field-day-2026',
    title: 'Viverst Agro Field Day',
    excerpt: 'Processing, packaging and B2B logistics, demonstrated on site.',
    type: 'field-day',
    brand: 'agro',
    mode: 'in-person',
    venue: 'Viverst Agro Facility',
    city: 'Lagos, Nigeria',
    startsAt: '2026-10-15T09:00:00+01:00',
    endsAt: '2026-10-15T15:00:00+01:00',
    capacity: 80,
    registerUrl: '/contact',
    status: 'published',
    body: [
      { type: 'p', text: 'A working day at the facility rather than a conference. Equipment running, lines open, questions answered on the floor.' },
      { type: 'h', text: 'On the day' },
      { type: 'list', items: ['Live processing line walkthrough', 'Packaging formats and shelf-life testing', 'B2B supply and offtake conversations'] },
    ],
  },
  {
    slug: 'studio-open-critique-november',
    title: 'Studio Open Critique',
    excerpt: 'Bring work in progress. Leave with a sharper direction.',
    type: 'workshop',
    brand: 'studio',
    mode: 'online',
    venue: 'Online',
    city: 'Remote',
    startsAt: '2026-11-12T16:00:00+01:00',
    endsAt: '2026-11-12T18:00:00+01:00',
    capacity: 40,
    registerUrl: '/contact',
    status: 'published',
    body: [
      { type: 'p', text: 'An open session where founders and designers put unfinished work up for honest critique.' },
      { type: 'list', items: ['Six slots, fifteen minutes each', 'Brand systems, packaging and identity work', 'Recorded and shared with attendees'] },
    ],
  },
  {
    slug: 'group-investor-briefing-q4',
    title: 'Group Investor Briefing',
    excerpt: 'Where the portfolio stands and what comes next.',
    type: 'briefing',
    brand: 'group',
    mode: 'hybrid',
    venue: 'Viverst Global Limited',
    city: 'Lagos, Nigeria',
    startsAt: '2026-12-03T11:00:00+01:00',
    endsAt: '2026-12-03T13:00:00+01:00',
    capacity: 60,
    registerUrl: '/contact',
    status: 'published',
    body: [
      { type: 'p', text: 'A direct briefing on the group: how each company performed, where capital went, and what is being built next.' },
      { type: 'list', items: ['Portfolio review across both companies', 'Governance and capital allocation', 'Open questions from attendees'] },
    ],
  },
  {
    slug: 'agro-processing-workshop-july',
    title: 'Agro Processing Workshop',
    excerpt: 'Yield, throughput and the cost of a badly sized line.',
    type: 'workshop',
    brand: 'agro',
    mode: 'in-person',
    venue: 'Viverst Agro Facility',
    city: 'Lagos, Nigeria',
    startsAt: '2026-07-09T10:00:00+01:00',
    endsAt: '2026-07-09T14:00:00+01:00',
    capacity: 50,
    registerUrl: '/contact',
    status: 'published',
    body: [
      { type: 'p', text: 'A practical session on sizing a processing line against real offtake rather than optimistic projections.' },
    ],
  },
  {
    slug: 'brand-systems-masterclass-august',
    title: 'Brand Systems Masterclass',
    excerpt: 'Building an identity that holds up in print and at scale.',
    type: 'masterclass',
    brand: 'studio',
    mode: 'online',
    venue: 'Online',
    city: 'Remote',
    startsAt: '2026-08-20T15:00:00+01:00',
    endsAt: '2026-08-20T17:30:00+01:00',
    capacity: 120,
    registerUrl: '/contact',
    status: 'published',
    body: [
      { type: 'p', text: 'How a brand system is specified, documented and handed over so it survives the people who made it.' },
    ],
  },
]
