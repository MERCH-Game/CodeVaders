import React, { useState } from 'react'
import commonBug from '../../assets/images/common_bug.png'
import criticalBug from '../../assets/images/critical_bug.png'
import playerLinux from '../../assets/images/player_linux.png'
import ArcadeButton from '../../components/arcade/ArcadeButton.jsx'
import GameHUD from '../../components/game/GameHUD.jsx'

import closeIcon from '../../assets/icons/close.png'
import muteIcon from '../../assets/icons/mute.png'
import unmuteIcon from '../../assets/icons/unmute.png'
import homeIcon from '../../assets/icons/home.png'

export default function PlayScreen({ onFinish }) {
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const lives = 3 // Assuming static for now as per original code

  const toggleMute = () => setIsMuted(!isMuted)

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* HUD (Top) */}
      <GameHUD time="00:42" lives={lives} onMenuClick={() => setIsPaused(true)} />

      {/* Playfield (Middle) */}
      <div className="flex-1 relative w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Placeholder arrangement matching original logic */}
        <div className="absolute top-[20%] left-[15%] w-[25%] animate-flicker">
          <img src={commonBug} alt="Common bug" className="w-full object-contain drop-shadow-[0_0_10px_rgba(255,59,78,0.5)]" />
        </div>
        <div className="absolute top-[15%] right-[10%] w-[35%] animate-neon">
          <img src={criticalBug} alt="Critical bug" className="w-full object-contain drop-shadow-[0_0_15px_rgba(244,168,255,0.7)]" />
        </div>
        <div className="absolute bottom-[10%] w-[30%]">
          <img src={playerLinux} alt="Player character" className="w-full object-contain drop-shadow-[0_0_15px_rgba(59,130,255,0.7)]" />
        </div>
      </div>

      {/* Controls (Bottom) */}
      <div className="p-[6%] pb-[8%] flex flex-col items-center gap-4 bg-gradient-to-t from-arcade-bg to-transparent">
        <p className="font-sans font-bold text-[14px] text-white/80 text-center uppercase tracking-widest">
          Tap the bugs to defend your merch
        </p>
        <div className="w-[80%]">
          <ArcadeButton onClick={onFinish}>
            End Round
          </ArcadeButton>
        </div>
      </div>

      {/* Pause Popup */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-arcade-panel border-4 border-arcade-purple rounded-xl p-8 w-full max-w-sm relative flex flex-col items-center shadow-[0_0_30px_rgba(157,78,221,0.6)]">
            
            {/* Close Button (Top Right) */}
            <button 
              onClick={() => setIsPaused(false)}
              className="absolute -top-4 -right-4 w-10 h-10 hover:scale-110 active:scale-95 transition-transform bg-arcade-red rounded-full p-1 border-2 border-white shadow-[0_0_10px_rgba(255,59,78,0.8)]"
            >
              <img src={closeIcon} alt="Close" className="w-full h-full object-contain" />
            </button>
            
            <h2 className="font-pixel text-2xl text-white mb-8 mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] uppercase text-center w-full border-b-2 border-arcade-purple/50 pb-4">
              Paused
            </h2>
            
            <div className="flex flex-col gap-6 w-full px-2">
              {/* Display lives left */}
              <div className="flex items-center justify-between">
                <span className="font-pixel text-sm text-arcade-pink uppercase">Lives Left</span>
                <div className="flex gap-1 text-arcade-red text-[16px] font-pixel drop-shadow-[0_0_5px_rgba(255,59,78,0.8)]">
                  {Array.from({ length: lives }).map((_, i) => (
                    <span key={i}>♥</span>
                  ))}
                </div>
              </div>

              {/* Play / Mute Volume */}
              <button 
                onClick={toggleMute}
                className="flex items-center justify-between group hover:bg-white/5 p-2 -mx-2 rounded transition-colors"
              >
                <span className="font-pixel text-sm text-white group-hover:text-arcade-pink transition-colors uppercase">
                  {isMuted ? "Unmute Sound" : "Mute Sound"}
                </span>
                <div className="w-8 h-8 group-hover:scale-110 transition-transform">
                  <img src={isMuted ? muteIcon : unmuteIcon} alt="Toggle Sound" className="w-full h-full object-contain" />
                </div>
              </button>
              
              {/* End Session */}
              <button 
                onClick={onFinish}
                className="flex items-center justify-between group mt-4 hover:bg-white/5 p-2 -mx-2 rounded transition-colors"
              >
                <span className="font-pixel text-sm text-arcade-red group-hover:text-red-400 transition-colors uppercase drop-shadow-[0_0_5px_rgba(255,59,78,0.5)]">
                  End Session
                </span>
                <div className="w-8 h-8 group-hover:scale-110 transition-transform">
                  <img src={homeIcon} alt="End Session" className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
