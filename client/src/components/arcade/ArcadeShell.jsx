import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import ArcadeFrame from './ArcadeFrame.jsx'
import { bgMusic } from '../../assets/assets.js'
import muteIcon from '../../assets/icons/mute.png'
import unmuteIcon from '../../assets/icons/unmute.png'
import IconButton from './IconButton.jsx'

export const MusicContext = createContext({
  isMuted: false,
  toggleMusic: () => {}
})

export function useMusic() {
  return useContext(MusicContext)
}

export default function ArcadeShell({ children, hideVolume = false }) {
  const [isMuted, setIsMuted] = useState(false)
  const musicRef = useRef(null)

  useEffect(() => {
    const music = new window.Audio(bgMusic)
    music.loop = true
    music.volume = 1.0
    musicRef.current = music

    const tryPlay = () => {
      if (music.paused) {
        music.play()
          .then(() => setIsMuted(false))
          .catch(() => setIsMuted(true))
      }
    }

    // Attempt immediate playback
    tryPlay()

    // Browsers block autoplay unless the user interacts. 
    // This listener starts the music on the very first interaction.
    const onInteract = () => {
      tryPlay()
      document.removeEventListener('click', onInteract)
      document.removeEventListener('keydown', onInteract)
      document.removeEventListener('touchstart', onInteract)
    }

    document.addEventListener('click', onInteract)
    document.addEventListener('keydown', onInteract)
    document.addEventListener('touchstart', onInteract)

    // Cleanup global window hacks from before
    if (window.setGameMuted) delete window.setGameMuted;

    return () => {
      music.pause()
      music.currentTime = 0
      musicRef.current = null
      document.removeEventListener('click', onInteract)
      document.removeEventListener('keydown', onInteract)
      document.removeEventListener('touchstart', onInteract)
    }
  }, [])

  const toggleMusic = () => {
    const music = musicRef.current
    if (!music) return

    if (isMuted) {
      music.play().then(() => setIsMuted(false)).catch(() => setIsMuted(true))
      return
    }

    music.pause()
    setIsMuted(true)
  }

  return (
    <MusicContext.Provider value={{ isMuted, toggleMusic }}>
      <div className="flex w-full h-[100svh] items-center justify-center bg-arcade-bg overflow-hidden">
      {/* 
        Responsive behavior:
        - Mobile: Full width/height (w-full h-full)
        - Tablet/Desktop: Constrained to max-w-md, with aspect-[9/16], centered.
      */}
      <div className="relative w-full h-[100dvh] sm:max-w-md sm:border-x-[12px] sm:border-gray-900 sm:shadow-[0_0_50px_rgba(123,44,255,0.3)] bg-black overflow-hidden flex flex-col isolation-auto transition-all duration-300">
        
        {/* Global Mute Toggle Overlay (top right) */}
        {!hideVolume && (
          <div className="absolute top-3 right-3 z-50 w-8 max-w-[3rem] opacity-90 hover:opacity-100 transition-opacity">
            <IconButton 
              icon={isMuted ? muteIcon : unmuteIcon}
              ariaLabel={isMuted ? 'Unmute background music' : 'Mute background music'}
              onClick={toggleMusic}
            />
          </div>
        )}

        <ArcadeFrame>
          <div className="flex-1 flex flex-col items-center justify-center w-full h-full">
            <div className="w-full h-full max-h-[100dvh] aspect-[9/16] mx-auto flex flex-col relative">
              {children}
            </div>
          </div>
        </ArcadeFrame>
      </div>
    </div>
    </MusicContext.Provider>
  )
}
