# CodeVaders 🚀👾

An infinite, retro-futuristic arcade space shooter inspired by the legendary classic *Galaga*, built on the **MERN** stack (**M**ongoDB, **E**xpress.js, **R**eact, **N**ode.js).

Designed natively for a **portrait-mode** browser experience (desktop arcade cabinet bezel + mobile touch support), featuring modular registries for extensible enemies, attacks, power-ups, themes, and a competitive global leaderboard.

---

## 🎮 Game Concept & Highlights

- **Infinite Gameplay Loop**: Procedural wave-based escalation where enemy density, flight velocities, attack frequencies, and patterns scale dynamically.
- **Modular Registry Architecture**:
  - `EnemyRegistry`: Plug-and-play enemy archetypes (Scouts, Vanguards, Heavy Gunners, Bosses) with customizable flight paths and behaviors.
  - `AttackRegistry`: Modular bullet patterns (straight lasers, targeted shots, spread blasts, homing projectiles).
  - `PowerUpRegistry`: Drop table and player augmentations (dual/triple blasters, energy shields, rapid overdrive, screen-clearing EMP, and Galaga-inspired dual ships).
  - `ThemeRegistry`: Swappable aesthetic palettes (80s Neon, Cyberpunk, Deep Space Vector) and audio themes.
- **Portrait-First Viewport**: Fixed vertical aspect ratio (9:16) with sleek retro side bezels on desktop and full edge-to-edge touch controls on mobile.
- **Guest Mode vs. Authenticated Mode**:
  - **Play as Guest**: Jump straight into the action without sign-up. Scores are tracked locally.
  - **Authenticated Player**: Register/Log in to save stats and compete for the top ranks on the persistent **Global Leaderboard**.
- **Retro Web Audio API**: Procedurally generated 8-bit sound effects (laser blasts, explosions, power-up chimes) with zero external asset dependencies.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React (Vite) | UI components, modals, HUD overlays |
| **Engine** | HTML5 Canvas 2D | High-performance 60fps game loop with delta-time physics |
| **Styling** | TailwindCSS + Custom CSS | Retro-arcade styling, glow effects, responsive portrait cabinet |
| **Backend** | Node.js + Express | RESTful API for authentication and leaderboard scores |
| **Database** | MongoDB + Mongoose | Persistent storage for user accounts and verified high scores |
| **Auth** | JWT + bcryptjs | Secure token-based authentication and password hashing |
| **Sound** | Web Audio API | Procedural retro sound synthesis |

---

## 🗺️ Roadmap & Phase Breakdown

### 📌 Phase 1: Project Setup & Monorepo Foundation
- Initialize client/server directory structure.
- Configure Express backend with MongoDB connection and environment configuration.
- Set up React with Vite and TailwindCSS for high-speed HMR and optimized builds.
- Configure User and Score Mongoose models.

### 📌 Phase 2: Core Portrait Engine & Player Systems
- 2D Canvas engine with delta-time (`dt`) physics loop for frame-rate independence.
- High-DPI canvas resolution scaling.
- Portrait aspect-ratio enclosure (desktop arcade chassis + mobile viewport).
- Desktop keyboard controls (`WASD` / `Arrow Keys` + `Spacebar`) and mobile touch drag controls.
- Player ship mechanics: boundaries, lives, damage flash invulnerability, and parallax starfield.

### 📌 Phase 3: Modular Enemy System & Infinite Wave Progression
- Implement `EnemyRegistry` with starter archetypes (Sine Scout, Formation Diver, Gunner).
- Implement `AttackRegistry` with diverse projectile trajectories.
- Infinite wave scaling algorithm for procedural difficulty ramp.
- Spatial collision detection for bullets, enemies, and player.

### 📌 Phase 4: Modular Power-Up & Weapon Engine
- Implement `PowerUpRegistry` with customizable drop chances.
- Implement power-ups: Spread Fire, Energy Shield, Overdrive, EMP Bomb, and Dual-Ship companion.
- HUD indicators for active power-ups and remaining buff durations.

### 📌 Phase 5: Authentication & Guest Play Mode
- Guest Mode: Instant zero-friction play with local score persistence and post-game signup prompt.
- Authenticated Mode: Secure registration and login using JWT.
- User profile header displaying rank and all-time personal best.

### 📌 Phase 6: Global Leaderboard & Anti-Cheat Validation
- Leaderboard submission API with heuristic sanity checks (anti-cheat verification).
- Global Top 100 Leaderboard API with personal rank tracking.
- Retro arcade high-score leaderboard UI with filters (All-Time / Today).

### 📌 Phase 7: Themes, Audio & Arcade Polish
- Theme Registry for swappable visual styles and color palettes.
- Procedural sound effects via Web Audio API.
- Screen shake, particle explosion bursts, floating score popups, and combo multipliers.

---

## 🚀 Getting Started (Development Setup)

*(Instructions will be activated upon completion of Phase 1)*

### Prerequisites
- Node.js (v18+)
- MongoDB (local instance or MongoDB Atlas URI)

### Quick Run
```bash
# 1. Clone repository
git clone https://github.com/chinmay17-bot/MerchGame.git
cd MerchGame

# 2. Setup Server
cd server
npm install
# configure .env with PORT and MONGO_URI
npm run dev

# 3. Setup Client
cd ../client
npm install
npm run dev
```

---

## 📜 License
MIT License. Created with ❤️ for arcade game lovers.
