export class PlayerProjectile {
    constructor(x, y, vx = 0) {
        this.type = 'player_bullet';
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 16;
        this.vx = vx;
        this.vy = -400;
        this.isDead = false;
        this.damage = 1;
    }

    update(dt, engine) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (
            this.y + this.height < 0
            || this.x + this.width < 0
            || this.x > engine.width
        ) {
            this.isDead = true;
        }
    }

    render(ctx) {
        ctx.fillStyle = '#00aaff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00aaff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}
