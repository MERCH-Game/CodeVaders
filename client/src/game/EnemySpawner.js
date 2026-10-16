import { CommonBug } from './entities/CommonBug.js';
import { CriticalBug } from './entities/CriticalBug.js';
import { DDoSBug } from './entities/DDoSBug.js';
import { WormBug } from './entities/WormBug.js';
import { IntroFormation } from './formations/IntroFormation.js';
import { DifficultyController } from './DifficultyController.js';

export class EnemySpawner {
    constructor(images, difficultyController = null) {
        this.images = images;
        this.difficultyController = difficultyController || new DifficultyController();
        this.spawnTimer = 0;
        this.introStarted = false;
        this.introFormation = null;
    }

    reset() {
        this.spawnTimer = 0;
        this.introStarted = false;
        this.introFormation = null;
        if (this.difficultyController) {
            this.difficultyController.reset();
        }
    }

    update(dt, engine) {
        // Start opening castle formation on initial start
        if (!this.introStarted) {
            this.introStarted = true;
            this.introFormation = new IntroFormation(engine, this.images);
        }

        // Count current active, living enemies
        const activeEnemyCount = this.getActiveEnemyCount(engine);

        // Update the centralized difficulty controller
        const params = this.difficultyController.update(dt, activeEnemyCount);

        // If intro formation is active, let it advance
        if (this.introFormation) {
            this.introFormation.update(dt, engine);
            if (this.introFormation.state === 'DONE') {
                this.introFormation = null;
                // Immediately ready for regular spawning so there is no lull
                this.spawnTimer = params.spawnInterval;
            } else {
                // While opening formation is advancing, refrain from cluttering screen with regular spawns
                return;
            }
        }

        // 1. Process Scheduled Engagement Events (~15-20s beats)
        const pendingEvent = this.difficultyController.consumePendingEvent();
        if (pendingEvent) {
            this.executeEngagementEvent(pendingEvent.type, engine, params);
        }

        // 2. Process Regular Centralized Spawning
        // Enforce active enemy limit cap
        if (this.getActiveEnemyCount(engine) >= params.maxEnemies) {
            return;
        }

        this.spawnTimer += dt;
        if (this.spawnTimer >= params.spawnInterval) {
            // Avoid burst spawning after pause or delay
            this.spawnTimer = 0;

            const enemyType = this.difficultyController.pickEnemyType();
            this.spawnEnemyByType(enemyType, engine, params);
        }
    }

    getActiveEnemyCount(engine) {
        if (!engine || !engine.entities) return 0;
        return engine.entities.filter(
            e => e.type === 'enemy' && !e.isDead && e.state !== 'DYING' && e.state !== 'DEAD'
        ).length;
    }

    spawnEnemyByType(type, engine, params) {
        if (this.getActiveEnemyCount(engine) >= params.maxEnemies) return;

        switch (type) {
            case 'critical':
                this.spawnCritical(engine, params);
                break;
            case 'ddos':
                // Strict check: never before 30 seconds
                if (this.difficultyController.getElapsedTime() >= 30) {
                    this.spawnDDoSBug(engine, params);
                } else {
                    this.spawnCommon(engine, params);
                }
                break;
            case 'worm':
                // Strict check: only phase 4+ (>= 60 seconds)
                if (this.difficultyController.getElapsedTime() >= 60) {
                    this.spawnWormBug(engine, params);
                } else {
                    this.spawnCommon(engine, params);
                }
                break;
            case 'common':
            default:
                this.spawnCommon(engine, params);
                break;
        }
    }

    /**
     * Executes curated engagement events every 15-20 seconds.
     */
    executeEngagementEvent(eventType, engine, params) {
        const canSpawn = (needed = 1) => {
            return (this.getActiveEnemyCount(engine) + needed) <= params.maxEnemies;
        };

        switch (eventType) {
            case 'COMMON_PINCER': {
                // Two Common Bugs swooping from opposite sides simultaneously
                if (canSpawn(2)) {
                    this.spawnCommon(engine, params, 1, 0.15);
                    this.spawnCommon(engine, params, -1, 0.25);
                }
                break;
            }

            case 'COMMON_VEE': {
                // 3 Common Bugs in staggered formation
                if (canSpawn(3)) {
                    this.spawnCommon(engine, params, 1, 0.12);
                    this.spawnCommon(engine, params, 1, 0.22);
                    this.spawnCommon(engine, params, 1, 0.32);
                }
                break;
            }

            case 'CRITICAL_ESCORT': {
                // 1 Critical Bug flanked by 1 Common Bug
                if (canSpawn(2)) {
                    this.spawnCritical(engine, params, engine.width * 0.45);
                    this.spawnCommon(engine, params, 1, 0.2);
                }
                break;
            }

            case 'DDOS_VANGUARD': {
                // 1 DDoS Bug escorted by 1 Common Bug (strict >= 30s)
                if (this.difficultyController.getElapsedTime() >= 30 && canSpawn(2)) {
                    this.spawnDDoSBug(engine, params, engine.width * 0.5);
                    this.spawnCommon(engine, params, -1, 0.2);
                    // Demanding encounter: trigger recovery window
                    this.difficultyController.triggerRecoveryWindow(3.5);
                }
                break;
            }

            case 'DDOS_ENCOUNTER_45S': {
                // Recognizable ~45-second special milestone threat
                if (this.difficultyController.getElapsedTime() >= 30 && canSpawn(2)) {
                    this.spawnDDoSBug(engine, params, engine.width * 0.5);
                    this.spawnCommon(engine, params, 1, 0.15);
                    this.spawnCommon(engine, params, -1, 0.25);
                    this.difficultyController.triggerRecoveryWindow(4.0);
                }
                break;
            }

            case 'CROSSFIRE': {
                // 1 Critical Bug center + 2 Common Bugs pincering
                if (canSpawn(3)) {
                    this.spawnCritical(engine, params, engine.width * 0.5);
                    this.spawnCommon(engine, params, 1, 0.15);
                    this.spawnCommon(engine, params, -1, 0.25);
                }
                break;
            }

            case 'WORM_STRIKE': {
                // 1 Worm Bug flank entry + 1 Critical Bug
                if (this.difficultyController.getElapsedTime() >= 60 && canSpawn(2)) {
                    this.spawnWormBug(engine, params);
                    this.spawnCritical(engine, params, engine.width * 0.35);
                    this.difficultyController.triggerRecoveryWindow(3.5);
                }
                break;
            }

            case 'DDOS_SWARM': {
                // 1 DDoS Bug + 2 Common Bugs
                if (this.difficultyController.getElapsedTime() >= 30 && canSpawn(3)) {
                    this.spawnDDoSBug(engine, params, engine.width * 0.4);
                    this.spawnCommon(engine, params, 1, 0.18);
                    this.spawnCommon(engine, params, -1, 0.28);
                    this.difficultyController.triggerRecoveryWindow(3.5);
                }
                break;
            }

            case 'WORM_AND_DDOS': {
                // High threat combination: 1 Worm Bug + 1 DDoS Bug
                if (this.difficultyController.getElapsedTime() >= 60 && canSpawn(2)) {
                    this.spawnWormBug(engine, params);
                    this.spawnDDoSBug(engine, params, engine.width * 0.55);
                    this.difficultyController.triggerRecoveryWindow(4.0);
                }
                break;
            }

            case 'DOUBLE_WORM': {
                // Coordinated side attack: Worm from left, Worm from right
                if (this.difficultyController.getElapsedTime() >= 60 && canSpawn(2)) {
                    this.spawnWormBug(engine, params, 1);
                    this.spawnWormBug(engine, params, -1);
                    this.difficultyController.triggerRecoveryWindow(4.0);
                }
                break;
            }

            case 'TACTICAL_ASSAULT': {
                // Endless high-threat squad
                if (this.difficultyController.getElapsedTime() >= 60 && canSpawn(3)) {
                    this.spawnWormBug(engine, params);
                    this.spawnDDoSBug(engine, params, engine.width * 0.5);
                    this.spawnCritical(engine, params, engine.width * 0.25);
                    this.difficultyController.triggerRecoveryWindow(4.5);
                }
                break;
            }

            case 'SWARM_PINCER': {
                // 4 Common Bugs in double pincer
                if (canSpawn(4)) {
                    this.spawnCommon(engine, params, 1, 0.12);
                    this.spawnCommon(engine, params, -1, 0.18);
                    this.spawnCommon(engine, params, 1, 0.26);
                    this.spawnCommon(engine, params, -1, 0.32);
                }
                break;
            }

            default:
                this.spawnCommon(engine, params);
                break;
        }
    }

    spawnCommon(engine, params, forcedDirection = null, relativeY = null) {
        const isLeft = forcedDirection !== null ? (forcedDirection === 1) : (Math.random() > 0.5);
        const direction = isLeft ? 1 : -1;
        const startX = isLeft ? -50 : engine.width + 50;
        const startY = relativeY !== null
            ? engine.height * relativeY
            : Math.random() * (engine.height * 0.35) + 30; // top 35% safe zone, well above player
        
        const bug = new CommonBug(startX, startY, this.images, direction, {
            speedMultiplier: params.speedMultiplier,
            fireRateMultiplier: params.fireRateMultiplier,
        });
        engine.addEntity(bug);
    }

    spawnCritical(engine, params, customX = null) {
        const randomX = customX !== null
            ? Math.max(20, Math.min(engine.width - 80, customX))
            : 30 + Math.random() * Math.max(10, engine.width - 120);
        const bug = new CriticalBug(randomX, -70, this.images, {
            speedMultiplier: params.speedMultiplier,
            fireRateMultiplier: params.fireRateMultiplier,
        });
        engine.addEntity(bug);
    }

    spawnWormBug(engine, params, forcedDirection = null) {
        // Enforce Phase 4+ (>= 60s) rule
        if (this.difficultyController.getElapsedTime() < 60) return;

        const isLeft = forcedDirection !== null ? (forcedDirection === 1) : (Math.random() > 0.5);
        const direction = isLeft ? 1 : -1;
        const startX = isLeft ? -70 : engine.width + 70;
        
        // Target positioning area in upper/mid screen (18% to 34% height)
        const targetY = engine.height * (0.18 + Math.random() * 0.16);
        const startY = targetY;
        
        // Station somewhere in the center safe zone of the screen (25% to 75% width)
        const targetX = engine.width * (0.25 + Math.random() * 0.5);
        
        const worm = new WormBug(startX, startY, targetX, targetY, this.images, direction, {
            speedMultiplier: params.speedMultiplier,
            fireRateMultiplier: params.fireRateMultiplier,
        });
        engine.addEntity(worm);
    }

    spawnDDoSBug(engine, params, customX = null) {
        // Enforce strict DDoS rule: NEVER spawn before 30 seconds
        if (this.difficultyController.getElapsedTime() < 30) return;

        const randomX = customX !== null
            ? Math.max(20, Math.min(engine.width - 80, customX))
            : 40 + Math.random() * Math.max(10, engine.width - 140);
        const bug = new DDoSBug(randomX, -60, this.images, {
            speedMultiplier: params.speedMultiplier,
            fireRateMultiplier: params.fireRateMultiplier,
        });
        engine.addEntity(bug);
    }
}
