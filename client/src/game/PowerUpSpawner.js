import { PowerUpDrop } from './entities/PowerUpDrop.js';

const POWER_UPS = ['claude', 'cpp', 'java', 'python'];
const MAX_ACTIVE_DROPS = 2;

export class PowerUpSpawner {
    constructor(images) {
        this.images = images;
        this.spawnTimer = 0;
        this.nextSpawnTime = this.getNextSpawnTime();
    }

    getNextSpawnTime() {
        return 4 + Math.random() * 5;
    }

    update(dt, engine) {
        this.spawnTimer += dt;
        if (this.spawnTimer < this.nextSpawnTime) return;

        this.spawnTimer = 0;
        this.nextSpawnTime = this.getNextSpawnTime();

        const activeDrops = engine.entities.filter(
            entity => entity.type === 'power_up' && !entity.isDead,
        ).length;
        if (activeDrops >= MAX_ACTIVE_DROPS) return;

        const powerUp = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
        const width = 32;
        const x = Math.random() * Math.max(0, engine.width - width);
        engine.addEntity(new PowerUpDrop(x, -width, powerUp, this.images));
    }
}
