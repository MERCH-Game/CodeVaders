import { useEffect, useRef } from 'react'
import { gameOverSound } from '../../assets/assets.js'
import gameLogo from '../../assets/images/game_logo.png'
import gameOverImg from '../../assets/images/game_over.png'
import playAgainIcon from '../../assets/icons/play_again.png'
import saveIcon from '../../assets/icons/save_icon.png'
import homeIcon from '../../assets/icons/home.png'
import IconButton from '../../components/arcade/IconButton.jsx'

export default function GameOverScreen({ onRestart, onSave, onHome, score = 9999 }) {
  const sfxRef = useRef(null)

  useEffect(() => {
    const sfx = new window.Audio(gameOverSound)
    sfx.volume = 1.0
    sfxRef.current = sfx
    sfx.play().catch(() => { })

    return () => {
      sfx.pause()
      sfx.currentTime = 0
      sfxRef.current = null
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-evenly w-full h-full px-[8%] py-[4%] text-center">

      {/* ── Top group: CodeVaders logo + GAME OVER title ──── */}
      <div className="flex flex-col items-center gap-1 w-full shrink-0 select-none">
        <img
          src={gameLogo}
          alt="CodeVaders"
          draggable="false"
          className="w-[72%] max-h-[12vh] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] pointer-events-none select-none"
        />
        <img
          src={gameOverImg}
          alt="Game Over"
          draggable="false"
          className="w-[108%] max-w-none max-h-[18vh] object-contain drop-shadow-[0_4px_18px_rgba(200,0,0,0.6)] animate-flicker pointer-events-none select-none"
        />
      </div>

      {/* ── Score panel — rectangular ─────────────────────────── */}
      <div className="w-[65%] shrink-0 aspect-[2/1] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-arcade-panel/90 p-[5%] shadow-[0_0_28px_rgba(244,168,255,0.30),inset_0_0_22px_rgba(0,0,0,0.5)]" style={{ containerType: 'inline-size' }}>
        <span className="font-pixel text-arcade-pink uppercase tracking-wider text-center" style={{ fontSize: '8cqi', lineHeight: 1.7 }}>
          Final Score
        </span>
        <strong
          className="font-pixel text-arcade-yellow leading-none text-center whitespace-nowrap [text-shadow:0_3px_0_#9c5420,0_0_20px_rgba(255,200,60,0.55)] max-w-full"
          style={{ fontSize: `clamp(8cqi, ${110 / Math.max((typeof score === 'number' ? score.toLocaleString() : String(score)).length, 1)}cqi, 20cqi)` }}
        >
          {typeof score === 'number' ? score.toLocaleString() : score}
        </strong>
      </div>

      {/* ── Action buttons — single horizontal row ────────── */}
      <div className="flex flex-row items-center justify-center gap-[6%] w-full shrink-0 px-[4%]">
        <IconButton ariaLabel="Play again" onClick={onRestart} icon={playAgainIcon} className="w-[28%] aspect-square flex items-center justify-center" />
        <IconButton ariaLabel="Save progress" onClick={onSave} icon={saveIcon} className="w-[28%] aspect-square flex items-center justify-center" />
        <IconButton ariaLabel="Go to home screen" onClick={onHome} icon={homeIcon} className="w-[28%] aspect-square flex items-center justify-center" />
      </div>

    </div>
  )
}
