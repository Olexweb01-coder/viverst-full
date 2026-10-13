import { useState } from 'react'
import { X } from 'lucide-react'

/* Shown on the Today screen while the admin and shop run on Vercel's Hobby
   plan, whose terms are for non-commercial use. Dismiss hides it for 30 days.
   Remove this component once hosting is on a plan that allows commercial use. */
const KEY = 'viverst-admin:hosting-notice-dismissed'
const DAYS = 30

function dismissedRecently() {
  try {
    const t = Number(window.localStorage.getItem(KEY) || 0)
    return t && Date.now() - t < DAYS * 86400000
  } catch { return false }
}

export default function HostingNotice() {
  const [hidden, setHidden] = useState(dismissedRecently)
  if (hidden) return null
  function dismiss() {
    try { window.localStorage.setItem(KEY, String(Date.now())) } catch { /* private mode: just hide for now */ }
    setHidden(true)
  }
  return (
    <div className="note note-info hosting-notice" role="status">
      <div>
        <strong>Hosting reminder.</strong> The admin and shop run on Vercel’s free Hobby plan, which is meant for
        non-commercial use. Vercel may pause them and ask you to upgrade (Pro, about $20 a month) or move them to
        a free host that allows commercial use. Nothing is lost either way; this is a heads-up, not an error.
      </div>
      <button type="button" className="btn btn-quiet btn-sm" onClick={dismiss} aria-label="Hide this reminder for 30 days"><X aria-hidden="true" />Hide for 30 days</button>
    </div>
  )
}
