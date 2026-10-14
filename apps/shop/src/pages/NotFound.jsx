import { Link } from 'react-router-dom'
import { Seo } from '@viverst/ui'
export default function NotFound({ shopName }) {
  return <section className="section shop-page"><div className="container"><Seo title={`Not found | ${shopName}`} description="" /><h1>Nothing on that shelf.</h1><p className="lede">The page you were after isn’t here.</p><Link to="/" className="btn btn--primary">Back to the shop</Link></div></section>
}
