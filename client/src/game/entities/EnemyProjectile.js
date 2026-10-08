export class EnemyProjectile {
    constructor(x, y, vx = 0, vy = 400, style = 'laser') {
        this.type = 'enemy_bullet';
        this.x = x;
        this.y = y;
        this.style = style;
        this.vx = vx;
        this.vy = vy;
        this.isDead = false;
        this.damage = 1;

        if (this.style === 'worm') {
            this.width = 6;
            this.height = 14;
        } else if (this.style === 'dot') {
            this.width = 2;
            this.height = 2;
        } else {
            this.width = 6;
            this.height = 16;
        }
    }

    update(dt, engine) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Remove if off-screen
        if (this.y > engine.height || this.y + this.height < 0 || this.x > engine.width || this.x + this.width < 0) {
            this.isDead = true;
        }
    }

    onCollideWithPlayer(player, engine) {
        if (engine.onPlayerHit) {
            engine.onPlayerHit();
        }
        this.isDead = true;
    }

    render(ctx) {
        if (this.style === 'worm') {
            ctx.save();
            ctx.fillStyle = '#00ff66'; // Cyber neon green
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00ff66';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Crisp white core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 1, this.y + 2, this.width - 2, this.height - 4);
            ctx.restore();
        } else if (this.style === 'dot') {
            ctx.save();
            ctx.fillStyle = '#ff2255'; // Neon retro red/pink
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#ff0055';
            ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
            // 1-pixel bright white core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(this.x), Math.round(this.y), 1, 1);
            ctx.restore();
        } else {
            ctx.fillStyle = '#ff00ff'; // Neon pink/purple for enemy bullet
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Add a glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff00ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0; // Reset
        }
    }
}

