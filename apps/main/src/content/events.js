/**
 * Event content. This is the shape an API would return, so the admin backend
 * can replace the source without any page needing to change.
 *
 * `startsAt` is an ISO string with the Lagos offset (+01:00). `endsAt` is
 * optional: leave it out and the event shows its start time only. Whether an
 * event is upcoming or past is derived from the clock at render time, never
 * stored — otherwise the site goes stale the moment a date passes.
 *
 * Optional fields:
 *   image, imageAlt   flyer shown on the listing and the event page
 *   endsAt            end time; omit to show the start time only
 *   capacity          number of places; omit to hide it
 *   city              shown after the venue; omit for online events
 *   registration      { whatsappUrl } turns on the on-page registration form.
 *                     Entries go to the registrations sheet, tagged with the
 *                     event's slug, and the success screen links to the group.
 */

import reimaginingFlyer from '@brand-assets/main/events/reimagining-agriculture-2026.webp'

export const EVENT_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'webinar', label: 'Webinar', icon: 'users' },
  { key: 'field-day', label: 'Field Day', icon: 'factory' },
  { key: 'workshop', label: 'Workshop', icon: 'puzzle' },
  { key: 'briefing', label: 'Briefing', icon: 'trending' },
  { key: 'masterclass', label: 'Masterclass', icon: 'award' },
]

export const EVENTS = [
  {
    slug: 'reimagining-agriculture-digital-economy',
    title: 'Reimagining Agriculture in the Digital Economy',
    excerpt: 'A live session on how farmers, processors and traders can use digital tools to reach buyers, get paid and keep better records.',
    type: 'webinar',
    brand: 'agro',
    mode: 'online',
    venue: 'Online, live on Zoho',
    startsAt: '2026-10-24T18:00:00+01:00',
    image: reimaginingFlyer,
    imageAlt: 'Viverst Agro flyer: Reimagining Agriculture in the Digital Economy, hosted by David Ogunsola, agripreneur, with speaker Barnabas Omoniwa (SirBarna), agriculture and blockchain researcher.',
    registration: {
      whatsappUrl: 'https://chat.whatsapp.com/CWD4naGsRZDBNqntPkYmZ7',
    },
    status: 'published',
    body: [
      { type: 'p', text: 'Viverst Agro is hosting a live conversation on what the digital economy means for agriculture in Nigeria: selling to buyers you have never met, getting paid on time, and keeping records that banks and partners will trust.' },
      { type: 'h', text: 'Who you will hear from' },
      { type: 'list', items: [
        'Host: David Ogunsola, agripreneur',
        'Speaker: Barnabas Omoniwa (SirBarna), agriculture and blockchain researcher',
      ] },
      { type: 'h', text: 'How to join' },
      { type: 'list', items: [
        'Register on this page with your name, phone number and email',
        'Join the WhatsApp group straight after. The Zoho link and reminders are shared there',
        'Saturday 24 October 2026, 6:00 PM WAT',
      ] },
    ],
  },
]
