import { EnemyProjectile } from './EnemyProjectile.js';

export const COMMON_BUG_CONFIG = {
    hp: 1,
    maxHp: 1,
    horizontalSpeed: 180, // pixels per second
    fireRate: 1.2, // seconds between shots
    score: 100,
    width: 48,
    height: 48
};

export class CommonBug {
    constructor(x, y, imageAssets, direction = 1, options = {}) {
        this.type = 'enemy';
        this.id = 'common_' + Math.random().toString(36).substring(7);
        this.x = x;
        this.y = y;
        this.width = COMMON_BUG_CONFIG.width;
        this.height = COMMON_BUG_CONFIG.height;
        this.hp = COMMON_BUG_CONFIG.hp;
        
        this.state = 'MOVING'; // MOVING, DYING, DEAD
        this.isFormationMember = false;
        
        this.direction = direction; // 1 for left-to-right, -1 for right-to-left
        this.speedMultiplier = options.speedMultiplier || 1.0;
        this.fireRateMultiplier = options.fireRateMultiplier || 1.0;
        this.velocityX = this.direction * COMMON_BUG_CONFIG.horizontalSpeed * this.speedMultiplier;
        
        this.isDead = false;
        
        this.imageAssets = imageAssets;
        this.image = imageAssets ? imageAssets.commonBug : null;
        this.blastImage = imageAssets ? imageAssets.commonBugBlast : null;
        this.bulletImage = imageAssets ? imageAssets.commonBugBullet : null;
        this.deathTimer = 0;
        
        this.shootTimer = Math.random() * 0.4;
    }

    update(dt, engine) {
        if (this.state === 'DEAD') {
            this.isDead = true;
            return;
        }

        if (this.isFormationMember) {
            if (this.state === 'DYING') {
                this.deathTimer += dt;
                if (this.deathTimer > 0.2) {
                    this.state = 'DEAD';
                    this.isDead = true;
                }
            }
            return; // Managed externally by IntroFormation
        }

        if (this.state === 'MOVING') {
            this.x += this.velocityX * dt;
            
            // Cleanly remove after exiting the opposite side
            if (this.direction === 1 && this.x > engine.width + this.width) {
                this.isDead = true;
                this.state = 'DEAD';
            } else if (this.direction === -1 && this.x < -this.width) {
                this.isDead = true;
                this.state = 'DEAD';
            }
            
            // Only shoot while on-screen
            const isVisible = this.x >= 10 && (this.x + this.width) <= (engine.width - 10);
            if (isVisible) {
                this.shootTimer += dt * this.fireRateMultiplier;
                if (this.shootTimer >= COMMON_BUG_CONFIG.fireRate) {
                    this.shootTimer = 0;
                    this.shoot(engine);
                }
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
        // Player position is tracked in engine.playerShooter
        const player = engine.playerShooter || engine.entities.find(e => e.type === 'player');
        
        const bulletWidth = 12;
        const bulletX = this.x + this.width / 2 - bulletWidth / 2;
        const bulletY = this.y + this.height;
        
        let vx = 0;
        let vy = 250; // bullet speed
        
        if (player) {
            const targetX = player.centerX ?? (player.x + player.width / 2);
            const targetY = player.y + (player.height ? player.height / 2 : 0);
            
            const dx = targetX - (bulletX + bulletWidth / 2);
            const dy = targetY - bulletY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const speed = 250; // bullet speed
                vx = (dx / dist) * speed;
                vy = (dy / dist) * speed;
            }
        }
        
        const bulletImg = this.bulletImage || (this.imageAssets && this.imageAssets.commonBugBullet) || (engine && engine.images && engine.images.commonBugBullet) || null;
        const projectile = new EnemyProjectile(bulletX, bulletY, vx, vy, 'common', bulletImg);
        engine.addEntity(projectile);
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
        // We use the blastImage rendered during DYING state as a minimal hook
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
        
        let imgToDraw = this.image || (this.imageAssets && this.imageAssets.commonBug);
        if (this.state === 'DYING') {
            const blast = this.blastImage || (this.imageAssets && this.imageAssets.commonBugBlast);
            if (blast) imgToDraw = blast;
        }

        if (imgToDraw) {
            ctx.drawImage(imgToDraw, this.x, this.y, this.width, this.height);
        } else {
            // Fallback
            ctx.fillStyle = this.state === 'DYING' ? 'orange' : 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
