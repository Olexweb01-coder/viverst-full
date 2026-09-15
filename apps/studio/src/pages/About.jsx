import { Link } from 'react-router-dom'
import { Seo, Icon } from '@viverst/ui'
import { BUSINESS, MISSION, PROCESS, REASONS, COMMITMENTS } from '../data/studio.js'

export default function About() {
  return (
    <>
      <Seo
        title="About | Viverst Studio"
        description={MISSION}
        url={`${BUSINESS.site}/about`}
        image={`${BUSINESS.site}/og-image.png`}
        siteName={BUSINESS.name}
      />
      <section className="page-head">
        <div className="shell">
          <p className="eyebrow">About</p>
          <h1>Great businesses deserve great visual identities.</h1>
          <p className="page-lede">
            Many businesses have a good product and a real idea, and still struggle to put it into a
            form people recognise. {BUSINESS.name} exists to close that gap.
          </p>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell prose-grid">
          <div>
            <h2>What we are here to do</h2>
            <p>{MISSION}</p>
            <p>
              We are the design arm of {BUSINESS.parent}, which also owns {BUSINESS.siblingName}.
              That means the studio answers to a group with a long view rather than to the next
              invoice, and it means a client is not depending on one freelancer staying available.
            </p>
          </div>
          <ul className="commitments">
            {COMMITMENTS.map((c) => (
              <li key={c}><Icon name="check" size={18} />{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band is-dark" data-dark data-rv>
        <div className="shell">
          <div className="head">
            <h2>How the work runs</h2>
            <p>Five steps, in this order, on every project.</p>
          </div>
          <ol className="steps">
            <span className="steps-track" aria-hidden="true"><i /></span>
            {PROCESS.map((s, i) => (
              <li className="step" key={s.title} style={{ '--i': i }}>
                <span className="step-dot">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="dark-out" aria-hidden="true" />

      <section className="band" data-rv>
        <div className="shell">
          <div className="head">
            <h2>What we hold to</h2>
            <p>The same six standards apply whether the job is a flyer or a full identity.</p>
          </div>
          <div className="tiles">
            {REASONS.map((r, i) => (
              <article className="tile" key={r.title} style={{ '--i': i }}>
                <span className="tile-icon"><Icon name={r.icon} size={26} /></span>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </article>
            ))}
          </div>
          <div className="btn-row">
            <Link className="btn btn-accent btn-lg" to="/contact"><span>Start a project</span></Link>
            <Link className="btn btn-line btn-lg" to="/services"><span>What we do</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
