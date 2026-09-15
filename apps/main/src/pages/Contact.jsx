import { useState } from 'react'
import { Float, Tilt } from '@viverst/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MapPin, Send, Check } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import Reveal from '../components/Reveal.jsx'
import WaveField from '../components/WaveField.jsx'
import { COMPANY, SUBSIDIARIES } from '../data/site.js'
import './Pages.css'

const TOPICS = ['Partnership', 'Investment', 'Viverst Agro', 'Viverst Studio', 'Something else']

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' })
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.email.trim() && form.message.trim()

  // No backend here: this composes a pre-filled email in the visitor's mail
  // client. Swap for a real endpoint (Formspree, Resend, etc.) when you have one.
  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const subject = encodeURIComponent(`${form.topic} — enquiry from ${form.name}`)
    const body = encodeURIComponent(
      `${form.message}\n\n—\n${form.name}\n${form.email}\nTopic: ${form.topic}`,
    )
    window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`
    setSent(true)
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <>
      <Seo
        title="Contact | Viverst Global Limited"
        description="Reach Viverst Global Limited about partnership, investment, Viverst Agro or Viverst Studio."
        path="/contact"
      />

      <header className="page-hero page-hero--short">
        <WaveField opacity={0.7} />
        <div className="container page-hero-inner">
          <Reveal>
            <p className="eyebrow">Contact</p>
            <h1>The gap you&rsquo;re facing might be one we understand.</h1>
            <p className="lede">Partnership, investment, or a question. A person will answer.</p>
          </Reveal>
        </div>
      </header>

      <section className="section--tight">
        <div className="container contact-grid">
          <Reveal className="contact-side">
            <Tilt as="div" className="contact-card contact-card--link" max={5}>
            <a className="contact-card-a" href={`mailto:${COMPANY.email}`}>
              <span className="contact-icon"><Mail size={18} aria-hidden="true" /></span>
              <span className="contact-label">Email</span>
              <span className="contact-value">{COMPANY.email}</span>
            </a>
            </Tilt>

            <div className="contact-card contact-card--static">
              <span className="contact-icon"><MapPin size={18} aria-hidden="true" /></span>
              <span className="contact-label">Head office</span>
              <span className="contact-value">{COMPANY.city}, {COMPANY.country}</span>
            </div>

            <div className="contact-brands">
              {SUBSIDIARIES.map((s) => (
                <Float key={s.key} delay={0.6} duration={7.5} distance={-6}>
                <div className="contact-brand"
                     style={{ '--c-deep': s.theme.deep, '--c-bright': s.theme.bright, '--c-font': s.theme.font }}>
                  <span className="contact-brand-dot breathe" aria-hidden="true" />
                  <div>
                    <strong>{s.name}</strong>
                    <span>{s.blurb}</span>
                  </div>
                </div>
                </Float>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="contact-formwrap">
            <form className="contact-form" onSubmit={submit} noValidate>
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
                      {form.topic === t && (
                        <motion.span layoutId="topic-pill" className="topic-pill"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                      )}
                      <span className="topic-text">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Message</span>
                <textarea rows={5} value={form.message} onChange={set('message')}
                          placeholder="Tell us what you're working on." required />
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
                      Send message <Send size={16} aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <p className="form-note">Opens a pre-filled message in your email app.</p>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  )
}
