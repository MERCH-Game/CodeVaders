export class EnemyProjectile {
    constructor(x, y) {
        this.type = 'enemy_bullet';
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 16;
        this.vy = 400; // Speed of the bullet straight down
        this.isDead = false;
        this.damage = 1;
    }

    update(dt, engine) {
        this.y += this.vy * dt;
        
        // Remove if off-screen
        if (this.y > engine.height) {
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
        ctx.fillStyle = '#ff00ff'; // Neon pink/purple for enemy bullet
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add a glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0; // Reset
    }
}
