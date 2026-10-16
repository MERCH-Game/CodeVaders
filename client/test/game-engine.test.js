import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/game/GameEngine.js';
import { EnemySpawner } from '../src/game/EnemySpawner.js';

function createEngine() {
    return new GameEngine({
        width: 320,
        height: 568,
        getContext: () => ({}),
    });
}

test('GameEngine counts active enemies and projectiles without changing entity state', () => {
    const engine = createEngine();
    engine.entities = [
        { type: 'enemy', state: 'MOVING', isDead: false },
        { type: 'enemy', state: 'DYING', isDead: false },
        { type: 'enemy', state: 'MOVING', isDead: true },
        { type: 'enemy_bullet', isDead: false },
        { type: 'enemy_bullet', isDead: true },
    ];

    assert.equal(engine.getActiveEnemyCount(), 1);
    assert.equal(engine.getActiveEnemyBulletCount(), 1);
    assert.equal(new EnemySpawner({}).getActiveEnemyCount(engine), 1);
    assert.equal(engine.entities.length, 5);
});

test('GameEngine reuses collision groups and preserves projectile damage handling', () => {
    const engine = createEngine();
    let damageTaken = 0;
    let enemyHitCount = 0;
    engine.onEnemyHit = () => enemyHitCount++;

    const enemy = {
        type: 'enemy',
        state: 'MOVING',
        isDead: false,
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        takeDamage: (damage) => {
            damageTaken += damage;
        },
    };
    const playerBullet = {
        type: 'player_bullet',
        isDead: false,
        x: 100,
        y: 100,
        width: 6,
        height: 16,
        damage: 1,
    };
    engine.entities = [enemy, playerBullet];

    engine.handleCollisions();

    const enemyGroup = engine.collisionGroups.enemies;
    const bulletGroup = engine.collisionGroups.playerBullets;
    assert.equal(damageTaken, 1);
    assert.equal(enemyHitCount, 1);
    assert.equal(playerBullet.isDead, true);

    engine.entities = [{ type: 'enemy', state: 'MOVING', isDead: false }];
    engine.handleCollisions();

    assert.strictEqual(engine.collisionGroups.enemies, enemyGroup);
    assert.strictEqual(engine.collisionGroups.playerBullets, bulletGroup);
    assert.equal(enemyGroup.length, 1);
    assert.equal(bulletGroup.length, 0);
});

test('GameEngine start and stop maintain a single animation-frame request', () => {
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    const requestedFrames = [];
    const cancelledFrames = [];
    globalThis.requestAnimationFrame = (callback) => {
        requestedFrames.push(callback);
        return 0;
    };
    globalThis.cancelAnimationFrame = (frameId) => cancelledFrames.push(frameId);

    try {
        const engine = createEngine();
        engine.start();
        engine.start();
        assert.equal(requestedFrames.length, 1);

        engine.stop();
        engine.stop();
        assert.deepEqual(cancelledFrames, [0]);
        assert.equal(engine.animationFrameId, null);
    } finally {
        globalThis.requestAnimationFrame = originalRequestAnimationFrame;
        globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    }
});
