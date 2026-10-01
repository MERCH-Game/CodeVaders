import { useState } from 'react'
import ArcadeShell from './components/arcade/ArcadeShell.jsx'
import GameOverScreen from './screens/GameOverScreen/GameOverScreen.jsx'
import HomeScreen from './screens/HomeScreen/HomeScreen.jsx'
import PlayScreen from './screens/PlayScreen/PlayScreen.jsx'

function App() {
  const [activeScreen, setActiveScreen] = useState('home')

  return (
    <ArcadeShell hideVolume={activeScreen === 'play'}>
      {activeScreen === 'home' && <HomeScreen onStart={() => setActiveScreen('play')} />}
      {activeScreen === 'play' && <PlayScreen onFinish={() => setActiveScreen('game-over')} />}
      {activeScreen === 'game-over' && (
        <GameOverScreen
          onHome={() => setActiveScreen('home')}
          onRestart={() => setActiveScreen('play')}
          onSave={() => console.log('Saved!')}
        />
      )}
    </ArcadeShell>
  )
}

export default App
