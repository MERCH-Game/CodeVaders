import React, { useState, useEffect, useRef } from 'react'
import playerLinux from '../../assets/images/player_linux.png'
import commonBugImg from '../../assets/images/common_bug.png'
import commonBugBlastImg from '../../assets/images/common_bug_blast.png'
import criticalBugImg from '../../assets/images/critical_bug.png'
import criticalBugBlastImg from '../../assets/images/critical_bug_blast.png'
import { GameEngine } from '../../game/GameEngine.js'
import { EnemySpawner } from '../../game/EnemySpawner.js'

import GameHUD from '../../components/game/GameHUD.jsx'

import closeIcon from '../../assets/icons/close.png'
import muteIcon from '../../assets/icons/mute.png'
import unmuteIcon from '../../assets/icons/unmute.png'
import homeIcon from '../../assets/icons/home.png'
import moveLeftIcon from '../../assets/icons/move_left.png'
import moveRightIcon from '../../assets/icons/move_right.png'

export default function PlayScreen({ onFinish }) {
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [playerPosition, setPlayerPosition] = useState(50)
  const playfieldRef = useRef(null)
  const playerRef = useRef(null)
  const directionRef = useRef(0)
  const movementFrame = useRef(null)
  const previousFrameTime = useRef(null)
  const playerPositionRef = useRef(playerPosition)
  const [lives, setLives] = useState(3)
  const canvasRef = useRef(null)
  const engineRef = useRef(null)

  const toggleMute = () => setIsMuted(!isMuted)
  const getHorizontalBounds = (playfieldWidth, playerWidth) => {
    if (!playfieldWidth || !playerRef.current) return { left: 0, right: 100 }

    const emSize = Number.parseFloat(window.getComputedStyle(playerRef.current).fontSize)
    return {
      left: (playerWidth / 2 + emSize * 1.4) / playfieldWidth * 100,
      right: 100 - (playerWidth / 2 + emSize * 1.3) / playfieldWidth * 100,
    }
  }

  const moveFrame = (timestamp) => {
    if (!directionRef.current) return

    if (previousFrameTime.current !== null) {
      const elapsed = Math.min((timestamp - previousFrameTime.current) / 1000, 0.05)
      const playfieldWidth = playfieldRef.current?.clientWidth ?? 0
      const playerWidth = playerRef.current?.offsetWidth ?? 0
      if (playfieldWidth > 0) {
        const bounds = getHorizontalBounds(playfieldWidth, playerWidth)
        const nextPosition = playerPositionRef.current
          + (directionRef.current * 252 * elapsed / playfieldWidth) * 100
        const boundedPosition = Math.max(bounds.left, Math.min(bounds.right, nextPosition))

        playerPositionRef.current = boundedPosition
        setPlayerPosition(boundedPosition)
      }
    }

    previousFrameTime.current = timestamp
    movementFrame.current = window.requestAnimationFrame(moveFrame)
  }

  const startMoving = (event, direction) => {
    event.preventDefault()
    if (movementFrame.current !== null) window.cancelAnimationFrame(movementFrame.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    directionRef.current = direction
    previousFrameTime.current = null
    movementFrame.current = window.requestAnimationFrame(moveFrame)
  }
  const stopMoving = () => {
    directionRef.current = 0
    previousFrameTime.current = null
    if (movementFrame.current !== null) {
      window.cancelAnimationFrame(movementFrame.current)
      movementFrame.current = null
    }
  }

  const handleKeyboardMove = (event, direction) => {
    if (event.detail === 0) {
      const playfieldWidth = playfieldRef.current?.clientWidth ?? 0
      const playerWidth = playerRef.current?.offsetWidth ?? 0
      const bounds = getHorizontalBounds(playfieldWidth, playerWidth)
      playerPositionRef.current = Math.max(
        bounds.left,
        Math.min(bounds.right, playerPositionRef.current + direction * 5),
      )
      setPlayerPosition(playerPositionRef.current)
    }
  }

  useEffect(() => () => {
    if (movementFrame.current !== null) window.cancelAnimationFrame(movementFrame.current)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return;

    // Load images
    const images = {};
    let loadedCount = 0;
    const sources = {
      commonBug: commonBugImg,
      commonBugBlast: commonBugBlastImg,
      criticalBug: criticalBugImg,
      criticalBugBlast: criticalBugBlastImg
    };

    const initEngine = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Match container size
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const engine = new GameEngine(canvas, () => {
            // On Player Hit
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    onFinish(); // End game
                }
                return newLives;
            });
        });
        
        engineRef.current = engine;
        
        // Setup EnemySpawner
        const spawner = new EnemySpawner(images);
        engine.setSpawner(spawner);

        engine.start();
    };

    const keys = Object.keys(sources);
    if (keys.length === 0) {
        initEngine();
    } else {
        keys.forEach(key => {
            const img = new Image();
            img.src = sources[key];
            img.onload = () => {
                images[key] = img;
                loadedCount++;
                if (loadedCount === keys.length) {
                    initEngine();
                }
            };
        });
    }

    return () => {
        if (engineRef.current) {
            engineRef.current.stop();
        }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
        if (isPaused) {
            engineRef.current.stop();
        } else {
            engineRef.current.start();
        }
    }
  }, [isPaused]);


  return (
    <div className="flex flex-col w-full h-full relative">
      {/* HUD (Top) */}
      <GameHUD time="00:42" lives={lives} onMenuClick={() => setIsPaused(true)} />

      {/* Playfield (Middle) */}
      <div ref={playfieldRef} className="flex-1 relative w-full overflow-hidden flex flex-col items-center justify-center touch-none">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
        <div
          ref={playerRef}
          className="absolute bottom-0 w-[3em] pointer-events-none"
          style={{ left: `${playerPosition}%`, transform: 'translateX(-50%)' }}
        >
          <img src={playerLinux} alt="Player character" className="w-full object-contain drop-shadow-[0_0_15px_rgba(59,130,255,0.7)]" />
        </div>
      </div>

      {/* Controls (Bottom) */}
      <div className="flex w-full items-center justify-between px-6 pb-6 pt-3 bg-gradient-to-t from-arcade-bg to-transparent">
        <button
          type="button"
          aria-label="Move player left"
          onPointerDown={(event) => startMoving(event, -1)}
          onPointerUp={stopMoving}
          onPointerCancel={stopMoving}
          onLostPointerCapture={stopMoving}
          onBlur={stopMoving}
          onClick={(event) => handleKeyboardMove(event, -1)}
          onContextMenu={(event) => event.preventDefault()}
          className="flex h-16 w-16 touch-none select-none items-center justify-center focus-visible:outline-3 focus-visible:outline-arcade-pink focus-visible:outline-offset-2 [-webkit-tap-highlight-color:transparent]"
        >
          <img src={moveLeftIcon} alt="" draggable="false" className="pointer-events-none h-10 w-10 select-none object-contain" />
        </button>
        <button
          type="button"
          aria-label="Move player right"
          onPointerDown={(event) => startMoving(event, 1)}
          onPointerUp={stopMoving}
          onPointerCancel={stopMoving}
          onLostPointerCapture={stopMoving}
          onBlur={stopMoving}
          onClick={(event) => handleKeyboardMove(event, 1)}
          onContextMenu={(event) => event.preventDefault()}
          className="flex h-16 w-16 touch-none select-none items-center justify-center focus-visible:outline-3 focus-visible:outline-arcade-pink focus-visible:outline-offset-2 [-webkit-tap-highlight-color:transparent]"
        >
          <img src={moveRightIcon} alt="" draggable="false" className="pointer-events-none h-10 w-10 select-none object-contain" />
        </button>
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
