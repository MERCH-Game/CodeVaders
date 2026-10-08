import { CommonBug } from '../entities/CommonBug.js';

export class IntroFormation {
    constructor(engine, images) {
        this.bugs = [];
        this.state = 'ENTERING';
        this.timer = 0;
        
        // 10 bugs forming a wide, solid castle barrier spanning the screen
        this.formationOffsets = [
            // Outer towers
            { dx: -2, dy: 0 }, { dx: 2, dy: 0 },
            // Inner upper walls
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
            // Solid impenetrable horizontal wall
            { dx: -2, dy: 2 }, { dx: -1, dy: 2 }, { dx: 0, dy: 2 }, { dx: 1, dy: 2 }, { dx: 2, dy: 2 },
            // Vanguard / Gatehouse
            { dx: 0, dy: 3 }
        ];
        
        this.baseX = engine.width / 2;
        this.baseY = engine.height * 0.15;
        // Calculate spacing so the outer bugs (dx: -2 and 2) sit with a small 35px margin from the edges
        this.spacingX = (engine.width - 70) / 4; 
        this.spacingY = 45;
        
        this.formationOffsets.forEach((offset) => {
            // Bugs entering from both left and right sides
            const isLeft = offset.dx < 0;
            const startX = isLeft ? -80 : engine.width + 80;
            const startY = this.baseY + offset.dy * this.spacingY;
            
            const bug = new CommonBug(startX, startY, images);
            bug.isFormationMember = true;
            
            bug.targetX = this.baseX + offset.dx * this.spacingX - bug.width / 2;
            bug.targetY = startY;
            
            this.bugs.push(bug);
            engine.addEntity(bug);
        });
    }

    update(dt, engine) {
        this.bugs = this.bugs.filter(bug => !bug.isDead && bug.state !== 'DEAD');
        
        if (this.bugs.length === 0 && this.state !== 'DONE') {
            this.state = 'DONE';
            return;
        }

        if (this.state === 'ENTERING') {
            let allReached = true;
            const speed = 120; // Entering speed
            
            for (const bug of this.bugs) {
                if (bug.state === 'DYING') continue;
                
                const dx = bug.targetX - bug.x;
                const dy = bug.targetY - bug.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 2) {
                    bug.x += (dx / dist) * speed * dt;
                    bug.y += (dy / dist) * speed * dt;
                    allReached = false;
                } else {
                    bug.x = bug.targetX;
                    bug.y = bug.targetY;
                }
            }
            
            if (allReached) {
                this.state = 'PAUSING';
                this.timer = 0;
            }
        } else if (this.state === 'PAUSING') {
            this.timer += dt;
            if (this.timer >= 1.5) {
                this.state = 'ADVANCING';
            }
        } else if (this.state === 'ADVANCING') {
            const advanceSpeed = 55; // Steady approach
            for (const bug of this.bugs) {
                if (bug.state === 'DYING') continue;
                bug.y += advanceSpeed * dt;
                
                if (bug.y > engine.height) {
                    bug.state = 'DEAD';
                    bug.isDead = true;
                }
            }
        }
    }
}
