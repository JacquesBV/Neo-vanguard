
(() => {
/* ===== GARDIEN DU SILO — sprite v3 (pixel art procédural) =====================
   Pensé pour l'écran LCD 4 tons du secteur 1 : grandes masses lisibles, contour
   sombre continu, biseau lumineux en haut à gauche, un seul point brillant (l'œil).
   La forme est décrite en « unités de dessin » (grille de 56) puis échantillonnée
   pixel par pixel à la résolution réelle du tampon : toujours net, à 1 pour 1.
   Index de couleur : 0 vide · 1 contour · 2 ombre · 3 blindage · 4 clair ·
                      5 énergie (œil, voyants) · 6 bande de danger            */
const NVGuardSprite = (() => {
  const DW = 56, DH = 60, CX = 27.5, IRY = 27;
  const TAU = Math.PI * 2;
  const inPoly = (x, y, P) => {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const rr = (x, y, x0, y0, x1, y1, r) => {          /* rectangle arrondi */
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const qx = Math.max(x0 + r - x, 0, x - (x1 - r)), qy = Math.max(y0 + r - y, 0, y - (y1 - r));
    return qx * qx + qy * qy <= r * r;
  };
  /* coque : octogone blindé, plus large en haut (épaules) qu'en bas */
  const HULL = [[16, 9], [39, 9], [46, 16], [46, 36], [40, 45], [15, 45], [9, 36], [9, 16]];
  const CROWN = [[21, 3], [34, 3], [37, 10], [18, 10]];
  const JAW = [[21, 43], [34, 43], [32, 51], [23, 51]];
  const FIN = [[0.5, 15], [3, 6], [6, 9], [9.5, 15]];
  const BRACE_L = [[6, 20], [12, 18], [12, 31], [6, 29]];

  /* matière de chaque point du dessin (avant contour et biseau)
     renvoie [couleur, biseau?] ou null                                   */
  function sample(x, y, s) {
    const ax = x <= CX ? x : 2 * CX - x;       /* symétrie gauche/droite */
    const side = x <= CX ? -1 : 1;
    /* --- œil et iris ------------------------------------------------- */
    const dx = x - CX, dy = y - IRY, d = Math.hypot(dx, dy);
    if (d < 13.6) {
      if (d >= 12.4) return [4, 0];                         /* bague claire */
      if (d >= 11.2) return [1, 0];                         /* gorge sombre */
      const rin = 3.2 + s.open * 4.4;
      if (d < rin) {
        /* œil : pupille tournée vers le joueur */
        const px = CX + s.lx * (rin - 2.4), py = IRY + s.ly * (rin - 2.4) * 0.8;
        const pd = Math.hypot(x - px, y - py);
        if (pd < Math.max(1.3, rin * 0.42)) return [1, 0];
        if (Math.hypot(x - (px - 1.2), y - (py - 1.4)) < 0.9 && rin > 4) return [4, 0];
        return [5, 0];
      }
      if (d < rin + 1) return [1, 0];
      /* pétales de l'iris, en rotation lente */
      let a = Math.atan2(dy, dx) - s.spin;
      a = ((a % TAU) + TAU) % TAU;
      const k = a / (TAU / 8), f = k - Math.floor(k);
      if (!s.simple && f < 0.11) return [1, 0];                          /* joint entre pétales */
      if (s.simple) return [2, 0];
      const lit = f < 0.5 ? 3 : 2;
      return [(Math.floor(k) % 2) ? (lit === 3 ? 2 : 2) : lit, 0];
    }
    /* --- couronne radar au sommet ----------------------------------- */
    if (inPoly(x, y, CROWN)) {
      if (y >= 5.5 && y < 7.5) {                            /* rampe de voyants */
        const slot = Math.floor((x - 21) / 3);
        if (((x - 21) % 3) < 2) return [slot === s.scan ? 5 : 1, 0];
      }
      return [3, 1];
    }
    /* antennes */
    if (Math.abs(ax - 20.5) < 0.6 && y > 0.5 && y < 4) return [y < 1.6 ? (s.blink ? 5 : 4) : 2, 0];
    /* --- mâchoire-canon --------------------------------------------- */
    if (inPoly(x, y, JAW)) {
      if (y > 47 && Math.abs(x - CX) < 2.2) return [s.fire > 0 ? 5 : 1, 0];   /* bouche */
      return [y < 45 ? 4 : 2, 1];
    }
    if (y >= 50.5 && y < 54.5 && Math.abs(x - CX) < 2.6) {           /* canon */
      if (Math.abs(x - CX) < 1.3) return [s.fire > 0 ? 5 : 1, 0];
      return [3, 1];
    }
    if (s.fire > 0 && y >= 54.5 && y < 54.5 + 4 * s.fire && Math.abs(x - CX) < 2.4 - (y - 54.5) * 0.5) return [5, 0];
    /* --- coque -------------------------------------------------------- */
    if (inPoly(x, y, HULL)) {
      /* sourcils blindés en V au-dessus de l'œil : regard menaçant */
      const by = 12.6 + (ax - 13) * 0.42;
      if (ax > 13 && ax < 25.5 && y > by && y < by + 2.6) return [1, 0];
      if (ax > 13 && ax < 25.5 && y >= by + 2.6 && y < by + 3.6) return [4, 0];
      /* bande de danger du silo, sous l'iris */
      if (y >= 40 && y < 44 && ax > 15.5) return [(Math.floor((x + y) / 3) % 2) ? 6 : 1, 0];
      /* grilles d'aération latérales */
      if (!s.simple && ax >= 10.5 && ax < 14 && y > 18 && y < 35) return [(Math.floor(y) % 3 === 0) ? 1 : 2, 0];
      /* rivets aux quatre coins de la plaque */
      if ((Math.abs(ax - 17.5) < 0.6 || Math.abs(ax - 16.5) < 0.6 && false) && (Math.abs(y - 12) < 0.6 || Math.abs(y - 38) < 0.6)) return [4, 0];
      /* plaque haute légèrement plus claire */
      if (y < 13.5) return [4, 1];
      return [3, 1];
    }
    /* --- ailerons au sommet des épaulières ---------------------------- */
    if (inPoly(ax, y, FIN)) return [4, 1];
    /* --- épaulières lance-missiles ----------------------------------- */
    if (rr(ax, y, 0.5, 14, 11.5, 39, 2.5)) {
      /* trois tubes par épaule */
      for (let i = 0; i < 3; i++) {
        const ty = 20 + i * 6.5, td = Math.hypot(ax - 6, y - ty);
        if (td < 2.6) {
          if (td < 1.5) return [(s.tubes[(side < 0 ? 0 : 3) + i]) ? 5 : 1, 0];
          return [2, 0];
        }
      }
      if (y < 16.5) return [4, 1];                          /* capot */
      if (y > 36) return [2, 0];                            /* soubassement */
      return [3, 1];
    }
    if (inPoly(ax, y, BRACE_L)) return [2, 1];
    return null;
  }

  /* palette : écran LCD 4 tons ou couleurs pour les ères suivantes */
  function palette(mono) {
    if (mono) return [null, mono[0], mono[1], mono[2], mono[3], mono[3], mono[2]];
    return [null, '#05070d', '#26384d', '#5d7a96', '#c9dcf2', '#ffb347', '#e9c23c'];
  }

  const cache = { cv: null, g: null, w: 0, h: 0 };
  /* o : { f (pixels par unité), open, fire, lx, ly, t, dmg, flash, phase, mono } */
  function render(o) {
    const f = o.f, W = Math.ceil(DW * f) + 2, H = Math.ceil(DH * f) + 2;
    if (!cache.cv || cache.w !== W || cache.h !== H) {
      cache.cv = document.createElement('canvas'); cache.cv.width = W; cache.cv.height = H;
      cache.g = cache.cv.getContext('2d'); cache.w = W; cache.h = H;
    }
    const t = o.t || 0;
    const s = {
      simple: o.f < 0.7, open: o.open || 0, fire: o.fire || 0, lx: o.lx || 0, ly: o.ly || 0,
      /* rotation par crans (clac !) : nette sur l'écran LCD à rémanence */
      spin: Math.floor(t * (1.2 + (o.phase || 0) * 0.8)) * (TAU / 16),
      scan: Math.floor(t * 6) % 4, blink: Math.floor(t * 3) % 2 === 0,
      tubes: [0, 1, 2, 3, 4, 5].map(i => (Math.floor(t * 4) + i * 2) % 6 === 0 || o.fire > 0.5),
    };
    const col = new Uint8Array(W * H), bev = new Uint8Array(W * H);
    for (let py = 1; py < H - 1; py++) for (let px = 1; px < W - 1; px++) {
      const r = sample((px - 1 + 0.5) / f, (py - 1 + 0.5) / f, s);
      if (r) { col[py * W + px] = r[0]; bev[py * W + px] = r[1]; }
    }
    /* biseau : lumière en haut à gauche, ombre en bas à droite */
    const out = col.slice();
    for (let py = 1; py < H - 1; py++) for (let px = 1; px < W - 1; px++) {
      const i = py * W + px; if (!bev[i]) continue;
      const up = col[i - W], lf = col[i - 1], dn = col[i + W], rt = col[i + 1];
      if (!up || !lf) out[i] = 4;
      else if (!dn || !rt) out[i] = 2;
    }
    /* fissures et étincelles selon les dégâts */
    const dmg = o.dmg || 0;
    const crack = (pts) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * f * 1.5);
        for (let j = 0; j <= n; j++) {
          const px = Math.round((x0 + (x1 - x0) * j / n) * f) + 1, py = Math.round((y0 + (y1 - y0) * j / n) * f) + 1;
          if (px > 0 && py > 0 && px < W && py < H && out[py * W + px]) out[py * W + px] = 1;
        }
      }
    };
    if (dmg > 0.3) { crack([[12, 15], [16, 19], [14, 23], [17, 27]]); crack([[41, 33], [38, 37], [40, 41]]); }
    if (dmg > 0.55) { crack([[42, 14], [39, 17], [41, 20]]); crack([[3, 26], [7, 29], [5, 33]]); }
    if (dmg > 0.8 && Math.floor(t * 10) % 2) {
      for (let k = 0; k < 4; k++) {
        const a = t * 5 + k * 1.7, px = Math.round((CX + Math.cos(a) * (18 + k * 3)) * f) + 1, py = Math.round((IRY - 4 + Math.sin(a * 1.3) * 14) * f) + 1;
        if (px > 0 && py > 0 && px < W && py < H && out[py * W + px]) out[py * W + px] = 5;
      }
    }
    /* contour sombre continu (4 voisins) : détache le boss du décor */
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const i = py * W + px; if (col[i]) continue;
      if ((px > 0 && col[i - 1]) || (px < W - 1 && col[i + 1]) || (py > 0 && col[i - W]) || (py < H - 1 && col[i + W])) out[i] = 1;
    }
    /* pixels -> image */
    const pal = palette(o.mono), img = cache.g.createImageData(W, H), D = img.data;
    const rgb = pal.map(c => c ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : null);
    const fl = o.flash > 0;
    for (let i = 0; i < W * H; i++) {
      let c = out[i]; if (!c) continue;
      if (fl && c > 1 && c !== 5) c = (c === 2 ? 3 : 4);
      const p = rgb[c]; D[i * 4] = p[0]; D[i * 4 + 1] = p[1]; D[i * 4 + 2] = p[2]; D[i * 4 + 3] = 255;
    }
    cache.g.putImageData(img, 0, 0);
    return { cv: cache.cv, w: W, h: H, ox: (CX + 0.5) * f + 1, oy: IRY * f + 1 };
  }
  return { render, DW, DH };
})();

  /* branchement : boss du secteur 1 et mini-boss « mGuardian » */
  const BOSS_NAME = 'GARDIEN DU SILO';
  const clampG = (v, a, b) => v < a ? a : v > b ? b : v;
  function monoPal() { const q = TH.livery && TH.livery.gb; return R.era === 0 && q ? q : null; }
  function blit(x, y, f, st) {
    const g = PAINT.g, K = PAINT.K;
    const r = NVGuardSprite.render(Object.assign({ f, mono: monoPal() }, st));
    const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
    g.drawImage(r.cv, Math.round(x * K - r.ox), Math.round(y * K - r.oy));
    g.imageSmoothingEnabled = sm;
  }
  const prevBoss = drawBoss;
  drawBoss = function () {
    const b = G.boss;
    if (!b || !b.def || b.def.name !== BOSS_NAME) return prevBoss();
    useBuf(R.bufNear);
    const tg = (typeof nearestPlayer === 'function' ? nearestPlayer(b.x, b.y) : G.player) || G.player;
    if (b._ptA !== undefined && b.atkT > b._ptA + .15) b._fireT = .22;
    b._ptA = b.atkT; b._fireT = Math.max(0, (b._fireT || 0) - 1 / 60);
    const want = clampG(1 - b.atkT / .7, 0, 1) * .75 + .25 * (b.ph > 0 ? 1 : .4) + (b._fireT > 0 ? .25 : 0);
    b._open = (b._open || 0) + (want - (b._open || 0)) * .12;
    const dx = tg ? tg.x - b.x : 0, dy = tg ? tg.y - b.y : 1, d = Math.hypot(dx, dy) || 1;
    blit(b.x, b.y + Math.round(Math.sin((b.t || 0) * 1.6) * 3), 3.8 * PAINT.K, {
      t: b.t || 0, phase: b.ph || 0, open: clampG(b._open, 0, 1), fire: clampG(b._fireT / .22, 0, 1),
      lx: dx / d, ly: clampG(dy / d, -.3, 1), dmg: 1 - b.hp / Math.max(1, b.maxHp), flash: b.flash || 0 });
  };
  const prevEnemy = drawEnemyOne;
  drawEnemyOne = function (en, g, K, e) {
    if (en.kind !== 'mGuardian') return prevEnemy(en, g, K, e);
    const tg = (typeof nearestPlayer === 'function' ? nearestPlayer(en.x, en.y) : G.player) || G.player;
    const dx = tg ? tg.x - en.x : 0, dy = tg ? tg.y - en.y : 1, d = Math.hypot(dx, dy) || 1;
    if (en._pf !== undefined && en.fireT > en._pf + .2) en._ft = .2;
    en._pf = en.fireT; en._ft = Math.max(0, (en._ft || 0) - 1 / 60);
    const want = clampG(1 - (en.fireT || 1) / .6, 0, 1) * .7 + (en._ft > 0 ? .3 : .1);
    en._open = (en._open || 0) + (want - (en._open || 0)) * .12;
    blit(en.x, en.y, Math.max(.6, 2.2 * PAINT.K), {
      t: en.t || 0, open: clampG(en._open, 0, 1), fire: clampG(en._ft / .2, 0, 1),
      lx: dx / d, ly: clampG(dy / d, -.3, 1), dmg: 1 - en.hp / Math.max(1, en.maxHp), flash: en.flash > 0 ? 1 : 0 });
    if (en.hp < en.maxHp) {
      const q = monoPal(), w = 96, y0 = en.y - (en.r || 48) * 1.55;
      fr(en.x - w / 2, y0, w, 4, q ? q[0] : '#05070d'); fr(en.x - w / 2, y0, w * en.hp / en.maxHp, 4, q ? q[3] : '#ffb347');
    }
  };
})();
