import { useState } from 'react'
import { Mail, MapPin, Send, Check, ArrowUpRight } from 'lucide-react'
import { Seo, Reveal, Float, Tilt, Icon } from '@viverst/ui'
import { BUSINESS, CHAIN } from '../data/agro.js'
import './Pages.css'

const TOPICS = ['Buying or supplying', 'Processing and packaging', 'Technology', 'Partnership', 'Something else']

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' })
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.email.trim() && form.message.trim()

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const subject = encodeURIComponent(`${form.topic} — ${form.name}`)
    const body = encodeURIComponent(`${form.message}\n\n—\n${form.name}\n${form.email}\nTopic: ${form.topic}`)
    window.location.href = `mailto:${BUSINESS.email}?subject=${subject}&body=${body}`
    setSent(true)
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <>
      <Seo
        title="Contact | Viverst Agro"
        description="Talk to Viverst Agro about buying or supplying, processing and packaging, agricultural technology or partnership. Lagos, Nigeria."
        url={BUSINESS.site + '/contact'}
        siteName={BUSINESS.name}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          about: { '@type': 'Organization', name: BUSINESS.name, url: BUSINESS.site, email: BUSINESS.email },
        }}
      />

      <header className="page-hero page-hero--short">
        <span className="field-glow field-glow--a drift" aria-hidden="true" />
        <div className="container page-hero-inner">
          <Reveal as="p" className="eyebrow">Contact</Reveal>
          <Reveal as="h1" delay={0.05}>Tell us where you are losing money.</Reveal>
          <Reveal as="p" className="lede" delay={0.1}>That is usually the whole conversation.</Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container contact-grid">
          <Reveal className="contact-side">
            <Float distance={-6} duration={7.5}>
              <Tilt max={4}>
                <a className="contact-card" href={`mailto:${BUSINESS.email}`}>
                  <span className="icon-plate"><Mail size={18} aria-hidden="true" /></span>
                  <span className="contact-label">Email</span>
                  <span className="contact-value">{BUSINESS.email}</span>
                </a>
              </Tilt>
            </Float>

            <Float delay={0.8} distance={-6} duration={8.5}>
              <div className="contact-card contact-card--static">
                <span className="icon-plate"><MapPin size={18} aria-hidden="true" /></span>
                <span className="contact-label">Where we are</span>
                <span className="contact-value">{BUSINESS.city}, {BUSINESS.country}</span>
              </div>
            </Float>

            <div className="contact-chain">
              <p className="contact-chain-title">We work across</p>
              <ul>
                {CHAIN.map((s, i) => (
                  <li key={s.key} style={{ '--j': i }}>
                    <Icon name={s.icon} size={15} /> {s.stage}
                  </li>
                ))}
              </ul>
            </div>

            <a className="contact-parent" href={BUSINESS.parentUrl}>
              {BUSINESS.parent} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            <form className="apply-form" onSubmit={submit} noValidate>
              <div className="field-row">
                <label className="field">
                  <span>Your name</span>
                  <input type="text" value={form.name} onChange={set('name')}
                         placeholder="Ada Obi" autoComplete="name" required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={set('email')}
                         placeholder="you@company.com" autoComplete="email" required />
                </label>
              </div>

              <div className="field">
                <span>What is this about?</span>
                <div className="topics" role="radiogroup" aria-label="Topic">
                  {TOPICS.map((t) => (
                    <button type="button" key={t} role="radio" aria-checked={form.topic === t}
                            className={`topic ${form.topic === t ? 'is-on' : ''}`}
                            onClick={() => setForm((f) => ({ ...f, topic: t }))}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Message</span>
                <textarea rows={5} value={form.message} onChange={set('message')}
                          placeholder="What are you working on?" required />
              </label>

              <button className="btn btn--primary apply-submit" type="submit" disabled={!valid}>
                {sent
                  ? <><Check size={17} aria-hidden="true" /> Opening your mail app</>
                  : <>Send message <Send size={16} aria-hidden="true" /></>}
              </button>
              <p className="form-note">Opens a pre-filled message in your email app.</p>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  )
}
