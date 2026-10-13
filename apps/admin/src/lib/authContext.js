import { createContext } from 'react'
/* session: null while loading, false when signed out, object when in.
   staff:   null while loading, false if the person is not staff, else their row. */
export const AuthCtx = createContext({ session: null, staff: null, signOut() {} })
