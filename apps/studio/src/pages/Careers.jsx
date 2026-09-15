import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo, Icon } from '@viverst/ui'
import { BUSINESS, ROLES } from '../data/studio.js'

export default function Careers() {
  const [form, setForm] = useState({ name: '', email: '', craft: '', note: '' })
  const ready = form.name.trim() && form.email.includes('@') && form.craft.trim() && form.note.trim()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <Seo
        title="Careers | Viverst Studio"
        description="Designers and creative people who want to build a studio from the start."
        url={`${BUSINESS.site}/careers`}
        image={`${BUSINESS.site}/og-image.png`}
        siteName={BUSINESS.name}
      />
      <section className="page-head">
        <div className="shell">
          <p className="eyebrow">Careers</p>
          <h1>Build the studio, not just the work.</h1>
          <p className="page-lede">
            {BUSINESS.name} is early. That is the reason to join now rather than the reason to wait.
          </p>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell prose-grid">
          <div>
            {ROLES.some((r) => r.sample) && (
              <p className="sample-note">
                <Icon name="eye" size={15} />
                Sample listings. Real openings replace these when hiring starts.
              </p>
            )}
            {ROLES.length === 0 ? (
              <div className="empty-roles">
                <h2>No open roles right now</h2>
                <p>
                  Nothing is posted today. We would still rather see good work early than miss it,
                  so the form is open and it is read.
                </p>
              </div>
            ) : (
              <div className="roles">
                {ROLES.map((r) => (
                  <article className="role" key={r.slug}>
                    <h2>{r.title}</h2>
                    <p className="role-terms">{r.type} &middot; {r.place}</p>
                    <p>{r.summary}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form className="apply-form" onSubmit={(e) => e.preventDefault()}>
            <h2>Send your work</h2>
            <label>
              <span>Your name</span>
              <input type="text" value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
            <label>
              <span>What you do</span>
              <input type="text" value={form.craft} onChange={set('craft')} placeholder="Brand design, 3D, motion…" />
            </label>
            <label>
              <span>A link to your work, and anything worth knowing</span>
              <textarea rows="4" value={form.note} onChange={set('note')} />
            </label>
            <button className="btn btn-accent btn-lg apply-submit" type="submit" disabled={!ready}>
              <span>Send</span>
            </button>
            <p className="form-note">
              <Icon name="mail" size={15} /> Or write to {BUSINESS.email}
            </p>
          </form>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell">
          <div className="btn-row">
            <Link className="btn btn-line btn-lg" to="/about"><span>About the studio</span></Link>
            <Link className="btn btn-line btn-lg" to="/services"><span>What we do</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
