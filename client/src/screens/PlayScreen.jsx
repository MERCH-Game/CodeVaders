import commonBug from '../assets/images/common_bug.png'
import criticalBug from '../assets/images/critical_bug.png'
import playerLinux from '../assets/images/player_linux.png'
import ScreenFrame from './ScreenFrame.jsx'
import './PlayScreen.css'

export default function PlayScreen({ onFinish }) {
  return (
    <ScreenFrame screenName="Play screen" className="play-layout">
      <div className="screen-content">
        <div className="game-hud" aria-label="Game status">
          <span className="hud-chip">Score&nbsp; 0120</span>
          <span className="hud-chip">Time&nbsp; 00:42</span>
          <span className="hud-chip" aria-label="Three lives">♥ ♥ ♥</span>
        </div>
        <div className="playfield-art" aria-label="Player fighting bugs">
          <img src={commonBug} alt="Common bug" />
          <img src={criticalBug} alt="Critical bug" />
          <img src={playerLinux} alt="Player character" />
        </div>
        <div className="screen-actions">
          <p className="play-prompt">Tap the bugs to defend your merch</p>
          <button className="game-button" onClick={onFinish} type="button">
            End round
          </button>
        </div>
      </div>
    </ScreenFrame>
  )
}