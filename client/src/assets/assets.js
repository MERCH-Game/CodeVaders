// =============================================================================
// assets.js — Central barrel file for all static assets
// Import from this file anywhere in the project:
//   import { bgImage, buttonSound } from '@/assets/assets.js'
// =============================================================================

// ---------------------------------------------------------------------------
// Images — Game UI & Backgrounds
// ---------------------------------------------------------------------------
import acLogo      from './images/ac_logo.svg'
import acName      from './images/ac_name.svg'
import bg          from './images/bg.svg'
import gameLogo    from './images/game_logo.svg'
import hero        from './images/hero.svg'
import playerLinux from './images/player_linux.svg'
import sample1Btn  from './images/sample1btn.svg'
import sample2Btn  from './images/sample2btn.svg'

// Images — Enemy Sprites
import commonBug       from './images/common_bug.png'
import commonBugBlast  from './images/common_bug_blast.png'
import criticalBug     from './images/critical_bug.png'
import criticalBugBlast from './images/critical_bug_blast.png'

// Images — Misc / Boilerplate (kept for reference)
import heroPng  from './images/hero.png'
import reactSvg from './images/react.svg'
import viteSvg  from './images/vite.svg'

// ---------------------------------------------------------------------------
// Audio — Game SFX & Music
// ---------------------------------------------------------------------------
import buttonSound      from './audio/Button.mp3'
import defeatSound      from './audio/Defeat.mp3'
import enemyHitSound    from './audio/Enemy_hit.mp3'
import bgMusic          from './audio/bg_music.mp3'
import gameOverSound    from './audio/game_over.wav'
import playerHitSound   from './audio/player_hit.mp3'
import pythonPowerup    from './audio/python_powerup.mp3'

// Audio — Test / Reference Sounds
import arcadeUi16       from './audio/floraphonic-arcade-ui-16-229516.mp3'
import arcadeUi6        from './audio/floraphonic-arcade-ui-6-229503.mp3'
import scoringCounter1  from './audio/mixkit-arcade-retro-scoring-counter-273 (1).wav'
import scoringCounter   from './audio/mixkit-arcade-retro-scoring-counter-273.wav'
import blockHit         from './audio/mixkit-electronic-retro-block-hit-2185.wav'
import casinoNotif      from './audio/mixkit-retro-arcade-casino-notification-211.wav'
import arcadeLose       from './audio/mixkit-retro-arcade-lose-2027.wav'
import retroRobot       from './audio/mixkit-retro-robot-sound-1421.wav'

// ---------------------------------------------------------------------------
// Named exports — grouped for easy tree-shaking
// ---------------------------------------------------------------------------
export const Images = {
  acLogo,
  acName,
  bg,
  gameLogo,
  hero,
  playerLinux,
  sample1Btn,
  sample2Btn,
  commonBug,
  commonBugBlast,
  criticalBug,
  criticalBugBlast,
  // Boilerplate (keep for now)
  heroPng,
  reactSvg,
  viteSvg,
}

export const Audio = {
  // Game SFX
  buttonSound,
  defeatSound,
  enemyHitSound,
  bgMusic,
  gameOverSound,
  playerHitSound,
  pythonPowerup,
  // Test / Reference
  arcadeUi16,
  arcadeUi6,
  scoringCounter1,
  scoringCounter,
  blockHit,
  casinoNotif,
  arcadeLose,
  retroRobot,
}

// Flat named exports (for direct destructuring)
export {
  // Images
  acLogo, acName, bg, gameLogo, hero, playerLinux, sample1Btn, sample2Btn,
  commonBug, commonBugBlast, criticalBug, criticalBugBlast,
  heroPng, reactSvg, viteSvg,
  // Audio
  buttonSound, defeatSound, enemyHitSound, bgMusic, gameOverSound,
  playerHitSound, pythonPowerup,
  arcadeUi16, arcadeUi6, scoringCounter1, scoringCounter,
  blockHit, casinoNotif, arcadeLose, retroRobot,
}
