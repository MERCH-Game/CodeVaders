import { createAuthClient } from 'better-auth/react'

/**
 * Better Auth client configured for CodeVaders.
 * Points to the Express backend and sends credentials with all requests.
 */
const apiUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000'

export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: {
    credentials: 'include',
  },
})

export const { signIn, signOut, useSession, getSession } = authClient

/**
 * Initiates the Google OAuth social sign-in flow.
 * Directs Better Auth to Google's select_account picker with callback URLs
 * pointing back to the current frontend origin.
 */
export async function signInWithGoogle() {
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

  return await authClient.signIn.social({
    provider: 'google',
    callbackURL: currentOrigin,
    errorCallbackURL: currentOrigin,
  })
}
