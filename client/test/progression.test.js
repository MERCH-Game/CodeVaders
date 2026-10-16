import test from 'node:test';
import assert from 'node:assert/strict';
import { DifficultyController } from '../src/game/DifficultyController.js';
import { DIFFICULTY_CONFIG } from '../src/game/DifficultyConfig.js';
import { CommonBug } from '../src/game/entities/CommonBug.js';
import { CriticalBug } from '../src/game/entities/CriticalBug.js';
import { DDoSBug } from '../src/game/entities/DDoSBug.js';
import { WormBug } from '../src/game/entities/WormBug.js';
import { EnemySpawner } from '../src/game/EnemySpawner.js';

test('CodeVaders — Survival Progression & Difficulty Scaling System', async (t) => {
  await t.test('1. DifficultyController initializes with single source of truth for elapsed time', () => {
    const controller = new DifficultyController();
    assert.equal(controller.getElapsedTime(), 0, 'Initial elapsed time should be 0');
    assert.equal(controller.getCurrentPhase().id, 1, 'Initial phase should be Phase 1 Warm-up');

    // Simulate 5 seconds
    controller.update(5.0);
    assert.equal(controller.getElapsedTime(), 5.0, 'Elapsed time should accumulate delta time accurately');
  });

  await t.test('2. Phase 1 (0–15s Warm-up): Common Bugs only, strictly NO DDoS Bugs', () => {
    const controller = new DifficultyController();
    
    // Check parameters at 0s, 5s, 14.9s
    for (const time of [0, 5, 14.9]) {
      controller.reset();
      controller.update(time);
      const params = controller.getInterpolatedParameters();
      assert.equal(params.phase.id, 1, `At ${time}s phase should be 1`);
      assert.equal(params.weights.ddos, 0, `DDoS weight must be 0 at ${time}s`);
      assert.equal(params.weights.worm, 0, `Worm weight must be 0 at ${time}s`);
      assert.equal(params.weights.critical, 0, `Critical weight must be 0 in Phase 1`);
      assert.equal(params.weights.common, 1.0, `Common Bug should be 100% in Phase 1`);

      // Verify random pick never returns anything other than common
      for (let i = 0; i < 20; i++) {
        assert.equal(controller.pickEnemyType(), 'common');
      }
    }
  });

  await t.test('3. Phase 2 (15–30s Escalation): Faster spawns, higher speed, NO DDoS Bugs before 30s', () => {
    const controller = new DifficultyController();
    controller.update(20.0);
    const params = controller.getInterpolatedParameters();

    assert.equal(params.phase.id, 2, 'At 20s phase should be 2 Escalation');
    assert.ok(params.spawnInterval < 2.8, 'Spawn interval should decrease compared to Phase 1');
    assert.ok(params.speedMultiplier > 1.0, 'Speed multiplier should increase above 1.0');
    assert.ok(params.fireRateMultiplier > 1.0, 'Fire rate multiplier should increase above 1.0');
    assert.equal(params.weights.ddos, 0, 'DDoS Bug MUST NOT spawn before 30 seconds');
    assert.equal(params.weights.worm, 0, 'Worm Bug MUST NOT spawn in Phase 2');
    assert.ok(params.weights.critical > 0, 'Critical Bugs become eligible in Phase 2');

    // Test boundary at 29.9s: DDoS must STILL be 0
    controller.reset();
    controller.update(29.9);
    const boundaryParams = controller.getInterpolatedParameters();
    assert.equal(boundaryParams.weights.ddos, 0, 'DDoS weight must strictly be 0 at 29.9s');
  });

  await t.test('4. Phase 3 (30–60s First Threat): DDoS Bugs become eligible strictly >= 30s', () => {
    const controller = new DifficultyController();
    controller.update(30.0);
    const params30 = controller.getInterpolatedParameters();

    assert.equal(params30.phase.id, 3, 'At 30s phase should be 3 First Threat');
    assert.ok(params30.weights.ddos > 0, 'DDoS Bugs MUST become eligible at 30 seconds');
    assert.equal(params30.weights.worm, 0, 'Worm Bugs must not spawn before 60s');

    // Special threat at ~45s
    controller.reset();
    controller.update(45.0);
    const eventAt45 = controller.selectEngagementEvent();
    assert.equal(eventAt45, 'DDOS_ENCOUNTER_45S', 'At 45s recognizable milestone threat should be selected');
  });

  await t.test('5. Phase 4 (60–90s Survival Pressure): Worm Bugs introduced strictly >= 60s', () => {
    const controller = new DifficultyController();
    controller.update(59.9);
    assert.equal(controller.getInterpolatedParameters().weights.worm, 0, 'Worm must not spawn at 59.9s');

    controller.reset();
    controller.update(60.0);
    const params60 = controller.getInterpolatedParameters();
    assert.equal(params60.phase.id, 4, 'At 60s phase should be 4 Survival Pressure');
    assert.ok(params60.weights.worm > 0, 'Worm Bugs become eligible at 60s');
    assert.ok(params60.weights.common > 0);
    assert.ok(params60.weights.critical > 0);
    assert.ok(params60.weights.ddos > 0);
  });

  await t.test('6. Phase 5 (90–120s) & Phase 6+ (Endless): Bounded scaling and diminishing returns', () => {
    const controller = new DifficultyController();
    
    // Check Phase 5
    controller.update(105);
    const params105 = controller.getInterpolatedParameters();
    assert.equal(params105.phase.id, 5, 'At 105s phase should be 5 Intense Survival');

    // Check Phase 6 (Endless at 200s, 500s, 1000s)
    for (const time of [200, 500, 1000]) {
      controller.reset();
      controller.update(time);
      const params = controller.getInterpolatedParameters();
      assert.equal(params.phase.id, 6, `At ${time}s phase should be 6 Endless`);
      assert.ok(params.spawnInterval >= DIFFICULTY_CONFIG.bounds.minSpawnInterval, 'Spawn interval respects min bound');
      assert.ok(params.speedMultiplier <= DIFFICULTY_CONFIG.bounds.maxSpeedMultiplier, 'Speed multiplier respects cap');
      assert.ok(params.fireRateMultiplier <= DIFFICULTY_CONFIG.bounds.maxFireRateMultiplier, 'Fire rate multiplier respects cap');
      assert.ok(params.maxEnemies <= DIFFICULTY_CONFIG.bounds.maxActiveEnemies, 'Active enemy count respects cap');
    }
  });

  await t.test('7. Smooth parameter interpolation across phase boundaries', () => {
    const controller = new DifficultyController();

    // Sample progression at 0s, 7.5s, 15s, 22.5s, 30s
    controller.update(7.5);
    const midPhase1 = controller.getInterpolatedParameters();
    controller.reset();
    controller.update(15.0);
    const atPhase2 = controller.getInterpolatedParameters();

    assert.ok(midPhase1.spawnInterval > atPhase2.spawnInterval, 'Spawn interval decreases smoothly between 7.5s and 15s');
    assert.ok(midPhase1.speedMultiplier < atPhase2.speedMultiplier, 'Speed increases smoothly between 7.5s and 15s');
  });

  await t.test('8. Engagement events occur every 15–20s and defer when crowded', () => {
    const controller = new DifficultyController();
    let eventsTriggered = 0;

    controller.onEngagementEvent = () => {
      eventsTriggered++;
    };

    // Simulate 60 seconds with active enemies under the cap
    for (let t = 0; t < 60; t++) {
      controller.update(1.0, 2); // 2 active enemies
    }

    assert.ok(eventsTriggered >= 2 && eventsTriggered <= 4, `Should trigger 2-4 events in 60s (was ${eventsTriggered})`);

    // Test crowding postponement: screen has 12 enemies (max cap)
    const crowdedController = new DifficultyController();
    let crowdedEvents = 0;
    crowdedController.onEngagementEvent = () => crowdedEvents++;
    for (let t = 0; t < 40; t++) {
      crowdedController.update(1.0, 12); // Crowded!
    }
    assert.equal(crowdedEvents, 0, 'No engagement event should spawn when screen is crowded');
  });

  await t.test('9. Recovery windows activate after demanding encounters and space spawns', () => {
    const controller = new DifficultyController();
    assert.equal(controller.isRecoveryWindowActive(), false);

    controller.triggerRecoveryWindow(3.5);
    assert.equal(controller.isRecoveryWindowActive(), true);

    const normalParams = controller.getInterpolatedParameters();
    assert.ok(normalParams.spawnInterval > 3.0, 'Spawn interval should be expanded during recovery window');

    // Advance 4 seconds: recovery window should expire
    controller.update(4.0);
    assert.equal(controller.isRecoveryWindowActive(), false);
  });

  await t.test('10. Survival Milestones announce at configured times without awarding score', () => {
    const controller = new DifficultyController();
    const milestonesAnnounced = [];

    controller.onMilestoneReached = (info) => {
      milestonesAnnounced.push(info.seconds);
    };

    // Simulate 125 seconds
    for (let s = 1; s <= 125; s++) {
      controller.update(1.0);
    }

    assert.deepEqual(milestonesAnnounced, [15, 30, 45, 60, 90, 120]);
    // Elapsed time formula continues to represent score directly
    const score = Math.floor(controller.getElapsedTime());
    assert.equal(score, 125, 'Score should depend exclusively on survival seconds (125)');
  });

  await t.test('11. Enemy classes accept speedMultiplier and fireRateMultiplier', () => {
    const commonBug = new CommonBug(100, 100, null, 1, {
      speedMultiplier: 1.5,
      fireRateMultiplier: 1.4,
    });
    assert.equal(commonBug.speedMultiplier, 1.5);
    assert.equal(commonBug.fireRateMultiplier, 1.4);
    assert.equal(commonBug.velocityX, 180 * 1.5);

    const criticalBug = new CriticalBug(100, 100, null, {
      speedMultiplier: 1.25,
      fireRateMultiplier: 1.3,
    });
    assert.equal(criticalBug.speedMultiplier, 1.25);
    assert.equal(criticalBug.velocityY, 100 * 1.25);

    const ddosBug = new DDoSBug(100, 100, null, {
      speedMultiplier: 1.35,
    });
    assert.equal(ddosBug.speedMultiplier, 1.35);

    const wormBug = new WormBug(0, 100, 200, 100, null, 1, {
      speedMultiplier: 1.4,
      fireRateMultiplier: 1.5,
    });
    assert.equal(wormBug.speedMultiplier, 1.4);
    assert.equal(wormBug.fireRateMultiplier, 1.5);
  });

  await t.test('12. Enemy projectile limiter prevents bullet-hell screen overcrowding', () => {
    const mockEngine = {
      entities: Array.from({ length: 22 }, () => ({ type: 'enemy_bullet', isDead: false })),
      canEnemyShoot() {
        const count = this.entities.filter(e => e.type === 'enemy_bullet' && !e.isDead).length;
        return count < 20;
      },
      addEntity(ent) {
        this.entities.push(ent);
      }
    };

    const initialBulletCount = mockEngine.entities.length;
    const bug = new CriticalBug(50, 50, null);
    bug.shoot(mockEngine);

    assert.equal(mockEngine.entities.length, initialBulletCount, 'No new bullet should be added when cap is reached');
  });

  await t.test('13. EnemySpawner respects active enemy cap and DDoS 30s rule', () => {
    const spawner = new EnemySpawner(null);
    const fakeEngine = {
      width: 400,
      height: 700,
      entities: [],
      addEntity(e) {
        this.entities.push(e);
      }
    };

    // Before 30s, calling spawnEnemyByType('ddos') falls back to common
    spawner.difficultyController.elapsedTime = 10;
    const params = spawner.difficultyController.getInterpolatedParameters();
    spawner.spawnEnemyByType('ddos', fakeEngine, params);
    assert.equal(fakeEngine.entities.length, 1);
    assert.equal(fakeEngine.entities[0].type, 'enemy');
    assert.ok(fakeEngine.entities[0].id.startsWith('common_'), 'DDoS request before 30s must spawn common bug');

    // Fill entities up to cap
    fakeEngine.entities = Array.from({ length: 15 }, () => ({
      type: 'enemy',
      isDead: false,
      state: 'MOVING',
    }));
    const preCount = fakeEngine.entities.length;
    spawner.spawnEnemyByType('common', fakeEngine, params);
    assert.equal(fakeEngine.entities.length, preCount, 'Spawner must not exceed active enemy cap');
  });

  await t.test('14. Full lifecycle reset correctly restores timers and progression state', () => {
    const controller = new DifficultyController();
    controller.update(85);
    controller.triggerRecoveryWindow();
    assert.ok(controller.getElapsedTime() > 0);
    assert.ok(controller.getCurrentPhase().id > 1);

    controller.reset();
    assert.equal(controller.getElapsedTime(), 0);
    assert.equal(controller.getCurrentPhase().id, 1);
    assert.equal(controller.isRecoveryWindowActive(), false);
    assert.equal(controller.passedMilestones.size, 0);
  });
});
