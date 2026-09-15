import { Link } from 'react-router-dom'
import { Seo, Icon } from '@viverst/ui'
import Artefact from '../components/Artefacts.jsx'
import { BUSINESS, FOCUS_AREAS, DELIVERABLES } from '../data/studio.js'

export default function Services() {
  return (
    <>
      <Seo
        title="What we do | Viverst Studio"
        description="Brand identity, digital and visual design, graphic design, print, 3D and visualisation, marketing design, creative strategy and business communication."
        url={`${BUSINESS.site}/services`}
        image={`${BUSINESS.site}/og-image.png`}
        siteName={BUSINESS.name}
      />
      <section className="page-head">
        <div className="shell">
          <p className="eyebrow">What we do</p>
          <h1>Eight areas, one standard.</h1>
          <p className="page-lede">
            Each of these can be taken on its own. They are better together, because every piece
            then comes out of the same set of decisions.
          </p>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell">
          <div className="areas">
            {FOCUS_AREAS.map((f, i) => (
              <article className="area" key={f.key} id={f.key} style={{ '--i': i }}>
                <span className="area-n">{String(i + 1).padStart(2, '0')}</span>
                <h2>{f.title}</h2>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band" data-rv>
        <div className="shell">
          <div className="head">
            <h2>What you actually get</h2>
            <p>The finished pieces that leave the studio, with the files behind them.</p>
          </div>
          <div className="gets">
            {DELIVERABLES.map((d, i) => (
              <article className="get is-static" key={d.art} style={{ '--i': i }}>
                <Artefact name={d.art} />
                <div className="get-meta">
                  <span className="tagline"><b />{d.cat}</span>
                  <h3>{d.title}</h3>
                  <p>{d.body}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="btn-row">
            <Link className="btn btn-accent btn-lg" to="/contact"><span>Start a project</span></Link>
            <Link className="btn btn-line btn-lg" to="/about"><span>How the work runs</span></Link>
            <span className="btn-note"><Icon name="mail" size={15} /> {BUSINESS.email}</span>
          </div>
        </div>
      </section>
    </>
  )
}
