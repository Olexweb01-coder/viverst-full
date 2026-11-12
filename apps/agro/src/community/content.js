/**
 * The Agricultural Value Chain Community: every word and picture on the page.
 * The copy is the client's brief, unchanged. Change it here, not in the page.
 */
import farming from '@brand-assets/agro/img/chain-farming.webp'
import tools from '@brand-assets/agro/img/chain-tools.webp'
import processing from '@brand-assets/agro/img/chain-processing.webp'
import packaging from '@brand-assets/agro/img/chain-packaging.webp'
import market from '@brand-assets/agro/img/chain-market.webp'
import crates from '@brand-assets/agro/img/crates.webp'
import drone from '@brand-assets/agro/img/drone.webp'
import greenhouse from '@brand-assets/agro/img/greenhouse.webp'
import group from '@brand-assets/agro/img/door-group.webp'
import tomatoes from '@brand-assets/agro/img/tomatoes.webp'
import fromAbove from '@brand-assets/agro/img/farm-from-above.webp'

export const COMMUNITY = {
  name: 'The Agricultural Value Chain Community',
  host: 'Viverst Agro',
  hostUrl: 'https://agro.viverst.com',
  url: 'https://agro.viverst.com/community',
  /* The WhatsApp community's invite link. Once it is set, the message shown
     after registering offers a button to join. Leave empty to hide the button. */
  whatsappUrl: 'https://chat.whatsapp.com/FELyfsAsS03HkaNd2RGrBU?s=cl&p=a&iam=2',
  group: 'Viverst Global Limited',
  email: 'agro@viverst.com',
  /* The community's privacy policy, src/community/Privacy.jsx. */
  privacyUrl: '/community/privacy',
}

/* Section ids double as the menu's targets. */
export const NAV = [
  { id: 'top', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'who', label: 'Who We Are For' },
  { id: 'benefits', label: 'Community Benefits' },
  { id: 'activities', label: 'Activities' },
]

export const HERO = {
  headline: ['The', 'Agricultural', 'Value', 'Chain', 'Community'],
  marked: ['Value', 'Chain'],
  phrases: ['Connecting People.', 'Creating Opportunities.', 'Growing Agriculture.'],
  description: 'A community bringing together individuals, professionals and businesses across the agricultural value chain to connect, exchange knowledge, discover opportunities and build meaningful collaborations.',
  primary: 'Join the community',
  secondary: 'Explore the community',
}

/* The hero's moving pictures: two columns, one stage of the chain per picture. */
export const REEL = [
  [
    { src: farming, label: 'Production' },
    { src: processing, label: 'Processing' },
    { src: drone, label: 'Technology' },
    { src: market, label: 'Distribution' },
  ],
  [
    { src: packaging, label: 'Packaging' },
    { src: crates, label: 'Trading' },
    { src: tools, label: 'Inputs and services' },
    { src: greenhouse, label: 'Research' },
  ],
]

export const AUDIENCE = [
  'Farmers and farm owners', 'Agribusiness owners', 'Agro-processors', 'Food manufacturers',
  'Input suppliers', 'Aggregators and commodity traders', 'Distributors, wholesalers and retailers',
  'AgTech professionals', 'Consultants and extension workers', 'Researchers and students',
  'Investors and finance professionals', 'Logistics and supply chain operators', 'Food businesses and exporters',
]

export const ABOUT = {
  heading: ['One Industry.', 'Different Players.', 'Shared Opportunities.'],
  lead: 'Agriculture is bigger than farming. It is an interconnected ecosystem of people, businesses and services working together to produce, process, move and deliver food and agricultural products.',
  body: [
    'The Agricultural Value Chain Community exists to bridge the gaps between these players by creating a platform where knowledge is exchanged, relationships are built and opportunities are discovered.',
    'Whether you are a farmer, processor, distributor, researcher, AgTech enthusiast or agricultural entrepreneur, there is a place for you here.',
  ],
  chain: ['Production', 'Processing', 'Packaging', 'Distribution', 'Technology', 'Consumption'],
}

export const SECTORS = {
  heading: 'There Is a Place for You in the Value Chain.',
  items: [
    { icon: 'Sprout', name: 'Production', text: 'Crop farmers, livestock farmers and farm operators.', src: farming, alt: 'A tractor working rows of crops, seen from above.' },
    { icon: 'Factory', name: 'Processing', text: 'Agro-processors, food manufacturers and value-addition businesses.', src: processing, alt: 'Workers sorting fresh greens into crates inside a packhouse.' },
    { icon: 'Tractor', name: 'Inputs and Services', text: 'Seed suppliers, fertiliser businesses, equipment providers and agricultural consultants.', src: tools, alt: 'A tractor pulling a plough across a green field.' },
    { icon: 'Scale', name: 'Aggregation and Trading', text: 'Produce aggregators, commodity traders and agricultural merchants.', src: crates, alt: 'Crates of harvested apples stacked between orchard rows.' },
    { icon: 'Cpu', name: 'Technology and Innovation', text: 'AgTech companies, digital agriculture professionals and automation specialists.', src: drone, alt: 'A drone flying low over a field of crops.' },
    { icon: 'Truck', name: 'Packaging and Distribution', text: 'Packaging companies, logistics providers, distributors and retailers.', src: market, alt: 'A delivery truck and packed cartons on the road into a city.' },
    { icon: 'GraduationCap', name: 'Research and Education', text: 'Researchers, lecturers, students and agricultural institutions.', src: greenhouse, alt: 'A grower studying plants inside a greenhouse.' },
    { icon: 'Landmark', name: 'Investment and Finance', text: 'Agricultural investors, financial institutions and agribusiness financiers.', src: group, alt: 'Colleagues talking through a plan around a meeting table.' },
  ],
}

export const BENEFITS = {
  heading: ['More Than a Network.', 'A Platform for Growth.'],
  items: [
    { icon: 'Handshake', name: 'Meaningful Connections', text: 'Connect with people and businesses across different parts of the agricultural ecosystem.' },
    { icon: 'DoorOpen', name: 'Access to Opportunities', text: 'Discover business opportunities, partnerships, projects, events and industry openings.' },
    { icon: 'BookOpen', name: 'Knowledge and Insights', text: 'Learn from industry professionals, experienced practitioners and fellow community members.' },
    { icon: 'Users', name: 'Collaboration', text: 'Find potential partners, suppliers, customers and collaborators.' },
    { icon: 'Megaphone', name: 'Visibility and Exposure', text: 'Showcase your work, business, products, services and expertise.' },
    { icon: 'TrendingUp', name: 'Industry Development', text: 'Participate in conversations and initiatives shaping the future of agriculture.' },
  ],
}

export const ACTIVITIES = {
  words: ['Connect.', 'Learn.', 'Collaborate.', 'Grow.'],
  items: [
    'Agricultural discussions and industry conversations',
    'Networking and relationship-building opportunities',
    'Webinars, workshops and learning sessions',
    'Business and partnership opportunities',
    'Industry news, insights and updates',
    'Product, service and business showcases',
    'Collaborative projects and initiatives',
  ],
  photos: [
    { src: group, alt: 'Members of a team in conversation around a table.' },
    { src: tomatoes, alt: 'Fresh tomatoes packed in cartons, ready to move.' },
    { src: fromAbove, alt: 'Farm plots and a red earth road, seen from the air.' },
  ],
}

export const CTA = {
  heading: 'Be Part of the Agricultural Ecosystem.',
  text: 'Agriculture needs connected people, informed businesses and stronger collaborations. Join a community bringing together the people shaping the industry.',
  button: 'Become a member',
}

export const FORM = {
  heading: 'Join The Agricultural Value Chain Community',
  text: 'Take the first step towards connecting with people, businesses and opportunities across the agricultural value chain. Complete the form below to register your interest in joining.',
  roles: [
    'Farmer / Farm Owner', 'Agribusiness Owner', 'Agro-processor / Food Manufacturer',
    'Agricultural Input Supplier', 'Aggregator / Commodity Trader', 'Distributor / Retailer',
    'Agricultural Consultant / Extension Worker', 'AgTech Professional', 'Researcher / Academic',
    'Student', 'Agricultural Investor / Finance Professional', 'Logistics / Supply Chain Professional', 'Other',
  ],
  interests: [
    'Crop Production', 'Livestock Production', 'Agro-processing', 'Agricultural Technology',
    'Agricultural Finance', 'Agricultural Research', 'Food Packaging',
    'Supply Chain and Distribution', 'Agricultural Marketing and Trade', 'Other',
  ],
  sources: ['Social Media', 'Friend / Referral', 'Website', 'Event / Webinar', 'Other'],
  consent: 'I agree to receive relevant community updates, information and communications.',
  submit: 'Register now',
  successTitle: 'Registration Successful!',
  successText: 'Thank you for expressing interest in joining The Agricultural Value Chain Community. Your details have been received. We look forward to welcoming you.',
  duplicateText: 'You have already registered with this email address, so there is nothing more to fill in.',
  whatsappText: 'One more step: join the community on WhatsApp. Conversations, updates and opportunities are shared there.',
  whatsappButton: 'Join the WhatsApp community',
}
