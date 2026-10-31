import { createContext, useContext } from 'react'

// status: 'loading' | 'none' | 'active' | 'expired' | 'error'
export const NO_PASS = {
  status: 'none',
  hasPass: false,
  email: null,
  validUntil: null,
  refresh: async () => null,
  signIn: async () => { throw new Error('PassProvider is missing') },
  signOut: () => {},
}

export const PassContext = createContext(NO_PASS)

// The visitor's Wrapped Pass on this device: { status, hasPass, email,
// validUntil, refresh, signIn, signOut }. Outside a PassProvider it reports
// no Pass, so components stay usable on their own (and in tests).
export default function usePass() {
  return useContext(PassContext)
}

// Turns a /me or /sessions/verify response into Pass state.
export function passStateFrom({ email = null, pass_valid_until: validUntil = null, has_pass: hasPass } = {}, now = Date.now()) {
  const active = hasPass ?? (validUntil != null && Date.parse(validUntil) > now)
  return { status: active ? 'active' : validUntil ? 'expired' : 'none', hasPass: Boolean(active), email, validUntil }
}
