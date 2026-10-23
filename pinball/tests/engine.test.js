/* Tests déterministes du moteur : node pinball/tests/engine.test.js */
'use strict';
const assert = require('node:assert/strict');
const E = require('../engine.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('✓', name); }
  catch (error) { console.error('✗', name); throw error; }
}
function steps(game, count) { for (let i = 0; i < count; i++) game.step(E.FIXED_DT); }
function freeBall(game) {
  const ball = game.balls[0];
  ball.ready = false;
  ball.saver = ball.saverOnLaunch = 0;
  return ball;
}

test('nouvelle partie : une bille prête, trois billes au compteur, secteur 1', () => {
  const g = new E.Game();
  assert.equal(g.stock, 3);
  assert.equal(g.balls.length, 1);
  assert.equal(g.balls[0].ready, true);
  assert.equal(g.balls[0].saverOnLaunch, 8);
  assert.equal(g.sector, 1);
  assert.deepEqual(g.missionInfo(), { type: 0, progress: 0, target: 10, time: 0 });
});

test('lance-bille : la charge règle la puissance du lancer', () => {
  const weak = new E.Game();
  weak.setPlunger(true); steps(weak, 24); weak.setPlunger(false);
  const weakSpeed = -weak.balls[0].vy;
  const strong = new E.Game();
  strong.setPlunger(true); steps(strong, 240); strong.setPlunger(false);
  const strongSpeed = -strong.balls[0].vy;
  assert(weakSpeed >= 1350 && weakSpeed < 1600);
  assert(strongSpeed > weakSpeed + 500);
  assert.equal(strong.balls[0].saver, 8);
});

test('pause : le temps, la physique et le score ne progressent pas', () => {
  const g = new E.Game();
  g.setPlunger(true); steps(g, 30); g.setPlunger(false);
  steps(g, 10);
  const snapshot = JSON.stringify({ time: g.time, score: g.score, balls: g.balls });
  g.setPaused(true);
  assert.equal(g.advance(1), 0);
  steps(g, 240);
  assert.equal(JSON.stringify({ time: g.time, score: g.score, balls: g.balls }), snapshot);
});

test('collision rapide : une bille à 2400 px/s ne traverse pas la paroi', () => {
  const g = new E.Game();
  const b = freeBall(g);
  b.x = 80; b.y = 500; b.vx = -E.MAX_SPEED; b.vy = 0;
  steps(g, 2);
  assert(b.x >= 46 + b.r, `x=${b.x}`);
  assert(b.vx > 0, `vx=${b.vx}`);
});

test('batteur mobile : le contact donne une impulsion vers le haut', () => {
  const g = new E.Game();
  const b = freeBall(g);
  const f = g.flippers[0];
  const mx = f.x + Math.cos(f.angle) * f.length * 0.55;
  const my = f.y + Math.sin(f.angle) * f.length * 0.55;
  b.x = mx + Math.sin(f.angle) * 35;
  b.y = my - Math.cos(f.angle) * 35;
  b.vx = 0; b.vy = 300;
  g.setFlipper('left', true);
  g.step(E.FIXED_DT);
  assert(b.vy < 0, `vy=${b.vy}`);
  assert(Math.abs(f.omega) > 1);
});

test('bumper : 500 points et progression de la mission du secteur 1', () => {
  const g = new E.Game();
  const b = freeBall(g);
  b.x = 512; b.y = 372; b.vx = 0; b.vy = 500;
  g.step(E.FIXED_DT);
  assert.equal(g.score, 500);
  assert.equal(g.missionInfo().progress, 1);
  assert(g.drainEvents().some(e => e.type === 'bumper'));
});

test('deux banques : bonus et multiplicateur ×2, réarmement après une seconde', () => {
  const g = new E.Game();
  g.completeBank('left');
  g.completeBank('right');
  assert.equal(g.score, 10000);
  assert.equal(E.MULTIPLIERS[g.multiplierIndex], 2);
  for (const target of g.targets) target.down = true;
  g.bankTimers.left = 1;
  steps(g, 241);
  assert(g.targets.filter(t => t.bank === 'left').every(t => !t.down));
});

test('missions : les quatre types enchaînent les secteurs et conservent les seuils', () => {
  const g = new E.Game();
  g.progressMission(10);
  assert.equal(g.sector, 2);
  g.progressMission(2);
  assert.equal(g.sector, 3);
  g.progressMission(2);
  assert.equal(g.sector, 4);
  g.completeBank('left');
  assert.equal(g.sector, 4);
  g.completeBank('right');
  assert.equal(g.sector, 5);
  assert.equal(g.missionInfo().type, 0);
  assert.equal(g.missionInfo().target, 10);
});

test('rampe : entrée, trajet déterminé, sortie et validation à 2500 points', () => {
  const g = new E.Game();
  const b = freeBall(g);
  b.x = 205; b.y = 710; b.vx = 0; b.vy = -600;
  g.step(E.FIXED_DT);
  assert(b.ramp, 'la rampe doit être activée');
  const path = b.ramp;
  b.rampDistance = path.length - 0.5;
  g.step(E.FIXED_DT);
  assert.equal(b.ramp, null);
  assert.equal(g.score, 2500);
  assert(b.rampCooldown > 0);
  assert(Number.isFinite(b.x) && Number.isFinite(b.y));
});

test('jackpot : une rampe vaut 25 000 pendant le multibille', () => {
  const g = new E.Game();
  const b = freeBall(g);
  g.spawnBall(false, 0);
  g.multiball = true;
  g.enterRamp(b, E.RAMPS.left);
  b.rampDistance = E.RAMPS.left.length - 0.1;
  g.step(E.FIXED_DT);
  assert.equal(g.score, 25000);
  assert(g.drainEvents().some(e => e.type === 'jackpot'));
});

test('protection : la perte renvoie la même bille sans la réarmer', () => {
  const g = new E.Game();
  g.setPlunger(true); g.setPlunger(false);
  let b = g.balls[0];
  b.saver = 2; b.y = E.HEIGHT + 40;
  g.step(E.FIXED_DT);
  assert.equal(g.stock, 3);
  assert.equal(g.balls.length, 1);
  assert.equal(g.balls[0].ready, true);
  assert.equal(g.balls[0].saverOnLaunch, 0);
  b = freeBall(g); b.y = E.HEIGHT + 40;
  g.step(E.FIXED_DT);
  assert.equal(g.stock, 2);
});

test('Vorax : 5 impacts, 100 000 points et trois billes espacées', () => {
  const g = new E.Game();
  g.sector = 24;
  g.completeMission();
  assert(g.challenge);
  assert.equal(g.challenge.time, 45);
  const b = g.balls[0];
  for (let i = 0; i < 5; i++) { b.cooldowns.reactor = 0; g.hitReactor(b); }
  assert.equal(g.challenge, null);
  assert(g.multiball);
  assert(g.score >= 135000);
  assert.equal(g.pendingLaunches.length, 2);
  steps(g, 193);
  assert.equal(g.balls.length, 2);
  steps(g, 193);
  assert.equal(g.balls.length, 3);
});

test('multibille : une réserve n’est consommée que lorsque toutes les billes sont perdues', () => {
  const g = new E.Game();
  g.multiball = true;
  g.spawnBall(true, 0); g.spawnBall(true, 0);
  assert.equal(g.balls.length, 3);
  for (let i = 1; i < 3; i++) { g.balls[1].y = E.HEIGHT + 40; g.step(E.FIXED_DT); }
  assert.equal(g.stock, 3);
  assert.equal(g.balls.length, 1);
  const last = freeBall(g); last.y = E.HEIGHT + 40;
  g.step(E.FIXED_DT);
  assert.equal(g.stock, 2);
  assert.equal(g.balls.length, 1);
});

test('échec Vorax : les secteurs ne repartent pas à zéro, deux banques réarment', () => {
  const g = new E.Game();
  g.sector = 24; g.completeMission();
  g.challenge.time = 0.001;
  g.step(E.FIXED_DT);
  assert.equal(g.challenge, null);
  assert.equal(g.sector, 24);
  assert(g.campaignComplete);
  g.completeBank('left');
  assert.equal(g.challenge, null);
  g.completeBank('right');
  assert(g.challenge);
  assert.equal(g.challenge.hits, 0);
});

test('réarmement Vorax : les banques du multibille ne comptent pas pour la tentative suivante', () => {
  const g = new E.Game();
  g.sector = 24; g.completeMission();
  const b = g.balls[0];
  for (let i = 0; i < 5; i++) { b.cooldowns.reactor = 0; g.hitReactor(b); }
  steps(g, 386);
  assert.equal(g.balls.length, 3);
  g.completeBank('left'); g.completeBank('right');
  assert.equal(g.bankSeries, 0);
  assert.equal(g.challenge, null);
  for (let i = 1; i < 3; i++) { g.balls[1].y = E.HEIGHT + 40; g.step(E.FIXED_DT); }
  assert.equal(g.multiball, false);
  g.completeBank('left');
  assert.equal(g.challenge, null);
  g.completeBank('right');
  assert(g.challenge);
});

console.log(`\n${passed} tests moteur réussis.`);
