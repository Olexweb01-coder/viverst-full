import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'
import './ScrollProgress.css'

export default function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 })

  if (reduce) return null
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />
}
