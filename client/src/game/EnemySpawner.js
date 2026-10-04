import { CommonBug } from './entities/CommonBug.js';
import { CriticalBug } from './entities/CriticalBug.js';

export class EnemySpawner {
    constructor(images) {
        this.images = images;
        this.timeElapsed = 0;
        this.lastCommonSpawnTime = 0;
        this.lastCriticalSpawnTime = 0;
        this.commonSpawnInterval = 2; // seconds
        this.criticalSpawnInterval = 7; // seconds (less quantity)
    }

    update(dt, engine) {
        this.timeElapsed += dt;

        // Regular Common Bug spawning
        if (this.timeElapsed - this.lastCommonSpawnTime >= this.commonSpawnInterval) {
            this.lastCommonSpawnTime = this.timeElapsed;
            this.spawnCommon(engine);
        }

        // Infinite Critical Bug spawning at lower frequency
        if (this.timeElapsed - this.lastCriticalSpawnTime >= this.criticalSpawnInterval) {
            this.lastCriticalSpawnTime = this.timeElapsed;
            this.spawnCritical(engine);
        }
    }

    spawnCommon(engine) {
        const randomX = Math.random() * (engine.width - 50);
        const bug = new CommonBug(randomX, engine.height * -0.1, this.images);
        engine.addEntity(bug);
    }

    spawnCritical(engine) {
        const randomX = Math.random() * (engine.width - 70);
        const bug = new CriticalBug(randomX, engine.height * -0.1, this.images);
        engine.addEntity(bug);
    }
}
