import ScreenFrame from './ScreenFrame.jsx'
import './GameOverScreen.css'

export default function GameOverScreen({ onRestart, onHome }) {
  return (
    <ScreenFrame screenName="Game over screen" className="game-over-layout">
      <div className="screen-content">
        <p className="screen-eyebrow">Round complete</p>
        <div className="result-badge" aria-hidden="true">★</div>
        <div>
          <h1 className="screen-title">Game<br />over</h1>
          <p className="screen-copy">The merch made it out in one piece.</p>
        </div>
        <div className="score-panel">
          <span className="score-label">Final score</span>
          <strong className="score-value">1,240</strong>
        </div>
        <div className="screen-actions">
          <button className="game-button" onClick={onRestart} type="button">
            Play again
          </button>
          <button className="game-button" onClick={onHome} type="button">
            Home screen
          </button>
        </div>
      </div>
    </ScreenFrame>
  )
}