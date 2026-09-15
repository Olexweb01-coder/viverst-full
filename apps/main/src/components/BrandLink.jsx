import { Link } from 'react-router-dom'

/**
 * Viverst Agro and Viverst Studio live on their own subdomains, so links to
 * them must be real anchors — a router Link would try to resolve them as
 * in-app routes. Internal destinations still go through the router.
 */
export default function BrandLink({ to, external, children, ...rest }) {
  if (external) return <a href={to} {...rest}>{children}</a>
  return <Link to={to} {...rest}>{children}</Link>
}
