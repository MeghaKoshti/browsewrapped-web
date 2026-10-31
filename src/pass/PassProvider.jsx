import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMe, verifyMagicLink } from '../api/client'
import { loadPassToken, savePassToken, clearPassToken } from '../lib/passSession'
import { PassContext, passStateFrom } from './passContext'

const SIGNED_OUT = { status: 'none', hasPass: false, email: null, validUntil: null }

// Email links are single-use. React's StrictMode (and a quick double click)
// can ask to verify the same token twice, so share one request per token.
const verifications = new Map()

// Asks /me about a stored token and reports the result through setPass. It
// only sets state after the request, so it is safe to start from an effect.
async function checkPass(token, signal, setPass) {
  try {
    const me = await getMe(token, { signal })
    setPass(passStateFrom(me))
    return me
  } catch (err) {
    if (signal?.aborted) return null
    if (err?.response?.status === 401) {
      // Expired or revoked session: forget it so we stop sending it.
      clearPassToken()
      setPass(SIGNED_OUT)
      return null
    }
    setPass((current) => (current.status === 'loading' ? { ...SIGNED_OUT, status: 'error' } : current))
    throw err
  }
}

// Checks the stored Pass token with GET /me once on load and shares the
// result with every usePass() caller.
export default function PassProvider({ children }) {
  const [pass, setPass] = useState(() => (loadPassToken() ? { ...SIGNED_OUT, status: 'loading' } : SIGNED_OUT))

  const refresh = useCallback(async ({ signal } = {}) => {
    const token = loadPassToken()
    if (token) return checkPass(token, signal, setPass)
    setPass(SIGNED_OUT)
    return null
  }, [])

  useEffect(() => {
    const token = loadPassToken()
    if (!token) return undefined
    const controller = new AbortController()
    checkPass(token, controller.signal, setPass).catch(() => {})
    return () => controller.abort()
  }, [])

  const signIn = useCallback(async (token) => {
    if (!verifications.has(token)) {
      verifications.set(token, verifyMagicLink(token).finally(() => setTimeout(() => verifications.delete(token), 60_000)))
    }
    const session = await verifications.get(token)
    savePassToken(session.access_token)
    setPass(passStateFrom(session))
    return session
  }, [])

  const signOut = useCallback(() => {
    clearPassToken()
    setPass(SIGNED_OUT)
  }, [])

  const value = useMemo(() => ({ ...pass, refresh, signIn, signOut }), [pass, refresh, signIn, signOut])
  return <PassContext.Provider value={value}>{children}</PassContext.Provider>
}
