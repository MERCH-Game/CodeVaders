import { PlayerProjectile } from './entities/PlayerProjectile.js';
import { PlayerLaser } from './entities/PlayerLaser.js';

export class GameEngine {
    constructor(
        canvas,
        onPlayerHit,
        onPowerUpsChange = () => {},
        onPowerUpCollected = () => {},
        onLaserFired = () => {},
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = [];
        this.lastTime = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.isRunning = false;
        this.onPlayerHit = onPlayerHit;
        this.onPowerUpsChange = onPowerUpsChange;
        this.onPowerUpCollected = onPowerUpCollected;
        this.onLaserFired = onLaserFired;
        this.powerUps = [];
        this.spawner = null;
        this.powerUpSpawner = null;
        this.playerShooter = null;
        this.playerShootTimer = 0;
        this.enemySlowTimer = 0;
        this.cppPowerUpTimer = 0;
        this.tripleShotTimer = 0;
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

    consumePowerUp(index) {
        if (index < 0 || index >= this.powerUps.length) return;

        const powerUp = this.powerUps[index];
        if (!['cpp', 'python', 'java'].includes(powerUp.type)) return;

        this.powerUps.splice(index, 1);
        if (powerUp.type === 'cpp') {
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
        if (this.playerShooter && !laserActive) {
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
        if (this.spawner && this.spawner.update) {
            this.spawner.update(dt, this);
        }
        if (this.powerUpSpawner && this.powerUpSpawner.update) {
            this.powerUpSpawner.update(dt, this);
        }

        // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.update) {
                const entityDt = entity.type === 'enemy' && this.enemySlowTimer > 0
                    ? dt * 0.5
                    : dt;
                entity.update(entityDt, this);
            }
            if (entity.isDead) {
                this.entities.splice(i, 1);
            }
        }

        // Simple AABB Collision Detection
        this.handleCollisions();
    }

    handleCollisions() {
        const enemies = this.entities.filter(e => e.type === 'enemy');
        const player = this.entities.find(e => e.type === 'player');
        const playerBullets = this.entities.filter(e => e.type === 'player_bullet');
        const playerLasers = this.entities.filter(e => e.type === 'player_laser');
        const powerUpDrops = this.entities.filter(e => e.type === 'power_up');

        // Enemy vs Player
        if (player) {
            for (const enemy of enemies) {
                if (this.checkAABB(player, enemy)) {
                    enemy.onCollideWithPlayer(player, this);
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
            for (const enemy of enemies) {
                if (this.checkAABB(bullet, enemy)) {
                    enemy.takeDamage(bullet.damage || 1, this);
                    bullet.isDead = true; // Destroy bullet
                    break;
                }
            }
        }
    }

    checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
            }
        }
    }
}
