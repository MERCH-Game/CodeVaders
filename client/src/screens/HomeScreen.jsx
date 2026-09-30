import { useEffect, useRef, useState } from 'react'
import { bgMusic } from '../assets/assets.js'
import acName from '../assets/images/ac_name.png'
import gameLogo from '../assets/images/game_logo.png'
import startButton from '../assets/images/sample1btn.png'
import muteIcon from '../assets/icons/mute.png'
import unmuteIcon from '../assets/icons/unmute.png'
import ScreenFrame from './ScreenFrame.jsx'
import './HomeScreen.css'

export default function HomeScreen({ onStart }) {
  const [isMuted, setIsMuted] = useState(false)
  const musicRef = useRef(null)

  useEffect(() => {
    const music = new window.Audio(bgMusic)
    music.loop = true
    music.volume = 0.5
    musicRef.current = music
    music.play().catch(() => setIsMuted(true))

    return () => {
      music.pause()
      music.currentTime = 0
      musicRef.current = null
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
    <ScreenFrame screenName="Home screen" className="home-layout">
      <button
        aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
        aria-pressed={isMuted}
        className="music-toggle"
        onClick={toggleMusic}
        type="button"
      >
        <img src={isMuted ? muteIcon : unmuteIcon} alt="" />
      </button>
      <div className="screen-content">
        <div className="brand-lockup">
          <img className="ac-name" src={acName} alt="AC Name" />
          <img className="brand-logo" src={gameLogo} alt="Merch Game" />
        </div>
        <button
          aria-label="Start game"
          className="home-image-button"
          onClick={onStart}
          type="button"
        >
          <img src={startButton} alt="" />
        </button>
      </div>
    </ScreenFrame>
  )
}