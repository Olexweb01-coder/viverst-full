import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* The first page a visitor lands on paints at once. Fading it in from
   nothing showed the pale page background for a moment under the dark hero —
   a blue blink on every cold load. Route changes after that still cross-fade. */
let firstPaint = true

/** Cross-fade between routes. Short enough that navigation never feels laggy. */
export default function PageShell({ children }) {
  const reduce = useReducedMotion()
  const skipEntrance = firstPaint
  useEffect(() => { firstPaint = false }, [])

  if (reduce) return <>{children}</>

  return (
    <motion.div
      initial={skipEntrance ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
