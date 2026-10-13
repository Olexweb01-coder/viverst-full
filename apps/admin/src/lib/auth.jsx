import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { AuthCtx } from './authContext.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [lookup, setLookup] = useState({ forUser: null, staff: null })

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(data.session ?? false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? false))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const userId = session ? session.user.id : null
  useEffect(() => {
    if (!userId) return
    let alive = true
    supabase.from('staff').select('user_id,email,name,role,active').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (alive) setLookup({ forUser: userId, staff: data && data.active ? data : false }) })
    return () => { alive = false }
  }, [userId])

  // derived, so no state is set synchronously inside an effect
  const staff = !session ? (session === false ? false : null)
    : lookup.forUser === userId ? lookup.staff : null

  const signOut = () => supabase.auth.signOut()
  return <AuthCtx.Provider value={{ session, staff, signOut }}>{children}</AuthCtx.Provider>
}
