import commonBug from '../../assets/images/common_bug.png'
import criticalBug from '../../assets/images/critical_bug.png'
import playerLinux from '../../assets/images/player_linux.png'
import ArcadeButton from '../../components/arcade/ArcadeButton.jsx'
import GameHUD from '../../components/game/GameHUD.jsx'

export default function PlayScreen({ onFinish }) {
  return (
    <div className="flex flex-col w-full h-full">
      {/* HUD (Top) */}
      <GameHUD score={120} time="00:42" lives={3} />

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
    </div>
  )
}
