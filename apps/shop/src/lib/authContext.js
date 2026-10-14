import { createContext, useContext } from 'react'
export const AuthCtx = createContext({ session: null, user: null })
export const useAuth = () => useContext(AuthCtx)
