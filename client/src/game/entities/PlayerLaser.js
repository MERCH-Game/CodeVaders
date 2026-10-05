export class PlayerLaser {
    constructor() {
        this.type = 'player_laser';
        this.x = 0;
        this.y = 0;
        this.width = 18;
        this.height = 0;
        this.remaining = 3;
        this.wavePhase = 0;
        this.streaks = Array.from({ length: 24 }, () => ({
            y: Math.random(),
            x: (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 22),
            width: 3 + Math.random() * 4,
            height: 5 + Math.random() * 15,
            phase: Math.random() * Math.PI * 2,
            speed: 7 + Math.random() * 10,
        }));
        this.isDead = false;
    }

    update(dt, engine) {
        const player = engine.playerShooter;
        if (!player) {
            this.isDead = true;
            return;
        }

        this.x = player.centerX - this.width / 2;
        this.y = 0;
        this.height = player.y;
        this.remaining -= dt;
        this.wavePhase += dt * 10;
        this.elapsed = (this.elapsed || 0) + dt;
        this.isDead = this.remaining <= 0;
    }

    render(ctx) {
        ctx.save();
        const auraGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        auraGradient.addColorStop(0, 'rgba(96, 165, 250, 0.65)');
        auraGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.55)');
        auraGradient.addColorStop(1, 'rgba(37, 99, 235, 0.8)');
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = auraGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        const beamGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        beamGradient.addColorStop(0, '#dbeafe');
        beamGradient.addColorStop(0.5, '#60a5fa');
        beamGradient.addColorStop(1, '#1d4ed8');
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#60a5fa';
        ctx.fillStyle = beamGradient;
        ctx.fillRect(this.x + this.width * 0.3, this.y, this.width * 0.4, this.height);

        for (const streak of this.streaks) {
            const flicker = (Math.sin(this.elapsed * streak.speed + streak.phase) + 1) / 2;
            if (flicker < 0.35) continue;

            const streakY = streak.y * this.height;
            const streakX = this.x + this.width / 2 + streak.x;
            ctx.fillStyle = `rgba(96, 165, 250, ${flicker})`;
            ctx.shadowBlur = 8;
            ctx.fillRect(
                streakX,
                streakY,
                streak.width,
                Math.min(streak.height, this.height - streakY),
            );
        }

        const pulse = (Math.sin(this.wavePhase) + 1) / 2;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            8,
            18 + pulse * 8,
            3 + pulse * 2,
            0,
            0,
            Math.PI * 2,
        );
        const impactGradient = ctx.createLinearGradient(
            this.x + this.width / 2 - 24,
            0,
            this.x + this.width / 2 + 24,
            0,
        );
        impactGradient.addColorStop(0, `rgba(37, 99, 235, ${0.45 + pulse * 0.45})`);
        impactGradient.addColorStop(0.5, `rgba(147, 197, 253, ${0.45 + pulse * 0.45})`);
        impactGradient.addColorStop(1, `rgba(37, 99, 235, ${0.45 + pulse * 0.45})`);
        ctx.strokeStyle = impactGradient;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
    }
}
