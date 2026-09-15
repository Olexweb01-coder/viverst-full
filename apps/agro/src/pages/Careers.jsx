import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Send, Check } from 'lucide-react'
import { Seo, Reveal, Float, Icon } from '@viverst/ui'
import { BUSINESS, ROLES, VALUE_PILLARS } from '../data/agro.js'
import './Pages.css'

const AREAS = ['Farming and production', 'Processing and packaging', 'Technology', 'Sales and supply', 'Operations']

export default function Careers() {
  const [form, setForm] = useState({ name: '', email: '', area: AREAS[0], note: '' })
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.email.trim()

  // No backend: this opens a pre-filled message. Swap for a real endpoint later.
  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const subject = encodeURIComponent(`Open application — ${form.area} — ${form.name}`)
    const body = encodeURIComponent(`${form.note}\n\n—\n${form.name}\n${form.email}\nArea: ${form.area}`)
    window.location.href = `mailto:${BUSINESS.email}?subject=${subject}&body=${body}`
    setSent(true)
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <>
      <Seo
        title="Careers | Viverst Agro"
        description="No open roles at Viverst Agro right now. We still read every application — farming, processing, technology, sales and operations."
        url={BUSINESS.site + '/careers'}
        siteName={BUSINESS.name}
      />

      <header className="page-hero">
        <span className="field-glow field-glow--a drift" aria-hidden="true" />
        <div className="container page-hero-inner">
          <Reveal as="p" className="eyebrow">Careers</Reveal>
          <Reveal as="h1" delay={0.05}>Work where it actually counts.</Reveal>
          <Reveal as="p" className="lede" delay={0.1}>
Farming rewards people who can see a problem on the ground and build the thing that fixes it.
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          {ROLES.length === 0 ? (
            /* An honest empty state beats a page of invented openings. */
            <Reveal>
              <Float distance={-7} duration={8.5}>
                <div className="empty-roles">
                  <span className="empty-hex" aria-hidden="true"><Icon name="briefcase" size={26} /></span>
                  <h2>No open roles right now.</h2>
                  <p>
When a role opens, it will be listed here with what the job actually involves. Until then, the form below reaches a real person.
                  </p>
                </div>
              </Float>
            </Reveal>
          ) : (
            <div className="grid grid--2">
              {ROLES.map((r) => (
                <Reveal key={r.title}><div className="card"><h2>{r.title}</h2><p>{r.body}</p></div></Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section--alt">
        <span className="hex-field" aria-hidden="true" />
        <div className="container careers-grid" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <p className="eyebrow">How we work</p>
            <h2 className="page-title">What you would be joining.</h2>
            <ul className="trait-list">
              {VALUE_PILLARS.map((p, i) => (
                <li key={p.title} style={{ '--j': i }}>
                  <Icon name={p.icon} size={16} />
                  <span><strong>{p.title}.</strong> {p.body}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <form className="apply-form" onSubmit={submit} noValidate>
              <h2 className="apply-title">Open application</h2>

              <label className="field">
                <span>Your name</span>
                <input type="text" value={form.name} onChange={set('name')}
                       placeholder="Ada Obi" autoComplete="name" required />
              </label>

              <label className="field">
                <span>Email</span>
                <input type="email" value={form.email} onChange={set('email')}
                       placeholder="you@email.com" autoComplete="email" required />
              </label>

              <label className="field">
                <span>Area</span>
                <select value={form.area} onChange={set('area')}>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>

              <label className="field">
                <span>What you would bring</span>
                <textarea rows={4} value={form.note} onChange={set('note')}
                          placeholder="Briefly — what you have done and where you would fit." />
              </label>

              <button className="btn btn--primary apply-submit" type="submit" disabled={!valid}>
                {sent
                  ? <><Check size={17} aria-hidden="true" /> Opening your mail app</>
                  : <>Send application <Send size={16} aria-hidden="true" /></>}
              </button>
              <p className="form-note">Opens a pre-filled message in your email app.</p>
            </form>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <div className="center-cta">
              <Link className="btn" to="/solutions">
                See what we do <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
