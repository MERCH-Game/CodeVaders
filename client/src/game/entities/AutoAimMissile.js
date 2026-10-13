const MISSILE_SPEED = 520;
const MISSILE_WIDTH = 28;
const MISSILE_HEIGHT = 42;
const FRAME_DURATION = 0.1;
const CROSSHAIR_SIZE = 40;

export class AutoAimMissile {
    constructor(playerCenterX, playerY, target, images) {
        this.type = 'auto_aim_missile';
        this.target = target;
        this.images = images;
        this.x = playerCenterX - MISSILE_WIDTH / 2;
        this.y = playerY - MISSILE_HEIGHT;
        this.width = MISSILE_WIDTH;
        this.height = MISSILE_HEIGHT;
        this.angle = -Math.PI / 2;
        this.elapsed = 0;
        this.isDead = false;
    }

    update(dt, engine) {
        if (this.target.isDead || this.target.state === 'DYING' || this.target.state === 'DEAD') {
            this.isDead = true;
            engine.launchNextAutoAimMissile();
            return;
        }

        this.elapsed += dt;
        const targetX = this.target.x + this.target.width / 2;
        const targetY = this.target.y + this.target.height / 2;
        const missileX = this.x + this.width / 2;
        const missileY = this.y + this.height / 2;
        const dx = targetX - missileX;
        const dy = targetY - missileY;
        const distance = Math.hypot(dx, dy);
        const travelDistance = MISSILE_SPEED * dt;
        this.angle = Math.atan2(dy, dx);

        if (distance <= travelDistance) {
            this.target.takeDamage(this.target.hp, engine);
            this.isDead = true;
            engine.launchNextAutoAimMissile();
            return;
        }

        this.x += (dx / distance) * travelDistance;
        this.y += (dy / distance) * travelDistance;
    }

    render(ctx) {
        const targetX = this.target.x + this.target.width / 2;
        const targetY = this.target.y + this.target.height / 2;
        const crosshair = this.images?.autoAimCrosshair;

        if (crosshair) {
            ctx.drawImage(
                crosshair,
                targetX - CROSSHAIR_SIZE / 2,
                targetY - CROSSHAIR_SIZE / 2,
                CROSSHAIR_SIZE,
                CROSSHAIR_SIZE,
            );
        } else {
            ctx.save();
            ctx.strokeStyle = '#ff334f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(targetX, targetY, CROSSHAIR_SIZE / 2, 0, Math.PI * 2);
            ctx.moveTo(targetX - CROSSHAIR_SIZE / 2 - 4, targetY);
            ctx.lineTo(targetX + CROSSHAIR_SIZE / 2 + 4, targetY);
            ctx.moveTo(targetX, targetY - CROSSHAIR_SIZE / 2 - 4);
            ctx.lineTo(targetX, targetY + CROSSHAIR_SIZE / 2 + 4);
            ctx.stroke();
            ctx.restore();
        }

        const frames = [
            this.images?.rocket1,
            this.images?.rocket2,
            this.images?.rocket3,
        ];
        const frame = frames[Math.floor(this.elapsed / FRAME_DURATION) % frames.length];

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle + Math.PI / 2);
        if (frame) {
            ctx.drawImage(frame, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#ff334f';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
}