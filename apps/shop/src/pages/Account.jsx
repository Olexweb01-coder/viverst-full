import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Seo } from '@viverst/ui'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/authContext.js'
import { money } from '../lib/format.js'

const STATUS = { awaiting_payment: 'Awaiting payment', paid: 'Paid', packed: 'Packed', shipped: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' }

export default function Account({ shopName }) {
  const { session, user } = useAuth()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState(null)
  const next = params.get('next') || '/account'

  const load = useCallback(async () => {
    if (!user) return
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from('customers').select('name, phone').eq('user_id', user.id).maybeSingle(),
      supabase.from('orders').select('id, number, status, total_kobo, created_at, payment_method').order('created_at', { ascending: false }).limit(50),
    ])
    setProfile({ name: p?.name || '', phone: p?.phone || '' }); setOrders(o || [])
  }, [user])
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMsg('')
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/account` } })
      setBusy(false)
      if (error) { setError(error.message); return }
      if (data.session) { nav(next, { replace: true }); return }
      setMsg('Check your email for a link to confirm your account, then come back and sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      setBusy(false)
      if (error) { setError(/invalid/i.test(error.message) ? 'That email and password don’t match.' : error.message); return }
      nav(next, { replace: true })
    }
  }
  async function reset() {
    if (!email.trim()) { setError('Enter your email first, then press “Forgot password”.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account` })
    if (error) setError(error.message); else setMsg('We’ve emailed you a link to set a new password.')
  }
  async function saveProfile(e) {
    e.preventDefault(); setBusy(true); setError('')
    const { error } = await supabase.from('customers').update({ name: profile.name.trim(), phone: profile.phone.trim() }).eq('user_id', user.id)
    setBusy(false); if (error) setError(error.message); else setMsg('Saved.')
  }

  if (session === null) return <section className="section shop-page"><div className="container"><p className="muted">Loading…</p></div></section>

  if (!user) return (
    <section className="section shop-page">
      <Seo title={`${mode === 'signup' ? 'Create account' : 'Sign in'} | ${shopName}`} description="" />
      <div className="container account-auth">
        <h1>{mode === 'signup' ? 'Create an account' : 'Sign in'}</h1>
        <p className="lede">Keep your details for next time and see where your orders are. You can also check out without an account.</p>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && <label>Your name<input className="input" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>}
          <label>Email<input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input className="input" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="shop-error" role="alert">{error}</p>}
          {msg && <p className="shop-ok" role="status">{msg}</p>}
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
          <div className="auth-links">
            {mode === 'signin' ? <><button type="button" className="linklike" onClick={() => { setMode('signup'); setError('') }}>New here? Create an account</button><button type="button" className="linklike" onClick={reset}>Forgot password</button></>
              : <button type="button" className="linklike" onClick={() => { setMode('signin'); setError('') }}>Already have an account? Sign in</button>}
          </div>
        </form>
      </div>
    </section>
  )

  return (
    <section className="section shop-page">
      <Seo title={`Your account | ${shopName}`} description="" />
      <div className="container account">
        <div className="shop-section-head"><div><span className="eyebrow">Your account</span><h1>Hello{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}.</h1></div><button type="button" className="btn btn--sm" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
        <div className="account-grid">
          <form className="auth-form" onSubmit={saveProfile}>
            <h2>Your details</h2>
            <label>Name<input className="input" value={profile?.name ?? ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
            <label>Phone<input className="input" type="tel" value={profile?.phone ?? ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            <p className="small muted">Signed in as {user.email}</p>
            {error && <p className="shop-error" role="alert">{error}</p>}
            {msg && <p className="shop-ok" role="status">{msg}</p>}
            <button className="btn" type="submit" disabled={busy || !profile}>Save</button>
          </form>
          <div>
            <h2>Your orders</h2>
            {orders && orders.length === 0 && <p className="muted">No orders yet. <Link to="/products">Shop products</Link>.</p>}
            {orders && orders.length > 0 && <ul className="order-list">{orders.map((o) => (
              <li key={o.id}><Link to={`/order/${o.number}`}><span className="order-number">{o.number}</span><span className={`order-status order-status--${o.status}`}>{STATUS[o.status] || o.status}</span><span>{money(o.total_kobo)}</span><span className="muted small">{new Date(o.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span></Link></li>))}</ul>}
          </div>
        </div>
      </div>
    </section>
  )
}
