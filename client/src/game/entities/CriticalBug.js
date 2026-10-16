import { EnemyProjectile } from './EnemyProjectile.js';

export const CRITICAL_BUG_CONFIG = {
    hp: 2,
    maxHp: 2,
    speed: 100, // pixels per second
    score: 200,
    width: 64,
    height: 64,
    fireRate: 2 // fires every 2 seconds
};

export class CriticalBug {
    constructor(x, y, imageAssets, options = {}) {
        this.type = 'enemy';
        this.id = 'critical_' + Math.random().toString(36).substring(7);
        this.x = x;
        this.y = y;
        this.width = CRITICAL_BUG_CONFIG.width;
        this.height = CRITICAL_BUG_CONFIG.height;
        this.hp = CRITICAL_BUG_CONFIG.hp;
        
        this.state = 'MOVING'; // MOVING, DYING, DEAD
        this.speedMultiplier = options.speedMultiplier || 1.0;
        this.fireRateMultiplier = options.fireRateMultiplier || 1.0;
        this.velocityX = 0;
        this.velocityY = CRITICAL_BUG_CONFIG.speed * this.speedMultiplier;
        this.isDead = false;
        
        this.imageAssets = imageAssets;
        this.image = imageAssets ? imageAssets.criticalBug : null;
        this.blastImage = imageAssets ? imageAssets.criticalBugBlast : null;
        this.deathTimer = 0;
        
        this.shootTimer = 0;
    }

    update(dt, engine) {
        if (this.state === 'DEAD') {
            this.isDead = true;
            return;
        }

        if (this.state === 'MOVING') {
            // Critical bugs move vertically only
            this.velocityX = 0;
            this.velocityY = CRITICAL_BUG_CONFIG.speed * this.speedMultiplier;

            this.x += this.velocityX * dt;
            this.y += this.velocityY * dt;
            
            // Shooting logic
            this.shootTimer += dt * this.fireRateMultiplier;
            if (this.shootTimer >= CRITICAL_BUG_CONFIG.fireRate) {
                this.shootTimer = 0;
                this.shoot(engine);
            }
            
            // Cleanly remove/despawn the enemy after it exits the relevant game area
            if (this.y > engine.height + this.height) {
                this.state = 'DEAD';
                this.isDead = true;
            }
        } else if (this.state === 'DYING') {
            this.deathTimer += dt;
            if (this.deathTimer > 0.2) {
                this.state = 'DEAD';
                this.isDead = true;
            }
        }
    }

    shoot(engine) {
        if (engine && engine.canEnemyShoot && !engine.canEnemyShoot()) return;
        const bulletX = this.x + this.width / 2 - 3;
        const bulletY = this.y + this.height;
        const bullet = new EnemyProjectile(bulletX, bulletY);
        engine.addEntity(bullet);
    }

    takeDamage(amount, engine) {
        if (this.state === 'DYING' || this.state === 'DEAD') return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.triggerExplosion(engine);
            this.state = 'DYING';
        }
    }

    triggerExplosion(_engine) {
        this.deathTimer = 0;
    }

    onCollideWithPlayer(player, engine) {
        if (this.state === 'DYING' || this.state === 'DEAD') return;
        
        if (engine.onPlayerHit) {
            engine.onPlayerHit();
        }
        
        this.triggerExplosion(engine);
        this.state = 'DYING';
    }

    render(ctx) {
        if (this.state === 'DEAD') return;
        
        let imgToDraw = this.image || (this.imageAssets && this.imageAssets.criticalBug);
        if (this.state === 'DYING') {
            const blast = this.blastImage || (this.imageAssets && this.imageAssets.criticalBugBlast);
            if (blast) imgToDraw = blast;
        }

        if (imgToDraw) {
            ctx.drawImage(imgToDraw, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.state === 'DYING' ? 'orange' : 'purple';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
