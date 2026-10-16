import { PlayerProjectile } from './entities/PlayerProjectile.js';
import { PlayerLaser } from './entities/PlayerLaser.js';
import { AutoAimMissile } from './entities/AutoAimMissile.js';

export class GameEngine {
    constructor(
        canvas,
        onPlayerHit,
        onPowerUpsChange = () => {},
        onPowerUpCollected = () => {},
        onLaserFired = () => {},
        onEnemyHit = () => {},
        onRocketLaunched = () => {},
        onTimeUpdate = () => {},
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = [];
        this.lastTime = 0;
        this.elapsedTime = 0;
        this._lastReportedSec = -1;
        this.width = canvas.width;
        this.height = canvas.height;
        this.isRunning = false;
        this.animationFrameId = null;
        this.devMode = false;
        this.debugDiagnostics = typeof window !== 'undefined' && window.location?.search?.includes('debug');
        this.performanceStats = {
            frameTimeMs: 0,
            fps: 0,
            updateTimeMs: 0,
            renderTimeMs: 0,
        };
        this.diagnosticFrameCount = 0;
        this.diagnosticElapsedMs = 0;
        this.collisionGroups = {
            enemies: [],
            playerBullets: [],
            playerLasers: [],
            powerUpDrops: [],
            enemyBullets: [],
        };
        this._originalOnPlayerHit = onPlayerHit;
        this.playerHitThisFrame = false;
        this.onPlayerHit = () => {
            if (this.playerHitThisFrame) return;
            this.playerHitThisFrame = true;
            if (this._originalOnPlayerHit) this._originalOnPlayerHit();
        };
        this.onPowerUpsChange = onPowerUpsChange;
        this.onPowerUpCollected = onPowerUpCollected;
        this.onLaserFired = onLaserFired;
        this.onEnemyHit = onEnemyHit;
        this.onRocketLaunched = onRocketLaunched;
        this.onTimeUpdate = onTimeUpdate;
        this.powerUps = [];
        this.spawner = null;
        this.powerUpSpawner = null;
        this.playerShooter = null;
        this.playerShootTimer = 0;
        this.enemySlowTimer = 0;
        this.cppPowerUpTimer = 0;
        this.tripleShotTimer = 0;
        this.autoAimActive = false;
        this.autoAimTargets = [];
        this.autoAimImages = null;
    }

    setSpawner(spawner) {
        this.spawner = spawner;
    }

    setPowerUpSpawner(spawner) {
        this.powerUpSpawner = spawner;
    }

    getDifficultyController() {
        return this.spawner?.difficultyController || null;
    }

    getElapsedTime() {
        if (this.spawner?.difficultyController) {
            return this.spawner.difficultyController.getElapsedTime();
        }
        return this.elapsedTime;
    }

    getActiveEnemyCount() {
        let count = 0;
        for (const entity of this.entities) {
            if (entity.type === 'enemy' && !entity.isDead && entity.state !== 'DYING' && entity.state !== 'DEAD') {
                count++;
            }
        }
        return count;
    }

    getActiveEnemyBulletCount() {
        let count = 0;
        for (const entity of this.entities) {
            if (entity.type === 'enemy_bullet' && !entity.isDead) count++;
        }
        return count;
    }

    canEnemyShoot() {
        return this.getActiveEnemyBulletCount() < 20;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    setPlayerPosition(x, y, width, height) {
        this.playerShooter = { x, y, width, height, centerX: x + width / 2 };
    }

    setPlayerCenterX(centerX) {
        if (!this.playerShooter) return;

        this.playerShooter.centerX = centerX;
        this.playerShooter.x = centerX - this.playerShooter.width / 2;
    }

    consumePowerUp(index) {
        if (index < 0 || index >= this.powerUps.length) return;

        const powerUp = this.powerUps[index];
        if (!['claude', 'cpp', 'python', 'java'].includes(powerUp.type)) return;

        this.powerUps.splice(index, 1);
        if (powerUp.type === 'claude') {
            this.autoAimTargets = this.entities.filter(entity =>
                entity.type === 'enemy' && !entity.isDead && entity.state !== 'DYING' && entity.state !== 'DEAD'
            );
            this.autoAimActive = this.autoAimTargets.length > 0;
            this.launchNextAutoAimMissile();
        } else if (powerUp.type === 'cpp') {
            this.enemySlowTimer = 5;
            this.cppPowerUpTimer = 5;
        } else if (powerUp.type === 'python') {
            this.entities = this.entities.filter(entity => entity.type !== 'player_laser');
            this.addEntity(new PlayerLaser());
            this.onLaserFired();
        } else if (powerUp.type === 'java') {
            this.tripleShotTimer = 5;
        }
        this.onPowerUpsChange([...this.powerUps]);
    }

    launchNextAutoAimMissile() {
        while (this.autoAimTargets.length > 0) {
            const target = this.autoAimTargets.shift();
            if (!target.isDead && target.state !== 'DYING' && target.state !== 'DEAD') {
                const player = this.playerShooter;
                if (player) {
                    this.addEntity(new AutoAimMissile(player.centerX, player.y, target, this.autoAimImages));
                    this.onRocketLaunched();
                    return;
                }
            }
        }

        this.autoAimActive = false;
        this.autoAimTargets = [];
    }

    loop(time) {
        if (!this.isRunning) return;

        const dt = (time - this.lastTime) / 1000; // seconds
        this.lastTime = time;

        // Cap dt to prevent huge jumps if tab is inactive
        const safeDt = Math.min(dt, 0.1);

        const measurePerformance = this.isDiagnosticsEnabled();
        const updateStartedAt = measurePerformance ? performance.now() : 0;
        this.update(safeDt);
        if (measurePerformance) {
            this.performanceStats.updateTimeMs = performance.now() - updateStartedAt;
            this.performanceStats.frameTimeMs = dt * 1000;
            this.diagnosticFrameCount++;
            this.diagnosticElapsedMs += this.performanceStats.frameTimeMs;
            if (this.diagnosticElapsedMs >= 500) {
                this.performanceStats.fps = this.diagnosticFrameCount * 1000 / this.diagnosticElapsedMs;
                this.diagnosticFrameCount = 0;
                this.diagnosticElapsedMs = 0;
            }
            const renderStartedAt = performance.now();
            this.render();
            this.performanceStats.renderTimeMs = performance.now() - renderStartedAt;
        } else {
            this.render();
        }

        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.enemySlowTimer = Math.max(0, this.enemySlowTimer - dt);
        this.cppPowerUpTimer = Math.max(0, this.cppPowerUpTimer - dt);
        this.tripleShotTimer = Math.max(0, this.tripleShotTimer - dt);

        const laserActive = this.entities.some(entity => entity.type === 'player_laser' && !entity.isDead);
        if (this.playerShooter && !laserActive && !this.autoAimActive) {
            this.playerShootTimer += dt;
            const fireInterval = this.cppPowerUpTimer > 0 ? 0.5 : 1.5;
            if (this.playerShootTimer >= fireInterval) {
                this.playerShootTimer -= fireInterval;
                if (this.tripleShotTimer > 0) {
                    this.addEntity(new PlayerProjectile(this.playerShooter.centerX - 11, this.playerShooter.y - 16, -90));
                    this.addEntity(new PlayerProjectile(this.playerShooter.centerX - 3, this.playerShooter.y - 16));
                    this.addEntity(new PlayerProjectile(this.playerShooter.centerX + 5, this.playerShooter.y - 16, 90));
                } else {
                    this.addEntity(new PlayerProjectile(
                        this.playerShooter.centerX - 3,
                        this.playerShooter.y - 16,
                    ));
                }
            }
        }

        // Update systems/spawner
        if (!this.autoAimActive && this.spawner && this.spawner.update) {
            this.spawner.update(dt, this);
        }
        if (this.powerUpSpawner && this.powerUpSpawner.update) {
            this.powerUpSpawner.update(dt, this);
        }

        this.elapsedTime += dt;
        const currentSec = Math.floor(this.getElapsedTime());
        if (currentSec !== this._lastReportedSec) {
            this._lastReportedSec = currentSec;
            if (this.onTimeUpdate) {
                this.onTimeUpdate(currentSec);
            }
        }

        // Update all entities
        const entityCount = this.entities.length;
        let activeEntityCount = 0;
        for (let i = 0; i < entityCount; i++) {
            const entity = this.entities[i];
            if (entity.update) {
                const shouldFreeze = this.autoAimActive && (
                    (entity.type === 'enemy' && entity.state !== 'DYING') || entity.type === 'enemy_bullet'
                );
                if (!shouldFreeze) {
                    const entityDt = entity.type === 'enemy' && this.enemySlowTimer > 0
                        ? dt * 0.5
                        : dt;
                    entity.update(entityDt, this);
                }
            }
            if (!entity.isDead) {
                this.entities[activeEntityCount] = entity;
                activeEntityCount++;
            }
        }
        const newlyAddedEntities = this.entities.length > entityCount
            ? this.entities.slice(entityCount)
            : null;
        this.entities.length = activeEntityCount;
        if (newlyAddedEntities) this.entities.push(...newlyAddedEntities);

        // Simple AABB Collision Detection
        this.handleCollisions();
    }

    handleCollisions() {
        this.playerHitThisFrame = false;

        const {
            enemies,
            playerBullets,
            playerLasers,
            powerUpDrops,
            enemyBullets,
        } = this.collisionGroups;
        enemies.length = 0;
        playerBullets.length = 0;
        playerLasers.length = 0;
        powerUpDrops.length = 0;
        enemyBullets.length = 0;

        for (const entity of this.entities) {
            if (entity.type === 'enemy') enemies.push(entity);
            else if (entity.type === 'player_bullet') playerBullets.push(entity);
            else if (entity.type === 'player_laser') playerLasers.push(entity);
            else if (entity.type === 'power_up') powerUpDrops.push(entity);
            else if (entity.type === 'enemy_bullet') enemyBullets.push(entity);
        }

        const player = this.playerShooter;

        // PlayerBullets vs EnemyBullets
        for (const pBullet of playerBullets) {
            if (pBullet.isDead) continue;
            for (const eBullet of enemyBullets) {
                if (eBullet.isDead) continue;
                if (this.checkAABB(pBullet, eBullet)) {
                    pBullet.isDead = true;
                    eBullet.isDead = true;
                    break;
                }
            }
        }

        // Enemy vs Player
        if (player && !this.autoAimActive) {
            for (const enemy of enemies) {
                if (this.checkAABB(player, enemy, 0.1)) {
                    enemy.onCollideWithPlayer(player, this);
                }
            }

            for (const bullet of enemyBullets) {
                if (bullet.isDead) continue;
                if (this.checkAABB(player, bullet, 0.1)) {
                    if (this.onPlayerHit) this.onPlayerHit();
                    bullet.isDead = true;
                }
            }
        }

        if (this.playerShooter) {
            for (const drop of powerUpDrops) {
                if (this.checkAABB(this.playerShooter, drop)) {
                    drop.isDead = true;
                    if (this.powerUps.length < 3) {
                        this.powerUps.push({
                            id: `${drop.powerUp}-${Date.now()}-${Math.random()}`,
                            type: drop.powerUp,
                        });
                        this.onPowerUpsChange([...this.powerUps]);
                        this.onPowerUpCollected();
                    }
                }
            }
        }

        for (const laser of playerLasers) {
            for (const enemy of enemies) {
                if (this.checkAABB(laser, enemy)) {
                    enemy.takeDamage(enemy.hp, this);
                }
            }

            for (const entity of this.entities) {
                if (entity.type === 'enemy_bullet' && this.checkAABB(laser, entity)) {
                    entity.isDead = true;
                }
            }
        }

        // PlayerBullets vs Enemy
        for (const bullet of playerBullets) {
            if (bullet.isDead) continue;
            for (const enemy of enemies) {
                if (this.checkAABB(bullet, enemy, 0.1)) {
                    enemy.takeDamage(bullet.damage || 1, this);
                    this.onEnemyHit();
                    bullet.isDead = true; // Destroy bullet
                    break;
                }
            }
        }
    }

    checkAABB(a, b, inset = 0) {
        const aInsetX = a.width * inset;
        const aInsetY = a.height * inset;
        const bInsetX = b.width * inset;
        const bInsetY = b.height * inset;

        return (
            a.x + aInsetX < b.x + b.width - bInsetX &&
            a.x + a.width - aInsetX > b.x + bInsetX &&
            a.y + aInsetY < b.y + b.height - bInsetY &&
            a.y + a.height - aInsetY > b.y + bInsetY
        );
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
            }
        }
        if (this.autoAimActive) {
            this.ctx.save();
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillStyle = '#ff334f';
            this.ctx.shadowColor = '#ff334f';
            this.ctx.shadowBlur = 12;
            this.ctx.fillText('AUTO AIM', this.width / 2, 12);
            this.ctx.restore();
        }

        if (this.isDiagnosticsEnabled()) {
            this.renderDevDiagnostics();
        }
    }

    isDiagnosticsEnabled() {
        return this.devMode || this.debugDiagnostics
            || (typeof window !== 'undefined' && Boolean(window.__CODEVADERS_DEV_MODE__));
    }

    renderDevDiagnostics() {
        const controller = this.getDifficultyController();
        if (!controller) return;
        const diag = controller.getDiagnostics(this.getActiveEnemyCount());
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1;
        ctx.fillRect(8, 8, 250, 142);
        ctx.strokeRect(8, 8, 250, 142);

        ctx.font = '10px monospace';
        ctx.fillStyle = '#00f3ff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('[DEV DIAGNOSTICS]', 14, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Time: ${diag.elapsedTime}s | P${diag.phaseId}: ${diag.phaseName}`, 14, 28);
        ctx.fillText(`Enemies: ${diag.activeEnemies} | Bullets: ${this.getActiveEnemyBulletCount()}/20`, 14, 42);
        ctx.fillText(`Interval: ${diag.spawnInterval}`, 14, 56);
        ctx.fillText(`Speed: ${diag.speedMultiplier} | Fire: ${diag.fireRateMultiplier}`, 14, 70);
        ctx.fillText(`Next Evt: ${diag.nextEventIn}`, 14, 84);
        ctx.fillText(`Recovery: ${diag.isRecoveryActive ? `ACTIVE (${diag.recoveryRemaining})` : 'OFF'}`, 14, 98);
        ctx.fillText(`Frame: ${this.performanceStats.frameTimeMs.toFixed(1)}ms | FPS: ${this.performanceStats.fps.toFixed(0)}`, 14, 112);
        ctx.fillText(`Update: ${this.performanceStats.updateTimeMs.toFixed(1)}ms | Render: ${this.performanceStats.renderTimeMs.toFixed(1)}ms`, 14, 126);
        ctx.restore();
    }
}
