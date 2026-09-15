import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo, Icon } from '@viverst/ui'
import { BUSINESS, CONTACT_TOPICS } from '../data/studio.js'

export default function Contact() {
  const [topic, setTopic] = useState('')
  const [form, setForm] = useState({ name: '', email: '', note: '' })
  const ready = topic && form.name.trim() && form.email.includes('@') && form.note.trim()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <Seo
        title="Start a project | Viverst Studio"
        description={`Tell ${BUSINESS.name} what you are building. Brand, design, print and 3D from Lagos, Nigeria.`}
        url={`${BUSINESS.site}/contact`}
        image={`${BUSINESS.site}/og-image.png`}
        siteName={BUSINESS.name}
      />
      <section className="page-head">
        <div className="shell">
          <p className="eyebrow">Contact</p>
          <h1>Tell us what you are building.</h1>
          <p className="page-lede">
            A short note is enough to start. We will tell you honestly whether we are the right
            studio for it before anyone talks about a quote.
          </p>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell prose-grid">
          <div>
            <h2>What you get back</h2>
            <p>
              A reply from a person, usually within two working days, with an honest read on scope
              and what it would take. If the job is not right for us, we will say so.
            </p>
            <a className="foot-contact is-light" href={`mailto:${BUSINESS.email}`}>
              <Icon name="mail" size={15} /> {BUSINESS.email}
            </a>
            <span className="foot-contact is-light">
              <Icon name="pin" size={15} /> {BUSINESS.city}, {BUSINESS.country}
            </span>
            <div className="btn-row">
              <Link className="btn btn-line btn-lg" to="/services"><span>What we do</span></Link>
            </div>
          </div>

          <form className="apply-form" onSubmit={(e) => e.preventDefault()}>
            <h2>Start a project</h2>
            <fieldset className="topics">
              <legend>What is it about?</legend>
              {CONTACT_TOPICS.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={topic === t ? 'topic is-on' : 'topic'}
                  aria-pressed={topic === t}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </fieldset>
            <label>
              <span>Your name</span>
              <input type="text" value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
            <label>
              <span>What are you building?</span>
              <textarea rows="4" value={form.note} onChange={set('note')} />
            </label>
            <button className="btn btn-accent btn-lg apply-submit" type="submit" disabled={!ready}>
              <span>Send</span>
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
