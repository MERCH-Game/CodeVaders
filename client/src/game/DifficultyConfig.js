/**
 * DifficultyConfig.js
 * Central configuration for CodeVaders survival progression,
 * difficulty scaling, engagement events, and balancing parameters.
 */

export const DIFFICULTY_CONFIG = {
  // Global Hard Bounds & Safeguards
  bounds: {
    minSpawnInterval: 0.75,       // Minimum seconds between regular enemy spawns
    maxActiveEnemies: 12,         // Hard cap on simultaneous active enemies for fairness & 60fps
    maxSpeedMultiplier: 1.75,     // Hard cap on enemy movement speed multiplier
    maxFireRateMultiplier: 1.75,  // Hard cap on enemy attack frequency multiplier
    maxEnemyProjectiles: 20,      // Maximum simultaneous enemy bullets to prevent bullet hell
    crowdedThresholdRatio: 0.85,  // If active enemies >= 85% of cap, defer engagement events
  },

  // Difficulty Phases
  phases: [
    {
      id: 1,
      name: 'Warm-up',
      startTime: 0,
      endTime: 15,
      spawnInterval: 2.8,
      maxEnemies: 5,
      speedMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      // Phase 1: Only Common Bugs. Strictly NO DDoS Bugs.
      weights: { common: 1.0, critical: 0.0, ddos: 0.0, worm: 0.0 },
    },
    {
      id: 2,
      name: 'Escalation',
      startTime: 15,
      endTime: 30,
      spawnInterval: 2.0,
      maxEnemies: 6,
      speedMultiplier: 1.1,
      fireRateMultiplier: 1.1,
      // Phase 2: Common Bugs + occasional Critical Bugs. Strictly NO DDoS Bugs before 30s.
      weights: { common: 0.8, critical: 0.2, ddos: 0.0, worm: 0.0 },
    },
    {
      id: 3,
      name: 'First Threat',
      startTime: 30,
      endTime: 60,
      spawnInterval: 1.6,
      maxEnemies: 7,
      speedMultiplier: 1.25,
      fireRateMultiplier: 1.2,
      // Phase 3: DDoS Bugs become eligible strictly after 30 seconds!
      weights: { common: 0.55, critical: 0.25, ddos: 0.2, worm: 0.0 },
    },
    {
      id: 4,
      name: 'Survival Pressure',
      startTime: 60,
      endTime: 90,
      spawnInterval: 1.3,
      maxEnemies: 9,
      speedMultiplier: 1.4,
      fireRateMultiplier: 1.35,
      // Phase 4: Worm Bugs introduced; all 4 existing types eligible.
      weights: { common: 0.4, critical: 0.25, ddos: 0.2, worm: 0.15 },
    },
    {
      id: 5,
      name: 'Intense Survival',
      startTime: 90,
      endTime: 120,
      spawnInterval: 1.05,
      maxEnemies: 10,
      speedMultiplier: 1.55,
      fireRateMultiplier: 1.5,
      weights: { common: 0.35, critical: 0.25, ddos: 0.22, worm: 0.18 },
    },
    {
      id: 6,
      name: 'Endless Survival',
      startTime: 120,
      endTime: Infinity,
      spawnInterval: 0.85,
      maxEnemies: 12,
      speedMultiplier: 1.7,
      fireRateMultiplier: 1.65,
      weights: { common: 0.3, critical: 0.25, ddos: 0.23, worm: 0.22 },
    },
  ],

  // Survival Milestones (seconds survived)
  milestones: [15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 300],

  // Engagement Events Cadence & Recovery Windows
  events: {
    intervalMin: 16,            // Minimum seconds between engagement events
    intervalMax: 20,            // Maximum seconds between engagement events
    recoveryDuration: 3.5,      // Seconds of reduced regular spawn pressure after demanding encounters
    postponeDelay: 3.0,         // Seconds to defer an event if the screen is currently crowded
  },
};
