import { DIFFICULTY_CONFIG } from './DifficultyConfig.js';

/**
 * DifficultyController
 * Central source of truth for survival progression, difficulty scaling,
 * eligible enemy types, engagement events, and recovery windows.
 */
export class DifficultyController {
  constructor(config = DIFFICULTY_CONFIG) {
    this.config = config;
    this.elapsedTime = 0;
    this.recoveryTimer = 0;
    this.spawnTimer = 0;

    // Milestones tracking
    this.passedMilestones = new Set();
    this.pendingMilestone = null;

    // Engagement events tracking
    this.nextEventTimer = this.getRandomEventInterval();
    this.nextEventType = null;
    this.pendingEvent = null;
    this.recentEventTypes = [];

    // Callbacks
    this.onMilestoneReached = null;
    this.onEngagementEvent = null;
  }

  /**
   * Resets all progression state to start a new game run.
   */
  reset() {
    this.elapsedTime = 0;
    this.recoveryTimer = 0;
    this.spawnTimer = 0;
    this.passedMilestones.clear();
    this.pendingMilestone = null;
    this.nextEventTimer = this.getRandomEventInterval();
    this.nextEventType = null;
    this.pendingEvent = null;
    this.recentEventTypes = [];
  }

  getRandomEventInterval() {
    const { intervalMin, intervalMax } = this.config.events;
    return intervalMin + Math.random() * (intervalMax - intervalMin);
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  isRecoveryWindowActive() {
    return this.recoveryTimer > 0;
  }

  triggerRecoveryWindow(duration = null) {
    this.recoveryTimer = duration || this.config.events.recoveryDuration;
  }

  /**
   * Returns the current difficulty phase object based on elapsed survival time.
   */
  getCurrentPhase() {
    const time = this.elapsedTime;
    const { phases } = this.config;
    for (let i = phases.length - 1; i >= 0; i--) {
      if (time >= phases[i].startTime) {
        return phases[i];
      }
    }
    return phases[0];
  }

  /**
   * Computes smoothly interpolated parameters for the current elapsed time.
   */
  getInterpolatedParameters() {
    const time = this.elapsedTime;
    const { phases, bounds } = this.config;
    const currentPhase = this.getCurrentPhase();
    const phaseIndex = phases.findIndex(p => p.id === currentPhase.id);
    const nextPhase = phases[phaseIndex + 1];

    let spawnInterval = currentPhase.spawnInterval;
    let speedMultiplier = currentPhase.speedMultiplier;
    let fireRateMultiplier = currentPhase.fireRateMultiplier;
    let maxEnemies = currentPhase.maxEnemies;

    if (nextPhase && nextPhase.startTime !== Infinity) {
      // Smooth linear interpolation between phase bounds
      const phaseDuration = nextPhase.startTime - currentPhase.startTime;
      const progress = Math.min(1.0, Math.max(0.0, (time - currentPhase.startTime) / phaseDuration));

      spawnInterval = currentPhase.spawnInterval + (nextPhase.spawnInterval - currentPhase.spawnInterval) * progress;
      speedMultiplier = currentPhase.speedMultiplier + (nextPhase.speedMultiplier - currentPhase.speedMultiplier) * progress;
      fireRateMultiplier = currentPhase.fireRateMultiplier + (nextPhase.fireRateMultiplier - currentPhase.fireRateMultiplier) * progress;
      maxEnemies = Math.round(currentPhase.maxEnemies + (nextPhase.maxEnemies - currentPhase.maxEnemies) * progress);
    } else if (currentPhase.id === 6) {
      // Phase 6+ Endless Survival: Diminishing returns asymptotic scaling
      const tExt = time - 120;
      const diminish = 1 - Math.exp(-tExt / 100);

      spawnInterval = Math.max(bounds.minSpawnInterval, currentPhase.spawnInterval - 0.10 * diminish);
      speedMultiplier = Math.min(bounds.maxSpeedMultiplier, currentPhase.speedMultiplier + 0.05 * diminish);
      fireRateMultiplier = Math.min(bounds.maxFireRateMultiplier, currentPhase.fireRateMultiplier + 0.10 * diminish);
      maxEnemies = Math.min(bounds.maxActiveEnemies, currentPhase.maxEnemies + Math.floor(tExt / 60));
    }

    // Apply global hard caps
    spawnInterval = Math.max(bounds.minSpawnInterval, spawnInterval);
    speedMultiplier = Math.min(bounds.maxSpeedMultiplier, speedMultiplier);
    fireRateMultiplier = Math.min(bounds.maxFireRateMultiplier, fireRateMultiplier);
    maxEnemies = Math.min(bounds.maxActiveEnemies, maxEnemies);

    // Apply recovery window spacing: if recovery is active, space out spawns
    if (this.isRecoveryWindowActive()) {
      spawnInterval *= 2.2;
    }

    // Calculate eligible enemy weights strictly enforcing eligibility
    const weights = { ...currentPhase.weights };

    // STRICT RULE: DDoS Bugs must NEVER spawn before 30 seconds
    if (time < 30) {
      weights.ddos = 0.0;
    }

    // STRICT RULE: Worm Bugs must only spawn if phase 4+ (>= 60 seconds)
    if (time < 60) {
      weights.worm = 0.0;
    }

    // Normalize weights
    const totalWeight = weights.common + weights.critical + weights.ddos + weights.worm;
    if (totalWeight > 0) {
      weights.common /= totalWeight;
      weights.critical /= totalWeight;
      weights.ddos /= totalWeight;
      weights.worm /= totalWeight;
    } else {
      weights.common = 1.0;
    }

    return {
      phase: currentPhase,
      spawnInterval,
      speedMultiplier,
      fireRateMultiplier,
      maxEnemies,
      weights,
    };
  }

  /**
   * Randomly selects an eligible enemy type based on current phase weights.
   */
  pickEnemyType() {
    const { weights } = this.getInterpolatedParameters();
    const rand = Math.random();
    let cumulative = 0;

    cumulative += weights.common;
    if (rand <= cumulative) return 'common';

    cumulative += weights.critical;
    if (rand <= cumulative) return 'critical';

    cumulative += weights.ddos;
    if (rand <= cumulative) return 'ddos';

    return 'worm';
  }

  /**
   * Selects an engagement event appropriate for current phase and elapsed time.
   */
  selectEngagementEvent() {
    const time = this.elapsedTime;
    const currentPhase = this.getCurrentPhase();
    const candidates = [];

    // Phase 1 (0-15s) & Phase 2 (15-30s): Common formations & Critical escorts
    if (currentPhase.id === 1 || currentPhase.id === 2) {
      candidates.push('COMMON_PINCER', 'COMMON_VEE');
      if (currentPhase.id === 2) {
        candidates.push('CRITICAL_ESCORT');
      }
    } else if (currentPhase.id === 3) {
      // Phase 3 (30-60s): DDoS is eligible! Special event at ~45s
      if (Math.abs(time - 45) < 7) {
        return 'DDOS_ENCOUNTER_45S';
      }
      candidates.push('DDOS_VANGUARD', 'CROSSFIRE', 'COMMON_PINCER');
    } else if (currentPhase.id === 4) {
      // Phase 4 (60-90s): Worm Bugs + DDoS + Critical
      candidates.push('WORM_STRIKE', 'DDOS_SWARM', 'CROSSFIRE');
    } else if (currentPhase.id === 5) {
      // Phase 5 (90-120s): Intense survival combinations
      candidates.push('WORM_AND_DDOS', 'DOUBLE_WORM', 'DDOS_SWARM');
    } else {
      // Phase 6+ Endless (120s+)
      candidates.push('TACTICAL_ASSAULT', 'DOUBLE_WORM', 'SWARM_PINCER', 'WORM_AND_DDOS');
    }

    // Filter out recently triggered events to avoid repeating the same event indefinitely
    const available = candidates.filter(c => !this.recentEventTypes.includes(c));
    const pool = available.length > 0 ? available : candidates;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    this.recentEventTypes.push(picked);
    if (this.recentEventTypes.length > 2) {
      this.recentEventTypes.shift();
    }

    return picked;
  }

  /**
   * Core delta-time update loop.
   * Call once per frame with frame delta-time (dt) and current active enemy count.
   */
  update(dt, activeEnemyCount = 0) {
    this.elapsedTime += dt;

    if (this.recoveryTimer > 0) {
      this.recoveryTimer = Math.max(0, this.recoveryTimer - dt);
    }

    // 1. Check for Survival Milestones
    for (const milestone of this.config.milestones) {
      if (this.elapsedTime >= milestone && !this.passedMilestones.has(milestone)) {
        this.passedMilestones.add(milestone);
        const milestoneInfo = {
          seconds: milestone,
          phase: this.getCurrentPhase(),
        };
        this.pendingMilestone = milestoneInfo;
        if (this.onMilestoneReached) {
          this.onMilestoneReached(milestoneInfo);
        }
      }
    }

    // Endless milestone continuation: every 30s after 300s
    if (this.elapsedTime > 300) {
      const endlessStep = Math.floor(this.elapsedTime / 30) * 30;
      if (!this.passedMilestones.has(endlessStep)) {
        this.passedMilestones.add(endlessStep);
        const milestoneInfo = {
          seconds: endlessStep,
          phase: this.getCurrentPhase(),
        };
        this.pendingMilestone = milestoneInfo;
        if (this.onMilestoneReached) {
          this.onMilestoneReached(milestoneInfo);
        }
      }
    }

    // 2. Engagement Events Scheduling
    this.nextEventTimer -= dt;
    if (this.nextEventTimer <= 0) {
      const { maxEnemies } = this.getInterpolatedParameters();
      const isCrowded = activeEnemyCount >= maxEnemies * this.config.bounds.crowdedThresholdRatio;

      if (isCrowded) {
        // Screen is currently crowded: postpone event slightly to maintain fairness
        this.nextEventTimer = this.config.events.postponeDelay;
      } else {
        const eventType = this.selectEngagementEvent();
        this.pendingEvent = {
          type: eventType,
          time: this.elapsedTime,
        };

        if (this.onEngagementEvent) {
          this.onEngagementEvent(this.pendingEvent);
        }

        // Schedule next event
        this.nextEventTimer = this.getRandomEventInterval();
      }
    }

    return this.getInterpolatedParameters();
  }

  /**
   * Consumes and clears the pending milestone (if any).
   */
  consumePendingMilestone() {
    const m = this.pendingMilestone;
    this.pendingMilestone = null;
    return m;
  }

  /**
   * Consumes and clears the pending engagement event (if any).
   */
  consumePendingEvent() {
    const e = this.pendingEvent;
    this.pendingEvent = null;
    return e;
  }

  /**
   * Returns lightweight diagnostics for developer tools / HUD overlay.
   */
  getDiagnostics(activeEnemyCount = 0) {
    const params = this.getInterpolatedParameters();
    return {
      elapsedTime: this.elapsedTime.toFixed(1),
      phaseId: params.phase.id,
      phaseName: params.phase.name,
      activeEnemies: `${activeEnemyCount}/${params.maxEnemies}`,
      spawnInterval: `${params.spawnInterval.toFixed(2)}s`,
      speedMultiplier: `${params.speedMultiplier.toFixed(2)}x`,
      fireRateMultiplier: `${params.fireRateMultiplier.toFixed(2)}x`,
      nextEventIn: `${Math.max(0, this.nextEventTimer).toFixed(1)}s`,
      isRecoveryActive: this.isRecoveryWindowActive(),
      recoveryRemaining: `${this.recoveryTimer.toFixed(1)}s`,
    };
  }
}
