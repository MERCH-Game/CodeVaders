export default function GameHUD({ score, time, lives }) {
  return (
    <div className="flex flex-row items-center justify-between w-full p-4 bg-arcade-panel/80 border-b-2 border-arcade-purple/50 backdrop-blur-sm z-20">
      
      <div className="flex flex-col">
        <span className="font-pixel text-[8px] text-arcade-pink mb-1 uppercase tracking-wider">Score</span>
        <span className="font-pixel text-[12px] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          {score.toString().padStart(4, '0')}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-pixel text-[8px] text-arcade-pink mb-1 uppercase tracking-wider">Time</span>
        <span className="font-pixel text-[12px] text-white">
          {time}
        </span>
      </div>

      <div className="flex flex-col items-end">
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
