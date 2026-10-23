/*
 * NEO-VANGUARD PINBALL — moteur de physique et règles.
 * Indépendant du DOM : utilisable dans le navigateur et dans les tests Node.
 * Coordonnées de table : 1024 × 1536. Pas de simulation : 1 / 240 s.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NVPinballEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WIDTH = 1024;
  const HEIGHT = 1536;
  const BALL_RADIUS = 19;
  const FIXED_DT = 1 / 240;
  const MAX_SPEED = 2400;
  const GRAVITY = 620;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const MULTIPLIERS = [1, 2, 3, 5];

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const hypot = Math.hypot;
  const length = (x, y) => Math.hypot(x, y);
  const dot = (ax, ay, bx, by) => ax * bx + ay * by;
  const moveToward = (value, target, amount) => value < target ? Math.min(target, value + amount) : Math.max(target, value - amount);

  function segment(x1, y1, x2, y2, restitution) {
    return { x1, y1, x2, y2, e: restitution === undefined ? 0.82 : restitution };
  }

  function polyline(points, restitution) {
    const out = [];
    for (let i = 1; i < points.length; i++) {
      out.push(segment(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], restitution));
    }
    return out;
  }

  /* Colliders explicites : les illustrations du vaisseau et de Vorax ne sont
     pas des obstacles. Les rampes ont leurs propres trajectoires ci-dessous. */
  const WALLS = [];
  WALLS.push(...polyline([
    [46, 318], [46, 230], [62, 165], [105, 115], [170, 82], [260, 65],
    [764, 65], [854, 82], [919, 115], [962, 165], [994, 230], [994, 1505]
  ], 0.84));
  WALLS.push(...polyline([[46, 318], [46, 1110], [70, 1240], [210, 1380], [400, 1492], [450, 1518]], 0.8));
  WALLS.push(...polyline([[934, 560], [934, 1110], [910, 1240], [814, 1380], [624, 1492], [574, 1518]], 0.8));
  /* La paroi intérieure s'arrête à 1110 : la bille rejoint le plateau
     après la courbe supérieure, sans obstacle dessiné sur le vaisseau. */
  /* Petits guides de retour : ils évitent les zones mortes sans fermer le trou. */
  WALLS.push(segment(92, 1040, 152, 1130, 0.86));
  WALLS.push(segment(932, 1040, 872, 1130, 0.86));

  const BUMPERS = [
    { x: 512, y: 451, r: 62 },
    { x: 399, y: 533, r: 62 },
    { x: 625, y: 533, r: 62 }
  ];

  const POSTS = [
    { x: 186, y: 935, r: 18 },
    { x: 838, y: 935, r: 18 }
  ];

  const SLINGSHOTS = [
    { side: 'left', seg: segment(150, 1120, 274, 1204, 0.94) },
    { side: 'right', seg: segment(874, 1120, 750, 1204, 0.94) }
  ];

  const TARGETS = [
    { x: 279, y: 739, bank: 'left', index: 0 },
    { x: 316, y: 735, bank: 'left', index: 1 },
    { x: 352, y: 730, bank: 'left', index: 2 },
    { x: 679, y: 730, bank: 'right', index: 0 },
    { x: 716, y: 735, bank: 'right', index: 1 },
    { x: 753, y: 739, bank: 'right', index: 2 }
  ].map(t => Object.assign(t, { down: false }));

  const REACTOR = { x: 513, y: 349, r: 41 };

  function catmullRom(points, samplesPerSegment) {
    const out = [];
    const n = points.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(n - 1, i + 2)];
      for (let j = 0; j < samplesPerSegment; j++) {
        const t = j / samplesPerSegment;
        const t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(points[n - 1].slice());
    return out;
  }

  function buildRamp(side, controlPoints) {
    const points = catmullRom(controlPoints, 28);
    const cumulative = [0];
    for (let i = 1; i < points.length; i++) {
      cumulative.push(cumulative[i - 1] + hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    }
    return {
      side,
      controlPoints,
      points,
      cumulative,
      length: cumulative[cumulative.length - 1],
      entry: { x: controlPoints[0][0], y: controlPoints[0][1], r: 48 }
    };
  }

  const RAMPS = {
    left: buildRamp('left', [[205, 710], [132, 610], [112, 420], [142, 220], [224, 142], [304, 184], [326, 302]]),
    right: buildRamp('right', [[819, 710], [892, 610], [912, 420], [882, 220], [800, 142], [720, 184], [698, 302]])
  };

  function sampleRamp(ramp, distance) {
    const d = clamp(distance, 0, ramp.length);
    let lo = 0, hi = ramp.cumulative.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (ramp.cumulative[mid] <= d) lo = mid; else hi = mid;
    }
    const a = ramp.points[lo], b = ramp.points[Math.min(lo + 1, ramp.points.length - 1)];
    const span = Math.max(0.0001, ramp.cumulative[Math.min(lo + 1, ramp.cumulative.length - 1)] - ramp.cumulative[lo]);
    const t = clamp((d - ramp.cumulative[lo]) / span, 0, 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.max(0.0001, hypot(dx, dy));
    return { x: a[0] + dx * t, y: a[1] + dy * t, tx: dx / len, ty: dy / len };
  }

  function closestOnSegment(px, py, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const denom = dx * dx + dy * dy;
    const t = denom ? clamp(((px - s.x1) * dx + (py - s.y1) * dy) / denom, 0, 1) : 0;
    return { x: s.x1 + dx * t, y: s.y1 + dy * t, t };
  }

  /* Collision cercle / capsule avec correction de position. La vitesse du
     point de contact peut être fournie pour les batteurs en rotation. */
  function collideCapsule(ball, s, radius, restitution, surfaceVelocity) {
    const q = closestOnSegment(ball.x, ball.y, s);
    let dx = ball.x - q.x, dy = ball.y - q.y;
    let d = hypot(dx, dy);
    const minD = ball.r + radius;
    if (d >= minD) return null;
    if (d < 0.0001) {
      const sx = s.x2 - s.x1, sy = s.y2 - s.y1, sl = Math.max(0.0001, hypot(sx, sy));
      dx = -sy / sl; dy = sx / sl;
      if (dot(ball.vx, ball.vy, dx, dy) > 0) { dx = -dx; dy = -dy; }
      d = 1;
    }
    const nx = dx / d, ny = dy / d;
    ball.x = q.x + nx * (minD + 0.03);
    ball.y = q.y + ny * (minD + 0.03);
    const sv = surfaceVelocity ? surfaceVelocity(q) : { x: 0, y: 0 };
    const rvx = ball.vx - sv.x, rvy = ball.vy - sv.y;
    const vn = dot(rvx, rvy, nx, ny);
    const impact = -vn;
    if (vn < 0) {
      ball.vx -= (1 + restitution) * vn * nx;
      ball.vy -= (1 + restitution) * vn * ny;
    }
    return { nx, ny, impact, q };
  }

  function collideCircle(ball, circle, restitution) {
    let dx = ball.x - circle.x, dy = ball.y - circle.y;
    let d = hypot(dx, dy);
    const minD = ball.r + circle.r;
    if (d >= minD) return null;
    if (d < 0.0001) { dx = 0; dy = -1; d = 1; }
    const nx = dx / d, ny = dy / d;
    ball.x = circle.x + nx * (minD + 0.03);
    ball.y = circle.y + ny * (minD + 0.03);
    const vn = dot(ball.vx, ball.vy, nx, ny);
    const impact = -vn;
    if (vn < 0) {
      ball.vx -= (1 + restitution) * vn * nx;
      ball.vy -= (1 + restitution) * vn * ny;
    }
    return { nx, ny, impact };
  }

  function createFlippers() {
    return [
      { side: 'left', x: 305, y: 1278, length: 170, radius: 18, rest: 25 * DEG, active: -25 * DEG, angle: 25 * DEG, held: false, omega: 0 },
      { side: 'right', x: 717, y: 1278, length: 170, radius: 18, rest: 155 * DEG, active: 205 * DEG, angle: 155 * DEG, held: false, omega: 0 }
    ];
  }

  function flipperSegment(f) {
    return {
      x1: f.x, y1: f.y,
      x2: f.x + Math.cos(f.angle) * f.length,
      y2: f.y + Math.sin(f.angle) * f.length
    };
  }

  function freshTargets() {
    return TARGETS.map(t => Object.assign({}, t, { down: false }));
  }

  class Game {
    constructor(options) {
      this.options = options || {};
      this.events = [];
      this.accumulator = 0;
      this.start();
    }

    start() {
      this.running = true;
      this.paused = false;
      this.state = 'playing';
      this.time = 0;
      this.score = 0;
      this.stock = 3;
      this.multiplierIndex = 0;
      this.balls = [];
      this.pendingLaunches = [];
      this.flippers = createFlippers();
      this.targets = freshTargets();
      this.bankTimers = { left: 0, right: 0 };
      this.bankTowardMultiplier = 0;
      this.bankSeries = 0;
      this.sector = 1;
      this.missionProgress = 0;
      this.missionBanks = { left: false, right: false };
      this.campaignComplete = false;
      this.challenge = null;
      this.multiball = false;
      this.voraxVictories = 0;
      this.plungerHeld = false;
      this.accumulator = 0;
      this.events.length = 0;
      this.spawnBall(false, 8);
      this.emit('newGame', { stock: this.stock });
    }

    emit(type, data) {
      this.events.push(Object.assign({ type, time: this.time || 0 }, data || {}));
    }

    drainEvents() {
      const out = this.events.slice();
      this.events.length = 0;
      return out;
    }

    setPaused(value) {
      this.paused = !!value;
      this.accumulator = 0;
      if (this.paused) {
        this.plungerHeld = false;
        for (const f of this.flippers) f.held = false;
      }
    }

    setFlipper(side, held) {
      const f = this.flippers.find(item => item.side === side);
      if (!f || f.held === !!held) return;
      f.held = !!held;
      if (held) this.emit('flipper', { side });
    }

    releaseControls() {
      this.plungerHeld = false;
      for (const f of this.flippers) f.held = false;
    }

    setPlunger(held) {
      held = !!held;
      if (held === this.plungerHeld) return;
      this.plungerHeld = held;
      if (!held) {
        const ball = this.balls.find(b => b.ready);
        if (ball) this.launch(ball, ball.charge);
      }
    }

    spawnBall(auto, saver) {
      const ball = {
        id: (this._nextBallId = (this._nextBallId || 0) + 1),
        x: 970, y: 1400, vx: 0, vy: 0, r: BALL_RADIUS,
        ready: true, charge: 0, saver: 0, saverOnLaunch: Math.max(0, saver || 0),
        ramp: null, rampDistance: 0, rampSpeed: 0, rampCooldown: 0,
        cooldowns: Object.create(null), rotation: 0
      };
      this.balls.push(ball);
      if (auto) this.launch(ball, 0.82);
      return ball;
    }

    launch(ball, power) {
      if (!ball || !ball.ready) return;
      power = clamp(Number(power) || 0, 0, 1);
      ball.ready = false;
      ball.charge = 0;
      ball.saver = ball.saverOnLaunch;
      ball.saverOnLaunch = 0;
      ball.vx = -24;
      ball.vy = -(1350 + 950 * power);
      this.plungerHeld = false;
      this.emit('launch', { x: ball.x, y: ball.y, power, saver: ball.saver });
    }

    award(base, kind, x, y) {
      const points = Math.round(base * MULTIPLIERS[this.multiplierIndex]);
      this.score += points;
      this.emit('score', { base, points, kind, x: x === undefined ? 512 : x, y: y === undefined ? 700 : y });
      return points;
    }

    missionType() {
      return (this.sector - 1) % 4;
    }

    missionInfo() {
      if (this.challenge) return { type: 'vorax', progress: this.challenge.hits, target: 5, time: this.challenge.time };
      if (this.campaignComplete) return { type: 'rearm', progress: Math.min(2, this.bankSeries), target: 2, time: 0 };
      const type = this.missionType();
      if (type === 3) return { type, progress: (this.missionBanks.left ? 1 : 0) + (this.missionBanks.right ? 1 : 0), target: 2, time: 0 };
      return { type, progress: this.missionProgress, target: type === 0 ? 10 : 2, time: 0 };
    }

    progressMission(amount) {
      if (this.campaignComplete || this.sector > 24) return;
      const type = this.missionType();
      if (type === 3) return;
      this.missionProgress += amount;
      const target = type === 0 ? 10 : 2;
      if (this.missionProgress >= target) this.completeMission();
    }

    completeMission() {
      if (this.campaignComplete) return;
      const completed = this.sector;
      this.award(10000, 'sector', 512, 250);
      this.emit('sector', { sector: completed });
      if (completed >= 24) {
        this.campaignComplete = true;
        this.missionProgress = 0;
        this.startVorax();
        return;
      }
      this.sector++;
      this.missionProgress = 0;
      this.missionBanks.left = this.missionBanks.right = false;
    }

    completeBank(side) {
      this.award(5000, 'bank', side === 'left' ? 315 : 715, 690);
      this.emit('bank', { side });
      if (!this.multiball) this.bankSeries++; /* le réarmement de Vorax commence après le multibille */
      this.bankTowardMultiplier++;
      if (this.bankTowardMultiplier >= 2) {
        this.bankTowardMultiplier = 0;
        this.multiplierIndex = Math.min(MULTIPLIERS.length - 1, this.multiplierIndex + 1);
        this.emit('multiplier', { value: MULTIPLIERS[this.multiplierIndex] });
      }
      if (!this.campaignComplete && this.missionType() === 3) {
        this.missionBanks[side] = true;
        if (this.missionBanks.left && this.missionBanks.right) this.completeMission();
      }
      if (this.campaignComplete && !this.challenge && !this.multiball && this.bankSeries >= 2) this.startVorax();
    }

    startVorax() {
      if (!this.campaignComplete || this.challenge || this.multiball || !this.running) return;
      this.bankSeries = 0;
      this.challenge = { time: 45, hits: 0 };
      this.emit('voraxStart', { duration: 45 });
    }

    hitReactor(ball) {
      if (!this.challenge || (ball.cooldowns.reactor || 0) > 0) return;
      ball.cooldowns.reactor = 0.35;
      this.challenge.hits++;
      this.award(5000, 'reactor', REACTOR.x, REACTOR.y);
      this.emit('reactor', { hits: this.challenge.hits, x: REACTOR.x, y: REACTOR.y });
      if (this.challenge.hits >= 5) this.defeatVorax();
    }

    defeatVorax() {
      if (!this.challenge) return;
      this.challenge = null;
      this.bankSeries = 0;
      this.voraxVictories++;
      this.award(100000, 'vorax', REACTOR.x, REACTOR.y);
      this.multiball = true;
      const count = this.balls.length + this.pendingLaunches.length;
      const needed = Math.max(0, 3 - count);
      for (let i = 0; i < needed; i++) this.pendingLaunches.push({ delay: 0.8 * (i + 1) });
      this.emit('voraxWin', {});
      this.emit('multiball', { total: Math.min(3, count + needed) });
    }

    enterRamp(ball, ramp) {
      ball.ramp = ramp;
      ball.rampDistance = 0;
      ball.rampSpeed = clamp(hypot(ball.vx, ball.vy) * 0.9, 780, 1250);
      ball.vx = ball.vy = 0;
      ball.x = ramp.controlPoints[0][0];
      ball.y = ramp.controlPoints[0][1];
      this.emit('rampEnter', { side: ramp.side, x: ball.x, y: ball.y });
    }

    completeRamp(ball) {
      const ramp = ball.ramp;
      if (!ramp) return;
      const p = sampleRamp(ramp, ramp.length);
      ball.x = p.x; ball.y = p.y;
      ball.vx = p.tx * 640;
      ball.vy = Math.abs(p.ty * 640) + 220;
      ball.ramp = null;
      ball.rampCooldown = 1;
      const jackpot = this.multiball && this.balls.length >= 2;
      if (jackpot) {
        this.award(25000, 'jackpot', ball.x, ball.y);
        this.emit('jackpot', { side: ramp.side, x: ball.x, y: ball.y });
      } else {
        this.award(2500, 'ramp', ball.x, ball.y);
        this.emit('ramp', { side: ramp.side, x: ball.x, y: ball.y });
      }
      const type = this.missionType();
      if (!this.campaignComplete && ((type === 1 && ramp.side === 'left') || (type === 2 && ramp.side === 'right'))) this.progressMission(1);
    }

    updateFlipper(f, dt) {
      const old = f.angle;
      const target = f.held ? f.active : f.rest;
      const duration = f.held ? 0.055 : 0.08;
      f.angle = moveToward(f.angle, target, Math.abs(f.active - f.rest) / duration * dt);
      f.omega = (f.angle - old) / dt;
    }

    collideWorld(ball) {
      for (const wall of WALLS) {
        const hit = collideCapsule(ball, wall, 0, wall.e);
        if (hit && hit.impact > 210 && (ball.cooldowns.metal || 0) <= 0) {
          ball.cooldowns.metal = 0.09;
          this.emit('metal', { x: ball.x, y: ball.y, speed: hit.impact });
        }
      }

      for (let i = 0; i < BUMPERS.length; i++) {
        const b = BUMPERS[i];
        const hit = collideCircle(ball, b, 0.96);
        if (!hit) continue;
        if ((ball.cooldowns['bumper' + i] || 0) <= 0) {
          ball.cooldowns['bumper' + i] = 0.13;
          ball.vx += hit.nx * 540;
          ball.vy += hit.ny * 540;
          this.award(500, 'bumper', b.x, b.y);
          this.emit('bumper', { index: i, x: b.x, y: b.y });
          if (!this.campaignComplete && this.missionType() === 0) this.progressMission(1);
        }
      }

      for (let i = 0; i < POSTS.length; i++) {
        const p = POSTS[i];
        const hit = collideCircle(ball, p, 0.9);
        if (hit && (ball.cooldowns['post' + i] || 0) <= 0) {
          ball.cooldowns['post' + i] = 0.16;
          ball.vx += hit.nx * 120; ball.vy += hit.ny * 120;
          this.award(100, 'post', p.x, p.y);
          this.emit('post', { index: i, x: p.x, y: p.y });
        }
      }

      for (const sling of SLINGSHOTS) {
        const hit = collideCapsule(ball, sling.seg, 9, sling.seg.e);
        if (hit && (ball.cooldowns['sling' + sling.side] || 0) <= 0) {
          ball.cooldowns['sling' + sling.side] = 0.18;
          ball.vx += hit.nx * 390; ball.vy += hit.ny * 390 - 90;
          this.award(100, 'sling', ball.x, ball.y);
          this.emit('sling', { side: sling.side, x: ball.x, y: ball.y });
        }
      }

      for (const target of this.targets) {
        if (target.down) continue;
        const s = segment(target.x, target.y - 24, target.x, target.y + 24, 0.72);
        const hit = collideCapsule(ball, s, 12, 0.72);
        if (hit) {
          target.down = true;
          this.award(1000, 'target', target.x, target.y);
          this.emit('target', { bank: target.bank, index: target.index, x: target.x, y: target.y });
          const bank = this.targets.filter(t => t.bank === target.bank);
          if (bank.every(t => t.down)) {
            this.bankTimers[target.bank] = 1;
            this.completeBank(target.bank);
          }
        }
      }

      if (this.challenge) {
        const hit = collideCircle(ball, REACTOR, 0.9);
        if (hit) {
          ball.vx += hit.nx * 180; ball.vy += hit.ny * 180;
          this.hitReactor(ball);
        }
      }

      for (const f of this.flippers) {
        const s = flipperSegment(f);
        const surfaceVelocity = q => {
          const rx = q.x - f.x, ry = q.y - f.y;
          return { x: -f.omega * ry, y: f.omega * rx };
        };
        const hit = collideCapsule(ball, s, f.radius, 0.84, surfaceVelocity);
        if (hit && Math.abs(f.omega) > 2 && hit.impact > 0) {
          ball.vx += hit.nx * Math.min(170, Math.abs(f.omega) * 7);
          ball.vy += hit.ny * Math.min(170, Math.abs(f.omega) * 7);
        }
      }
    }

    updateBall(ball, dt) {
      for (const key in ball.cooldowns) ball.cooldowns[key] = Math.max(0, ball.cooldowns[key] - dt);
      ball.rampCooldown = Math.max(0, ball.rampCooldown - dt);
      ball.saver = Math.max(0, ball.saver - dt);
      ball.rotation += (ball.vx / Math.max(1, ball.r)) * dt;

      if (ball.ready) {
        ball.x = 970; ball.y = 1400; ball.vx = ball.vy = 0;
        if (this.plungerHeld) ball.charge = Math.min(1, ball.charge + dt / 1.35);
        return;
      }

      if (ball.ramp) {
        ball.rampDistance += ball.rampSpeed * dt;
        const p = sampleRamp(ball.ramp, ball.rampDistance);
        ball.x = p.x; ball.y = p.y;
        if (ball.rampDistance >= ball.ramp.length) this.completeRamp(ball);
        return;
      }

      ball.vy += GRAVITY * dt;
      const damping = Math.max(0, 1 - 0.025 * dt);
      ball.vx *= damping; ball.vy *= damping;
      const speed = hypot(ball.vx, ball.vy);
      if (speed > MAX_SPEED) { ball.vx *= MAX_SPEED / speed; ball.vy *= MAX_SPEED / speed; }
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      /* Deux passages de résolution évitent qu'un contact double laisse la
         bille dans une paroi. À vitesse maximale, un sous-pas parcourt 10 px,
         donc moins que le rayon de la bille. */
      this.collideWorld(ball);
      this.collideWorld(ball);

      if (ball.rampCooldown <= 0 && ball.vy < -300) {
        for (const side of ['left', 'right']) {
          const ramp = RAMPS[side];
          if (hypot(ball.x - ramp.entry.x, ball.y - ramp.entry.y) < ramp.entry.r) {
            this.enterRamp(ball, ramp);
            break;
          }
        }
      }
    }

    checkDrains() {
      const drained = [];
      const kept = [];
      for (const ball of this.balls) {
        if (ball.y > HEIGHT + 28 || ball.x < -70 || ball.x > WIDTH + 70) drained.push(ball);
        else kept.push(ball);
      }
      if (!drained.length) return;
      this.balls = kept;
      for (const ball of drained) this.emit('drain', { x: ball.x, y: Math.min(ball.y, HEIGHT), saver: ball.saver });
      if (this.multiball && this.balls.length < 2 && !this.pendingLaunches.length) {
        this.multiball = false;
        this.emit('multiballEnd', {});
      }
      if (this.balls.length || this.pendingLaunches.length || !this.running) return;

      const saved = drained.find(ball => ball.saver > 0);
      if (saved) {
        this.emit('ballSave', {});
        this.spawnBall(false, 0);       /* même bille, protection non réarmée */
        return;
      }

      this.stock--;
      this.emit('ballLost', { remaining: this.stock });
      if (this.stock > 0) {
        this.multiplierIndex = 0;
        this.bankTowardMultiplier = 0;
        this.spawnBall(false, 8);       /* nouvelle bille : protection initiale */
      } else {
        this.running = false;
        this.state = 'over';
        this.releaseControls();
        this.emit('gameOver', { score: this.score });
      }
    }

    step(dt) {
      if (!this.running || this.paused) return;
      dt = dt || FIXED_DT;
      this.time += dt;
      for (const f of this.flippers) this.updateFlipper(f, dt);

      for (const side of ['left', 'right']) {
        if (this.bankTimers[side] > 0) {
          this.bankTimers[side] -= dt;
          if (this.bankTimers[side] <= 0) {
            for (const target of this.targets) if (target.bank === side) target.down = false;
            this.emit('bankReset', { side });
          }
        }
      }

      if (this.challenge) {
        this.challenge.time -= dt;
        if (this.challenge.time <= 0) {
          this.challenge = null;
          this.bankSeries = 0;
          this.emit('voraxFailed', {});
        }
      }

      for (let i = this.pendingLaunches.length - 1; i >= 0; i--) {
        const pending = this.pendingLaunches[i];
        pending.delay -= dt;
        if (pending.delay <= 0) {
          this.pendingLaunches.splice(i, 1);
          this.spawnBall(true, 0);
        }
      }

      /* La liste peut gagner des billes en début de pas ; toutes utilisent le
         même dt et les mêmes règles sur mobile et sur PC. */
      for (const ball of this.balls.slice()) this.updateBall(ball, dt);
      this.checkDrains();
    }

    advance(frameDt) {
      if (!this.running || this.paused) { this.accumulator = 0; return 0; }
      this.accumulator += Math.min(0.05, Math.max(0, frameDt));
      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < 16) {
        this.step(FIXED_DT);
        this.accumulator -= FIXED_DT;
        steps++;
      }
      if (steps === 16) this.accumulator = 0;
      return this.accumulator / FIXED_DT;
    }
  }

  return {
    WIDTH, HEIGHT, BALL_RADIUS, FIXED_DT, MAX_SPEED, GRAVITY, MULTIPLIERS,
    WALLS, BUMPERS, POSTS, SLINGSHOTS, TARGETS, REACTOR, RAMPS,
    Game, closestOnSegment, collideCapsule, collideCircle, flipperSegment, sampleRamp
  };
});
