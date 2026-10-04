export class GameEngine {
    constructor(canvas, onPlayerHit) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = [];
        this.lastTime = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.isRunning = false;
        this.onPlayerHit = onPlayerHit;
        this.spawner = null;
    }

    setSpawner(spawner) {
        this.spawner = spawner;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    loop(time) {
        if (!this.isRunning) return;

        const dt = (time - this.lastTime) / 1000; // seconds
        this.lastTime = time;

        // Cap dt to prevent huge jumps if tab is inactive
        const safeDt = Math.min(dt, 0.1);

        this.update(safeDt);
        this.render();

        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Update systems/spawner
        if (this.spawner && this.spawner.update) {
            this.spawner.update(dt, this);
        }

        // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.update) {
                entity.update(dt, this);
            }
            if (entity.isDead) {
                this.entities.splice(i, 1);
            }
        }

        // Simple AABB Collision Detection
        this.handleCollisions();
    }

    handleCollisions() {
        const enemies = this.entities.filter(e => e.type === 'enemy');
        const player = this.entities.find(e => e.type === 'player');
        const playerBullets = this.entities.filter(e => e.type === 'player_bullet');

        // Enemy vs Player
        if (player) {
            for (const enemy of enemies) {
                if (this.checkAABB(player, enemy)) {
                    enemy.onCollideWithPlayer(player, this);
                }
            }
        }

        // PlayerBullets vs Enemy
        for (const bullet of playerBullets) {
            for (const enemy of enemies) {
                if (this.checkAABB(bullet, enemy)) {
                    enemy.takeDamage(bullet.damage || 1, this);
                    bullet.isDead = true; // Destroy bullet
                }
            }
        }
    }

    checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
            }
        }
    }
}
