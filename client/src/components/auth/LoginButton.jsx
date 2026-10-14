import React, { useState } from 'react'
import { useSession, signInWithGoogle, signOut } from '../../lib/auth-client.js'

export default function LoginButton({
  session: sessionProp,
  isLoading: isPendingProp,
  onSessionChange,
  className = '',
}) {
  const [actionLoading, setActionLoading] = useState(false)

  // Use Better Auth's reactive session hook
  const { data: sessionData, isPending: sessionPending } = useSession()

  const currentSession = sessionProp !== undefined ? sessionProp : sessionData
  const isLoading = isPendingProp !== undefined ? isPendingProp : sessionPending

  // Flag: defaults to true if unset
  const showLoginButton = import.meta.env.VITE_SHOW_LOGIN_BUTTON !== 'false'

  const handleLogin = async () => {
    try {
      setActionLoading(true)
      await signInWithGoogle()
    } catch (err) {
      console.error('Failed to start Google sign-in:', err)
      setActionLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setActionLoading(true)
      await signOut()
      if (onSessionChange) onSessionChange(null)
    } catch (err) {
      console.error('Sign-out failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // When authenticated: display player name and logout option
  if (currentSession?.user) {
    const displayName =
      currentSession.user.playerName ||
      currentSession.user.name ||
      currentSession.user.email

    return (
      <div
        id="user-account-badge"
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-arcade-panel/90 border border-arcade-purple/60 backdrop-blur-sm shadow-[0_0_12px_rgba(123,44,255,0.25)] ${className}`}
      >
        <span
          className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0"
          title="Online"
        />
        <span
          id="player-display-name"
          className="font-pixel text-[8px] sm:text-[9px] text-arcade-pink truncate max-w-[130px]"
          title={currentSession.user.email}
        >
          {displayName}
        </span>
        <button
          id="logout-btn"
          type="button"
          onClick={handleSignOut}
          disabled={actionLoading}
          className="font-pixel text-[7px] sm:text-[8px] text-gray-400 hover:text-red-400 uppercase tracking-wider transition-colors cursor-pointer ml-1"
          title="Sign out"
        >
          {actionLoading ? '[...]' : '[EXIT]'}
        </button>
      </div>
    )
  }

  // If login button is disabled via VITE_SHOW_LOGIN_BUTTON=false, hide when unauthenticated
  if (!showLoginButton) {
    return null
  }

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div
        id="auth-loading-state"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-arcade-panel/70 border border-arcade-purple/40 text-gray-400 font-pixel text-[8px] animate-pulse ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-arcade-pink/60 animate-ping" />
        CHECKING AUTH...
      </div>
    )
  }

  // Unauthenticated and enabled: show Login button
  return (
    <button
      id="login-btn"
      type="button"
      onClick={handleLogin}
      disabled={actionLoading}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-black/60 hover:bg-arcade-purple/20 active:scale-95 border border-arcade-purple hover:border-arcade-pink rounded font-pixel text-[9px] sm:text-[10px] text-white tracking-wider shadow-[0_0_10px_rgba(123,44,255,0.3)] hover:shadow-[0_0_18px_rgba(244,168,255,0.5)] transition-all cursor-pointer ${className}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      {actionLoading ? 'CONNECTING...' : 'LOGIN WITH GOOGLE'}
    </button>
  )
}
