import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Seo } from '@viverst/ui'
import { BUSINESS } from '../data/agro.js'
import { COMMUNITY } from './content.js'
import './Privacy.css'

/* The privacy policy for the community's registration form. It describes what
   the form in Community.jsx actually collects and where register.js sends it.
   If either changes, change this page and its date too. */
const UPDATED = '12 November 2026'

const COLLECTED = [
  'Your full name',
  'Your email address',
  'Your phone or WhatsApp number',
  'Your country, and your state or location',
  'Your business or organisation name, if you give one',
  'What best describes you, and the areas of agriculture you are interested in',
  'What you hope to gain from the community and how you heard about us, if you tell us',
  'The address of the page you registered on',
]

const RIGHTS = [
  'ask for a copy of the details we hold about you',
  'ask us to correct anything that is wrong or out of date',
  'ask us to delete your details',
  'withdraw your consent and stop receiving messages from us',
  'object to how we are using your details',
]

export default function Privacy() {
  return (
    <article className="avp">
      <Seo
        title={`Privacy Policy | ${COMMUNITY.name}`}
        description={`How ${COMMUNITY.name}, run by ${COMMUNITY.host}, handles the details you give when you register.`}
        url={`${COMMUNITY.url}/privacy`}
        siteName={COMMUNITY.host}
      />
      <header className="page-hero avp-hero">
        <div className="container page-hero-inner">
          <Link to="/community" className="avp-back"><ArrowLeft size={16} aria-hidden="true" /> {COMMUNITY.name}</Link>
          <h1>Privacy Policy</h1>
          <p className="lede">How {COMMUNITY.name} handles the details you give us when you register.</p>
          <p className="avp-date">Last updated: {UPDATED}</p>
        </div>
      </header>

      <div className="container avp-body">
        <section aria-labelledby="avp-who">
          <h2 id="avp-who">Who we are</h2>
          <p>
            {COMMUNITY.name} is run by {COMMUNITY.host}, part of {COMMUNITY.group}, based in {BUSINESS.city}, {BUSINESS.country}.
            We decide how the details you give us are used, and we are responsible for looking after them.
          </p>
        </section>

        <section aria-labelledby="avp-what">
          <h2 id="avp-what">What we collect</h2>
          <p>When you fill in the registration form, we collect what you type into it:</p>
          <ul>{COLLECTED.map((c) => <li key={c}>{c}</li>)}</ul>
          <p>We do not ask for payment details, identity numbers or passwords, and the form does not need them.</p>
        </section>

        <section aria-labelledby="avp-why">
          <h2 id="avp-why">Why we collect it</h2>
          <ul>
            <li>To register you as a member of the community.</li>
            <li>To contact you by email, phone or WhatsApp with community updates, events and opportunities.</li>
            <li>To understand who our members are and what they are interested in, so we can plan useful activities.</li>
          </ul>
          <p>
            We do this with your consent, which you give by ticking the box on the form before you register.
            You can withdraw it at any time.
          </p>
        </section>

        <section aria-labelledby="avp-where">
          <h2 id="avp-where">Where it is kept and who can see it</h2>
          <p>
            Your registration is stored in a Google Sheets spreadsheet in our Google account. Access is limited to the
            {' '}{COMMUNITY.host} team members who run the community. Google may keep this information on computers outside {BUSINESS.country}.
          </p>
          <p>
            This website is hosted by Vercel, which keeps standard technical records of visits, such as the internet
            address a visit came from.
          </p>
          <p>
            We do not sell your details and we do not give them to advertisers. We would only pass them to someone
            else if the law required us to.
          </p>
        </section>

        <section aria-labelledby="avp-whatsapp">
          <h2 id="avp-whatsapp">The WhatsApp community</h2>
          <p>
            After you register, you can choose to join our WhatsApp community. Joining is optional. If you join, other
            members and the community's admins may be able to see your phone number and your WhatsApp name. WhatsApp
            is a service run by Meta and has its own privacy policy. You can leave the WhatsApp community whenever you like.
          </p>
        </section>

        <section aria-labelledby="avp-long">
          <h2 id="avp-long">How long we keep it</h2>
          <p>
            We keep your details for as long as you are part of the community. If you ask us to remove you, we will
            delete your details from our records.
          </p>
        </section>

        <section aria-labelledby="avp-rights">
          <h2 id="avp-rights">Your rights</h2>
          <p>Under the Nigeria Data Protection Act 2023, you can:</p>
          <ul>{RIGHTS.map((r) => <li key={r}>{r}</li>)}</ul>
          <p>
            To do any of these, email <a href={`mailto:${COMMUNITY.email}`}>{COMMUNITY.email}</a>. If you are not happy
            with how we respond, you can complain to the Nigeria Data Protection Commission (ndpc.gov.ng).
          </p>
        </section>

        <section aria-labelledby="avp-children">
          <h2 id="avp-children">Children</h2>
          <p>
            The community is for adults. We do not knowingly collect details from anyone under 18. If you believe a
            child has registered, please tell us and we will remove their details.
          </p>
        </section>

        <section aria-labelledby="avp-changes">
          <h2 id="avp-changes">Changes to this policy</h2>
          <p>If we change how we handle your details, we will update this page and the date at the top.</p>
        </section>

        <section aria-labelledby="avp-contact">
          <h2 id="avp-contact">Contact us</h2>
          <p>
            {COMMUNITY.group}, {BUSINESS.city}, {BUSINESS.country}.<br />
            Email: <a href={`mailto:${COMMUNITY.email}`}>{COMMUNITY.email}</a><br />
            Phone: <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a>
          </p>
        </section>
      </div>
    </article>
  )
}
