import { Link } from 'react-router-dom'
import { Seo } from '@viverst/ui'
import Mark from '../components/Mark.jsx'
import { BUSINESS } from '../data/studio.js'

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page not found | Viverst Studio"
        description="That page is not here."
        url={`${BUSINESS.site}/`}
        siteName={BUSINESS.name}
        noindex
      />
      <section className="band" data-rv>
        <div className="shell empty-state">
          <div>
            <p className="eyebrow">404</p>
            <h1>That page is not here.</h1>
            <p className="page-lede">
              The link may be old, or the address may have a typo in it. Everything the studio does
              is one click away.
            </p>
            <div className="btn-row">
              <Link className="btn btn-accent btn-lg" to="/"><span>Back to home</span></Link>
              <Link className="btn btn-line btn-lg" to="/services"><span>What we do</span></Link>
            </div>
          </div>
          <Mark interactive={false} />
        </div>
      </section>
    </>
  )
}
