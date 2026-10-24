
(() => {
  /* ===== GARDIEN DU SILO — boss du secteur 1 et mini-boss de mi-parcours =====
     Une porte de silo blindée qui s'ouvre pour tirer : iris à huit pétales, œil-noyau
     qui suit le vaisseau, épaulières à vérins, couronne de radars, quatre bouches de
     feu, fumées, fissures progressives. Tout est vectoriel : lisible en 4 tons.      */
  const NAME = 'GARDIEN DU SILO', TAU2 = Math.PI * 2;
  function pal() {
    if (R.era === 0 && TH.livery && TH.livery.gb) { const q = TH.livery.gb; return { d: q[0], m: q[2], l: q[3], h: q[3], glow: q[3], mono: true }; }
    return { d: '#060a13', m: '#243449', l: '#5b7696', h: '#d6e7ff', glow: '#ffb347', mono: false };
  }
  function drawGuardian(o) {
    const g = PAINT.g, K = PAINT.K, P = pal(), cx = o.x, cy = o.y, S = o.s, t = o.t, open = o.open, dmg = o.dmg || 0, phase = o.phase || 0;
    const X = v => (cx + v * S) * K, Y = v => (cy + v * S) * K;
    const poly = (pts, fill) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.closePath(); g.fillStyle = fill; g.fill(); };
    const rect = (x, y, w, h, fill) => { g.fillStyle = fill; g.fillRect(Math.round(X(x)), Math.round(Y(y)), Math.max(1, Math.round(w * S * K)), Math.max(1, Math.round(h * S * K))); };
    const disc = (x, y, r, fill) => { g.beginPath(); g.arc(X(x), Y(y), Math.max(0.5, r * S * K), 0, TAU2); g.fillStyle = fill; g.fill(); };
    const ringA = (x, y, r, w, col, a0, a1) => { g.beginPath(); g.arc(X(x), Y(y), r * S * K, a0 === undefined ? 0 : a0, a1 === undefined ? TAU2 : a1); g.lineWidth = Math.max(1, w * S * K); g.strokeStyle = col; g.stroke(); };
    const strokeP = (pts, w, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.closePath(); g.lineWidth = Math.max(1, w * S * K); g.strokeStyle = col; g.lineJoin = 'miter'; g.stroke(); };
    const seg = (x1, y1, x2, y2, w, col) => { g.beginPath(); g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); g.lineWidth = Math.max(1, w * S * K); g.strokeStyle = col; g.stroke(); };
    g.save();
    /* ombre portée : le gardien flotte au-dessus du sol */
    g.globalAlpha = 0.4; g.beginPath(); g.ellipse(X(0), Y(122), 78 * S * K, 9 * S * K, 0, 0, TAU2); g.fillStyle = P.d; g.fill(); g.globalAlpha = 1;
    if (o.boss) {
    /* Couronne gyroscopique animée : elle donne au Gardien une vraie
       silhouette de boss, distincte des tourelles ordinaires du silo. */
    const spin = t * (phase >= 2 ? 1.05 : 0.62);
    g.globalAlpha = 0.62;
    ringA(0, 2, 126, 3.2, P.d, spin, spin + Math.PI * 1.72);
    ringA(0, 2, 119, 2.2, P.mono ? P.h : P.l, -spin * 0.72, -spin * 0.72 + Math.PI * 1.28);
    for (let i = 0; i < 6; i++) {
      const a = spin + i * TAU2 / 6, x1 = Math.cos(a) * 118, y1 = 2 + Math.sin(a) * 118;
      const x2 = Math.cos(a + 0.13) * 130, y2 = 2 + Math.sin(a + 0.13) * 130;
      seg(x1, y1, x2, y2, 5.5, (phase >= 2 && i % 2 === 0) ? P.glow : P.h);
      disc(x2, y2, 3.2 + 1.2 * Math.sin(t * 7 + i), P.h);
    }
    g.globalAlpha = 1;
    /* plaques de blindage mobiles et canons latéraux à recul */
    for (const sg of [-1, 1]) {
      const recoil = o.fire > 0.2 ? Math.sin(t * 35 + sg) * 8 * o.fire : Math.sin(t * 2 + sg) * 2;
      const pivotX = sg * 101, pivotY = 18 + Math.sin(t * 1.8 + sg) * 4;
      g.save(); g.translate(X(pivotX), Y(pivotY)); g.rotate(sg * (0.07 + Math.sin(t * 1.25 + sg) * 0.055));
      g.translate(-X(pivotX), -Y(pivotY));
      poly([[sg * 92, -18], [sg * 125, -28], [sg * 142, -12], [sg * 138, 27], [sg * 110, 38], [sg * 94, 22]], P.d);
      strokeP([[sg * 92, -18], [sg * 125, -28], [sg * 142, -12], [sg * 138, 27], [sg * 110, 38], [sg * 94, 22]], 2.8, P.l);
      poly([[sg * 101, -12], [sg * 128, -20], [sg * 135, -10], [sg * 132, 20], [sg * 111, 29], [sg * 101, 17]], P.m);
      rect(sg * 119 - 5, 22, 10, 28 + recoil, P.d); rect(sg * 119 - 3, 24, 6, 26 + recoil, P.l);
      rect(sg * 119 - 2, 47 + recoil, 4, 12, P.h);
      for (let j = 0; j < 3; j++) rect(sg * (106 + j * 9), -3, 4, 12, (Math.floor(t * 9 + j) % 3 === 0) ? P.h : P.d);
      g.restore();
    }
    }
    /* tuyères sous la coque */
    for (const sg of [-1, 1]) for (const k of [0, 1]) {
      const fx = sg * (30 + k * 26), L = 16 + 9 * Math.sin(t * 22 + sg + k * 2) + open * 6;
      poly([[fx - 8, 84], [fx + 8, 84], [fx + 3, 84 + L], [fx - 3, 84 + L]], P.l);
      poly([[fx - 4, 84], [fx + 4, 84], [fx, 84 + L * 0.62]], P.h);
    }
    /* épaulières blindées + vérins */
    for (const sg of [-1, 1]) {
      poly([[sg * 70, -64], [sg * 108, -50], [sg * 114, 50], [sg * 88, 80], [sg * 70, 62]], P.d);
      strokeP([[sg * 70, -64], [sg * 108, -50], [sg * 114, 50], [sg * 88, 80], [sg * 70, 62]], 3.2, P.mono ? P.h : P.l);
      poly([[sg * 74, -58], [sg * 104, -46], [sg * 108, 46], [sg * 86, 72], [sg * 74, 56]], P.m);
      poly([[sg * 74, -58], [sg * 104, -46], [sg * 102, -38], [sg * 74, -48]], P.l);        /* arête éclairée */
      for (let i = 0; i < 6; i++) {                                                           /* chevrons de danger */
        const yy = -28 + i * 15, a = sg * 78, b2 = sg * 104;
        poly([[a, yy], [a + sg * 8, yy], [b2, yy + 11], [b2 - sg * 8, yy + 11]], i % 2 ? P.d : P.l);
      }
      const col = Math.sin(t * 1.3 + sg) * 7;                                                 /* vérin coulissant */
      rect(sg * 98 - 3, -52, 6, 100, P.d); rect(sg * 98 - 1.5, -50, 3, 96, P.l);
      rect(sg * 98 - 6, -8 + col, 12, 14, P.d); rect(sg * 98 - 4, -6 + col, 8, 10, P.h);
      for (const ry of [-40, 36]) disc(sg * 80, ry, 2.6, P.h);
    }
    /* coque principale : octogone de béton armé */
    const hull = [[-72, -88], [72, -88], [94, -44], [94, 44], [72, 90], [-72, 90], [-94, 44], [-94, -44]];
    poly(hull, P.d);
    strokeP(hull, 3.4, P.mono ? P.h : P.l);
    poly(hull.map(p => [p[0] * 0.95, p[1] * 0.95]), P.m);
    poly([[-68, -84], [68, -84], [88, -46], [78, -46], [62, -76], [-62, -76], [-78, -46], [-88, -46]], P.l);   /* biseau haut */
    for (const yy of [-52, 54]) { rect(-86, yy, 172, 3, P.d); rect(-86, yy + 3, 172, 1.6, P.l); }
    for (const xx of [-44, 44]) rect(xx - 1.5, -50, 3, 104, P.d);
    for (let i = 0; i < 9; i++) { rect(-80 + i * 20, -47, 3, 3, P.h); rect(-80 + i * 20, 61, 3, 3, P.h); }
    /* couronne : capot de ventilation, radars, balise */
    poly([[-30, -100], [30, -100], [42, -82], [-42, -82]], P.d);
    poly([[-26, -96], [26, -96], [36, -84], [-36, -84]], P.m);
    for (let i = 0; i < 5; i++) { const on = Math.floor(t * 5 + i) % 5 === 0; rect(-20 + i * 9, -94, 6, 6, on ? P.h : P.d); }
    for (const sg of [-1, 1]) {
      const ax = sg * 58, ay = -92, rot = Math.sin(t * 0.8 + sg) * 0.55;
      rect(ax - 2, ay, 4, 14, P.d);
      g.save(); g.translate(X(ax), Y(ay)); g.rotate(rot);
      g.beginPath(); g.ellipse(0, 0, 17 * S * K, 7 * S * K, 0, Math.PI, TAU2); g.fillStyle = P.l; g.fill();
      g.beginPath(); g.ellipse(0, 0, 17 * S * K, 7 * S * K, 0, Math.PI, TAU2); g.lineWidth = Math.max(1, 2 * S * K); g.strokeStyle = P.d; g.stroke();
      g.fillStyle = P.h; g.fillRect(-0.5 * S * K, -13 * S * K, Math.max(1, 1.6 * S * K), 10 * S * K);
      g.restore();
    }
    if (Math.floor(t * 2.2) % 2 === 0) { rect(-1.5, -112, 3, 12, P.d); disc(0, -114, 3.6, P.h); }
    /* porte de silo : anneau de boulons, iris à huit pétales, noyau-œil */
    const dx = 0, dy = 6;
    disc(dx, dy, 60, P.d); disc(dx, dy, 56, P.l); disc(dx, dy, 51, P.d);
    for (let i = 0; i < 12; i++) { const a = i * TAU2 / 12 + 0.26; disc(dx + Math.cos(a) * 53.5, dy + Math.sin(a) * 53.5, 2.4, i % 2 ? P.d : P.h); }
    for (let i = 0; i < 8; i++) { const a0 = i * TAU2 / 8 + t * (0.2 + phase * 0.12); if (i % 2 === 0) ringA(dx, dy, 58, 3.4, (phase >= 2 && i === Math.floor(t * 4) % 8) ? P.glow : P.h, a0, a0 + 0.5); }
    const pulse = 0.74 + 0.26 * Math.sin(t * 5.2) + o.fire * 0.5;
    disc(dx, dy, 44, P.d);
    disc(dx, dy, 38 * (0.62 + 0.38 * open), P.mono ? P.m : P.glow);
    disc(dx, dy, 28 * (0.55 + 0.45 * open) * Math.min(1.1, pulse), P.mono ? P.l : P.h);
    const lx = clampN(o.lookX, -1, 1) * 9 * S, ly = clampN(o.lookY, -0.4, 1) * 7 * S;
    disc(dx + lx / S, dy + ly / S, 13 * (0.55 + 0.45 * open), P.d);
    disc(dx + lx / S, dy + ly / S, 8.5 * (0.55 + 0.45 * open), P.h);
    disc(dx + lx / S - 2.5, dy + ly / S - 2.5, 2.6, P.d);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU2 / 8 + 0.3927 + t * 0.12 * (1 - open), rin = 10 + open * 32, rout = 47, w = 0.2;
      const pts = [[rin * Math.cos(a - w), rin * Math.sin(a - w)], [rout * Math.cos(a - w * 0.82), rout * Math.sin(a - w * 0.82)], [rout * Math.cos(a + w * 0.82), rout * Math.sin(a + w * 0.82)], [rin * Math.cos(a + w), rin * Math.sin(a + w)]];
      poly(pts.map(p => [dx + p[0], dy + p[1]]), P.d);
      const s2 = 0.82; poly(pts.map(p => [dx + (p[0] - Math.cos(a) * 0) * s2 + p[0] * 0.1, dy + p[1] * s2 + p[1] * 0.1]), i % 2 ? P.m : P.l);
      seg(dx + Math.cos(a) * (rin + 4), dy + Math.sin(a) * (rin + 4), dx + Math.cos(a) * (rout - 5), dy + Math.sin(a) * (rout - 5), 1.8, P.d);
    }
    /* quatre bouches de feu sous la coque */
    for (const bx of [-54, -20, 20, 54]) {
      const rec = o.fire * 5;
      rect(bx - 7, 88, 14, 20 - rec, P.d); rect(bx - 5, 88, 10, 18 - rec, P.m); rect(bx - 2, 104 - rec, 4, 4, P.l);
      if (o.fire > 0.15) { disc(bx, 112 - rec, 6 + o.fire * 6, P.h); }
    }
    /* fumée des évents */
    for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) {
      const ph = (t * 0.45 + i * 0.33 + (sg > 0 ? 0.17 : 0)) % 1;
      g.globalAlpha = (1 - ph) * 0.4; disc(sg * 62 - sg * ph * 8, -92 - ph * 40, 4 + ph * 12, P.m); g.globalAlpha = 1;
    }
    /* dégâts : fissures, étincelles */
    if (dmg > 0.3) { seg(-60, -40, -34, -10, 2, P.d); seg(-34, -10, -44, 18, 2, P.d); seg(60, 20, 38, 44, 2, P.d); seg(10, -80, 24, -58, 2, P.d); }
    if (dmg > 0.6) { seg(-70, 30, -48, 52, 2.4, P.d); seg(50, -46, 70, -22, 2.4, P.d); if (Math.floor(t * 12) % 3 === 0) { disc(-40 + Math.sin(t * 9) * 8, 20, 3, P.h); disc(60, -30 + Math.cos(t * 7) * 6, 3, P.h); } }
    if (dmg > 0.8 && Math.floor(t * 8) % 2) { rect(-90, -20, 12, 40, P.d); }
    if (o.flash > 0) { g.globalAlpha = 0.55; poly(hull, P.h); g.globalAlpha = 1; }
    g.restore();
  }
  function clampN(v, a, b) { return v < a ? a : v > b ? b : v; }
  const oldBoss = drawBoss;
  drawBoss = function () {
    const b = G.boss;
    if (!b || !b.def || b.def.name !== NAME) return oldBoss();
    useBuf(R.bufNear);
    const P2 = (typeof nearestPlayer === 'function' ? nearestPlayer(b.x, b.y) : G.player) || G.player;
    if (b._ptA !== undefined && b.atkT > b._ptA + 0.15) b._fireT = 0.22;
    b._ptA = b.atkT; b._fireT = Math.max(0, (b._fireT || 0) - 1 / 60);
    const wantOpen = clampN(1 - b.atkT / 0.7, 0, 1) * 0.75 + 0.25 * (b.ph > 0 ? 1 : 0.4) + (b._fireT > 0 ? 0.25 : 0);
    b._open = (b._open === undefined ? 0 : b._open) + (wantOpen - (b._open === undefined ? 0 : b._open)) * 0.12;
    const dx = P2 ? P2.x - b.x : 0, dy = P2 ? P2.y - b.y : 1, d = Math.hypot(dx, dy) || 1;
    drawGuardian({ x: b.x, y: b.y + Math.sin(b.t * 1.6) * 2, s: 0.9, t: b.t || 0, boss: true, phase: b.ph || 0, open: clampN(b._open, 0, 1), fire: clampN(b._fireT / 0.22, 0, 1),
      lookX: dx / d, lookY: dy / d, dmg: 1 - b.hp / Math.max(1, b.maxHp), flash: b.flash });
  };
  const oldEnemy = drawEnemyOne;
  drawEnemyOne = function (en, g, K, e) {
    if (en.kind !== 'mGuardian') return oldEnemy(en, g, K, e);
    const P2 = (typeof nearestPlayer === 'function' ? nearestPlayer(en.x, en.y) : G.player) || G.player;
    const dx = P2 ? P2.x - en.x : 0, dy = P2 ? P2.y - en.y : 1, d = Math.hypot(dx, dy) || 1;
    if (en._pf !== undefined && en.fireT > en._pf + 0.2) en._ft = 0.2;
    en._pf = en.fireT; en._ft = Math.max(0, (en._ft || 0) - 1 / 60);
    const wantOpen = clampN(1 - (en.fireT || 1) / 0.6, 0, 1) * 0.7 + (en._ft > 0 ? 0.3 : 0.1);
    en._open = (en._open || 0) + (wantOpen - (en._open || 0)) * 0.12;
    drawGuardian({ x: en.x, y: en.y, s: Math.max(0.3, (en.r || 40) / 96 * 1.15), t: en.t || 0, open: clampN(en._open, 0, 1), fire: clampN(en._ft / 0.2, 0, 1),
      lookX: dx / d, lookY: dy / d, dmg: 1 - en.hp / Math.max(1, en.maxHp), flash: en.flash > 0 ? 1 : 0 });
    const pp = pal(), w = 96 * Math.max(0.3, (en.r || 40) / 96 * 1.15) * 0.9;
    if (en.hp < en.maxHp) { fr(en.x - w / 2, en.y - (en.r || 40) * 1.5, w, 4, pp.d); fr(en.x - w / 2, en.y - (en.r || 40) * 1.5, w * en.hp / en.maxHp, 4, pp.h); }
  };
  window.__drawGuardian = drawGuardian;
})();
