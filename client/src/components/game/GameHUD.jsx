import menuIcon from '../../assets/icons/menu.png'

export default function GameHUD({ score, lives, onMenuClick }) {
  return (
    <div className="flex flex-row items-center justify-between w-full p-4 bg-arcade-panel/80 border-b-2 border-arcade-purple/50 backdrop-blur-sm z-20">
      
      <div className="flex flex-col">
        <button 
          onClick={onMenuClick}
          className="w-8 h-8 md:w-10 md:h-10 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center bg-black/40 rounded-lg border border-arcade-purple/50 shadow-[0_0_10px_rgba(157,78,221,0.3)]"
        >
          <img src={menuIcon} alt="Menu" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
        </button>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-pixel text-[8px] text-arcade-pink mb-1 uppercase tracking-wider">Score</span>
        <span className="font-pixel text-[12px] text-white">
          {score}
        </span>
      </div>

      <div className="flex flex-col items-end min-w-[32px] md:min-w-[40px]">
        <span className="font-pixel text-[8px] text-arcade-pink mb-1 uppercase tracking-wider">Lives</span>
        <div className="flex gap-1 text-arcade-red text-[12px] font-pixel drop-shadow-[0_0_5px_rgba(255,59,78,0.8)]">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i}>♥</span>
          ))}
        </div>
      </div>

    </div>
  )
}
