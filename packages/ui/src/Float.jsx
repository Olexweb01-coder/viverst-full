/** Continuous rise-and-fall. Each instance gets its own timing so a grid ripples. */
export default function Float({
  children, delay = 0, distance = -9, duration = 7, className = '', style, ...rest
}) {
  return (
    <div
      className={`float ${className}`}
      style={{
        '--float-delay': `${delay}s`,
        '--float-y': `${distance}px`,
        '--float-dur': `${duration}s`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
