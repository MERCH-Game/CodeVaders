import { CommonBug } from './entities/CommonBug.js';
import { CriticalBug } from './entities/CriticalBug.js';
import { DDoSBug } from './entities/DDoSBug.js';
import { IntroFormation } from './formations/IntroFormation.js';

export class EnemySpawner {
    constructor(images) {
        this.images = images;
        this.timeElapsed = 0;
        this.lastCommonSpawnTime = 0;
        this.lastCriticalSpawnTime = 0;
        this.ddosMinSpawnTime = 30; // seconds before DDoS bugs can spawn
        this.lastDdosSpawnTime = this.ddosMinSpawnTime; 
        this.commonSpawnInterval = 2; // seconds
        this.criticalSpawnInterval = 4; // seconds (increased quantity)
        this.ddosSpawnInterval = 12; // seconds
        
        this.introStarted = false;
        this.introFormation = null;
    }

    update(dt, engine) {
        if (!this.introStarted) {
            this.introStarted = true;
            this.introFormation = new IntroFormation(engine, this.images);
        }

        if (this.introFormation) {
            this.introFormation.update(dt, engine);
            if (this.introFormation.state === 'DONE') {
                this.introFormation = null;
                // Reset timers to prevent instant spawning right after intro
                this.timeElapsed = 0;
                this.lastCommonSpawnTime = 0;
                this.lastCriticalSpawnTime = 0;
                this.lastDdosSpawnTime = 0;
            }
            return; // Wait for intro to finish
        }

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

        // DDoS Bug spawning
        if (this.timeElapsed >= this.ddosMinSpawnTime) {
            if (this.timeElapsed - this.lastDdosSpawnTime >= this.ddosSpawnInterval) {
                this.lastDdosSpawnTime = this.timeElapsed;
                this.spawnDDoSBug(engine);
            }
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

    spawnDDoSBug(engine) {
        const randomX = Math.random() * (engine.width - 60);
        const bug = new DDoSBug(randomX, engine.height * -0.1, this.images);
        engine.addEntity(bug);
    }
}
