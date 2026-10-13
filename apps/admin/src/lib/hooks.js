import { useContext, useEffect, useState } from 'react'
import { AuthCtx } from './authContext.js'

export const useAuth = () => useContext(AuthCtx)

/* a status message that clears itself after a few seconds */
export function useFlash(ms = 3500) {
  const [flash, setFlash] = useState(null)
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), ms)
    return () => clearTimeout(t)
  }, [flash, ms])
  return [flash, setFlash]
}
