export const COMMON_BUG_CONFIG = {
    hp: 1,
    maxHp: 1,
    waitDuration: 0.5, // seconds
    diveSpeed: 250, // pixels per second
    score: 100,
    width: 48,
    height: 48
};

export class CommonBug {
    constructor(x, y, imageAssets) {
        this.type = 'enemy';
        this.id = 'common_' + Math.random().toString(36).substring(7);
        this.x = x;
        this.y = y;
        this.width = COMMON_BUG_CONFIG.width;
        this.height = COMMON_BUG_CONFIG.height;
        this.hp = COMMON_BUG_CONFIG.hp;
        
        this.state = 'WAITING'; // WAITING, DIVING, DYING, DEAD
        this.isFormationMember = false;
        this.waitTimer = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isDead = false;
        
        this.imageAssets = imageAssets;
        this.image = imageAssets.commonBug;
        this.blastImage = imageAssets.commonBugBlast;
        this.deathTimer = 0;
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

        if (this.state === 'WAITING') {
            this.waitTimer += dt;
            // Optional bobbing effect
            this.y += Math.sin(this.waitTimer * 5) * 10 * dt;

            if (this.waitTimer >= COMMON_BUG_CONFIG.waitDuration) {
                this.state = 'DIVING';
                
                // Calculate dive vector towards player
                const player = engine.entities.find(e => e.type === 'player');
                if (player) {
                    const dx = player.x + player.width / 2 - (this.x + this.width / 2);
                    const dy = player.y + player.height / 2 - (this.y + this.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        this.velocityX = (dx / dist) * COMMON_BUG_CONFIG.diveSpeed;
                        this.velocityY = (dy / dist) * COMMON_BUG_CONFIG.diveSpeed;
                    } else {
                        this.velocityY = COMMON_BUG_CONFIG.diveSpeed;
                    }
                } else {
                    this.velocityY = COMMON_BUG_CONFIG.diveSpeed; // default downward dive
                }
            }
        } else if (this.state === 'DIVING') {
            this.x += this.velocityX * dt;
            this.y += this.velocityY * dt;
            
            // Cleanly remove/despawn the enemy after it exits the relevant game area
            if (this.y > engine.height + this.height || this.x < -this.width || this.x > engine.width + this.width) {
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
