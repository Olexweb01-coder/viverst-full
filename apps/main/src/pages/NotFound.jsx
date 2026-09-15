import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import WaveField from '../components/WaveField.jsx'
import { NAV_LINKS, SUBSIDIARIES } from '../data/site.js'
import './Pages.css'

export default function NotFound() {
  return (
    <section className="notfound">
      <Seo
        title="Page not found | Viverst Global Limited"
        description="The page you were looking for is not part of the Viverst group."
        path="/404"
      />
      <meta name="robots" content="noindex" />
      <WaveField opacity={0.7} />
      <div className="container notfound-inner">
        <motion.p className="notfound-code"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>404</motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
          That page isn&rsquo;t part of the group.
        </motion.h1>

        <motion.p className="lede"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}>
          The link may be out of date. Everything we have is one tap away.
        </motion.p>

        <motion.div className="notfound-links"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          {[...NAV_LINKS, ...SUBSIDIARIES.map((s) => ({ to: s.path, label: s.name }))].map((l) => (
            <Link key={l.to} className="notfound-chip" to={l.to}>{l.label}</Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.42 }}>
          <Link className="btn btn--primary notfound-btn" to="/">
            <ArrowLeft size={17} aria-hidden="true" /> Back home
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
