import gameLogo from '../assets/images/game_logo.png'
import gameOverImg from '../assets/images/game_over.png'
import playAgainIcon from '../assets/icons/play_again.png'
import saveIcon from '../assets/icons/save_icon.png'
import homeIcon from '../assets/icons/home.png'
import ScreenFrame from './ScreenFrame.jsx'
import './GameOverScreen.css'

const BTN_CLS = `
  p-0 border-0 bg-transparent cursor-pointer shrink-0
  transition-[transform,filter] duration-[120ms] ease-in-out
  hover:brightness-110 hover:-translate-y-1
  active:brightness-90 active:translate-y-0.5
  focus-visible:outline-3 focus-visible:outline-[#f4a8ff] focus-visible:outline-offset-2
`.trim()

export default function GameOverScreen({ onRestart, onSave, onHome, score = 1240 }) {
  return (
    <ScreenFrame screenName="Game over screen" className="game-over-layout">
      {/*
        3 flex children → justify-evenly gives equal space around each:
          [top group: logo + game-over]  [score panel]  [buttons]
        Score panel lands naturally in the vertical centre.
        overflow-hidden prevents any bleed outside the 9:16 frame.
      */}
      <div className="flex flex-col items-center justify-evenly w-full h-full px-[8%] py-[4%] overflow-hidden text-center">

        {/* ── Top group: CodeVaders logo + GAME OVER title ──── */}
        {/* Grouped so they count as ONE flex child, pushing score to centre */}
        <div className="flex flex-col items-center gap-1 w-full shrink-0">
          <img
            src={gameLogo}
            alt="CodeVaders"
            className="w-[72%] max-h-[12%] object-contain
                       drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />
          <img
            src={gameOverImg}
            alt="Game Over"
            className="w-[108%] max-w-none max-h-[18%] object-contain
                       drop-shadow-[0_4px_18px_rgba(200,0,0,0.6)]
                       animate-[go-flicker_3.5s_ease-in-out_infinite]"
          />
        </div>

        {/* ── Score panel — square ─────────────────────────── */}
        {/*
          container-type: inline-size set in CSS so child fonts use cqi.
          aspect-ratio: 1/1 set in CSS (Tailwind aspect-square works here too,
          but CSS rule pairs it with container-type cleanly).
          w-[55%]: wide enough that 26cqi score number fits without overflow.
          No pixel max-w — percentage drives the size at every breakpoint.
        */}
        <div className="go-score-panel w-[55%] shrink-0
                        flex flex-col items-center justify-center gap-[6%]
                        rounded-2xl border-2 border-white/30
                        bg-[rgba(12,4,28,0.92)] p-[8%]
                        shadow-[0_0_28px_rgba(244,168,255,0.30),inset_0_0_22px_rgba(0,0,0,0.5)]">
          <span className="go-score-label text-[#f4a8ff] uppercase tracking-wider leading-relaxed">
            Final<br />Score
          </span>
          <strong className="go-score-value text-[#ffe36e] leading-none
                              [text-shadow:0_3px_0_#9c5420,0_0_20px_rgba(255,200,60,0.55)]">
            {score.toLocaleString()}
          </strong>
        </div>

        {/* ── Action buttons — single horizontal row ────────── */}
        {/*
          Three equal square icons side-by-side.
          w-[26%] each + gap-[4%]: 3×26 + 2×4 = 86% total — fits inside px-[8%].
          justify-center keeps the row centred.
        */}
        <div className="flex flex-row items-center justify-center gap-[4%] w-full shrink-0">

          {/* Play Again — scale-[0.82] matches home icon's visual footprint */}
          <button aria-label="Play again" type="button" onClick={onRestart} className={`${BTN_CLS} w-[26%]`}>
            <img src={playAgainIcon} alt="" className="block w-full h-auto scale-[0.82]" />
          </button>

          {/* Save Progress — same visual equalisation */}
          <button aria-label="Save progress" type="button" onClick={onSave} className={`${BTN_CLS} w-[26%]`}>
            <img src={saveIcon} alt="" className="block w-full h-auto scale-[0.82]" />
          </button>

          {/* Home — reference size, no scale adjustment needed */}
          <button aria-label="Go to home screen" type="button" onClick={onHome} className={`${BTN_CLS} w-[26%]`}>
            <img src={homeIcon} alt="" className="block w-full h-auto" />
          </button>

        </div>
      </div>
    </ScreenFrame>
  )
}