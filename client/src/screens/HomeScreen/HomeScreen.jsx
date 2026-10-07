import acName from '../../assets/images/ac_name.png'
import gameLogo from '../../assets/images/game_logo.png'
import startButton from '../../assets/images/sample1btn.png'
import IconButton from '../../components/arcade/IconButton.jsx'

export default function HomeScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-evenly w-full h-full px-[8%] py-[8%] text-center relative">
      
      {/* Brand Lockup */}
      <div className="flex flex-col items-center gap-2 w-full shrink-0 mt-[10%] select-none">
        <img 
          className="w-[85%] max-h-[25vh] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-none select-none" 
          src={acName} 
          alt="Application Club" 
          draggable="false"
        />
        <img 
          className="w-[95%] max-h-[30vh] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)] -mt-4 animate-neon pointer-events-none select-none" 
          src={gameLogo} 
          alt="CodeVaders" 
          draggable="false"
        />
      </div>

      {/* Start Button */}
      <div className="w-[50%] max-w-[200px] shrink-0 mb-[15%]">
        <IconButton 
          icon={startButton}
          ariaLabel="Start Game"
          onClick={onStart}
          className="w-full animate-flicker hover:animate-none"
        />
      </div>

    </div>
  )
}
