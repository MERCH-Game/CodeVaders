import { CommonBug } from './entities/CommonBug.js';
import { CriticalBug } from './entities/CriticalBug.js';
import { DDoSBug } from './entities/DDoSBug.js';
import { WormBug } from './entities/WormBug.js';
import { IntroFormation } from './formations/IntroFormation.js';

export class EnemySpawner {
    constructor(images) {
        this.images = images;
        this.timeElapsed = 0;
        this.lastCommonSpawnTime = 0;
        this.lastCriticalSpawnTime = 0;
        this.wormSpawnInterval = 6.0; // seconds
        this.lastWormSpawnTime = 1.0; 
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
                this.timeElapsed = 0;
                this.lastCommonSpawnTime = 0;
                this.spawnCommon(engine); // Immediately spawn enemy right after castle clears
                this.lastCriticalSpawnTime = -this.criticalSpawnInterval + 1.0; // Critical bug appears 1s later
                this.lastWormSpawnTime = -this.wormSpawnInterval + 4.0; // Worm bug appears ~4s after formation
                this.lastDdosSpawnTime = 0;
            }
            return; // Wait for intro to finish
        }

        this.timeElapsed += dt;

        // Regular Common Bug spawning
        const currentCommonInterval = Math.max(0.6, this.commonSpawnInterval - Math.floor(this.timeElapsed / 20) * 0.3);
        if (this.timeElapsed - this.lastCommonSpawnTime >= currentCommonInterval) {
            this.lastCommonSpawnTime = this.timeElapsed;
            this.spawnCommon(engine);
        }

        // Critical Bug spawning
        if (this.timeElapsed - this.lastCriticalSpawnTime >= this.criticalSpawnInterval) {
            this.lastCriticalSpawnTime = this.timeElapsed;
            this.spawnCritical(engine);
        }

        // Worm Bug spawning
        if (this.timeElapsed - this.lastWormSpawnTime >= this.wormSpawnInterval) {
            this.lastWormSpawnTime = this.timeElapsed;
            this.spawnWormBug(engine);
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
        const isLeft = Math.random() > 0.5;
        const direction = isLeft ? 1 : -1;
        const startX = isLeft ? -50 : engine.width + 50;
        const startY = Math.random() * (engine.height * 0.4); // spawn in top 40% of screen
        
        const bug = new CommonBug(startX, startY, this.images, direction);
        engine.addEntity(bug);
    }

    spawnCritical(engine) {
        const randomX = Math.random() * (engine.width - 70);
        const bug = new CriticalBug(randomX, engine.height * -0.1, this.images);
        engine.addEntity(bug);
    }

    spawnWormBug(engine) {
        const isLeft = Math.random() > 0.5;
        const direction = isLeft ? 1 : -1;
        const startX = isLeft ? -70 : engine.width + 70;
        
        // Target positioning area in upper/mid screen (18% to 34% height)
        const targetY = engine.height * (0.18 + Math.random() * 0.16);
        const startY = targetY;
        
        // Station somewhere in the center safe zone of the screen (25% to 75% width)
        const targetX = engine.width * (0.25 + Math.random() * 0.5);
        
        const worm = new WormBug(startX, startY, targetX, targetY, this.images, direction);
        engine.addEntity(worm);
    }

    spawnDDoSBug(engine) {
        const randomX = Math.random() * (engine.width - 60);
        const bug = new DDoSBug(randomX, engine.height * -0.1, this.images);
        engine.addEntity(bug);
    }
}
