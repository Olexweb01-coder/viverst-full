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

export function Empty({ title, body, children }) {
  return <div className="empty"><strong>{title}</strong>{body}{children}</div>
}

export function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
