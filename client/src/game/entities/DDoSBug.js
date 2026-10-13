import { DDoSChildOrb } from './DDoSChildOrb.js';

export const DDOS_BUG_CONFIG = {
    hp: 3,
    maxHp: 3,
    speedX: 50,
    speedY: 20,
    score: 300,
    width: 60,
    height: 48,
    spreadAngle: Math.PI / 8, // ~22.5 degrees spread
};

export class DDoSBug {
    constructor(x, y, imageAssets) {
        this.type = 'enemy';
        this.id = 'ddos_' + Math.random().toString(36).substring(7);
        this.x = x;
        this.y = y;
        this.width = DDOS_BUG_CONFIG.width;
        this.height = DDOS_BUG_CONFIG.height;
        this.hp = DDOS_BUG_CONFIG.hp;
        
        this.state = 'MOVING'; // MOVING, DYING, DEAD
        this.isFormationMember = false;
        
        this.velocityX = (Math.random() > 0.5 ? 1 : -1) * DDOS_BUG_CONFIG.speedX;
        this.velocityY = DDOS_BUG_CONFIG.speedY;
        
        this.isDead = false;
        
        this.imageAssets = imageAssets;
        this.image = imageAssets ? imageAssets.ddosBug : null;
        this.blastImage = imageAssets ? imageAssets.criticalBugBlast : null; // Explode nicely
        
        this.deathTimer = 0;
        this.hasSplit = false;
    }

    update(dt, engine) {
        if (this.state === 'DEAD') {
            this.isDead = true;
            return;
        }

        if (this.isFormationMember) {
            if (this.state === 'DYING') {
                this.updateDying(dt, engine);
            }
        } else if (this.state === 'MOVING') {
            this.x += this.velocityX * dt;
            this.y += this.velocityY * dt;

            // Bounce off walls
            if (this.x < 0) {
                this.x = 0;
                this.velocityX *= -1;
            } else if (this.x + this.width > engine.width) {
                this.x = engine.width - this.width;
                this.velocityX *= -1;
            }

            // Despawn
            if (this.y > engine.height + this.height) {
                this.state = 'DEAD';
                this.isDead = true;
            }
        } else if (this.state === 'DYING') {
            this.updateDying(dt, engine);
        }
    }

    updateDying(dt, engine) {
        this.deathTimer += dt;
        
        // Trigger split immediately on death sequence start
        if (!this.hasSplit) {
            this.hasSplit = true;
            this.triggerSplit(engine);
        }

        if (this.deathTimer > 0.2) {
            this.state = 'DEAD';
            this.isDead = true;
        }
    }

    triggerSplit(engine) {
        const player = engine.playerShooter;
        let targetX = this.x + this.width / 2;
        let targetY = engine.height;

        if (player) {
            targetX = player.centerX;
            targetY = player.y + player.height / 2;
        }

        const spawnXOffset = 25; // Separation distance
        const orbsToSpawn = [
            { offsetX: -spawnXOffset, angle: -DDOS_BUG_CONFIG.spreadAngle }, // Left
            { offsetX: 0, angle: 0 }, // Center
            { offsetX: spawnXOffset, angle: DDOS_BUG_CONFIG.spreadAngle } // Right
        ];

        let adjustedY = this.y + this.height / 2;
        if (player) {
            const distY = player.y - adjustedY;
            if (distY < 80 && distY >= 0) {
                // Ensure player has reaction time if DDoS Bug dies too close
                adjustedY = player.y - 80;
            }
        }

        orbsToSpawn.forEach(cfg => {
            const spawnX = this.x + this.width / 2 + cfg.offsetX - 12; // 12 is half orb width
            const spawnY = adjustedY - 12;
            const orb = new DDoSChildOrb(spawnX, spawnY, targetX, targetY, cfg.angle, this.imageAssets);
            engine.addEntity(orb);
        });
    }

    takeDamage(amount, engine) {
        if (this.state === 'DYING' || this.state === 'DEAD') return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            if (engine.autoAimActive) this.hasSplit = true;
            this.state = 'DYING';
        }
    }

    onCollideWithPlayer(player, engine) {
        if (this.state === 'DYING' || this.state === 'DEAD') return;
        
        if (engine.onPlayerHit) engine.onPlayerHit();
        
        this.hp = 0;
        this.state = 'DYING';
    }

    render(ctx) {
        if (this.state === 'DEAD') return;
        
        let imgToDraw = this.image || (this.imageAssets && this.imageAssets.ddosBug);
        if (this.state === 'DYING') {
            const blast = this.blastImage || (this.imageAssets && this.imageAssets.criticalBugBlast);
            if (blast) imgToDraw = blast;
        }

        if (imgToDraw) {
            ctx.drawImage(imgToDraw, this.x, this.y, this.width, this.height);
        } else {
            // Fallback
            ctx.fillStyle = this.state === 'DYING' ? 'orange' : '#ff4400';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
