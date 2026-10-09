import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Loader2, MessageCircle, AlertCircle, X, ChevronDown, CheckCircle2 } from 'lucide-react'

import {
  validateRegistration, submitRegistration, normalizePhone, detectPhoneCountry,
  phoneCountry, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY,
} from '../lib/register.js'
import './RegisterForm.css'

const EMPTY = { name: '', phone: '', phoneCountry: DEFAULT_PHONE_COUNTRY, email: '', country: '', website: '' }

/* Most registrants are in Nigeria or its diaspora, so these sit at the top
   of the code picker. The full list follows. */
const COMMON = ['NG', 'GH', 'GB', 'US', 'CA', 'ZA', 'KE', 'AE']
const commonCountries = COMMON.map(phoneCountry)

/**
 * On-page registration for any event that has `registration.whatsappUrl`.
 * Name, phone and email are required; country is optional. On success a
 * dialog confirms the registration and sends the person to the WhatsApp
 * group, which is where the joining link and updates are shared.
 */
export default function RegisterForm({ event }) {
  const uid = useId()
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [tried, setTried] = useState(false)
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState(null) // { duplicate, email }
  const [dialogOpen, setDialogOpen] = useState(false)
  const sending = useRef(false)

  const errors = validateRegistration(form)
  const show = (k) => (tried || touched[k]) && errors[k]
  const whatsappUrl = event.registration.whatsappUrl

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (serverError) setServerError('')
  }
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  // Typing +44… or 0044… switches the code picker to that country.
  const setPhone = (e) => {
    const value = e.target.value
    setForm((f) => {
      const detected = detectPhoneCountry(value, f.phoneCountry)
      return { ...f, phone: value, phoneCountry: detected || f.phoneCountry }
    })
    if (serverError) setServerError('')
  }
  const phoneNow = normalizePhone(form.phone, form.phoneCountry)
  const cc = phoneCountry(form.phoneCountry)

  async function submit(e) {
    e.preventDefault()
    setTried(true)
    if (sending.current) return // a second tap while the first is in flight
    if (Object.keys(errors).length) {
      const first = ['name', 'phone', 'email'].find((k) => errors[k])
      document.getElementById(`${uid}-${first}`)?.focus()
      return
    }
    sending.current = true
    setStatus('sending')
    setServerError('')
    try {
      const res = await submitRegistration(event, form)
      setResult({ duplicate: res.duplicate, email: form.email.trim() })
      setStatus('done')
      setDialogOpen(true)
    } catch (err) {
      setServerError(err.message)
      setStatus('idle')
    } finally {
      sending.current = false
    }
  }

  const field = (k, label, props = {}, optional = false) => (
    <div className="reg-field">
      <label>
        <span className="reg-label">
          {label}{' '}
          {optional
            ? <span className="reg-optional">(optional)</span>
            : <span className="reg-required" aria-hidden="true">*</span>}
        </span>
        <input
          id={`${uid}-${k}`}
          name={k}
          value={form[k]}
          onChange={set(k)}
          onBlur={blur(k)}
          required={!optional}
          aria-required={!optional}
          aria-invalid={show(k) ? 'true' : undefined}
          aria-describedby={show(k) ? `${uid}-${k}-err` : undefined}
          disabled={status === 'sending'}
          {...props}
        />
      </label>
      {show(k) && <p className="reg-error" id={`${uid}-${k}-err`}>{errors[k]}</p>}
    </div>
  )

  return (
    <div className="reg" id="register">
      <div className="reg-intro">
        <p className="reg-eyebrow">Registration</p>
        <h2>{status === 'done' ? 'You\u2019re registered.' : 'Save your place.'}</h2>
        <p>
          {status === 'done'
            ? 'One step left: join the WhatsApp group. The joining link and every update for this event are shared there.'
            : 'Fill in your details below. After you register, you\u2019ll be asked to join the WhatsApp group, where the joining link and updates are shared.'}
        </p>
      </div>

      {status === 'done' ? (
        <div className="reg-done">
          <WhatsAppStep url={whatsappUrl} />
        </div>
      ) : (
        <form className="reg-form" onSubmit={submit} noValidate>
          <div className="reg-row">
            {field('name', 'Full name', { type: 'text', autoComplete: 'name', placeholder: 'e.g. Amaka Okafor' })}
            <div className="reg-field">
              <span className="reg-label" id={`${uid}-phone-label`}>
                Phone number <span className="reg-required" aria-hidden="true">*</span>
              </span>
              <div className={`reg-phone ${show('phone') ? 'is-invalid' : ''}`}>
                <div className="reg-cc">
                  <span className="reg-cc-face" aria-hidden="true">
                    {cc.iso} +{cc.dial} <ChevronDown size={14} />
                  </span>
                  <select
                    aria-label="Phone country code"
                    value={form.phoneCountry}
                    onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, phoneCountry: v })) }}
                    disabled={status === 'sending'}
                  >
                    <optgroup label="Common">
                      {commonCountries.map((c) => (
                        <option key={`c-${c.iso}`} value={c.iso}>{c.name} (+{c.dial})</option>
                      ))}
                    </optgroup>
                    <optgroup label="All countries">
                      {PHONE_COUNTRIES.map((c) => (
                        <option key={c.iso} value={c.iso}>{c.name} (+{c.dial})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <input
                  id={`${uid}-phone`}
                  name="phone"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  placeholder={cc.iso === 'NG' ? 'e.g. 0803 123 4567' : 'Phone number'}
                  value={form.phone}
                  onChange={setPhone}
                  onBlur={blur('phone')}
                  required
                  aria-required="true"
                  aria-labelledby={`${uid}-phone-label`}
                  aria-invalid={show('phone') ? 'true' : undefined}
                  aria-describedby={show('phone') ? `${uid}-phone-err` : phoneNow.ok ? `${uid}-phone-ok` : undefined}
                  disabled={status === 'sending'}
                />
              </div>
              {show('phone')
                ? <p className="reg-error" id={`${uid}-phone-err`}>{errors.phone}</p>
                : phoneNow.ok && (
                  <p className="reg-phone-ok" id={`${uid}-phone-ok`}>
                    <CheckCircle2 size={13} aria-hidden="true" /> Saved as {phoneNow.pretty}
                  </p>
                )}
            </div>
          </div>
          <div className="reg-row">
            {field('email', 'Email address', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'you@example.com' })}
            {field('country', 'Country', { type: 'text', autoComplete: 'country-name', placeholder: 'e.g. Nigeria' }, true)}
          </div>

          {/* Spam trap: hidden from people and screen readers, filled by bots. */}
          <div className="reg-trap" aria-hidden="true">
            <label>Leave this empty
              <input name="website" type="text" tabIndex={-1}
                     autoComplete="off" value={form.website} onChange={set('website')} />
            </label>
          </div>

          {serverError && (
            <p className="reg-server-error" role="alert">
              <AlertCircle size={16} aria-hidden="true" /> {serverError}
            </p>
          )}

          <button className="btn reg-submit" type="submit" disabled={status === 'sending'}>
            {status === 'sending'
              ? <><Loader2 className="reg-spin" size={17} aria-hidden="true" /> Registering&hellip;</>
              : <>Register <ArrowUpRight size={16} aria-hidden="true" /></>}
          </button>
          <p className="reg-note"><span aria-hidden="true">*</span> Required. We only use your details for this event.</p>
        </form>
      )}

      {dialogOpen && result && (
        <SuccessDialog
          event={event}
          duplicate={result.duplicate}
          email={result.email}
          url={whatsappUrl}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  )
}

function WhatsAppStep({ url }) {
  return (
    <div className="reg-wa">
      <p className="reg-wa-label">
        <span className="reg-wa-tag">Required</span>
        Join the WhatsApp group. The joining link, reminders and all event updates are shared there only.
      </p>
      <a className="btn reg-wa-btn" href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={18} aria-hidden="true" /> Join the WhatsApp group
        <span className="visually-hidden"> (opens WhatsApp)</span>
      </a>
    </div>
  )
}

function SuccessDialog({ event, duplicate, email, url, onClose }) {
  const titleRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    titleRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus()
    }
  }, [onClose])

  // Rendered at the end of <body>: a transformed ancestor (Reveal, Float)
  // would otherwise trap a fixed-position overlay inside it.
  return createPortal(
    <div className="reg-overlay" onClick={onClose}>
      <div className={`reg-dialog brand--${event.brand}`} role="dialog" aria-modal="true"
           aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <button className="reg-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>

        <div className="reg-check" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="reg-burst" style={{ '--a': `${i * 36}deg`, '--d': `${(i % 2) * 70}ms` }} />
          ))}
          <svg viewBox="0 0 64 64" width="88" height="88">
            <circle className="reg-check-ring" cx="32" cy="32" r="29" />
            <path className="reg-check-tick" d="M19 33.5 l9 9 l17-19" />
          </svg>
        </div>

        <h2 id={titleId} ref={titleRef} tabIndex={-1}>
          {duplicate ? 'You\u2019re already registered' : 'Registration successful'}
        </h2>
        <p className="reg-dialog-text">
          {duplicate
            ? <>We already have <strong>{email}</strong> down for <strong>{event.title}</strong>.</>
            : <>You&rsquo;re in for <strong>{event.title}</strong>.</>}
        </p>

        <WhatsAppStep url={url} />

        <button className="reg-later" type="button" onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body,
  )
}
