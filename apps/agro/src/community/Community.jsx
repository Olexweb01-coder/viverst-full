import { Fragment, useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowRight, BookOpen, Check, Cpu, DoorOpen, Factory, GraduationCap, Handshake,
  Landmark, Megaphone, Menu, MessageCircle, Scale, Sprout, Tractor, TrendingUp, Truck, Users, X,
} from 'lucide-react'
import { Reveal, Parallax, Magnetic, Seo, useReducedMotion, useInView } from '@viverst/ui'
import wordmark from '@brand-assets/agro/wordmark.webp'
import wordmarkLight from '@brand-assets/agro/wordmark-light.webp'
import { COMMUNITY, NAV, HERO, REEL, AUDIENCE, ABOUT, SECTORS, BENEFITS, ACTIVITIES, CTA, FORM } from './content.js'
import { COUNTRIES } from './countries.js'
import { COMMUNITY_SEO } from './seo.js'
import { EMPTY, FIELD_ORDER, validate, toPayload, sendRegistration } from './register.js'
import './Community.css'

const ICONS = { Sprout, Factory, Tractor, Scale, Cpu, Truck, GraduationCap, Landmark, Handshake, DoorOpen, BookOpen, Users, Megaphone, TrendingUp }
const SECTION_IDS = [...NAV.map((n) => n.id), 'join']

/* Words as separate spans with real spaces between them, so the heading still
   reads as a sentence to a screen reader and to a search engine. */
function Words({ words, marked = [] }) {
  const out = []
  let i = 0
  while (i < words.length) {
    const start = i
    const isMarked = marked.includes(words[i])
    const run = [words[i]]
    while (isMarked && marked.includes(words[i + 1])) { i += 1; run.push(words[i]) }
    const spans = run.map((w, k) => (
      <Fragment key={w}>
        {k > 0 && ' '}
        <span className="avc-word"><span style={{ '--i': start + k }}>{w}</span></span>
      </Fragment>
    ))
    out.push(
      <Fragment key={start}>
        {start > 0 && ' '}
        {isMarked ? <span className="avc-mark">{spans}</span> : spans}
      </Fragment>,
    )
    i += 1
  }
  return out
}

/* ── Menu ─────────────────────────────────────────────────── */

function Nav({ active, onDark }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 12)
  const close = () => setOpen(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onWide = () => { if (window.innerWidth > 1000) setOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onWide)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onWide)
    }
  }, [open])

  const light = onDark && !open
  return (
    <header className={`avc-nav${light ? ' avc-nav--light' : ''}${scrolled ? ' avc-nav--scrolled' : ''}${open ? ' avc-nav--open' : ''}`}>
      <div className="container avc-nav-inner">
        <a href="#top" className="avc-brand" onClick={close} aria-label={`${COMMUNITY.name}, by ${COMMUNITY.host}: back to the top`}>
          <img src={light ? wordmarkLight : wordmark} alt="" width="900" height="107" />
          <span className="avc-brand-tag">Community</span>
        </a>
        <nav className="avc-links" aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined}>{n.label}</a>
          ))}
        </nav>
        <a href="#join" className="btn btn--primary avc-nav-join" onClick={close}>Join Community</a>
        <button type="button" className="avc-burger" aria-expanded={open} aria-controls="avc-drawer"
                aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <nav id="avc-drawer" className="avc-drawer" aria-label="Sections">
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={close} style={{ '--i': i }}
               aria-current={active === n.id ? 'true' : undefined}>{n.label}</a>
          ))}
          <a href="#join" className="btn btn--primary" onClick={close} style={{ '--i': NAV.length }}>
            Join Community <ArrowRight size={16} aria-hidden="true" />
          </a>
        </nav>
      )}
    </header>
  )
}

/* ── Hero ─────────────────────────────────────────────────── */

function ReelColumn({ tiles, reverse }) {
  const set = (dup) => tiles.map((t) => (
    <figure key={`${dup ? 'b' : 'a'}-${t.label}`} className="avc-tile" aria-hidden={dup || undefined}>
      <img src={t.src} alt="" width="960" height="640" decoding="async" />
      <figcaption>{t.label}</figcaption>
    </figure>
  ))
  return (
    <div className={`avc-reel-col${reverse ? ' avc-reel-col--reverse' : ''}`}>
      <div className="avc-reel-track">{set(false)}{set(true)}</div>
    </div>
  )
}

function Hero() {
  return (
    <section className="avc-hero" id="top" aria-labelledby="avc-h1">
      <div className="avc-hero-grain" aria-hidden="true" />
      <div className="container avc-hero-inner">
        <div className="avc-hero-copy">
          <p className="avc-kicker"><span className="avc-kicker-dot" aria-hidden="true" />A {COMMUNITY.host} community</p>
          <h1 id="avc-h1"><Words words={HERO.headline} marked={HERO.marked} /></h1>
          <p className="avc-phrases">
            {HERO.phrases.map((p, i) => (
              <Fragment key={p}>{i > 0 && ' '}<span style={{ '--i': i }}>{p}</span></Fragment>
            ))}
          </p>
          <p className="avc-hero-text">{HERO.description}</p>
          <div className="avc-hero-cta">
            <Magnetic><a href="#join" className="btn btn--primary avc-caps">{HERO.primary} <ArrowRight size={17} aria-hidden="true" /></a></Magnetic>
            <a href="#about" className="btn avc-btn-line avc-caps">{HERO.secondary} <ArrowDown size={17} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="avc-reel" role="img" aria-label="Pictures from across the value chain: production, processing, packaging, trading, technology, distribution, inputs and research.">
          <ReelColumn tiles={REEL[0]} />
          <ReelColumn tiles={REEL[1]} reverse />
        </div>
      </div>
      <div className="avc-ticker" aria-hidden="true">
        <div className="avc-ticker-track">
          {[0, 1].map((k) => (
            <div className="avc-ticker-row" key={k}>
              {AUDIENCE.map((a) => <span key={a}>{a}</span>)}
            </div>
          ))}
        </div>
      </div>
      <p className="visually-hidden">This community is for: {AUDIENCE.join(', ')}.</p>
    </section>
  )
}

/* ── About ────────────────────────────────────────────────── */

/* Each word darkens as the paragraph is scrolled through. Only a CSS variable
   is written per frame; with motion reduced, or before the script runs, the
   variable keeps its default and the text is fully dark. */
function ScrollFill({ text }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const words = text.split(' ')

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return undefined
    let ticking = false
    const update = () => {
      ticking = false
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const p = (vh * 0.86 - r.top) / (vh * 0.46 + r.height)
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3))
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      el.style.removeProperty('--p')
    }
  }, [reduced])

  return (
    <p ref={ref} className="avc-fill" style={{ '--n': words.length }}>
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>{i > 0 && ' '}<span style={{ '--i': i }}>{w}</span></Fragment>
      ))}
    </p>
  )
}

function About() {
  return (
    <section className="section section--alt avc-about" id="about" aria-labelledby="avc-about-h">
      <div className="container avc-about-grid">
        <Reveal className="avc-about-head">
          <span className="eyebrow">About the community</span>
          <h2 id="avc-about-h">
            {ABOUT.heading.map((l, i) => <Fragment key={l}>{i > 0 && ' '}<span className="avc-line">{l}</span></Fragment>)}
          </h2>
        </Reveal>
        <div className="avc-about-body">
          <ScrollFill text={ABOUT.lead} />
          {ABOUT.body.map((p, i) => <Reveal as="p" key={p} delay={i * 0.08} className="avc-about-p">{p}</Reveal>)}
        </div>
      </div>
      <div className="container">
        <Reveal>
          <ol className="avc-chain" aria-label="The value chain, from production to consumption">
            {ABOUT.chain.map((c, i) => <li key={c} style={{ '--i': i }}><span className="avc-chain-node" aria-hidden="true" />{c}</li>)}
            <li className="avc-chain-runner" aria-hidden="true" />
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Who it is for ────────────────────────────────────────── */

function Sectors() {
  const items = SECTORS.items
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const reduced = useReducedMotion()
  const [ref, inView] = useInView({ margin: '-20% 0px', once: false })
  const running = inView && !reduced
  const next = () => setActive((a) => (a + 1) % items.length)

  return (
    <section className="section avc-who" id="who" aria-labelledby="avc-who-h">
      <div className="container">
        <Reveal className="avc-head">
          <span className="eyebrow">Who this community is for</span>
          <h2 id="avc-who-h">{SECTORS.heading}</h2>
        </Reveal>
        <div className="avc-who-grid" ref={ref}>
          <ul className="avc-sectors" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
            {items.map((s, i) => {
              const Icon = ICONS[s.icon]
              const on = i === active
              return (
                <li key={s.name} className={`avc-sector${on ? ' is-on' : ''}`}
                    onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}>
                  <span className="avc-sector-icon" aria-hidden="true"><Icon size={22} /></span>
                  <img className="avc-sector-thumb" src={s.src} alt="" width="960" height="640" loading="lazy" decoding="async" />
                  <div className="avc-sector-text">
                    <h3>{s.name}</h3>
                    <p>{s.text}</p>
                  </div>
                  {on && running && (
                    <span key={active} className={`avc-sector-bar${held ? ' is-held' : ''}`} aria-hidden="true" onAnimationEnd={next} />
                  )}
                </li>
              )
            })}
          </ul>
          <div className="avc-stage" aria-hidden="true">
            {items.map((s, i) => (
              <figure key={s.name} className={i === active ? 'is-on' : ''}>
                <img src={s.src} alt="" width="960" height="640" loading="lazy" decoding="async" />
                <figcaption>{s.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Why join ─────────────────────────────────────────────── */

function Benefits() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const spot = (e) => {
    if (reduced || !ref.current || e.pointerType === 'touch') return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`)
    ref.current.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`)
  }
  return (
    <section className="section avc-benefits" id="benefits" aria-labelledby="avc-benefits-h">
      <div className="container">
        <Reveal className="avc-head">
          <span className="eyebrow">Why join the community</span>
          <h2 id="avc-benefits-h">
            {BENEFITS.heading.map((l, i) => <Fragment key={l}>{i > 0 && ' '}<span className="avc-line">{l}</span></Fragment>)}
          </h2>
        </Reveal>
        <ul className="avc-benefit-grid" ref={ref} onPointerMove={spot}>
          {BENEFITS.items.map((b, i) => {
            const Icon = ICONS[b.icon]
            return (
              <Reveal as="li" key={b.name} delay={(i % 3) * 0.08} className="avc-benefit">
                <span className="avc-benefit-icon" aria-hidden="true" style={{ '--i': i }}><Icon size={26} strokeWidth={1.6} /></span>
                <h3>{b.name}</h3>
                <p>{b.text}</p>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ── What happens inside ──────────────────────────────────── */

function Activities() {
  const row = (k) => (
    <div className="avc-band-row" key={k}>
      {[0, 1].flatMap((r) => ACTIVITIES.words.map((w, i) => (
        <span key={`${r}-${w}`} className={i % 2 ? 'is-line' : ''}>{w}</span>
      )))}
    </div>
  )
  return (
    <section className="section section--alt avc-activities" id="activities" aria-labelledby="avc-activities-h">
      <div className="avc-band" aria-hidden="true"><div className="avc-band-track">{row(0)}{row(1)}</div></div>
      <div className="container avc-activities-grid">
        <div>
          <Reveal className="avc-head">
            <span className="eyebrow">What happens within the community</span>
            <h2 id="avc-activities-h">{ACTIVITIES.words.join(' ')}</h2>
          </Reveal>
          <ul className="avc-acts">
            {ACTIVITIES.items.map((a, i) => (
              <Reveal as="li" key={a} delay={i * 0.05} x={-14} y={0}>
                <span className="avc-act-tick" aria-hidden="true"><Check size={15} strokeWidth={3} /></span>{a}
              </Reveal>
            ))}
          </ul>
        </div>
        <div className="avc-collage">
          {ACTIVITIES.photos.map((p, i) => (
            <Parallax key={p.src} distance={[26, -34, 46][i]} className={`avc-shot avc-shot--${i + 1}`}>
              <img src={p.src} alt={p.alt} width="960" height="640" loading="lazy" decoding="async" />
            </Parallax>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Call to action ───────────────────────────────────────── */

function CtaBand() {
  return (
    <section className="avc-cta" aria-labelledby="avc-cta-h">
      <div className="avc-rings" aria-hidden="true"><span /><span /><span /></div>
      <div className="container avc-cta-inner">
        <Reveal>
          <h2 id="avc-cta-h">{CTA.heading}</h2>
          <p>{CTA.text}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <Magnetic><a href="#join" className="btn avc-btn-deep avc-caps">{CTA.button} <ArrowDown size={17} aria-hidden="true" /></a></Magnetic>
        </Reveal>
      </div>
    </section>
  )
}

/* ── Registration ─────────────────────────────────────────── */

function Field({ id, label, optional, error, hint, wide, children }) {
  return (
    <div className={`avc-field${wide ? ' avc-field--wide' : ''}${error ? ' has-error' : ''}`}>
      <label id={`${id}-label`} htmlFor={id}>
        {label}{optional ? <span className="avc-optional"> (optional)</span> : <span className="avc-req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="avc-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="avc-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

function Join() {
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')   // idle | sending | done | failed
  const [duplicate, setDuplicate] = useState(false)
  const [failure, setFailure] = useState('')
  const doneRef = useRef(null)

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setF((o) => ({ ...o, [k]: v }))
    if (errors[k]) setErrors((o) => { const n = { ...o }; delete n[k]; return n })
  }
  const toggle = (name) => {
    setF((o) => ({ ...o, interests: o.interests.includes(name) ? o.interests.filter((x) => x !== name) : [...o.interests, name] }))
    if (errors.interests) setErrors((o) => { const n = { ...o }; delete n.interests; return n })
  }
  const attrs = (k, hint) => ({
    id: `avc-${k}`, name: k, 'aria-labelledby': `avc-${k}-label`, 'aria-invalid': errors[k] ? 'true' : undefined,
    'aria-describedby': errors[k] ? `avc-${k}-error` : hint ? `avc-${k}-hint` : undefined,
  })

  useEffect(() => { if (status === 'done') doneRef.current?.focus() }, [status])

  async function submit(e) {
    e.preventDefault()
    if (status === 'sending') return
    const found = validate(f)
    setErrors(found)
    const first = FIELD_ORDER.find((k) => found[k])
    if (first) {
      const el = document.getElementById(first === 'interests' ? 'avc-interest-0' : `avc-${first}`)
      el?.focus()
      if (status === 'failed') setStatus('idle')
      return
    }
    setStatus('sending'); setFailure('')
    try {
      // a filled hidden field means a script, not a person: accept it and send nothing
      const res = f.website ? { ok: true, duplicate: false } : await sendRegistration(toPayload(f))
      setDuplicate(res.duplicate)
      setStatus('done')
    } catch (err) {
      setFailure(err.message)
      setStatus('failed')
    }
  }

  const count = Object.keys(errors).length
  return (
    <section className="section avc-join" id="join" aria-labelledby="avc-join-h">
      <div className="container avc-join-grid">
        <Reveal className="avc-join-intro">
          <span className="eyebrow">Register</span>
          <h2 id="avc-join-h">{FORM.heading}</h2>
          <p className="lede">{FORM.text}</p>
          <p className="avc-join-note"><span className="avc-req" aria-hidden="true">*</span> marks a field we need.</p>
        </Reveal>

        {status === 'done' ? (
          <div className="avc-done" ref={doneRef} tabIndex={-1} role="status">
            <svg className="avc-done-mark" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" /><path d="M19 33.5l9 9 17-19" />
            </svg>
            <h3>{FORM.successTitle}</h3>
            <p>{duplicate ? FORM.duplicateText : FORM.successText}</p>
            {COMMUNITY.whatsappUrl && (
              <div className="avc-done-next">
                <p>{FORM.whatsappText}</p>
                <a className="btn btn--primary" href={COMMUNITY.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} aria-hidden="true" /> {FORM.whatsappButton}
                  <span className="visually-hidden"> (opens WhatsApp)</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <form className="avc-form" onSubmit={submit} noValidate>
            <Field id="avc-name" label="Full Name" error={errors.name}>
              <input className="avc-input" type="text" autoComplete="name" value={f.name} onChange={set('name')} {...attrs('name')} />
            </Field>
            <Field id="avc-email" label="Email Address" error={errors.email}>
              <input className="avc-input" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set('email')} {...attrs('email')} />
            </Field>
            <Field id="avc-phone" label="Phone Number / WhatsApp Number" error={errors.phone} hint="Add your country code if you are outside Nigeria.">
              <input className="avc-input" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set('phone')} {...attrs('phone', true)} />
            </Field>
            <Field id="avc-country" label="Country" error={errors.country}>
              <select className="avc-input avc-select" autoComplete="country-name" value={f.country} onChange={set('country')} {...attrs('country')}>
                <option value="">Choose your country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="avc-location" label="State / Location" error={errors.location}>
              <input className="avc-input" type="text" autoComplete="address-level1" value={f.location} onChange={set('location')} {...attrs('location')} />
            </Field>
            <Field id="avc-organisation" label="Business / Organisation Name" optional>
              <input className="avc-input" type="text" autoComplete="organization" value={f.organisation} onChange={set('organisation')} {...attrs('organisation')} />
            </Field>
            <Field id="avc-role" label="What Best Describes You?" error={errors.role} wide>
              <select className="avc-input avc-select" value={f.role} onChange={set('role')} {...attrs('role')}>
                <option value="">Choose one</option>
                {FORM.roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <fieldset className={`avc-field avc-field--wide avc-chips${errors.interests ? ' has-error' : ''}`}
                      aria-describedby={errors.interests ? 'avc-interests-error' : 'avc-interests-hint'}>
              <legend>Which Areas of Agriculture Are You Interested In?<span className="avc-req" aria-hidden="true"> *</span></legend>
              <p className="avc-hint" id="avc-interests-hint">Choose as many as you like.</p>
              <div className="avc-chip-row">
                {FORM.interests.map((name, i) => (
                  <label key={name} className="avc-chip">
                    <input type="checkbox" id={`avc-interest-${i}`} name="interests" value={name}
                           checked={f.interests.includes(name)} onChange={() => toggle(name)} />
                    <span><Check size={14} strokeWidth={3} aria-hidden="true" />{name}</span>
                  </label>
                ))}
              </div>
              {errors.interests && <p className="avc-error" id="avc-interests-error">{errors.interests}</p>}
            </fieldset>

            <Field id="avc-goal" label="What Do You Hope to Gain from This Community?" optional wide>
              <textarea className="avc-input avc-textarea" rows="4" value={f.goal} onChange={set('goal')} {...attrs('goal')} />
            </Field>
            <Field id="avc-source" label="How Did You Hear About Us?" optional wide>
              <select className="avc-input avc-select" value={f.source} onChange={set('source')} {...attrs('source')}>
                <option value="">Choose one</option>
                {FORM.sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            {/* off-screen for people, tempting for scripts */}
            <div className="avc-trap" aria-hidden="true">
              <label id="avc-website-label" htmlFor="avc-website">Leave this field empty</label>
              <input id="avc-website" aria-labelledby="avc-website-label" name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
            </div>

            <div className={`avc-field avc-field--wide avc-consent${errors.consent ? ' has-error' : ''}`}>
              <label id="avc-consent-label" htmlFor="avc-consent">
                <input type="checkbox" checked={f.consent} onChange={set('consent')} {...attrs('consent')} />
                <span className="avc-box" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                <span>{FORM.consent}<span className="avc-req" aria-hidden="true"> *</span></span>
              </label>
              {errors.consent && <p className="avc-error" id="avc-consent-error">{errors.consent}</p>}
              <p className="avc-hint">
                We use your details to manage your membership and send you community updates.{' '}
                {COMMUNITY.privacyUrl
                  ? <a href={COMMUNITY.privacyUrl} target="_blank" rel="noopener noreferrer">Read the Privacy Policy</a>
                  : <span className="avc-privacy-pending">Privacy Policy</span>}.
              </p>
            </div>

            <div className="avc-field avc-field--wide avc-submit">
              <p className="avc-form-status" role="alert">
                {count > 0 && `Please check ${count === 1 ? 'the field' : `the ${count} fields`} marked above.`}
                {status === 'failed' && failure}
              </p>
              <button type="submit" className="btn btn--primary avc-caps" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending' : FORM.submit}
                {status === 'sending' ? <span className="avc-spinner" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────── */

function Foot() {
  return (
    <footer className="avc-foot">
      <div className="container avc-foot-inner">
        <div>
          <img src={wordmarkLight} alt={COMMUNITY.host} width="900" height="107" loading="lazy" decoding="async" />
          <p>{COMMUNITY.name} is run by {COMMUNITY.host}, part of {COMMUNITY.group}.</p>
        </div>
        <nav aria-label="Footer">
          {NAV.slice(1).map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
          <a href="#join">Join Community</a>
          {COMMUNITY.privacyUrl && <a href={COMMUNITY.privacyUrl}>Privacy Policy</a>}
        </nav>
        <div className="avc-foot-contact">
          <a href={COMMUNITY.hostUrl}>agro.viverst.com</a>
          <a href={`mailto:${COMMUNITY.email}`}>{COMMUNITY.email}</a>
        </div>
        <p className="avc-foot-small">© {new Date().getFullYear()} {COMMUNITY.group}. Lagos, Nigeria.</p>
      </div>
    </footer>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function Community() {
  const [active, setActive] = useState('top')
  const [pastHero, setPastHero] = useState(false)
  const [atForm, setAtForm] = useState(false)
  const [atCta, setAtCta] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const spy = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) setActive(en.target.id)
    }, { rootMargin: '-45% 0px -50% 0px' })
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    els.forEach((el) => spy.observe(el))

    const hero = document.getElementById('top')
    const form = document.getElementById('join')
    const cta = document.querySelector('.avc-cta')
    const edge = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.target === hero) setPastHero(!en.isIntersecting)
        if (en.target === form) setAtForm(en.isIntersecting)
        if (en.target === cta) setAtCta(en.isIntersecting)
      }
    }, { rootMargin: '-80px 0px 0px 0px' })
    if (hero) edge.observe(hero)
    if (form) edge.observe(form)
    if (cta) edge.observe(cta)
    return () => { spy.disconnect(); edge.disconnect() }
  }, [])

  // the button that follows the reader steps aside wherever the page already offers the same action
  const floating = pastHero && !atForm && !atCta
  return (
    <div className="avc">
      <Seo
        title={COMMUNITY_SEO.title}
        description={COMMUNITY_SEO.description}
        url={COMMUNITY_SEO.url}
        image={COMMUNITY_SEO.image}
        siteName={COMMUNITY.host}
        jsonLd={COMMUNITY_SEO.jsonLd}
      />
      <Nav active={active} onDark={!pastHero} />
      <Hero />
      <About />
      <Sectors />
      <Benefits />
      <Activities />
      <CtaBand />
      <Join />
      <Foot />
      <a href="#join" className={`btn btn--primary avc-float${floating ? ' is-shown' : ''}`}
         tabIndex={floating ? undefined : -1} aria-hidden={floating ? undefined : 'true'}>
        Join Community <ArrowRight size={16} aria-hidden="true" />
      </a>
    </div>
  )
}
