export class PowerUpDrop {
    constructor(x, y, powerUp, images) {
        this.type = 'power_up';
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.powerUp = powerUp;
        this.images = images;
        this.speed = 100;
        this.isDead = false;
    }

    update(dt, engine) {
        this.y += this.speed * dt;

        if (this.y > engine.height) {
            this.isDead = true;
        }
    }

    render(ctx) {
        const image = this.images[this.powerUp];
        if (image) {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
