import { useState } from 'react'
import { Float, Icon, Tilt } from '@viverst/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Check, ArrowUpRight, Mail } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import Marquee from '../components/Marquee.jsx'
import BrandLink from '../components/BrandLink.jsx'
import {
  COMPANY, SUBSIDIARIES, ROLES, VALUES,
  CAREER_PLACES, CAREER_AREAS, CAREER_EXPERIENCE, CAREER_TYPES, CAREER_AVAILABILITY, CAREER_REASONS,
} from '../data/site.js'
import './Pages.css'

const EMPTY = {
  name: '', email: '', phone: '',
  place: CAREER_PLACES[0], area: CAREER_AREAS[0], craft: '',
  experience: CAREER_EXPERIENCE[0], type: CAREER_TYPES[0], availability: CAREER_AVAILABILITY[0],
  areaOther: '', link: '', why: '',
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={onChange}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

/* Careers for the whole group live here. The subsidiaries' sites send people
   to this page rather than running their own, so every opening — parent,
   Agro or Studio — is listed once, and every application lands in one inbox. */
export default function Careers() {
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isOther = form.area === 'Other'
  const area = isOther ? form.areaOther.trim() : form.area
  const valid = form.name.trim() && form.email.trim() && form.phone.trim() && form.craft.trim() && form.why.trim()
    && (!isOther || form.areaOther.trim())

  // No backend: this opens a pre-filled message to HR with every answer laid
  // out in order. Swap for a real endpoint when the admin backend exists.
  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const subject = encodeURIComponent(`Application — ${area} — ${form.name}`)
    const lines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Where: ${form.place}`,
      `Area of interest: ${area}`,
      `Current role / what I do: ${form.craft}`,
      `Experience: ${form.experience}`,
      `Looking for: ${form.type}`,
      `Available: ${form.availability}`,
      `CV or portfolio: ${form.link || '—'}`,
      '',
      'Why Viverst:',
      form.why,
    ]
    window.location.href = `mailto:${COMPANY.hrEmail}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`
    setSent(true)
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <>
      <Seo
        title="Careers | Viverst Global Limited"
        description="Build your career with Viverst Global Limited, Viverst Agro and Viverst Studio. Tell us your area of interest and experience, and we will be in touch when a role fits. Applications go to hr@viverst.com."
        path="/careers"
      />

      <header className="page-hero">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">Careers</p>
            <h1>Build your career with Viverst.</h1>
            <p className="lede">
              We are a growing group of businesses and are always interested in capable people.
              Tell us who you are, what you do, and where you would like to work. Submit your
              application below, and we&rsquo;ll get in touch when an opportunity that fits comes up.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container">
          <div className="grid grid--3">
            {CAREER_REASONS.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.07}>
                <Float delay={i * 0.8} duration={7.5 + i * 0.7} distance={-7}>
                  <Tilt className="card pillar sheen-host" style={{ '--sheen-delay': `${i * 1.4}s` }}>
                    <span className="icon-plate"><Icon name={r.icon} size={21} /></span>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                  </Tilt>
                </Float>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {ROLES.length > 0 && (
        <section className="section--tight">
          <div className="container">
            <Reveal>
              <p className="eyebrow">Open roles</p>
              <h2 className="page-title">Roles open across the group.</h2>
            </Reveal>
            <div className="roles">
              {ROLES.map((r, i) => (
                <Reveal key={r.slug} delay={i * 0.06}>
                  <article className="role-card">
                    <h2>{r.title}</h2>
                    <p className="role-terms">{r.company} &middot; {r.type} &middot; {r.place}</p>
                    <p>{r.summary}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section--tight">
        <div className="container careers-grid">
          <div>
            <Reveal>
              <p className="eyebrow">Apply</p>
              <h2 className="page-title">Tell us about yourself.</h2>
              <p className="careers-intro">
                Fill in the form and it opens a message to our HR team with your answers already
                written in. We read every application, and we reply when a role opens that matches
                what you have told us.
              </p>
            </Reveal>

            <Reveal delay={0.08} className="careers-side">
              <p className="careers-side-title">Where you could work</p>
              <Tilt as="div" className="contact-card contact-card--link" max={4}>
                <BrandLink to="/about" external={false} className="contact-card-a">
                  <span className="contact-label">Parent</span>
                  <span className="contact-value">{COMPANY.legalName}</span>
                </BrandLink>
              </Tilt>
              {SUBSIDIARIES.map((s) => (
                <Tilt key={s.key} as="div" className="contact-card contact-card--link" max={4}>
                  <BrandLink to={s.path} external={s.external} className="contact-card-a">
                    <span className="contact-label">{s.blurb}</span>
                    <span className="contact-value">
                      {s.name} <ArrowUpRight size={15} aria-hidden="true" />
                    </span>
                  </BrandLink>
                </Tilt>
              ))}
            </Reveal>
          </div>

          <Reveal delay={0.1} className="contact-formwrap">
            <form className="contact-form" onSubmit={submit} noValidate>
              <h2 className="apply-title">Join our team</h2>

              <div className="field-row">
                <label className="field">
                  <span>Full name</span>
                  <input type="text" value={form.name} onChange={set('name')}
                         placeholder="Ada Obi" autoComplete="name" required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={set('email')}
                         placeholder="you@email.com" autoComplete="email" required />
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>Phone</span>
                  <input type="tel" value={form.phone} onChange={set('phone')}
                         placeholder="+234 …" autoComplete="tel" required />
                </label>
                <Select label="Where would you like to work?" value={form.place} onChange={set('place')} options={CAREER_PLACES} />
              </div>

              <Select label="Area of interest" value={form.area} onChange={set('area')} options={CAREER_AREAS} />
              {isOther && (
                <label className="field">
                  <span>Your preferred role or area</span>
                  <input type="text" value={form.areaOther} onChange={set('areaOther')}
                         placeholder="Tell us the role or field you have in mind" required autoFocus />
                </label>
              )}

              <label className="field">
                <span>Current role, or what you do</span>
                <input type="text" value={form.craft} onChange={set('craft')}
                       placeholder="Agronomist, brand designer, accountant, operations lead…" required />
              </label>

              <div className="field-row">
                <Select label="Years of experience" value={form.experience} onChange={set('experience')} options={CAREER_EXPERIENCE} />
                <Select label="Looking for" value={form.type} onChange={set('type')} options={CAREER_TYPES} />
              </div>

              <div className="field-row">
                <Select label="When could you start?" value={form.availability} onChange={set('availability')} options={CAREER_AVAILABILITY} />
                <label className="field">
                  <span>Link to your CV or portfolio</span>
                  <input type="url" value={form.link} onChange={set('link')}
                         placeholder="https://" autoComplete="url" />
                </label>
              </div>

              <label className="field">
                <span>Why do you want to work with Viverst?</span>
                <textarea rows={5} value={form.why} onChange={set('why')}
                          placeholder="A few lines is enough. What you have done, and what you are looking for next." required />
              </label>

              <button className="btn btn--primary contact-submit" type="submit" disabled={!valid}>
                <AnimatePresence mode="wait" initial={false}>
                  {sent ? (
                    <motion.span key="sent" className="submit-inner"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}>
                      <Check size={17} aria-hidden="true" /> Opening your mail app
                    </motion.span>
                  ) : (
                    <motion.span key="send" className="submit-inner"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}>
                      Submit application <Send size={16} aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <p className="form-note">
                <Mail size={13} aria-hidden="true" /> Opens a pre-filled message to {COMPANY.hrEmail}. Attach your CV there if you have one.
              </p>
            </form>
          </Reveal>
        </div>
      </section>

      <section className="section--tight">
        <div className="container">
          <Reveal>
            <p className="eyebrow">What you would be joining</p>
            <h2 className="page-title page-title--center">Ten values. Every company. Same standard.</h2>
          </Reveal>
        </div>
        <Reveal delay={0.08}><Marquee items={VALUES} duration={46} /></Reveal>
      </section>
    </>
  )
}
