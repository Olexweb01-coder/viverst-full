import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion'

/** Moves at a different rate to the page as you scroll past it. */
export default function Parallax({ children, distance = 60, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const y = useSpring(raw, { stiffness: 90, damping: 24, restDelta: 0.001 })

  if (reduce) return <div className={className}>{children}</div>
  return <motion.div ref={ref} className={className} style={{ y }}>{children}</motion.div>
}
