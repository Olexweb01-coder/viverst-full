import { Link } from 'react-router-dom'
import { Seo, Icon } from '@viverst/ui'

import Mark from '../components/Mark.jsx'
import Artefact from '../components/Artefacts.jsx'
import {
  BUSINESS, HEADLINE_LINES, LEDE, STATEMENT, STATEMENT_KEY, STATEMENT_CAPTION,
  FOCUS_AREAS, DELIVERABLES, PAINS, PROCESS, REASONS, AUDIENCE,
  PROJECTS,
} from '../data/studio.js'

/* The headline is split into lines so each can rise out of its own mask and
   sit at its own offset. The spaces between words stay inside the line, and
   the space BETWEEN lines is a real text node, so the h1 still reads as one
   sentence to a screen reader rather than running together. */
function Headline() {
  return (
    <h1 className="hero-title">
      {HEADLINE_LINES.map((line, i) => (
        <span className="hero-line" key={line.text} style={{ '--shift': line.shift }}>
          <span className={line.deep ? 'hero-word is-deep' : 'hero-word'}>{line.text}</span>
          {i < HEADLINE_LINES.length - 1 ? ' ' : null}
        </span>
      ))}
    </h1>
  )
}

function Statement() {
  const words = STATEMENT.split(' ')
  return (
    <p className="statement">
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className={STATEMENT_KEY.includes(w) ? 'sw is-key' : 'sw'}>
          {w}{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  )
}

export default function Home() {
  return (
    <>
      <Seo
        title="Viverst Studio | Brand, Design and Visual Communication in Lagos"
        description={LEDE}
        url={`${BUSINESS.site}/`}
        image={`${BUSINESS.site}/og-image.png`}
        siteName={BUSINESS.name}
      />

      {/* hero */}
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <Headline />
            <p className="hero-lede">{LEDE}</p>
            <div className="btn-row">
              <Link className="btn btn-accent btn-lg" to="/services"><span>What we do</span></Link>
              <Link className="btn btn-line btn-lg" to="/work"><span>See the work</span></Link>
            </div>
            <p className="hero-cue"><i aria-hidden="true" /> Eight areas of work, one standard</p>
          </div>
          <Mark />
        </div>
      </section>

      {/* the eight areas, running */}
      <div className="tick-fade is-in" aria-hidden="true" />
      <div className="ticker" data-dark aria-hidden="true">
        <div className="ticker-row">
          {[0, 1].map((pass) => (
            <div className="ticker-set" key={pass}>
              {FOCUS_AREAS.map((f) => (
                <span key={f.key}>{f.title}<b /></span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="tick-fade is-out" aria-hidden="true" />

      {/* statement */}
      <section className="band" data-rv>
        <div className="shell">
          <Statement />
          <p className="statement-by">{STATEMENT_CAPTION}</p>
          <div className="btn-row">
            <Link className="btn btn-line btn-lg" to="/about"><span>Read the studio&rsquo;s story</span></Link>
          </div>
        </div>
      </section>

      {/* eight areas, stacked */}
      <section className="band" data-rv>
        <div className="shell">
          <div className="head">
            <h2>Eight areas, one standard</h2>
            <p>
              Most studios do one of these well and the rest badly. We built the studio so the sign,
              the pack, the deck and the shopfront all come out of the same thinking.
            </p>
          </div>
          <div className="stack">
            {FOCUS_AREAS.map((f, i) => (
              <article className="stack-card" key={f.key} style={{ '--i': i }}>
                <div className="stack-n">{String(i + 1).padStart(2, '0')}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
          <div className="btn-row">
            <Link className="btn btn-line btn-lg" to="/services"><span>See each area in detail</span></Link>
            <span className="btn-note">Every one is set out in full on the services page.</span>
          </div>
        </div>
      </section>

      {/* what you get */}
      <section className="band" data-rv>
        <div className="shell">
          <div className="head">
            <h2>What you actually get</h2>
            <p>
              Not a folder of pictures. Finished, usable pieces with the rules and the source files
              that keep them working after we hand them over.
            </p>
          </div>
          <div className="gets gets-deliverables">
            {DELIVERABLES.map((d, i) => (
              <Link className="get" to="/services" key={d.art} style={{ '--i': i }}>
                <Artefact name={d.art} />
                <div className="get-meta">
                  <span className="tagline"><b />{d.cat}</span>
                  <h3>{d.title}</h3>
                  <p>{d.body}</p>
                  <span className="go">How this works <Icon name="arrow-right" size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* selected work */}
      {PROJECTS.length > 0 && (
        <section className="band" data-rv>
          <div className="shell">
            <div className="head">
              <h2>Selected work</h2>
              <p>
                A few projects end to end. The full set, with the brief and the thinking beside
                each one, is on the work page.
              </p>
            </div>
            <div className="gets gets-work">
              {PROJECTS.slice(0, 3).map((p, i) => (
                <Link className="get" to="/work" key={p.slug} style={{ '--i': i }}>
                  <Artefact name={p.art} />
                  <div className="get-meta">
                    <div className="project-meta">
                      <span className="tagline"><b />{p.category}</span>
                      <span className="project-year">{p.year}</span>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <span className="go">View project <Icon name="arrow-right" size={15} /></span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="btn-row">
              <Link className="btn btn-line btn-lg" to="/work"><span>See all work</span></Link>
            </div>
          </div>
        </section>
      )}

      {/* what goes wrong */}
      <section className="band is-dark" data-dark data-rv>
        <div className="shell">
          <div className="head">
            <h2>What usually goes wrong</h2>
            <p>
              Businesses rarely lose to a better product. They lose to a business that is easier to
              recognise and easier to trust.
            </p>
          </div>
          <div className="pains">
            {PAINS.map((p) => (
              <div className="pain" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how the work runs */}
      <section className="band is-dark" data-dark data-rv>
        <div className="shell">
          <div className="head">
            <h2>How the work runs</h2>
            <p>
              Five steps, in this order, every time. It is the part most studios skip, and it is the
              reason the last step is possible at all.
            </p>
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
          <div className="btn-row">
            <Link className="btn btn-ghost btn-lg" to="/about"><span>More about how we work</span></Link>
            <Link className="btn btn-accent btn-lg" to="/contact"><span>Start a project</span></Link>
          </div>
        </div>
      </section>
      <div className="dark-out" aria-hidden="true" />

      {/* why us */}
      <section className="band" data-rv>
        <div className="shell">
          <div className="head">
            <h2>Why businesses pick us</h2>
            <p>
              Six things we hold to on every project, whether it is a one-page flyer or a full
              identity rollout.
            </p>
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

          <div className="audience">
            <h2>Who we work with</h2>
            <div className="chips">
              {AUDIENCE.map((a) => <span key={a}>{a}</span>)}
            </div>
            <div className="btn-row">
              <Link className="btn btn-line btn-lg" to="/about"><span>About the studio</span></Link>
            </div>
          </div>
        </div>
      </section>

      {/* closing */}
      <div className="dark-in" aria-hidden="true" />
      <section className="band is-dark is-closing" data-dark data-rv>
        <div className="shell">
          <h2>Tell us what you are building.</h2>
          <p className="closing-lede">
            Send a short note about the business and what it needs to look like. We will tell you
            honestly whether we are the right studio for it.
          </p>
          <div className="btn-row">
            <Link className="btn btn-accent btn-lg" to="/contact"><span>Start a project</span></Link>
            <Link className="btn btn-ghost btn-lg" to="/about"><span>About the studio</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
