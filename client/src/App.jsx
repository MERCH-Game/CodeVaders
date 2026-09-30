import { useState } from 'react'
import './App.css'
import GameOverScreen from './screens/GameOverScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import PlayScreen from './screens/PlayScreen.jsx'
import './screens/Screens.css'

function App() {
  const [activeScreen, setActiveScreen] = useState('home')

  return (
    <main className="app-shell">
      <div className="screen-stage">
        {activeScreen === 'home' && <HomeScreen onStart={() => setActiveScreen('play')} />}
        {activeScreen === 'play' && <PlayScreen onFinish={() => setActiveScreen('game-over')} />}
        {activeScreen === 'game-over' && (
          <GameOverScreen
            onHome={() => setActiveScreen('home')}
            onRestart={() => setActiveScreen('play')}
          />
        )}
      </div>
    </main>
  )
}

export default App
