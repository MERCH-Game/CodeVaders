export const CHILD_ORB_CONFIG = {
    speed: 250, // High speed
    width: 24,
    height: 24
};

export class DDoSChildOrb {
    constructor(x, y, targetX, targetY, angleOffset, imageAssets) {
        this.type = 'enemy_bullet'; // Reuses enemy_bullet for collision with player
        this.x = x;
        this.y = y;
        this.width = CHILD_ORB_CONFIG.width;
        this.height = CHILD_ORB_CONFIG.height;
        this.isDead = false;
        this.damage = 1;
        
        this.image = imageAssets ? imageAssets.ddosOrb : null;

        // Calculate independent trajectory toward captured target position
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const baseAngle = Math.atan2(dy, dx);
        
        // Apply spread angle offset
        const finalAngle = baseAngle + angleOffset;

        this.vx = Math.cos(finalAngle) * CHILD_ORB_CONFIG.speed;
        this.vy = Math.sin(finalAngle) * CHILD_ORB_CONFIG.speed;
    }

    update(dt, engine) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clean up if it leaves the playable area
        if (this.y > engine.height + 50 || this.x + this.width < -50 || this.x > engine.width + 50 || this.y < -50) {
            this.isDead = true;
        }
    }

    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
