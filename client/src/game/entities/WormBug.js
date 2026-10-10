import { EnemyProjectile } from './EnemyProjectile.js';

export const WORM_BUG_CONFIG = {
    hp: 1,
    maxHp: 1,
    score: 250,
    width: 56,
    height: 56,
    spiralDuration: 2.2, // Seconds to complete the spiral entry
    spiralLoops: 2.0, // Number of complete spiral rotations
    holdDuration: 1.0, // Seconds to hold stationed position
    approachSpeed: 65, // Speed while moving toward the player
    fireRate: 1.8, // Seconds between shots
    bulletSpeed: 230 // Bullet velocity toward player
};

export class WormBug {
    constructor(startX, startY, targetX, targetY, imageAssets, direction = 1) {
        this.type = 'enemy';
        this.id = 'worm_' + Math.random().toString(36).substring(7);
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.width = WORM_BUG_CONFIG.width;
        this.height = WORM_BUG_CONFIG.height;
        this.hp = WORM_BUG_CONFIG.hp;
        
        // Direction: 1 = Left to Right entry, -1 = Right to Left entry
        this.direction = direction;
        
        // States: SPIRAL -> HOLD -> APPROACH -> DYING -> DEAD
        this.state = 'SPIRAL';
        
        this.spiralProgress = 0;
        this.spiralDuration = WORM_BUG_CONFIG.spiralDuration;
        this.spiralLoops = WORM_BUG_CONFIG.spiralLoops;
        
        // Initial spiral radius based on horizontal distance to target
        this.initialRadiusX = Math.abs(this.targetX - this.startX);
        this.initialRadiusY = Math.min(85, Math.max(45, this.targetY - 25));
        
        // Start angle: PI if entering from left (so cos(PI) = -1), 0 if from right (cos(0) = 1)
        this.startAngle = this.direction === 1 ? Math.PI : 0;
        
        this.holdTimer = 0;
        this.hoverTimer = 0;
        this.shootTimer = 0.4; // Ready to shoot soon after positioning
        this.deathTimer = 0;
        this.isDead = false;
        
        this.imageAssets = imageAssets;
        this.image = imageAssets ? imageAssets.wormBug : null;
        this.blastImage = imageAssets ? (imageAssets.criticalBugBlast || imageAssets.commonBugBlast) : null;
    }

    update(dt, engine) {
        if (this.state === 'DEAD') {
            this.isDead = true;
            return;
        }

        if (this.state === 'SPIRAL') {
            this.spiralProgress += dt / this.spiralDuration;
            const p = Math.min(1, this.spiralProgress);
            
            // Archimedean spiral inward toward (targetX, targetY)
            // Radius scales down from initialRadius to 0
            const currentRadiusX = this.initialRadiusX * (1 - p);
            const currentRadiusY = this.initialRadiusY * (1 - p);
            
            // Total angle completed
            const angle = this.startAngle + this.direction * (p * Math.PI * 2 * this.spiralLoops);
            
            this.x = (this.targetX + Math.cos(angle) * currentRadiusX) - this.width / 2;
            this.y = (this.targetY + Math.sin(angle) * currentRadiusY) - this.height / 2;
            
            // When spiral is completed, transition to HOLD state at target position
            if (p >= 1) {
                this.x = this.targetX - this.width / 2;
                this.y = this.targetY - this.height / 2;
                this.state = 'HOLD';
                this.holdTimer = 0;
                this.hoverTimer = 0;
            }

        } else if (this.state === 'HOLD') {
            this.holdTimer += dt;
            this.hoverTimer += dt;
            
            // Subtle hovering slither in place
            this.x = (this.targetX - this.width / 2) + Math.cos(this.hoverTimer * 2.5) * 4;
            this.y = (this.targetY - this.height / 2) + Math.sin(this.hoverTimer * 3.5) * 5;
            
            // Hold position briefly, then advance toward player
            if (this.holdTimer >= WORM_BUG_CONFIG.holdDuration) {
                this.state = 'APPROACH';
                this.shoot(engine); // Fire shot right as approach begins
            }

        } else if (this.state === 'APPROACH') {
            this.hoverTimer += dt;
            
            // Track player position
            const player = engine.playerShooter || engine.entities.find(e => e.type === 'player');
            const targetPlayerX = player ? (player.centerX ?? (player.x + player.width / 2)) : (engine.width / 2);
            const targetPlayerY = player ? (player.y + (player.height ? player.height / 2 : 0)) : engine.height;
            
            const dx = targetPlayerX - (this.x + this.width / 2);
            const dy = targetPlayerY - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                
                // Slithering wave perpendicular to the approach vector
                const wave = Math.sin(this.hoverTimer * 4.5) * 20;
                const perpX = -dirY * wave;
                const perpY = dirX * wave;
                
                this.x += (dirX * WORM_BUG_CONFIG.approachSpeed + perpX) * dt;
                this.y += (dirY * WORM_BUG_CONFIG.approachSpeed + perpY) * dt;
            } else {
                this.y += WORM_BUG_CONFIG.approachSpeed * dt;
            }
            
            // Keep inside reasonable horizontal boundaries
            this.x = Math.max(8, Math.min(engine.width - this.width - 8, this.x));
            
            // Shooting logic
            this.shootTimer += dt;
            if (this.shootTimer >= WORM_BUG_CONFIG.fireRate) {
                this.shootTimer = 0;
                this.shoot(engine);
            }
            
            // Cleanly despawn when passing below screen
            if (this.y > engine.height + this.height) {
                this.state = 'DEAD';
                this.isDead = true;
            }

        } else if (this.state === 'DYING') {
            this.deathTimer += dt;
            if (this.deathTimer > 0.25) {
                this.state = 'DEAD';
                this.isDead = true;
            }
        }
    }

    shoot(engine) {
        const bulletX = this.x + this.width / 2 - 3;
        const bulletY = this.y + this.height;
        
        let vx = 0;
        let vy = WORM_BUG_CONFIG.bulletSpeed;
        
        const player = engine.playerShooter || engine.entities.find(e => e.type === 'player');
        if (player) {
            const targetX = player.centerX ?? (player.x + player.width / 2);
            const targetY = player.y + (player.height ? player.height / 2 : 0);
            
            const dx = targetX - (bulletX + 3);
            const dy = targetY - bulletY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                vx = (dx / dist) * WORM_BUG_CONFIG.bulletSpeed;
                vy = (dy / dist) * WORM_BUG_CONFIG.bulletSpeed;
            }
        }
        
        const bullet = new EnemyProjectile(bulletX, bulletY, vx, vy, 'worm');
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
        
        let imgToDraw = this.image || (this.imageAssets && this.imageAssets.wormBug);
        if (this.state === 'DYING') {
            const blast = this.blastImage || (this.imageAssets && (this.imageAssets.criticalBugBlast || this.imageAssets.commonBugBlast));
            if (blast) imgToDraw = blast;
        }

        if (imgToDraw) {
            // Draw clean sprite with NO glow
            ctx.drawImage(imgToDraw, this.x, this.y, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = this.state === 'DYING' ? 'orange' : '#00ff66';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
