import { useState } from 'react'
import ArcadeShell from './components/arcade/ArcadeShell.jsx'
import GameOverScreen from './screens/GameOverScreen/GameOverScreen.jsx'
import HomeScreen from './screens/HomeScreen/HomeScreen.jsx'
import PlayScreen from './screens/PlayScreen/PlayScreen.jsx'

function App() {
  const [activeScreen, setActiveScreen] = useState('home')
  const [finalScore, setFinalScore] = useState(0)

  const finishGame = (score) => {
    setFinalScore(score)
    setActiveScreen('game-over')
  }

  return (
    <ArcadeShell hideVolume={activeScreen === 'play'}>
      {activeScreen === 'home' && <HomeScreen onStart={() => setActiveScreen('play')} />}
      {activeScreen === 'play' && <PlayScreen onFinish={finishGame} />}
      {activeScreen === 'game-over' && (
        <GameOverScreen
          onHome={() => setActiveScreen('home')}
          onRestart={() => setActiveScreen('play')}
          onSave={() => console.log('Saved!')}
          score={finalScore}
        />
      )}
    </ArcadeShell>
  )
}

export default App
