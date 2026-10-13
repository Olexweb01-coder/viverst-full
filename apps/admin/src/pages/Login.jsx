import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/hooks.js'
import logo from '@brand-assets/main/logo.webp'
import { Field, Note } from '../components/ui.jsx'

export default function Login({ notStaff }) {
  const { signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(error.message === 'Invalid login credentials' ? 'That email and password don’t match.' : error.message)
  }

  if (notStaff) {
    return (
      <div className="login">
        <div className="panel panel-body">
          <div className="login-brand"><img src={logo} alt="Viverst" /></div>
          <h1>This account isn’t on the staff list</h1>
          <p className="muted" style={{ marginTop: 8 }}>You signed in, but only staff accounts can use the admin. Ask the owner to add you, then sign in again.</p>
          <div className="form-actions" style={{ marginTop: 16 }}><button className="btn" type="button" onClick={signOut}>Sign out</button></div>
        </div>
      </div>
    )
  }

  return (
    <div className="login">
      <form className="panel panel-body form" onSubmit={submit}>
        <div className="login-brand"><img src={logo} alt="Viverst" /></div>
        <h1>Sign in</h1>
        <Field label="Email"><input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Note kind="error">{error}</Note>
        <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></div>
      </form>
    </div>
  )
}
