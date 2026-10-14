import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { AuthCtx } from './authContext.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)   // null = loading, false = signed out
  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(data.session ?? false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? false))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  return <AuthCtx.Provider value={{ session, user: session ? session.user : null }}>{children}</AuthCtx.Provider>
}
