// =============================================================================
// assets.js — Central barrel file for all static assets
// Import from this file anywhere in the project:
//   import { bgImage, buttonSound } from '@/assets/assets.js'
// =============================================================================

// ---------------------------------------------------------------------------
// Images — Game UI & Backgrounds
// ---------------------------------------------------------------------------
import acLogo      from './images/ac_logo.png'
import acName      from './images/ac_name.png'
import bg          from './images/bg.png'
import gameLogo    from './images/game_logo.png'
import hero        from './images/hero.png'
import playerLinux from './images/player_linux.png'
import sample1Btn  from './images/sample1btn.png'
import sample2Btn  from './images/sample2btn.png'

// Images — Enemy Sprites
import commonBug       from './images/common_bug.png'
import commonBugBlast  from './images/common_bug_blast.png'
import commonBugBullet from './images/common_bug_bullet.png'
import criticalBug     from './images/critical_bug.png'
import criticalBugBlast from './images/critical_bug_blast.png'
import ddosBug         from './images/ddos_bug.png'
import ddosOrb         from './images/ddos_orb.png'
import wormBug         from './images/worm_bug.png'
import wormBugFace     from './images/worm_bug_face.png'
import wormBugSegment  from './images/worm_bug_segment.png'

// ---------------------------------------------------------------------------
// Audio — Game SFX & Music
// ---------------------------------------------------------------------------
import buttonSound      from './audio/Button.mp3'
import defeatSound      from './audio/Defeat.mp3'
import enemyHitSound    from './audio/Enemy_hit.mp3'
import bgMusic          from './audio/bg_music.mp3'
import gameOverSound    from './audio/game_over.mp3'
import playerHitSound   from './audio/player_hit.mp3'
import pythonPowerup    from './audio/python_powerup.mp3'

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
  commonBugBullet,
  criticalBug,
  criticalBugBlast,
  ddosBug,
  ddosOrb,
  wormBug,
  wormBugFace,
  wormBugSegment,
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
}

// Flat named exports (for direct destructuring)
export {
  // Images
  acLogo, acName, bg, gameLogo, hero, playerLinux, sample1Btn, sample2Btn,
  commonBug, commonBugBlast, commonBugBullet, criticalBug, criticalBugBlast, ddosBug, ddosOrb, wormBug,
  wormBugFace, wormBugSegment,
  // Audio
  buttonSound, defeatSound, enemyHitSound, bgMusic, gameOverSound,
  playerHitSound, pythonPowerup,
}
