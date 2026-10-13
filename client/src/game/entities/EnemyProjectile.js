export class EnemyProjectile {
    constructor(x, y, vx = 0, vy = 400, style = 'laser', image = null) {
        this.type = 'enemy_bullet';
        this.x = x;
        this.y = y;
        this.style = style;
        this.vx = vx;
        this.vy = vy;
        this.isDead = false;
        this.damage = 1;
        this.image = image;

        if (this.style === 'worm') {
            this.width = 6;
            this.height = 14;
        } else if (this.style === 'dot' || this.style === 'common') {
            this.width = 12;
            this.height = 12;
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
        } else if (this.style === 'dot' || this.style === 'common') {
            const img = this.image;
            if (img && img.complete !== false && (img.naturalWidth || img.width) > 0) {
                // Accounting for transparent padding in the 536x465 sprite asset
                // (visible red bullet occupies ~32% width and ~37% height, yielding ~16x16 visible square)
                const drawW = 50;
                const drawH = 43;
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                const drawX = Math.round(cx - drawW / 2);
                const drawY = Math.round(cy - drawH / 2);

                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
                ctx.restore();
            } else {
                ctx.fillStyle = '#ff0033';
                ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
            }
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

