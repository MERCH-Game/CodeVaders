import { EnemyProjectile } from './EnemyProjectile.js';

export const WORM_BUG_CONFIG = {
    hp: 1,
    maxHp: 1,
    score: 250,
    width: 58,
    height: 53,
    
    // Slither entrance parameters
    slitherDuration: 2.6, // Seconds to complete slither & coil entrance
    transitionDuration: 0.22, // Seconds for smooth sprite crossfade (150-250ms)
    waveAmp: 24.0, // Base amplitude of the serpentine travelling wave
    waveFreq: 8.5, // Frequency of serpentine undulation (rad/s)
    curveArc: 35.0, // Vertical arc curvature of entrance trajectory
    
    // Segment geometry
    segCount: 12, // Number of body segments behind head
    segSpacing: 10.5, // Spacing between segments along trail (px)
    headWidth: 58, // Animated head render width (px) - matches stationary face
    headHeight: 53, // Animated head render height (px) - matches stationary face
    segWidth: 26, // Body segment render width (px)
    segHeight: 24, // Body segment render height (px)
    
    // Stationary & Attack parameters
    holdDuration: 1.0, // Seconds to hold stationed position
    approachSpeed: 65, // Speed while moving toward player
    fireRate: 1.8, // Seconds between shots
    bulletSpeed: 230 // Bullet velocity toward player
};

export class WormBug {
    constructor(startX, startY, targetX, targetY, imageAssets, direction = 1, options = {}) {
        this.type = 'enemy';
        this.id = 'worm_' + Math.random().toString(36).substring(7);
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = startX - WORM_BUG_CONFIG.width / 2;
        this.y = startY - WORM_BUG_CONFIG.height / 2;
        this.width = WORM_BUG_CONFIG.width;
        this.height = WORM_BUG_CONFIG.height;
        this.hp = WORM_BUG_CONFIG.hp;
        
        // Multipliers from difficulty controller
        this.speedMultiplier = options.speedMultiplier || 1.0;
        this.fireRateMultiplier = options.fireRateMultiplier || 1.0;

        // Direction: 1 = Left to Right entry, -1 = Right to Left entry
        this.direction = direction;
        this.facing = direction; // 1 = facing right (default asset), -1 = facing left (flipped)
        
        // Lifecycle states: ENTER -> SLITHER -> COIL -> TRANSITION -> HOLD -> APPROACH -> DYING -> DEAD
        this.state = 'ENTER';
        
        this.animTime = 0;
        this.transitionTimer = 0;
        this.holdTimer = 0;
        this.hoverTimer = 0;
        this.shootTimer = 0.4; // Ready to shoot soon after positioning
        this.deathTimer = 0;
        this.isDead = false;
        
        // Trail recording for body segments
        this.trail = [];
        this.totalDist = 0;
        this.lastHeadPos = null;
        
        // Image assets (uses wormBugFace for primary / stationary sprite)
        this.imageAssets = imageAssets;
        this.faceImage = imageAssets ? (imageAssets.wormBugFace || imageAssets.wormBug) : null;
        this.image = this.faceImage;
        this.segmentImage = imageAssets ? imageAssets.wormBugSegment : null;
        this.blastImage = imageAssets ? (imageAssets.criticalBugBlast || imageAssets.commonBugBlast) : null;
    }

    /**
     * Exact visual anchor for the head inside the stationary pose.
     * The stationary image is the worm bug face, centered at (targetX, targetY).
     */
    getStationaryHeadAnchor() {
        return { x: this.targetX, y: this.targetY };
    }

    /**
     * Computes the head's position, tangent, and wave amplitude at time t.
     */
    getHeadKinematics(t) {
        const u = Math.min(1.0, Math.max(0.0, t / WORM_BUG_CONFIG.slitherDuration));
        // Smoothstep easing for natural deceleration into the destination
        const s = u * u * (3.0 - 2.0 * u);
        const anchor = this.getStationaryHeadAnchor();
        
        // Base curved trajectory
        const baseX = this.startX + (anchor.x - this.startX) * s;
        const baseY = this.startY + (anchor.y - this.startY) * s + Math.sin(u * Math.PI) * WORM_BUG_CONFIG.curveArc;
        
        // Tangent vector
        let tx;
        let ty;
        if (u < 1.0) {
            const uNext = Math.min(1.0, u + 0.005);
            const sNext = uNext * uNext * (3.0 - 2.0 * uNext);
            const nextBaseX = this.startX + (anchor.x - this.startX) * sNext;
            const nextBaseY = this.startY + (anchor.y - this.startY) * sNext + Math.sin(uNext * Math.PI) * WORM_BUG_CONFIG.curveArc;
            tx = nextBaseX - baseX;
            ty = nextBaseY - baseY;
        } else {
            tx = this.direction;
            ty = 0.0;
        }
        
        const len = Math.hypot(tx, ty);
        if (len > 0.0001) {
            tx /= len;
            ty /= len;
        } else {
            tx = this.direction;
            ty = 0.0;
        }
        
        // Normal vector for transverse undulation
        const nx = -ty;
        const ny = tx;
        
        // Amplitude gradually dampens to zero as snake reaches destination
        const amp = WORM_BUG_CONFIG.waveAmp * Math.max(0.0, 1.0 - Math.pow(u, 1.3));
        const headWave = amp * Math.sin(WORM_BUG_CONFIG.waveFreq * t);
        
        const hx = baseX + nx * headWave;
        const hy = baseY + ny * headWave;
        
        return { x: hx, y: hy, tx, ty, u, amp };
    }

    update(dt, engine) {
        if (this.state === 'DEAD') {
            this.isDead = true;
            return;
        }

        if (this.state === 'ENTER' || this.state === 'SLITHER' || this.state === 'COIL') {
            this.animTime += dt;
            const head = this.getHeadKinematics(this.animTime);
            
            // Advance lifecycle sub-states
            if (head.u < 0.2) {
                this.state = 'ENTER';
            } else if (head.u < 0.7) {
                this.state = 'SLITHER';
            } else if (head.u < 1.0) {
                this.state = 'COIL';
            } else {
                this.state = 'TRANSITION';
                this.transitionTimer = 0;
            }
            
            // Record head motion to trail for body segments
            const headAngle = Math.atan2(head.ty, head.tx);
            if (!this.lastHeadPos) {
                this.trail.push({ x: head.x, y: head.y, dist: 0, angle: headAngle });
                this.lastHeadPos = { x: head.x, y: head.y };
            } else {
                const d = Math.hypot(head.x - this.lastHeadPos.x, head.y - this.lastHeadPos.y);
                if (d > 0.5 || head.u === 1.0) {
                    this.totalDist += d;
                    this.trail.push({ x: head.x, y: head.y, dist: this.totalDist, angle: headAngle });
                    this.lastHeadPos = { x: head.x, y: head.y };
                }
            }
            
            // Prune old trail points to keep array compact
            const minKeepDist = this.totalDist - (WORM_BUG_CONFIG.segCount + 3) * WORM_BUG_CONFIG.segSpacing;
            while (this.trail.length > 3 && this.trail[1].dist < minKeepDist) {
                this.trail.shift();
            }
            
            // Authoritative hitbox follows the snake head/body
            this.x = head.x - this.width / 2;
            this.y = head.y - this.height / 2;

        } else if (this.state === 'TRANSITION') {
            this.transitionTimer += dt;
            this.x = this.targetX - this.width / 2;
            this.y = this.targetY - this.height / 2;
            
            if (this.transitionTimer >= WORM_BUG_CONFIG.transitionDuration) {
                this.state = 'HOLD';
                this.holdTimer = 0;
                this.hoverTimer = 0;
            }

        } else if (this.state === 'HOLD') {
            this.holdTimer += dt;
            this.hoverTimer += dt;
            
            // Subtle hovering slither in place at target position
            this.x = (this.targetX - this.width / 2) + Math.cos(this.hoverTimer * 2.5) * 4;
            this.y = (this.targetY - this.height / 2) + Math.sin(this.hoverTimer * 3.5) * 5;
            
            // Hold position briefly, then advance toward player
            if (this.holdTimer >= WORM_BUG_CONFIG.holdDuration) {
                this.state = 'APPROACH';
                this.shoot(engine); // Fire shot right as approach begins
            }

        } else if (this.state === 'APPROACH') {
            this.hoverTimer += dt;
            
            // Track player position
            const player = engine.playerShooter || engine.entities.find(e => e.type === 'player');
            const targetPlayerX = player ? (player.centerX ?? (player.x + player.width / 2)) : (engine.width / 2);
            const targetPlayerY = player ? (player.y + (player.height ? player.height / 2 : 0)) : engine.height;
            
            const dx = targetPlayerX - (this.x + this.width / 2);
            const dy = targetPlayerY - (this.y + this.height / 2);
            const dist = Math.hypot(dx, dy);

            if (dx < -10) {
                this.facing = -1;
            } else if (dx > 10) {
                this.facing = 1;
            }
            
            if (dist > 0) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                
                // Slithering wave perpendicular to the approach vector
                const wave = Math.sin(this.hoverTimer * 4.5) * 20;
                const perpX = -dirY * wave;
                const perpY = dirX * wave;
                
                this.x += (dirX * WORM_BUG_CONFIG.approachSpeed * this.speedMultiplier + perpX) * dt;
                this.y += (dirY * WORM_BUG_CONFIG.approachSpeed * this.speedMultiplier + perpY) * dt;
            } else {
                this.y += WORM_BUG_CONFIG.approachSpeed * this.speedMultiplier * dt;
            }
            
            // Keep inside reasonable horizontal boundaries
            this.x = Math.max(8, Math.min(engine.width - this.width - 8, this.x));
            
            // Shooting logic
            this.shootTimer += dt * this.fireRateMultiplier;
            if (this.shootTimer >= WORM_BUG_CONFIG.fireRate) {
                this.shootTimer = 0;
                this.shoot(engine);
            }
            
            // Cleanly despawn when passing below screen
            if (this.y > engine.height + this.height) {
                this.state = 'DEAD';
                this.isDead = true;
            }

        } else if (this.state === 'DYING') {
            this.deathTimer += dt;
            if (this.deathTimer > 0.25) {
                this.state = 'DEAD';
                this.isDead = true;
            }
        }
    }

    /**
     * Calculates positions and angles for all body segments based on the trail and coil blend.
     */
    getBodySegmentPositions() {
        const N = WORM_BUG_CONFIG.segCount;
        const spacing = WORM_BUG_CONFIG.segSpacing;
        const segments = [];
        
        const head = this.getHeadKinematics(this.animTime);
        const anchor = this.getStationaryHeadAnchor();
        let trailIndex = this.trail.length - 1;
        
        // Coil blend factor: 0 when u < 0.65, easing smoothly to 1.0 at u = 1.0
        const coilRaw = head.u < 0.65 ? 0 : (head.u - 0.65) / 0.35;
        const coilWeight = coilRaw * coilRaw * (3.0 - 2.0 * coilRaw); // smoothstep
        
        for (let k = 1; k <= N; k++) {
            const targetDist = this.totalDist - k * spacing;
            let sx = head.x;
            let sy = head.y;
            let sAngle = Math.atan2(head.ty, head.tx);
            
            if (targetDist <= 0 || this.trail.length < 2) {
                // Extrapolate backwards along initial entry vector
                const off = k * spacing;
                sx = head.x - head.tx * off;
                sy = head.y - head.ty * off;
            } else {
                while (trailIndex > 1 && this.trail[trailIndex - 1].dist > targetDist) {
                    trailIndex--;
                }
                const p0 = this.trail[trailIndex - 1];
                const p1 = this.trail[trailIndex];
                const segDist = p1.dist - p0.dist;
                const frac = segDist > 0.0001 ? (targetDist - p0.dist) / segDist : 0;
                sx = p0.x + (p1.x - p0.x) * frac;
                sy = p0.y + (p1.y - p0.y) * frac;
                sAngle = p0.angle + (p1.angle - p0.angle) * frac;
            }
            
            // Add travelling sinusoidal wave along body
            const normalX = -Math.sin(sAngle);
            const normalY = Math.cos(sAngle);
            const waveOffset = head.amp * Math.sin(WORM_BUG_CONFIG.waveFreq * this.animTime - k * 0.55) * (1.0 - (k / N) * 0.25);
            sx += normalX * waveOffset;
            sy += normalY * waveOffset;
            
            // Target coiled arrangement matching the stationary pose
            const frac = k / N;
            const radius = 10.0 + 9.0 * frac;
            const spiralAngle = Math.PI + frac * (Math.PI * 2 * 0.95);
            
            let coilX;
            const coilY = anchor.y + radius * Math.sin(spiralAngle);
            if (this.facing === -1) {
                coilX = anchor.x - radius * Math.cos(spiralAngle);
            } else {
                coilX = anchor.x + radius * Math.cos(spiralAngle);
            }
            
            // Smoothly guide into coiled pose
            const finalX = (1 - coilWeight) * sx + coilWeight * coilX;
            const finalY = (1 - coilWeight) * sy + coilWeight * coilY;
            
            let segAngle = sAngle;
            if (coilWeight > 0.5) {
                const spiralTangent = spiralAngle + Math.PI / 2;
                const coilAngle = this.facing === -1 ? Math.PI - spiralTangent : spiralTangent;
                segAngle = (1 - coilWeight) * sAngle + coilWeight * coilAngle;
            }
            
            segments.push({ x: finalX, y: finalY, angle: segAngle, index: k });
        }
        
        return { head, segments };
    }

    shoot(engine) {
        if (engine && engine.canEnemyShoot && !engine.canEnemyShoot()) return;
        const bulletX = this.x + this.width / 2 - 3;
        const bulletY = this.y + this.height;
        
        let vx = 0;
        let vy = WORM_BUG_CONFIG.bulletSpeed;
        
        const player = engine.playerShooter || engine.entities.find(e => e.type === 'player');
        if (player) {
            const targetX = player.centerX ?? (player.x + player.width / 2);
            const targetY = player.y + (player.height ? player.height / 2 : 0);
            
            const dx = targetX - (bulletX + 3);
            const dy = targetY - bulletY;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 0) {
                vx = (dx / dist) * WORM_BUG_CONFIG.bulletSpeed;
                vy = (dy / dist) * WORM_BUG_CONFIG.bulletSpeed;
            }
        }
        
        const bullet = new EnemyProjectile(bulletX, bulletY, vx, vy, 'worm');
        engine.addEntity(bullet);
    }

    takeDamage(amount, engine) {
        if (this.state === 'DYING' || this.state === 'DEAD') return;
        
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.triggerExplosion(engine);
            this.state = 'DYING';
        }
    }

    triggerExplosion(_engine) {
        this.deathTimer = 0;
    }

    onCollideWithPlayer(player, engine) {
        if (this.state === 'DYING' || this.state === 'DEAD') return;
        
        if (engine.onPlayerHit) {
            engine.onPlayerHit();
        }
        
        this.triggerExplosion(engine);
        this.state = 'DYING';
    }

    renderAnimatedSnake(ctx, alpha) {
        if (alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const { head, segments } = this.getBodySegmentPositions();
        const segImg = this.segmentImage || (this.imageAssets && this.imageAssets.wormBugSegment);
        const faceImg = this.faceImage || (this.imageAssets && this.imageAssets.wormBugFace);
        
        // Draw body segments from tail (k = N) down to neck (k = 1)
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];
            ctx.save();
            ctx.translate(Math.round(seg.x), Math.round(seg.y));
            
            if (this.facing === -1) {
                ctx.scale(-1, 1);
                const localAngle = Math.atan2(Math.sin(seg.angle), -Math.cos(seg.angle));
                ctx.rotate(localAngle);
            } else {
                ctx.rotate(seg.angle);
            }
            
            if (segImg) {
                ctx.drawImage(
                    segImg,
                    -WORM_BUG_CONFIG.segWidth / 2,
                    -WORM_BUG_CONFIG.segHeight / 2,
                    WORM_BUG_CONFIG.segWidth,
                    WORM_BUG_CONFIG.segHeight
                );
            } else {
                ctx.fillStyle = '#7a22a3';
                ctx.beginPath();
                ctx.arc(0, 0, WORM_BUG_CONFIG.segWidth / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#b83bfa';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();
        }
        
        // Draw animated head on top of the neck
        ctx.save();
        ctx.translate(Math.round(head.x), Math.round(head.y));
        
        if (this.facing === -1) {
            ctx.scale(-1, 1);
            const localHeadAngle = Math.atan2(head.ty, -head.tx);
            ctx.rotate(localHeadAngle);
        } else {
            const headAngle = Math.atan2(head.ty, head.tx);
            ctx.rotate(headAngle);
        }
        
        if (faceImg) {
            ctx.drawImage(
                faceImg,
                -WORM_BUG_CONFIG.headWidth / 2,
                -WORM_BUG_CONFIG.headHeight / 2,
                WORM_BUG_CONFIG.headWidth,
                WORM_BUG_CONFIG.headHeight
            );
        } else {
            ctx.fillStyle = '#9b30ff';
            ctx.fillRect(
                -WORM_BUG_CONFIG.headWidth / 2,
                -WORM_BUG_CONFIG.headHeight / 2,
                WORM_BUG_CONFIG.headWidth,
                WORM_BUG_CONFIG.headHeight
            );
        }
        ctx.restore();
        
        ctx.restore();
    }

    renderStationarySprite(ctx, alpha) {
        if (alpha <= 0) return;
        const imgToDraw = this.faceImage || this.image || (this.imageAssets && (this.imageAssets.wormBugFace || this.imageAssets.wormBug));
        if (!imgToDraw) {
            ctx.fillStyle = '#9b30ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const posX = Math.round(this.state === 'TRANSITION' ? this.targetX - this.width / 2 : this.x);
        const posY = Math.round(this.state === 'TRANSITION' ? this.targetY - this.height / 2 : this.y);
        
        if (this.facing === -1) {
            ctx.translate(posX + this.width, posY);
            ctx.scale(-1, 1);
            ctx.drawImage(imgToDraw, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(imgToDraw, posX, posY, this.width, this.height);
        }
        
        ctx.restore();
    }

    render(ctx) {
        if (this.state === 'DEAD') return;
        
        if (this.state === 'DYING') {
            const blast = this.blastImage || (this.imageAssets && (this.imageAssets.criticalBugBlast || this.imageAssets.commonBugBlast));
            if (blast) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(blast, Math.round(this.x), Math.round(this.y), this.width, this.height);
                ctx.restore();
            } else {
                ctx.fillStyle = 'orange';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            return;
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (this.state === 'ENTER' || this.state === 'SLITHER' || this.state === 'COIL') {
            this.renderAnimatedSnake(ctx, 1.0);
        } else if (this.state === 'TRANSITION') {
            const p = Math.min(1.0, Math.max(0.0, this.transitionTimer / WORM_BUG_CONFIG.transitionDuration));
            // Crossfade: animated snake out, stationary sprite in
            if (p < 1.0) {
                this.renderAnimatedSnake(ctx, 1.0 - p);
            }
            if (p > 0) {
                this.renderStationarySprite(ctx, p);
            }
        } else {
            // HOLD or APPROACH: 100% stationary coiled sprite
            this.renderStationarySprite(ctx, 1.0);
        }

        ctx.restore();
    }
}
