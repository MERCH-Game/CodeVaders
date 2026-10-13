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
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = [];
        this.lastTime = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.isRunning = false;
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

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
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

        this.update(safeDt);
        this.render();

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

        const enemies = this.entities.filter(e => e.type === 'enemy');
        const player = this.playerShooter;
        const playerBullets = this.entities.filter(e => e.type === 'player_bullet');
        const playerLasers = this.entities.filter(e => e.type === 'player_laser');
        const powerUpDrops = this.entities.filter(e => e.type === 'power_up');
        const enemyBullets = this.entities.filter(e => e.type === 'enemy_bullet');

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
    }
}
