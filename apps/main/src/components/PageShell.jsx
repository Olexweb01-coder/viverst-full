import { motion, useReducedMotion } from 'framer-motion'

/** Cross-fade between routes. Short enough that navigation never feels laggy. */
export default function PageShell({ children }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
