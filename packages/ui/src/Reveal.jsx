import { useReducedMotion, useInView } from './hooks.js'

/**
 * Scroll-in wrapper. The transition lives in CSS; this only toggles a class,
 * so the browser animates it on the compositor.
 */
export default function Reveal({
  children, as: Tag = 'div', delay = 0, y = 20, x = 0, className = '', ...rest
}) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView()

  if (reduced) return <Tag className={className} {...rest}>{children}</Tag>

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--rv-delay': `${delay}s`, '--rv-y': `${y}px`, '--rv-x': `${x}px` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
