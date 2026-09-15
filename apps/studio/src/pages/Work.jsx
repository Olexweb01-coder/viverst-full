import { Link } from 'react-router-dom'
import { Seo, Icon } from '@viverst/ui'
import Artefact from '../components/Artefacts.jsx'
import Mark from '../components/Mark.jsx'
import { BUSINESS, PROJECTS } from '../data/studio.js'

export default function Work() {
  const samples = PROJECTS.filter((p) => p.sample).length

  return (
    <>
      <Seo
        title="Work | Viverst Studio"
        description="Identity, packaging, print, digital and company profiles from Viverst Studio, Lagos."
        url={`${BUSINESS.site}/work`}
        image={`${BUSINESS.site}/og-image.png`}
        siteName={BUSINESS.name}
      />
      <section className="page-head">
        <div className="shell">
          <p className="eyebrow">Work</p>
          <h1>The work, and the thinking behind it.</h1>
          <p className="page-lede">
            Every project here starts with a business question rather than a brief for a logo.
            The result is the part you see; the system underneath is the part that lasts.
          </p>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell">
          {samples > 0 && (
            <p className="sample-note">
              <Icon name="eye" size={15} />
              Sample layouts. Real projects replace these as they ship.
            </p>
          )}

          {PROJECTS.length === 0 ? (
            <div className="empty-state">
              <div>
                <h2>Nothing published yet</h2>
                <p>
                  The first projects are still in progress. Rather than fill this page with work
                  that is not ours, it stays empty until there is something honest to put on it.
                </p>
                <div className="btn-row">
                  <Link className="btn btn-accent btn-lg" to="/contact"><span>Start a project</span></Link>
                </div>
              </div>
              <Mark interactive={false} />
            </div>
          ) : (
            <div className="gets">
              {PROJECTS.map((p, i) => (
                <article className="get is-static" key={p.slug} style={{ '--i': i }}>
                  <Artefact name={p.art} />
                  <div className="get-meta">
                    <div className="project-meta">
                      <span className="tagline"><b />{p.category}</span>
                      <span className="project-year">{p.year}</span>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="btn-row">
            <Link className="btn btn-accent btn-lg" to="/contact"><span>Start a project</span></Link>
            <Link className="btn btn-line btn-lg" to="/services"><span>What we do</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}
