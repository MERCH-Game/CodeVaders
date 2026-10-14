import { useState } from 'react'
import ArcadeShell from './components/arcade/ArcadeShell.jsx'
import GameOverScreen from './screens/GameOverScreen/GameOverScreen.jsx'
import HomeScreen from './screens/HomeScreen/HomeScreen.jsx'
import PlayScreen from './screens/PlayScreen/PlayScreen.jsx'
import AuthErrorModal from './components/auth/AuthErrorModal.jsx'
import { useSession, signInWithGoogle } from './lib/auth-client.js'

function App() {
  const [activeScreen, setActiveScreen] = useState('home')
  const [finalScore, setFinalScore] = useState(0)
  const { data: session, isPending: isSessionLoading } = useSession()

  // Initialize auth error directly from URL params if returning from rejected OAuth
  const [authError, setAuthError] = useState(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const errCode = params.get('error')
    if (errCode) {
      // Clean query parameters from URL immediately without reloading to prevent loops
      window.history.replaceState({}, document.title, window.location.pathname)
      return {
        title: 'College email required',
        message:
          'College email required. Please sign in with your verified MNNIT student email address (@mnnit.ac.in).',
      }
    }
    return null
  })

  const finishGame = (score) => {
    setFinalScore(score)
    setActiveScreen('game-over')
  }

  const handleRetryLogin = () => {
    setAuthError(null)
    signInWithGoogle().catch((err) => {
      console.error('Retry sign-in failed:', err)
    })
  }

  return (
    <ArcadeShell hideVolume={activeScreen === 'play'}>
      {activeScreen === 'home' && (
        <HomeScreen
          onStart={() => setActiveScreen('play')}
          session={session}
          isLoading={isSessionLoading}
        />
      )}
      {activeScreen === 'play' && <PlayScreen onFinish={finishGame} />}
      {activeScreen === 'game-over' && (
        <GameOverScreen
          onHome={() => setActiveScreen('home')}
          onRestart={() => setActiveScreen('play')}
          onSave={() => console.log('Saved!')}
          score={finalScore}
        />
      )}

      {/* Unauthorized College Domain / Auth Error Modal */}
      <AuthErrorModal
        isOpen={Boolean(authError)}
        title={authError?.title}
        message={authError?.message}
        onRetry={handleRetryLogin}
        onClose={() => setAuthError(null)}
      />
    </ArcadeShell>
  )
}

export default App
