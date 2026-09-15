import { motion, useReducedMotion } from 'framer-motion'

/**
 * Scroll-in wrapper used by every section on the site.
 * `once` keeps it from re-triggering, so scrolling back up stays calm.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  x = 0,
  duration = 0.7,
  className,
  as = 'div',
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] || motion.div

  if (reduce) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}
