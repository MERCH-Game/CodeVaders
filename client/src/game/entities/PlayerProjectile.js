export class PlayerProjectile {
    constructor(x, y) {
        this.type = 'player_bullet';
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 16;
        this.vy = -400;
        this.isDead = false;
        this.damage = 1;
    }

    update(dt, engine) {
        this.y += this.vy * dt;

        if (this.y + this.height < 0) {
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
