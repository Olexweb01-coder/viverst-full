export function PageHead({ title, lede, children }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{lede && <p>{lede}</p>}</div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}

export function Note({ kind = 'info', children }) {
  if (!children) return null
  return <div className={`note note-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

/* a small, brand-coloured illustration so empty screens feel intentional */
function EmptyArt() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden="true">
      <defs><linearGradient id="ea" x1="0" x2="1"><stop offset="0" stopColor="#0464de" /><stop offset="1" stopColor="#06065d" /></linearGradient></defs>
      <ellipse cx="80" cy="104" rx="60" ry="8" fill="rgba(6,6,93,0.08)" />
      <rect x="34" y="28" width="92" height="64" rx="10" fill="#fff" stroke="url(#ea)" strokeWidth="2.5" />
      <rect x="46" y="42" width="40" height="7" rx="3.5" fill="rgba(4,100,222,0.25)" />
      <rect x="46" y="56" width="68" height="6" rx="3" fill="rgba(6,6,93,0.10)" />
      <rect x="46" y="68" width="52" height="6" rx="3" fill="rgba(6,6,93,0.10)" />
      <circle cx="118" cy="30" r="12" fill="#ed0101" />
      <path d="M113 30l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function Empty({ title, body, children }) {
  return <div className="empty"><EmptyArt /><strong>{title}</strong>{body && <span>{body}</span>}{children}</div>
}
export function Chip({ kind = 'dim', children }) {
  return <span className={`chip chip-${kind}`}>{children}</span>
}

/* Field: a <label> around ONE input, so clicking the caption focuses it.
   Group: the same look, but a <div>, for anything holding buttons or several
   controls: a <label> would forward clicks to its first control and make
   toggles misfire. */
export function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
export function Group({ label, hint, children }) {
  return <div className="field" role="group" aria-label={typeof label === 'string' ? label : undefined}><span>{label}</span>{children}{hint && <small>{hint}</small>}</div>
}
