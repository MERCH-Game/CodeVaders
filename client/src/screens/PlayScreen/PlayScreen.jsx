import React, { useState, useEffect, useRef } from 'react'
import playerLinux from '../../assets/images/player_linux.png'
import playerHit from '../../assets/images/player_hit.png'
import player2 from '../../assets/images/player2.png'
import player3 from '../../assets/images/player3.png'
import commonBugImg from '../../assets/images/common_bug.png'
import commonBugBlastImg from '../../assets/images/common_bug_blast.png'
import commonBugBulletImg from '../../assets/images/common_bug_bullet.png'
import criticalBugImg from '../../assets/images/critical_bug.png'
import criticalBugBlastImg from '../../assets/images/critical_bug_blast.png'
import ddosBugImg from '../../assets/images/ddos_bug.png'
import ddosOrbImg from '../../assets/images/ddos_orb.png'
import wormBugImg from '../../assets/images/worm_bug.png'
import wormBugFaceImg from '../../assets/images/worm_bug_face.png'
import wormBugSegmentImg from '../../assets/images/worm_bug_segment.png'
import claudePowerUpImg from '../../assets/images/claude.png'
import cppPowerUpImg from '../../assets/images/cpp.png'
import javaPowerUpImg from '../../assets/images/java.png'
import pythonPowerUpImg from '../../assets/images/python.png'
import croshairImg from '../../assets/images/croshair.png'
import rocketImg from '../../assets/images/rocket.png'
import rocket2Img from '../../assets/images/rocket2.png'
import rocket3Img from '../../assets/images/rocket3.png'
import { GameEngine } from '../../game/GameEngine.js'
import { EnemySpawner } from '../../game/EnemySpawner.js'
import { PowerUpSpawner } from '../../game/PowerUpSpawner.js'
import { useMusic } from '../../components/arcade/ArcadeShell.jsx'
import { enemyHitSound, laserSound, powerUpPickupSound, rocketSound } from '../../assets/assets.js'

import GameHUD from '../../components/game/GameHUD.jsx'

import closeIcon from '../../assets/icons/close.png'
import muteIcon from '../../assets/icons/mute.png'
import unmuteIcon from '../../assets/icons/unmute.png'
import homeIcon from '../../assets/icons/home.png'
import moveLeftIcon from '../../assets/icons/move_left.png'
import moveRightIcon from '../../assets/icons/move_right.png'

export default function PlayScreen({ onFinish }) {
  const [isPaused, setIsPaused] = useState(false)
  const { isMuted, toggleMusic } = useMusic()
  const playerPositionRef = useRef(50)
  const playfieldRef = useRef(null)
  const playerRef = useRef(null)
  const directionRef = useRef(0)
  const movementFrame = useRef(null)
  const previousFrameTime = useRef(null)
  const movementMetricsRef = useRef(null)
  const [lives, setLives] = useState(3)
  const livesRef = useRef(3)
  // Single source of truth: score is strictly elapsed survival time in seconds.
  const [score, setScore] = useState(0)
  const lastSoundTimesRef = useRef({})
  const [isPlayerHit, setIsPlayerHit] = useState(false)
  const playerHitTimerRef = useRef(null)
  const [isPlayerDestroyed, setIsPlayerDestroyed] = useState(false)
  const [destructionFrame, setDestructionFrame] = useState(0)
  const [powerUps, setPowerUps] = useState([])
  const [powerUpGlowKey, setPowerUpGlowKey] = useState(0)
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const gameScreenRef = useRef(null)

  const isMutedRef = useRef(isMuted)
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  const playGameSound = React.useCallback((source, minGapMs = 60) => {
    if (isMutedRef.current) return
    const now = performance.now()
    if (lastSoundTimesRef.current[source] && now - lastSoundTimesRef.current[source] < minGapMs) {
      return
    }
    lastSoundTimesRef.current[source] = now
    const sound = new window.Audio(source)
    sound.play().catch(() => {})
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' || e.key === '`') {
        window.__CODEVADERS_DEV_MODE__ = !window.__CODEVADERS_DEV_MODE__
        if (engineRef.current) {
          engineRef.current.devMode = Boolean(window.__CODEVADERS_DEV_MODE__)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
      const metrics = movementMetricsRef.current
      if (metrics) {
        const nextPosition = playerPositionRef.current
          + (directionRef.current * 252 * elapsed / metrics.playfieldWidth) * 100
        const boundedPosition = Math.max(metrics.bounds.left, Math.min(metrics.bounds.right, nextPosition))

        playerPositionRef.current = boundedPosition
        if (playerRef.current) {
          const offsetX = metrics.playfieldWidth * (boundedPosition - 50) / 100
          playerRef.current.style.transform = `translate3d(calc(-50% + ${offsetX}px), 0, 0)`
        }
        engineRef.current?.setPlayerCenterX(metrics.playfieldWidth * boundedPosition / 100)
      }
    }

    previousFrameTime.current = timestamp
    movementFrame.current = window.requestAnimationFrame(moveFrame)
  }

  const startMoving = (event, direction) => {
    event.preventDefault()
    if (movementFrame.current !== null) window.cancelAnimationFrame(movementFrame.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    const playfieldWidth = playfieldRef.current?.clientWidth ?? 0
    const playerWidth = playerRef.current?.offsetWidth ?? 0
    movementMetricsRef.current = playfieldWidth > 0
      ? { playfieldWidth, bounds: getHorizontalBounds(playfieldWidth, playerWidth) }
      : null
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
      if (playerRef.current) {
        const offsetX = playfieldWidth * (playerPositionRef.current - 50) / 100
        playerRef.current.style.transform = `translate3d(calc(-50% + ${offsetX}px), 0, 0)`
      }
      engineRef.current?.setPlayerCenterX(playfieldWidth * playerPositionRef.current / 100)
    }
  }

  const syncPlayerPosition = (engine) => {
    if (!playerRef.current || !canvasRef.current) return

    const playerBounds = playerRef.current.getBoundingClientRect()
    const canvasBounds = canvasRef.current.getBoundingClientRect()
    engine.setPlayerPosition(
      playerBounds.left - canvasBounds.left,
      playerBounds.top - canvasBounds.top,
      playerBounds.width,
      playerBounds.height,
    )
  }

  useEffect(() => () => {
    if (movementFrame.current !== null) window.cancelAnimationFrame(movementFrame.current)
    if (playerHitTimerRef.current !== null) window.clearTimeout(playerHitTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isPlayerDestroyed) return

    const nextFrameTimer = window.setTimeout(() => setDestructionFrame(1), 900)
    const finishTimer = window.setTimeout(() => onFinish(score), 1400)
    return () => {
      window.clearTimeout(nextFrameTimer)
      window.clearTimeout(finishTimer)
    }
  }, [isPlayerDestroyed, onFinish, score])

  useEffect(() => {
    if (!canvasRef.current) return;

    // Load images
    const images = {};
    const sources = {
      commonBug: commonBugImg,
      commonBugBlast: commonBugBlastImg,
      commonBugBullet: commonBugBulletImg,
      criticalBug: criticalBugImg,
      criticalBugBlast: criticalBugBlastImg,
      ddosBug: ddosBugImg,
      ddosOrb: ddosOrbImg,
      wormBug: wormBugImg,
      wormBugFace: wormBugFaceImg,
      wormBugSegment: wormBugSegmentImg,
      claude: claudePowerUpImg,
      cpp: cppPowerUpImg,
      java: javaPowerUpImg,
      python: pythonPowerUpImg,
      autoAimCrosshair: croshairImg,
      rocket1: rocketImg,
      rocket2: rocket2Img,
      rocket3: rocket3Img,
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
            setIsPlayerHit(true);
            if (playerHitTimerRef.current !== null) window.clearTimeout(playerHitTimerRef.current);
            playerHitTimerRef.current = window.setTimeout(() => {
              setIsPlayerHit(false);
              playerHitTimerRef.current = null;
            }, 500);
            playerRef.current?.animate([
              { filter: 'drop-shadow(0 0 0 rgba(255, 0, 0, 0))' },
              { filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 1)) drop-shadow(0 0 20px rgba(255, 0, 0, 0.8))' },
              { filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.7)) drop-shadow(0 0 12px rgba(255, 0, 0, 0.45))' },
              { filter: 'drop-shadow(0 0 0 rgba(255, 0, 0, 0))' },
            ], { duration: 500, easing: 'ease-out' });
            gameScreenRef.current?.animate([
              { transform: 'translate(0, 0)', boxShadow: 'inset 0 0 0 rgba(255, 0, 0, 0)' },
              { transform: 'translate(-3px, 2px)', boxShadow: 'inset 0 0 32px rgba(255, 0, 0, 0.55)' },
              { transform: 'translate(3px, -2px)', boxShadow: 'inset 0 0 24px rgba(255, 0, 0, 0.35)' },
              { transform: 'translate(-2px, -1px)', boxShadow: 'inset 0 0 12px rgba(255, 0, 0, 0.18)' },
              { transform: 'translate(0, 0)', boxShadow: 'inset 0 0 0 rgba(255, 0, 0, 0)' },
            ], { duration: 360, easing: 'ease-out' });
            if (livesRef.current <= 0) return;
            const newLives = livesRef.current - 1;
            livesRef.current = newLives;
            setLives(newLives);
            if (newLives === 0) {
              setIsPlayerDestroyed(true);
              const finalScore = engineRef.current ? Math.floor(engineRef.current.getElapsedTime()) : 0;
              setScore(finalScore);
              engineRef.current?.stop();
              stopMoving();
            }
        }, setPowerUps, () => {
          setPowerUpGlowKey(key => key + 1)
          playGameSound(powerUpPickupSound)
        }, () => {
          playGameSound(laserSound)
          gameScreenRef.current?.animate([
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-3px, 2px)' },
            { transform: 'translate(3px, -2px)' },
            { transform: 'translate(-2px, -1px)' },
            { transform: 'translate(2px, 1px)' },
            { transform: 'translate(0, 0)' },
          ], { duration: 320, easing: 'ease-out' });
        }, () => playGameSound(enemyHitSound, 60), () => playGameSound(rocketSound, 80), (timeInSec) => {
          setScore(timeInSec);
        });

        engine.autoAimImages = images;
        engine.images = images;
        
        engineRef.current = engine;
        syncPlayerPosition(engine);
        
        // Setup EnemySpawner with DifficultyController
        const spawner = new EnemySpawner(images);
        engine.setSpawner(spawner);
        engine.setPowerUpSpawner(new PowerUpSpawner(images));

        engine.start();
    };

    initEngine();

    const keys = Object.keys(sources);
    keys.forEach(key => {
        const img = new Image();
        img.onload = () => {
            images[key] = img;
        };
        img.onerror = () => {
            console.error(`Failed to load game image: ${key}`, sources[key]);
        };
        img.src = sources[key];
    });

    return () => {
        if (engineRef.current) {
            engineRef.current.stop();
        }
    };
  }, [playGameSound]);

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
    <div ref={gameScreenRef} className="flex flex-col w-full h-full relative select-none">
      {/* HUD (Top) */}
      <GameHUD score={score} lives={lives} onMenuClick={() => setIsPaused(true)} />

      {/* Playfield (Middle) */}
      <div ref={playfieldRef} className="flex-1 relative w-full overflow-hidden flex flex-col items-center justify-center touch-none select-none">
        <canvas ref={canvasRef} tabIndex="-1" className="absolute inset-0 block w-full h-full select-none outline-none focus:outline-none" />
        <div
          ref={playerRef}
          className="absolute bottom-24 w-[3em] pointer-events-none select-none"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <img src={isPlayerHit ? playerHit : isPlayerDestroyed ? (destructionFrame === 0 ? player2 : player3) : playerLinux} alt="Player character" draggable="false" className="w-full object-contain drop-shadow-[0_0_15px_rgba(59,130,255,0.7)] select-none pointer-events-none" />
        </div>
      </div>

      {/* Power-up inventory */}
      <div
        key={powerUpGlowKey}
        className={`absolute bottom-24 left-6 z-10 flex flex-col items-start gap-1 select-none ${
          powerUpGlowKey > 0 ? 'animate-power-up-pickup' : ''
        }`}
      >
        <div className="flex flex-col gap-1.5" aria-label="Power-up inventory">
          {Array.from({ length: 3 }, (_, index) => {
            const powerUp = powerUps[index]
            const imageSources = {
              claude: claudePowerUpImg,
              cpp: cppPowerUpImg,
              java: javaPowerUpImg,
              python: pythonPowerUpImg,
            }

            return (
              <button
                key={powerUp?.id ?? `empty-${index}`}
                type="button"
                disabled={!powerUp}
                aria-label={powerUp ? `Use ${powerUp.type} power-up` : 'Empty power-up slot'}
                onClick={() => engineRef.current?.consumePowerUp(index)}
                className={`flex h-10 w-10 select-none items-center justify-center rounded border border-white/20 ${
                  powerUp ? 'bg-arcade-panel hover:border-arcade-blue active:scale-95' : 'bg-white/15'
                }`}
              >
                {powerUp && (
                  <img src={imageSources[powerUp.type]} alt="" draggable="false" className="h-7 w-7 select-none pointer-events-none object-contain" />
                )}
              </button>
            )
          })}
        </div>
        {powerUps.length > 0 && (
          <span className="w-10 text-center text-[10px] leading-tight text-white/70">
            Tap
          </span>
        )}
      </div>

      {/* Controls (Bottom) */}
      <div className="absolute bottom-0 left-0 z-10 flex w-full items-center justify-between px-6 pb-6 pt-3 bg-gradient-to-t from-arcade-bg to-transparent">
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
              className="absolute -top-4 -right-4 w-10 h-10 select-none hover:scale-110 active:scale-95 transition-transform bg-arcade-red rounded-full p-1 border-2 border-white shadow-[0_0_10px_rgba(255,59,78,0.8)]"
            >
              <img src={closeIcon} alt="Close" draggable="false" className="w-full h-full object-contain pointer-events-none select-none" />
            </button>
            
            <h2 className="font-pixel text-2xl text-white mb-8 mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] uppercase text-center w-full border-b-2 border-arcade-purple/50 pb-4 select-none">
              Paused
            </h2>
            
            <div className="flex flex-col gap-6 w-full px-2 select-none">
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
                onClick={toggleMusic}
                className="flex items-center justify-between group hover:bg-white/5 p-2 -mx-2 rounded transition-colors select-none"
              >
                <span className="font-pixel text-sm text-white group-hover:text-arcade-pink transition-colors uppercase">
                  {isMuted ? "Unmute Background Music" : "Mute Background Music"}
                </span>
                <div className="w-8 h-8 group-hover:scale-110 transition-transform">
                  <img src={isMuted ? muteIcon : unmuteIcon} alt="Toggle Sound" draggable="false" className="w-full h-full object-contain pointer-events-none select-none" />
                </div>
              </button>
              
              {/* End Session */}
              <button 
                onClick={() => onFinish(score)}
                className="flex items-center justify-between group mt-4 hover:bg-white/5 p-2 -mx-2 rounded transition-colors select-none"
              >
                <span className="font-pixel text-sm text-arcade-red group-hover:text-red-400 transition-colors uppercase drop-shadow-[0_0_5px_rgba(255,59,78,0.5)]">
                  End Session
                </span>
                <div className="w-8 h-8 group-hover:scale-110 transition-transform">
                  <img src={homeIcon} alt="End Session" draggable="false" className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] pointer-events-none select-none" />
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
