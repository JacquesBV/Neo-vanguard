
/* =============================================================================
   SECTEUR 24 — refonte complète : le sas, le couloir, le grand sas et VORAX.
   Seul le décor du couloir (et son défilement) est repris de l'ancienne version.
   Déroulé :
     arrive  → le Vanguard arrive devant le sas de la base (cinématique)
     talk    → VESTA ordonne de détruire le sas (cinématique, tir coupé)
     sas     → combat contre le sas et ses défenses
     boom    → le sas explose, ses deux battants sont arrachés
     hall    → couloir : tourelles au sol, mitrailleuses murales, nouveaux ennemis
     alarm   → le grand sas tremble : quelque chose frappe de l'autre côté
     hands   → les mains de VORAX trouent le sas (barre de vie partagée)
     tear    → les mains écartent le sas et le font exploser
     reveal  → VORAX apparaît, immense
     vorax   → combat final : yeux rouges qui chargent, rayons laser, orbes, spirale
   ========================================================================== */
(() => {
  const FINAL = 24, MID = L_W / 2;
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const tr = o => o[LG()] || o.fr;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = t => { t = cl(t, 0, 1); return t * t * (3 - 2 * t); };
  const eo = t => 1 - Math.pow(1 - cl(t, 0, 1), 3);
  const V2_ART = {
    'vorax-hands-spritesheet.webp': 'hands/vorax-hands-atlas.webp',
    'defense-enemies-spritesheet.webp': 'enemies/defense-atlas.webp',
    'sas-door.webp': 'doors/airlock.webp'
  };
  const IMG = n => { const i = new Image(); i.decoding = 'async'; i.src = V2_ART[n] ? 'assets/level24-v2/' + V2_ART[n] : 'assets/level24/' + n; return i; };
  const ART = {
    boss: IMG('vorax-intro-matched-spritesheet.webp'), hands: IMG('vorax-hands-spritesheet.webp'),
    foes: IMG('defense-enemies-spritesheet.webp'), corridor: IMG('flagship-base-corridor.webp'), sas: IMG('sas-door.webp')
  };
  const ok = i => !!(i && i.complete && i.naturalWidth > 0);
  const on = () => G.level === FINAL && G._nv24 && G._nv24.level === FINAL;

  /* ------------------------------------------------------------------ textes */
  const TXT = {
    arrive: { fr: 'SECTEUR 24 · SAS DE LA BASE VORAX', en: 'SECTOR 24 · VORAX BASE AIRLOCK', es: 'SECTOR 24 · ESCLUSA DE LA BASE VORAX', pt: 'SETOR 24 · ESCOTILHA DA BASE VORAX', ja: 'セクター24 · ヴォラックス基地エアロック' },
    v1: { fr: 'Vanguard, voici le sas de la base de VORAX.', en: 'Vanguard, this is the airlock of VORAX’s base.', es: 'Vanguard, esta es la esclusa de la base de VORAX.', pt: 'Vanguard, esta é a escotilha da base de VORAX.', ja: 'ヴァンガード、ここがヴォラックス基地のエアロックよ。' },
    v2: { fr: 'Il faut détruire ce sas ! Je te rends tes canons. Feu !', en: 'We have to destroy this airlock! Your guns are back online. Fire!', es: '¡Hay que destruir esta esclusa! Te devuelvo los cañones. ¡Fuego!', pt: 'Temos de destruir esta escotilha! Devolvo-te os canhões. Fogo!', ja: 'このエアロックを破壊して！武装を戻すわ。撃って！' },
    sasGoal: { fr: 'DÉTRUIS LE SAS', en: 'DESTROY THE AIRLOCK', es: 'DESTRUYE LA ESCLUSA', pt: 'DESTRÓI A ESCOTILHA', ja: 'エアロックを破壊せよ' },
    sasName: { fr: 'SAS DE CONFINEMENT', en: 'CONTAINMENT AIRLOCK', es: 'ESCLUSA DE CONTENCIÓN', pt: 'ESCOTILHA DE CONTENÇÃO', ja: '封鎖エアロック' },
    v3: { fr: 'Le sas a cédé. Le couloir est truffé de tourelles, reste mobile !', en: 'The airlock is down. The corridor is full of turrets, keep moving!', es: 'La esclusa ha caído. El pasillo está lleno de torretas, ¡muévete!', pt: 'A escotilha caiu. O corredor está cheio de torres, continua a mexer-te!', ja: 'エアロック突破。通路は砲台だらけ、止まらないで！' },
    v4: { fr: 'Attention… quelque chose frappe de l’autre côté du grand sas !', en: 'Careful… something is hammering the other side of the great airlock!', es: 'Cuidado… ¡algo golpea al otro lado de la gran esclusa!', pt: 'Cuidado… algo está a bater do outro lado da grande escotilha!', ja: '気をつけて…巨大エアロックの向こうで何かが叩いている！' },
    gate: { fr: 'LE GRAND SAS VA CÉDER · PRÉPARE-TOI', en: 'THE GREAT AIRLOCK IS GIVING WAY · GET READY', es: 'LA GRAN ESCLUSA VA A CEDER · PREPÁRATE', pt: 'A GRANDE ESCOTILHA VAI CEDER · PREPARA-TE', ja: '大エアロックが破られる · 備えろ' },
    hands: { fr: 'MAINS DE VORAX', en: 'HANDS OF VORAX', es: 'MANOS DE VORAX', pt: 'MÃOS DE VORAX', ja: 'ヴォラックスの手' },
    v5: { fr: 'Ses yeux chargent ! Reste entre les deux rayons rouges !', en: 'His eyes are charging! Stay between the two red beams!', es: '¡Sus ojos se cargan! ¡Quédate entre los dos rayos rojos!', pt: 'Os olhos dele estão a carregar! Fica entre os dois raios vermelhos!', ja: '目が充填してる！赤い二本の光線の間にいて！' },
    v6: { fr: 'Vise la tête, Vanguard. C’est là qu’il est fragile.', en: 'Aim for the head, Vanguard. That is where he is weak.', es: 'Apunta a la cabeza, Vanguard. Ahí es vulnerable.', pt: 'Aponta à cabeça, Vanguard. É aí que ele é frágil.', ja: '頭を狙って、ヴァンガード。そこが弱点よ。' },
    crit: { fr: 'CRITIQUE', en: 'CRITICAL', es: 'CRÍTICO', pt: 'CRÍTICO', ja: 'クリティカル' },
    leftHand: { fr: 'MAIN GAUCHE', en: 'LEFT HAND', es: 'MANO IZQUIERDA', pt: 'MÃO ESQUERDA', ja: '左手' },
    rightHand: { fr: 'MAIN DROITE', en: 'RIGHT HAND', es: 'MANO DERECHA', pt: 'MÃO DIREITA', ja: '右手' },
    form1: { fr: 'VORAX · CUIRASSÉ', en: 'VORAX · ARMORED', es: 'VORAX · ACORAZADO', pt: 'VORAX · BLINDADO', ja: 'ヴォラックス・装甲形態' },
    form2: { fr: 'VORAX · NÉCRO-RÉACTEUR', en: 'VORAX · NECRO-REACTOR', es: 'VORAX · NECROREACTOR', pt: 'VORAX · NECRORREATOR', ja: 'ヴォラックス・ネクロリアクター' },
    form3: { fr: 'VORAX · SINGULARITÉ', en: 'VORAX · SINGULARITY', es: 'VORAX · SINGULARIDAD', pt: 'VORAX · SINGULARIDADE', ja: 'ヴォラックス・特異点' },
    morph1: { fr: 'Le cuirassé est détruit… Non. Son réacteur se reconstitue !', en: 'The armored form is destroyed… No. Its reactor is rebuilding!', es: 'El acorazado está destruido… No. ¡Su reactor se reconstruye!', pt: 'A forma blindada foi destruída… Não. O reator está a reconstruir-se!', ja: '装甲形態は破壊した…だめだ。リアクターが再構築されている！' },
    morph2: { fr: 'Deuxième cœur à zéro. VORAX ouvre une singularité ! Dernière forme !', en: 'Second core at zero. VORAX is opening a singularity! Final form!', es: 'Segundo núcleo a cero. ¡VORAX abre una singularidad! ¡Forma final!', pt: 'Segundo núcleo a zero. VORAX abre uma singularidade! Forma final!', ja: '第二コア停止。ヴォラックスが特異点を開く！最終形態だ！' },
    palmWarn: { fr: 'Ses paumes chargent ! Les deux rayons vont se croiser !', en: 'His palms are charging! The two beams will cross!', es: '¡Sus palmas cargan! ¡Los dos rayos se cruzarán!', pt: 'As palmas estão a carregar! Os dois raios vão cruzar-se!', ja: '掌が充填中！2本の光線が交差する！' }
  };

  /* --------------------------------------------------------- atelier sprites */
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function tint(src, col) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
  function finish(S) { S.w = tint(S.c, '#ffffff'); S.r = tint(S.c, '#ff2238'); S.k = tint(S.c, '#04030a'); return S; }
  function inset(poly, k) { const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length; return poly.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]); }
  function sprite(img, x, y, w, h, poly, q = 1) {
    let bx = x, by = y, bw = w, bh = h;
    if (poly) { const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]); bx = Math.min(...xs); by = Math.min(...ys); bw = Math.max(...xs) - bx; bh = Math.max(...ys) - by; }
    const c = mk(bw * q, bh * q), g = c.getContext('2d'); g.scale(q, q);
    if (poly) { g.beginPath(); poly.forEach((p, i) => i ? g.lineTo(p[0] - bx, p[1] - by) : g.moveTo(p[0] - bx, p[1] - by)); g.closePath(); g.clip(); }
    g.drawImage(img, bx, by, bw, bh, 0, 0, bw, bh);
    return finish({ c, x: bx, y: by, bw, bh, cx: bx + bw / 2, cy: by + bh / 2 });
  }
  function erase(S, polys) {
    const g = S.c.getContext('2d'); g.save(); g.setTransform(S.c.width / S.bw, 0, 0, S.c.height / S.bh, 0, 0); g.globalCompositeOperation = 'destination-out';
    for (const p of polys) { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0] - S.x, q[1] - S.y) : g.moveTo(q[0] - S.x, q[1] - S.y)); g.closePath(); g.fill(); }
    g.restore(); return finish(S);
  }

  /* planche des défenseurs : 8 silhouettes (coordonnées de la planche) */
  const FR = [[9, 35, 408, 439], [424, 55, 352, 387], [767, 62, 390, 422], [1157, 16, 368, 463], [11, 498, 457, 488], [478, 509, 310, 457], [788, 502, 390, 479], [1190, 504, 323, 430]];
  /* planche des mains : poing gauche, poing droit, main ouverte G/D, prise G/D, prise électrique G/D */
  const HR = [[17, 8, 450, 515], [489, 7, 414, 531], [892, 40, 332, 461], [1229, 43, 296, 468], [37, 528, 389, 485], [484, 530, 371, 483], [877, 505, 334, 503], [1218, 509, 302, 500]];
  /* VORAX : marionnette découpée dans la pose de l'intro (repos) */
  const VX = { x: 60, y: 0, w: 545, h: 640, cx: 330.5, cy: 319.5, H: 500 };
  VX.s = VX.H / 629;
  const VP = {
    legL: { poly: [[222, 335], [321, 335], [320, 640], [222, 640]], piv: [272, 338] },
    legR: { poly: [[323, 335], [424, 335], [424, 640], [325, 640]], piv: [372, 338] },
    armL: { poly: [[60, 250], [118, 234], [200, 230], [216, 262], [214, 330], [192, 458], [60, 458]], piv: [150, 248] },
    armR: { poly: [[604, 250], [526, 234], [444, 230], [428, 262], [430, 330], [452, 458], [604, 458]], piv: [494, 248] },
    head: { poly: [[262, 4], [384, 4], [390, 118], [352, 144], [292, 144], [254, 118]], piv: [322, 140] }
  };
  let SP = null;
  function prep() {
    if (SP) return SP;
    if (!ok(ART.boss) || !ok(ART.hands) || !ok(ART.foes) || !ok(ART.sas)) return null;
    try {
      const s = {};
      s.foes = FR.map(f => sprite(ART.foes, ...f, null, .6));
      s.hands = HR.map(f => sprite(ART.hands, ...f, null, .75));
      s.sas = sprite(ART.sas, 0, 0, 864, 572, null, .85); s.sasL = sprite(ART.sas, 0, 0, 432, 572, null, .7); s.sasR = sprite(ART.sas, 432, 0, 432, 572, null, .7);
      s.parts = {};
      for (const k in VP) s.parts[k] = sprite(ART.boss, 0, 0, 0, 0, VP[k].poly);
      s.torso = erase(sprite(ART.boss, VX.x, VX.y, VX.w, VX.h), Object.values(VP).map(p => inset(p.poly, .975)));
      s.smash = sprite(ART.boss, 0, 640, 600, 560, null, .8);
      SP = s;
    } catch (err) { SP = null; }
    return SP;
  }

  /* ---------------------------------------------------- outils de dessin */
  const P = () => PAINT.g, KK = () => PAINT.K;
  function drawS(S, x, y, w, o = {}) {
    const g = P(), K = KK(), sc = w / S.bw, h = S.bh * sc;
    g.save(); g.translate(x * K, y * K); if (o.rot) g.rotate(o.rot);
    g.scale((o.sx || 1) * (o.fx ? -1 : 1), o.sy || 1);
    const a = o.a === undefined ? 1 : o.a; g.globalAlpha *= a;
    const dx = -w / 2 * K, dy = -h / 2 * K, dw = w * K, dh = h * K;
    g.drawImage(S.c, dx, dy, dw, dh);
    if (o.dark > 0) { g.globalAlpha = a * Math.min(1, o.dark); g.drawImage(S.k, dx, dy, dw, dh); }
    if (o.red > 0) { g.globalAlpha = a * Math.min(1, o.red); g.globalCompositeOperation = 'source-over'; g.drawImage(S.r, dx, dy, dw, dh); }
    if (o.flash > 0) { g.globalAlpha = a * Math.min(1, o.flash); g.drawImage(S.w, dx, dy, dw, dh); }
    g.restore();
  }
  /* point de la planche → coordonnées de jeu pour un sprite dessiné en (x,y,w) */
  function kp(S, px, py, x, y, w, o = {}) {
    const sc = w / S.bw; let lx = (px - S.cx) * sc * (o.fx ? -1 : 1) * (o.sx || 1), ly = (py - S.cy) * sc * (o.sy || 1);
    const r = o.rot || 0, c = Math.cos(r), s = Math.sin(r);
    return [x + lx * c - ly * s, y + lx * s + ly * c];
  }
  function glow(x, y, r, rgb, a) {
    if (!(a > 0) || !(r > 0) || !isFinite(x) || !isFinite(y)) return;
    const g = P(), K = KK(); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a);
    const gr = g.createRadialGradient(x * K, y * K, 0, x * K, y * K, r * K);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.35, 'rgba(' + rgb + ',.45)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect((x - r) * K, (y - r) * K, 2 * r * K, 2 * r * K); g.restore();
  }
  /* flamme de réacteur : ang = direction dans laquelle la flamme s'étire */
  function flame(x, y, ang, len, wid, t, rgb = '176,92,255') {
    const g = P(), K = KK(), f = .78 + .22 * Math.sin(t * 47 + x) + .12 * Math.sin(t * 83 + y);
    const L = len * f;
    g.save(); g.translate(x * K, y * K); g.rotate(ang - Math.PI / 2); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(0, 0, 0, L * K);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.22, 'rgba(' + rgb + ',.85)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-wid / 2 * K, 0); g.quadraticCurveTo(-wid * .35 * K, L * .55 * K, 0, L * K); g.quadraticCurveTo(wid * .35 * K, L * .55 * K, wid / 2 * K, 0); g.closePath(); g.fill();
    g.globalAlpha = .55; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 1 * K, wid * .28 * K, wid * .2 * K, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function bolt(x1, y1, x2, y2, seed, w, col, jag = 12) {
    const g = P(), K = KK(), n = 7; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = w * K; g.shadowColor = col; g.shadowBlur = 10;
    g.beginPath(); g.moveTo(x1 * K, y1 * K);
    for (let i = 1; i < n; i++) { const u = i / n, j = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; const off = ((j - Math.floor(j)) - .5) * jag * 2; const nx = -(y2 - y1), ny = x2 - x1, d = Math.hypot(nx, ny) || 1; g.lineTo((x1 + (x2 - x1) * u + nx / d * off) * K, (y1 + (y2 - y1) * u + ny / d * off) * K); }
    g.lineTo(x2 * K, y2 * K); g.stroke(); g.restore();
  }
  function segHit(px, py, x1, y1, x2, y2, r) {
    const vx = x2 - x1, vy = y2 - y1, u = cl(((px - x1) * vx + (py - y1) * vy) / (vx * vx + vy * vy || 1), 0, 1);
    const dx = px - (x1 + u * vx), dy = py - (y1 + u * vy); return dx * dx + dy * dy < r * r;
  }
  const players = () => (G.players && G.players.length ? G.players : [G.player]).filter(p => p && p.alive && !p.out);
  const vuln = p => (p.inv || 0) <= 0;
  const target = (x, y) => (typeof nearestPlayer === 'function' ? nearestPlayer(x, y) : null) || G.player || { x: MID, y: L_H - 150 };
  const S_ = () => eScale();
  function shot(x, y, ang, sp, kind = 'ball', o = {}) { eb(x, y, ang, sp * S_().bs, kind, o); }
  function aimAt(x, y) { const t = target(x, y); return Math.atan2(t.y - y, t.x - x); }
  function shards(x, y, n, cols, spd = 260, size = 5) {
    for (let i = 0; i < n; i++) { const a = rnd(TAU), v = rnd(spd, spd * .3); spawnPart({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rnd(1.1, .4), col: pick(cols), size: rnd(size, size * .4), glow: true, drag: .94 }); }
  }
  function sfx(n, o) { try { Audio2.sfx(n, o); } catch (e) { } }

  /* =============================================================== ÉTAT */
  function init() {
    G._nv24 = {
      level: FINAL, stage: 'approach', t: 0, T: 0, off: 498, offV: 0, nearV: 0, lb: 0, lbTo: 0, noFire: false,
      door: null, waveT: 0, waveI: 0, hole: 0, holeT: 0, alarm: 0, said: {}, flashRed: 0,
      sy: 0, cruise: 1
    };
    G.props && (G.props.length = 0);
  }
  const V = () => G._nv24;
  function go(stage) { const v = V(); v.stage = stage; v.t = 0; }

  /* --------------------------------------------------------- le premier sas */
  function makeDoor() {
    const hp = Math.round(60 * S_().hp * (G.twoP && G.players && G.players.length > 1 ? 1.5 : 1));
    const cracks = [];
    for (let i = 0; i < 9; i++) {
      let x = rnd(150, -150), y = rnd(90, -90), a = rnd(TAU); const pts = [[x, y]];
      for (let k = 0; k < 6; k++) { a += rnd(.9, -.9); x += Math.cos(a) * rnd(26, 12); y += Math.sin(a) * rnd(26, 12); pts.push([cl(x, -200, 200), cl(y, -128, 128)]); }
      cracks.push({ at: i / 9, pts });
    }
    return { x: MID, y: -190, w: 430, hp, max: hp, flash: 0, shake: 0, cracks, emitT: 1.4, ringT: 3.2, side: 1, core: 0, halves: null };
  }
  const doorH = d => d.w * .34;

  /* ------------------------------------------------------------ défenseurs */
  /* PV revus à la baisse : le secteur 24 était trop résistant (demande joueur). */
  /* PV de nouveau réduits (second passage joueur : le secteur restait trop dur). */
  const FOE = {
    lance:   { f: 0, w: 70,  hp: 2,  r: 22, sc: 160, cr: [1, 4], kind: 'drone' },
    orbe:    { f: 1, w: 74,  hp: 4,  r: 28, sc: 260, cr: [2, 6], kind: 'stinger' },
    griffe:  { f: 2, w: 92,  hp: 4,  r: 32, sc: 300, cr: [2, 6], kind: 'stinger' },
    tourelle:{ f: 3, w: 84,  hp: 5,  r: 32, sc: 340, cr: [3, 7], kind: 'turret' },
    manta:   { f: 4, w: 138, hp: 18, r: 54, sc: 1400, cr: [12, 22], kind: 'carrier', flip: true },
    tambour: { f: 5, w: 98,  hp: 7,  r: 36, sc: 520, cr: [4, 9], kind: 'shielder', flip: true },
    dard:    { f: 6, w: 62,  hp: 1,  r: 18, sc: 140, cr: [1, 3], kind: 'drone', flip: true },
    gatling: { f: 7, w: 92,  hp: 6,  r: 34, sc: 420, cr: [3, 8], kind: 'turret' }
  };
  function foe(type, x, y, o = {}) {
    const D = FOE[type], s = S_();
    const e = spawnEnemy(D.kind, x, y, { ty: o.ty || 200 });
    Object.assign(e, { nv: type, mv: 'nv24', fire: null, aim: null, spawner: null, split: 0, guard: false, guardOn: false, ring: 0, layerCd: 0, elite: false, mini: false });
    e.r = D.r; e.hp = e.maxHp = Math.max(1, Math.round(D.hp * s.hp * (o.hp || 1) * (G.twoP && G.players && G.players.length > 1 ? 1.4 : 1)));
    e.sc = D.sc; e.cr = D.cr; e.st = 0; e.k = 0; e.cd = o.cd !== undefined ? o.cd : rnd(1.8, .8); e.warp = 0; e.side = o.side || 0;
    e.ty = o.ty || 200; e.spinUp = 0; e.fireOn = 0; e.burst = 0; e.bT = 0; e.lockX = x; e.lockY = L_H; e.x0 = x; e.lx = x; e.bank = 0; e.aimA = Math.PI / 2; e.recoil = 0; e.ch = 0; e.spin = rnd(TAU); e.dly = o.dly || 0;
    return e;
  }
  /* comportements */
  function aiFoe(e, dt) {
    const v = V(), T = target(e.x, e.y); e.k += dt; if (e.warp > 0) e.warp -= dt; if (e.recoil > 0) e.recoil = Math.max(0, e.recoil - dt * 5);
    const live = e.y > 10 && e.y < L_H - 40;
    switch (e.nv) {
      case 'lance': {
        if (e.st === 0) { e.y += (e.ty - e.y) * Math.min(1, dt * 2.4); e.x = e.x0 + Math.sin(e.k * 2.2 + e.spin) * 30; if (e.k > 1.6) { e.st = 1; e.k = 0; } }
        else if (e.st === 1) { e.x = e.x0 + Math.sin(e.k * 2.2 + e.spin) * 30 + Math.sin(e.k * 1.1) * 70; e.y += 16 * dt; if (e.k > 2.6) { e.st = 2; e.k = 0; e.vx = 0; e.vy = 60; } }
        else { e.vx += cl(T.x - e.x, -1, 1) * 260 * dt; e.vx = cl(e.vx, -170, 170); e.vy = Math.min(360, e.vy + 380 * dt); e.x += e.vx * dt; e.y += e.vy * dt; }
        e.cd -= dt; if (live && e.st < 2 && e.cd <= 0) { e.cd = rnd(2.7, 1.9); const [mx, my] = [e.x, e.y + 20]; shot(mx, my, aimAt(mx, my), 165, 'ball', { r: 7 }); e.recoil = .5; sfx('ehit'); }
        if (chance(dt * 26)) spawnPart({ x: e.x + rnd(14, -14), y: e.y - 28, vx: rnd(20, -20), vy: -rnd(90, 40), life: .28, col: pick(['#c27bff', '#ffffff', '#8a5cff']), size: 2.4, glow: true });
        break; }
      case 'orbe': {
        if (e.y < e.ty) e.y += (e.ty - e.y + 30) * dt * 1.6;
        e.x = cl(e.x0 + Math.sin(e.k * .8 + e.spin) * 60, 40, L_W - 40); e.y += Math.sin(e.k * 1.7) * 10 * dt;
        e.cd -= dt;
        if (e.cd <= 0 && live) { e.ch = Math.min(1, e.ch + dt / 1.1); if (e.ch >= 1) { e.ch = 0; e.cd = rnd(4.3, 3.4); const n = 10; for (let i = 0; i < n; i++) shot(e.x, e.y, i / n * TAU + e.spin, 120, 'orb', { r: 8 }); sfx('ehit'); addLight && addLight(e.x, e.y, 70, '#ff3348', .18); } }
        e.spin += dt * (1.1 + e.ch * 7);
        break; }
      case 'griffe': {
        /* poursuite continue par vélocité : plus aucun palier ni saut de position */
        e.vx = e.vx || 0; if (!e.vy) e.vy = 120;
        if (e.y < e.ty) { e.y += 110 * dt; e.vx = 0; }
        else {
          const tx = cl(T.x + Math.sin(e.k * 1.4 + e.spin) * 110, 50, L_W - 50);
          const ty = cl(e.y + 55, 90, L_H - 250);
          e.vx += cl(tx - e.x, -1, 1) * 560 * dt; e.vx = cl(e.vx, -250, 250);
          e.vy += cl(ty - e.y, -1, 1) * 320 * dt; e.vy = cl(e.vy, 60, 240);
          e.x += e.vx * dt; e.y += e.vy * dt;
          e.cd -= dt;
          if (e.cd <= 0 && live) {
            e.cd = rnd(2.4, 1.8);
            const w = FOE.griffe.w, S = SP && SP.foes[2]; const tips = [[800, 380], [940, 460], [1065, 370], [1145, 430]];
            for (const [px, py] of tips) { const p = S ? kp(S, px, py, e.x, e.y, w) : [e.x, e.y + 20]; shot(p[0], p[1], aimAt(p[0], p[1]) + rnd(.12, -.12), 150, 'ball', { r: 6 }); } sfx('ehit');
          }
        }
        break; }
      case 'tourelle': {
        e.y += v.nearV * dt; if (e.y < e.ty && v.nearV < 4) e.y += 90 * dt;
        /* le canon suit le joueur en douceur, dans un cône limité : plus de
           rotation folle dans tous les sens (demande joueur). */
        const want = Math.atan2(T.y - e.y, T.x - e.x), lim = .52, rel = cl(want - Math.PI / 2, -lim, lim);
        e.aimA += cl(Math.PI / 2 + rel - e.aimA, -1.4 * dt, 1.4 * dt);
        e.cd -= dt;
        if (e.cd <= 0 && live) { e.burst = 3; e.bT = 0; e.cd = rnd(3.3, 2.6); }
        if (e.burst > 0) { e.bT -= dt; if (e.bT <= 0) { e.bT = .2; e.burst--; e.recoil = 1; e.bar = ((e.bar | 0) + 1) % 2; const mz = muzzle(e); shot(mz[0], mz[1], e.aimA, 210, 'laser', { r: 7 }); spawnPart({ x: mz[0], y: mz[1], vx: Math.cos(e.aimA) * 90, vy: Math.sin(e.aimA) * 90, life: .14, col: '#ffd0d6', size: 7, glow: true }); sfx('cannon'); } }
        break; }
      case 'manta': {
        if (e.y < e.ty) e.y += Math.max(26, (e.ty - e.y) * 1.2) * dt;
        else e.x = cl(MID + Math.sin(e.k * .45) * 130, 80, L_W - 80);
        e.cd -= dt;
        if (e.cd <= 0 && e.y > 60) {
          e.cd = 3.1; e.salvo = ((e.salvo | 0) + 1);
          const S = SP && SP.foes[4], pods = [[100, 690], [130, 630], [345, 640], [375, 690]];
          if (e.salvo % 2) { for (const [px, py] of pods) { const p = S ? kp(S, px, py, e.x, e.y, FOE.manta.w, { rot: Math.PI }) : [e.x, e.y]; shot(p[0], p[1], Math.PI / 2 + rnd(.5, -.5), 115, 'missile', { r: 8, steer: 1.5 }); } sfx('cannon'); }
          else { const a = aimAt(e.x, e.y + 40); for (let i = 0; i < 9; i++) shot(e.x, e.y + 40, a + (i - 4) * .13, 150, 'ball', { r: 9 }); sfx('ehit'); }
          e.recoil = 1;
        }
        break; }
      case 'tambour': {
        if (e.y < e.ty) e.y += (e.ty - e.y + 40) * dt * 1.4; else e.x = cl(e.x0 + Math.sin(e.k * .6 + e.spin) * 90, 60, L_W - 60);
        e.spin += dt * 2.4; e.cd -= dt;
        if (e.cd <= 0 && e.y > 40) { e.fireOn = 2.2; e.cd = 4.0; }
        if (e.fireOn > 0) { e.fireOn -= dt; e.sT = (e.sT || 0) - dt; if (e.sT <= 0) { e.sT = .13; e.ang = (e.ang || 0) + .5; for (let i = 0; i < 2; i++) shot(e.x, e.y, e.ang + i * Math.PI, 125, 'ball', { r: 8 }); } }
        break; }
      case 'dard': {
        if (e.st === 0) { e.y += (e.ty - e.y) * Math.min(1, dt * 3.2); if (Math.abs(e.y - e.ty) < 6 || e.k > 1.4) { e.st = 1; e.k = 0; e.lockX = T.x; e.lockY = T.y; sfx('alert'); } }
        else if (e.st === 1) { if (e.k < .45) { e.lockX = T.x; e.lockY = T.y; } if (e.k > .7) { e.st = 2; e.k = 0; const a = Math.atan2(e.lockY - e.y, e.lockX - e.x); e.vx = Math.cos(a); e.vy = Math.sin(a); sfx('dash'); } }
        else { const sp = Math.min(620, 140 + e.k * 1400); e.x += e.vx * sp * dt; e.y += e.vy * sp * dt; if (chance(dt * 60)) spawnPart({ x: e.x, y: e.y, vx: -e.vx * 60, vy: -e.vy * 60, life: .3, col: pick(['#ff3c52', '#c27bff']), size: 4, glow: true }); /* pas de réapparition : le dard sort et quitte la carte */ if (e.y < -120 || e.x < -90 || e.x > L_W + 90) e.gone = true; }
        break; }
      case 'gatling': {
        e.y += v.nearV * dt; if (e.y < e.ty && v.nearV < 4) e.y += 90 * dt;
        /* mitrailleuse murale : le canon s'oriente vers le joueur dans son secteur */
        const gWant = cl(aimAt(e.x, e.y), e.side < 0 ? -.2 : Math.PI / 2 - .2, e.side < 0 ? Math.PI / 2 + .2 : Math.PI + .2);
        e.aimA += cl(gWant - e.aimA, -2.0 * dt, 2.0 * dt);
        e.cd -= dt;
        if (e.cd <= 0 && live) { e.burst = 6; e.bT = 0; e.cd = rnd(3.7, 3.0); e.spinUp = 1; }
        if (e.spinUp > 0) e.spinUp = Math.max(0, e.spinUp - dt * .7);
        if (e.burst > 0) { e.bT -= dt; if (e.bT <= 0) { e.bT = .075; e.burst--; e.recoil = 1; const mz = muzzle(e); const a = cl(aimAt(mz[0], mz[1]), e.side < 0 ? -.2 : Math.PI / 2 - .2, e.side < 0 ? Math.PI / 2 + .2 : Math.PI + .2); shot(mz[0], mz[1], a + rnd(.06, -.06), 235, 'ball', { r: 5 }); if (e.burst % 3 === 0) sfx('ehit'); } }
        e.spin += dt * (3 + (e.burst > 0 ? 30 : e.spinUp * 20));
        break; }
    }
    e.bank = cl(((e.x - e.lx) / Math.max(dt, 1e-3)) / 260, -1, 1); e.lx = e.x;
    if (e.hp < e.maxHp * .45 && chance(dt * 8)) spawnPart({ x: e.x + rnd(e.r * .6, -e.r * .6), y: e.y + rnd(e.r * .5, -e.r * .5), vx: rnd(14, -14), vy: -rnd(50, 20), life: rnd(.9, .5), col: pick(['#2a2234', '#3d3448']), size: rnd(9, 5) });
  }
  function muzzle(e) {
    const S = SP && SP.foes[FOE[e.nv].f], w = FOE[e.nv].w;
    if (!S) return [e.x, e.y + 20];
    if (e.nv === 'tourelle') { const p = (e.bar ? [1500, 325] : [1365, 330]); return kp(S, p[0], p[1], e.x, e.y, w, { rot: e.aimA - Math.PI / 2 }); }
    if (e.nv === 'gatling') return kp(S, 1410, 925, e.x, e.y, w, { fx: e.side > 0 });
    return [e.x, e.y];
  }
  const _updateEnemies = updateEnemies;
  updateEnemies = function (dt) {
    if (on()) {
      for (const e of G.enemies) if (e.nv) aiFoe(e, dt);
      /* retrait propre des défenseurs sortis par le haut (aucune téléportation) */
      for (let i = G.enemies.length - 1; i >= 0; i--) if (G.enemies[i].gone) G.enemies.splice(i, 1);
    }
    return _updateEnemies(dt);
  };
  const _killEnemy = killEnemy;
  killEnemy = function (e) {
    if (e && e.nv && on()) {
      shards(e.x, e.y, e.nv === 'manta' ? 34 : 14, ['#c27bff', '#ff3c52', '#ffffff', '#7a6c8f'], e.nv === 'manta' ? 340 : 220, e.nv === 'manta' ? 8 : 5);
      if (typeof SHOCK !== 'undefined') SHOCK.push({ x: e.x, y: e.y, t: 0, life: .35, max: e.r * 2.6, col: '#c27bff' });
      if (e.nv === 'manta') { FX.addShake(10); FX.addFlash(.2, '#ffd9f0'); for (let i = 0; i < 4; i++) explode(e.x + rnd(50, -50), e.y + rnd(30, -30), 1.6, '#ff3c52', '#ffd0a0'); }
    }
    return _killEnemy(e);
  };
  /* dessin des défenseurs */
  function drawFoe(e) {
    if(window.NV24ANIME) return NV24ANIME.drawFoe(e);
    const s = prep(); if (!s) return false;
    const D = FOE[e.nv], S = s.foes[D.f], t = G.time || (e.k + e.spin), k = e.k;
    const fl = e.flash > 0 ? .85 : 0, warp = e.warp > 0 ? 1 - e.warp / .55 : 1;
    const g = P(); g.save(); g.globalAlpha *= sm(warp);
    let w = D.w * (1.5 - .5 * sm(warp));
    if (warp < 1) { glow(e.x, e.y, 60 * (1 - warp) + 20, '190,110,255', .7 * (1 - warp)); ring(e.x, e.y, 20 + 70 * warp, 2, 'rgba(210,150,255,' + (1 - warp) + ')'); }
    const hurt = e.hp < e.maxHp * .45 ? .25 + .2 * Math.sin(k * 20) : 0;
    switch (e.nv) {
      case 'lance': {
        const o = { sx: 1 - Math.abs(e.bank) * .28, rot: e.bank * .18 + Math.sin(k * 3) * .03, flash: fl, red: hurt * .5 };
        for (const [px, py] of [[185, 80], [265, 80]]) { const p = kp(S, px, py, e.x, e.y, w, o); flame(p[0], p[1], -Math.PI / 2 + o.rot, 26 + (e.st === 2 ? 22 : 0), 12, k * 2 + px, '186,98,255'); }
        drawS(S, e.x, e.y, w, o);
        const c = kp(S, 218, 300, e.x, e.y, w, o); glow(c[0], c[1], 14 + e.recoil * 18, '200,120,255', .45 + e.recoil * .5);
        break; }
      case 'orbe': {
        const o = { rot: e.spin * .35, flash: fl, red: hurt * .5, sx: 1 + Math.sin(k * 6) * .02 };
        glow(e.x, e.y, 34 + e.ch * 40, '255,40,60', .25 + e.ch * .7);
        drawS(S, e.x, e.y, w, o);
        const c = kp(S, 610, 270, e.x, e.y, w, o);
        glow(c[0], c[1], 10 + e.ch * 22 + Math.sin(k * 9) * 3, '255,60,70', .9);
        if (e.ch > .15) for (let i = 0; i < 3; i++) { const a = k * 5 + i * TAU / 3; bolt(c[0] + Math.cos(a) * 34, c[1] + Math.sin(a) * 34, c[0], c[1], Math.floor(k * 18) + i, 1.4, 'rgba(255,90,110,.9)', 5); }
        break; }
      case 'griffe': {
        const st = cl(Math.hypot(e.vx || 0, e.vy || 0) / 240, 0, 1);
        const o = { sx: 1 + st * .08, sy: 1 - st * .1 + Math.sin(k * 4) * .015, rot: e.bank * .12, flash: fl, red: hurt * .5 };
        drawS(S, e.x, e.y, w, o);
        for (const [px, py] of [[800, 380], [940, 460], [1065, 370], [1145, 430]]) { const p = kp(S, px, py, e.x, e.y, w, o); glow(p[0], p[1], 7 + Math.sin(k * 7 + px) * 2, '255,50,60', .9); }
        const c = kp(S, 1025, 295, e.x, e.y, w, o); glow(c[0], c[1], 16 + st * 10, '190,100,255', .7);
        break; }
      case 'tourelle': {
        const rot = e.aimA - Math.PI / 2, back = e.recoil * 5;
        const o = { rot, flash: fl, red: hurt * .5 };
        const bx = e.x - Math.cos(e.aimA) * back, by = e.y - Math.sin(e.aimA) * back;
        g.save(); g.globalAlpha *= .45; drawS(S, e.x + 4, e.y + 8, w, { rot, dark: 1 }); g.restore();
        drawS(S, bx, by, w, o);
        for (const [px, py] of [[1365, 330], [1500, 325]]) { const p = kp(S, px, py, bx, by, w, o); glow(p[0], p[1], 9 + e.recoil * 22, '255,50,70', .7 + e.recoil * .3); }
        const tp = kp(S, 1345, 430, bx, by, w, o); flame(tp[0], tp[1], Math.PI / 2 + rot, 14, 9, k, '186,98,255');
        break; }
      case 'manta': {
        const o = { rot: Math.PI + e.bank * .1, flash: fl, red: hurt * .45, sx: 1 - Math.abs(e.bank) * .1 };
        for (const [px, py] of [[60, 820], [140, 860], [335, 860], [415, 820]]) { const p = kp(S, px, py, e.x, e.y, w, o); flame(p[0], p[1], -Math.PI / 2 + e.bank * .1, 30 + Math.sin(k * 3 + px) * 6, 15, k + px, '186,98,255'); }
        drawS(S, e.x, e.y, w, o);
        for (const [px, py] of [[100, 690], [130, 630], [345, 640], [375, 690], [175, 745], [300, 745]]) { const p = kp(S, px, py, e.x, e.y, w, o); glow(p[0], p[1], 8 + e.recoil * 12 + Math.sin(k * 8 + px) * 2, '255,40,60', .85); }
        const n = kp(S, 238, 745, e.x, e.y, w, o); glow(n[0], n[1], 20, '200,120,255', .55 + .2 * Math.sin(k * 4));
        break; }
      case 'tambour': {
        const o = { rot: Math.PI + Math.sin(k * 2) * .05, flash: fl, red: hurt * .5 };
        const fp = kp(S, 632, 935, e.x, e.y, w, o); flame(fp[0], fp[1], -Math.PI / 2, 22, 13, k, '186,98,255');
        drawS(S, e.x, e.y, w, o);
        for (const [px, py] of [[540, 795], [715, 730]]) { const p = kp(S, px, py, e.x, e.y, w, o); const fire = e.fireOn > 0 ? 1 : .35; for (let i = 0; i < 4; i++) { const a = e.spin * (px < 600 ? 1 : -1) + i * TAU / 4; glow(p[0] + Math.cos(a) * 15, p[1] + Math.sin(a) * 9, 6, '255,50,60', fire); } glow(p[0], p[1], 18, '255,40,60', .3 * fire); }
        const c = kp(S, 632, 648, e.x, e.y, w, o); glow(c[0], c[1], 11 + (e.fireOn > 0 ? 8 : 0), '255,70,80', .9);
        break; }
      case 'dard': {
        const a = e.st === 2 ? Math.atan2(e.vy, e.vx) - Math.PI / 2 : e.st === 1 ? Math.atan2(e.lockY - e.y, e.lockX - e.x) - Math.PI / 2 : 0;
        const o = { rot: Math.PI + a, flash: fl || (e.st === 1 && Math.floor(k * 16) % 2 ? .6 : 0) };
        if (e.st === 1) { const gg = P(), K = KK(); gg.save(); gg.globalAlpha = .25 + .45 * (k / .7); gg.strokeStyle = '#ff3c52'; gg.setLineDash([6 * K, 7 * K]); gg.lineWidth = 1.6 * K; gg.beginPath(); gg.moveTo(e.x * K, e.y * K); gg.lineTo(e.lockX * K, e.lockY * K); gg.stroke(); gg.restore(); }
        for (const [px, py] of [[815, 855], [940, 860], [1000, 860], [1125, 855]]) { const p = kp(S, px, py, e.x, e.y, w, o); flame(p[0], p[1], a - Math.PI / 2, e.st === 2 ? 34 : 16, 9, k + px, '200,110,255'); }
        drawS(S, e.x, e.y, w, o);
        const c = kp(S, 970, 690, e.x, e.y, w, o); glow(c[0], c[1], 9 + (e.st === 1 ? 14 * Math.abs(Math.sin(k * 20)) : 0), '255,40,60', 1);
        break; }
      case 'gatling': {
        const o = { fx: e.side > 0, flash: fl, red: hurt * .5, rot: Math.sin(k * 1.4) * .03 };
        const bx = e.x - (e.side > 0 ? -1 : 1) * e.recoil * 3;
        drawS(S, bx, e.y, w, o);
        const tip = kp(S, 1410, 925, bx, e.y, w, o);
        for (let i = 0; i < 3; i++) { const a = e.spin + i * TAU / 3; glow(tip[0] + Math.cos(a) * 5, tip[1] + Math.sin(a) * 3, 3.5, '255,120,120', .9); }
        if (e.burst > 0 && e.bT > .04) glow(tip[0], tip[1], 20, '255,210,180', .9);
        const c = kp(S, 1360, 740, bx, e.y, w, o); glow(c[0], c[1], 10 + e.spinUp * 10, '255,40,60', .85);
        for (const [px, py] of [[1295, 605], [1425, 605]]) { const p = kp(S, px, py, bx, e.y, w, o); glow(p[0], p[1], 7, '190,110,255', .6 + .3 * Math.sin(k * 5)); }
        break; }
    }
    g.restore();
    if (e.maxHp >= 15 && e.hp < e.maxHp) { const bw = Math.min(70, e.r * 2), by = e.y - e.r - 14; fr(e.x - bw / 2 - 1, by - 1, bw + 2, 5, 'rgba(0,0,0,.75)'); fr(e.x - bw / 2, by, bw * cl(e.hp / e.maxHp, 0, 1), 3, e.hp / e.maxHp < .3 ? '#ff324b' : '#c27bff'); }
    return true;
  }
  const _drawEnemyOne = drawEnemyOne;
  drawEnemyOne = function (en, g, K, e) {
    let drawn = false; if (en && en.nv && on()) { try { drawn = drawFoe(en); } catch (err) { drawn = false; } }
    if (drawn) { if (typeof drawEnemyExtra === 'function') drawEnemyExtra(en, g, K, e); return; }
    return _drawEnemyOne(en, g, K, e);
  };

  /* ------------------------------------------------------- vagues du couloir */
  const LANES = [.18, .34, .5, .66, .82];
  const HALL = [
    { t: 0.4,  fn() { foe('tourelle', L_W * .3, -60, { ty: 120 }); foe('tourelle', L_W * .7, -140, { ty: 60 }); } },
    { t: 1.4, fn() { for (let i = 0; i < 5; i++) foe('lance', L_W * LANES[i], -50 - Math.abs(i - 2) * 46, { ty: 150 + Math.abs(i - 2) * 40 }); } },
    { t: 4.5, fn() { foe('gatling', 40, -80, { side: -1, ty: 80 }); foe('orbe', L_W * .3, -60, { ty: 210 }); foe('orbe', L_W * .7, -90, { ty: 250 }); } },
    { t: 7.7,  fn() { foe('griffe', L_W * .25, -70, { ty: 140 }); foe('griffe', L_W * .75, -90, { ty: 170 }); foe('gatling', L_W - 40, -150, { side: 1, ty: 60 }); } },
    { t: 10.5,  fn() { for (let i = 0; i < 4; i++) foe('dard', L_W * (.2 + i * .2), -40 - i * 60, { ty: 120 + (i % 2) * 70 }); } },
    { t: 13.3,  fn() { foe('tambour', MID, -80, { ty: 200 }); foe('tourelle', L_W * .2, -70, { ty: 90 }); foe('tourelle', L_W * .8, -70, { ty: 90 }); } },
    { t: 16.8,  fn() { foe('manta', MID, -120, { ty: 170, cd: 2.4 }); foe('gatling', 40, -60, { side: -1, ty: 70 }); foe('gatling', L_W - 40, -60, { side: 1, ty: 70 }); sfx('alert'); } },
    { t: 21.7,  fn() { for (let i = 0; i < 5; i++) foe('lance', L_W * LANES[i], -60 - i * 30, { ty: 140 + i * 25 }); foe('orbe', MID, -120, { ty: 300 }); } },
    { t: 24.5,  fn() { for (let i = 0; i < 3; i++) foe('dard', L_W * (.25 + i * .25), -50 - i * 50, { ty: 160 }); foe('griffe', L_W * .5, -90, { ty: 150 }); } },
    { t: 27.3,  fn() { foe('tourelle', L_W * .25, -60, { ty: 100 }); foe('tourelle', L_W * .5, -120, { ty: 70 }); foe('tourelle', L_W * .75, -60, { ty: 100 }); foe('tambour', MID, -160, { ty: 260 }); } }
  ];
  const HALL_END = 31;
  /* les trois premiers quarts du secteur : l'approche de la base, en vol libre */
  const APPROACH = [
    { t: 2,  fn() { for (let i = 0; i < 5; i++) foe('lance', L_W * LANES[i], -50 - Math.abs(i - 2) * 46, { ty: 150 + Math.abs(i - 2) * 40 }); } },
    { t: 7,  fn() { foe('orbe', L_W * .3, -60, { ty: 200 }); foe('orbe', L_W * .7, -90, { ty: 240 }); } },
    { t: 11, fn() { for (let i = 0; i < 4; i++) foe('dard', L_W * (.2 + i * .2), -40 - i * 60, { ty: 130 + (i % 2) * 70 }); } },
    { t: 15, fn() { for (let i = 0; i < 5; i++) foe('lance', L_W * LANES[i], -60 - i * 30, { ty: 140 + i * 25 }); foe('griffe', MID, -100, { ty: 150 }); } },
    { t: 20, fn() { foe('tambour', MID, -80, { ty: 200 }); foe('tourelle', L_W * .25, -150, { ty: 120 }); foe('tourelle', L_W * .75, -150, { ty: 120 }); } },
    { t: 25, fn() { foe('griffe', L_W * .25, -70, { ty: 140 }); foe('griffe', L_W * .75, -90, { ty: 170 }); foe('lance', L_W * .5, -150, { ty: 260 }); } },
    { t: 30, fn() { foe('orbe', L_W * .2, -60, { ty: 190 }); foe('orbe', L_W * .5, -110, { ty: 270 }); foe('orbe', L_W * .8, -60, { ty: 190 }); } },
    { t: 35, fn() { foe('manta', MID, -120, { ty: 170, cd: 2.4 }); foe('gatling', 40, -80, { side: -1, ty: 90 }); sfx('alert'); } },
    { t: 46, fn() { for (let i = 0; i < 5; i++) foe('dard', L_W * (.15 + i * .175), -40 - i * 45, { ty: 140 + (i % 2) * 60 }); } },
    { t: 50, fn() { for (let i = 0; i < 5; i++) foe('lance', L_W * LANES[i], -50 - Math.abs(i - 2) * 46, { ty: 170 + Math.abs(i - 2) * 30 }); foe('orbe', MID, -140, { ty: 300 }); } },
    { t: 55, fn() { foe('tambour', L_W * .3, -80, { ty: 190 }); foe('tambour', L_W * .7, -140, { ty: 240 }); } },
    { t: 61, fn() { foe('griffe', L_W * .2, -70, { ty: 130 }); foe('griffe', L_W * .5, -110, { ty: 160 }); foe('griffe', L_W * .8, -70, { ty: 130 }); foe('gatling', L_W - 40, -150, { side: 1, ty: 80 }); } },
    { t: 66, fn() { for (let i = 0; i < 6; i++) foe('lance', i % 2 ? L_W * .85 : L_W * .15, -50 - i * 55, { ty: 150 + i * 22 }); } },
    { t: 71, fn() { foe('orbe', L_W * .3, -60, { ty: 220 }); foe('orbe', L_W * .7, -60, { ty: 220 }); for (let i = 0; i < 3; i++) foe('dard', L_W * (.25 + i * .25), -150 - i * 40, { ty: 150 }); foe('tourelle', MID, -210, { ty: 90 }); } },
    { t: 77, fn() { foe('manta', MID, -120, { ty: 160, cd: 2.0, hp: 1.2 }); for (let i = 0; i < 4; i++) foe('lance', L_W * (.15 + i * .233), -220 - i * 30, { ty: 280 }); sfx('alert'); } },
    { t: 87, fn() { foe('tambour', MID, -80, { ty: 210 }); foe('griffe', L_W * .25, -100, { ty: 150 }); foe('griffe', L_W * .75, -100, { ty: 150 }); foe('gatling', 40, -160, { side: -1, ty: 80 }); } },
    { t: 93, fn() { for (let i = 0; i < 6; i++) foe('dard', L_W * (.12 + i * .152), -40 - i * 40, { ty: 130 + (i % 3) * 50 }); } },
    { t: 98, fn() { for (let i = 0; i < 7; i++) foe('lance', L_W * (.1 + i * .133), -50 - Math.abs(i - 3) * 40, { ty: 160 + Math.abs(i - 3) * 30 }); } }
  ];

  /* ------------------------------------------------------------- le boss */
  const DOOR2 = { x: MID, y: 205, w: 470, hole: 88 };    /* le grand sas, au bout du couloir */
  function makeBoss() {
    const b = spawnBoss();
    b.parts = []; b.enter = false; b.x = MID; b.y = 200; b.r = 150;
    const vMax = b.maxHp;
    b.nv = { vMax, stage: 'hands' };
    const handHp = Math.round(vMax * .06);
    b.hp = b.maxHp = handHp * 2; b.name = tr(TXT.hands);
    const H = side => ({ side, hx: side < 0 ? 150 : 330, hy: 330, x: MID + side * DOOR2.hole, y: DOOR2.y, sc: .3, a: 0,
      hp: handHp, maxHp: handHp, dead: false, fr: side < 0 ? 0 : 1, flash: 0, mode: 'burst', t: 0, atkT: 1.6 + (side > 0 ? 1.1 : 0) });
    b.hands = [H(-1), H(1)];
    b.handI = 0;
    return b;
  }
  const VO = { x: MID, y: 335 };                       /* centre de VORAX au repos */
  function vpt(b, px, py) { const s = VX.s * (b.vz || 1); return [b.vx + (px - VX.cx) * s, b.vy + (py - VX.cy) * s]; }

  /* ================================================================ FLOT */
  function autopilot(dt, y = L_H - 170) {
    let i = 0;
    for (const p of players()) { const tx = MID + (G.players && G.players.length > 1 ? (i ? 30 : -30) : 0); p.x += (tx - p.x) * Math.min(1, dt * 1.6); p.y += (y - p.y) * Math.min(1, dt * 1.6); p.inv = Math.max(p.inv || 0, .3); i++; }
  }
  function bulletsHit(test, onHit) {
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const bu = G.bullets[i]; if (!bu) continue;
      const r = test(bu); if (!r) continue;
      CUR_OWN = bu.owner || CUR_OWN;
      onHit(bu, r);
      if (!bu.pierce) G.bullets.splice(i, 1);
    }
  }
  function sasUpdate(v, dt) {
    const d = v.door; d.flash = Math.max(0, d.flash - dt * 4); d.shake = Math.max(0, d.shake - dt * 18);
    const h = doorH(d);
    bulletsHit(bu => Math.abs(bu.x - d.x) < d.w * .46 && Math.abs(bu.y - d.y) < h * .45, bu => {
      d.hp -= Math.max(.5, bu.dmg); d.flash = .5; d.shake = Math.min(5, d.shake + 1.2);
      spawnPart({ x: bu.x, y: bu.y, vx: rnd(60, -60), vy: rnd(20, -90), life: .2, col: pick(['#ffe6b0', '#ffffff', '#ffb070']), size: 3, glow: true });
    });
    const frac = d.hp / d.max;
    if (frac < .6 && chance(dt * 10)) spawnPart({ x: d.x + rnd(170, -170), y: d.y + rnd(100, -100), vx: rnd(10, -10), vy: -rnd(60, 20), life: rnd(1.2, .6), col: pick(['#2b2533', '#3a3242']), size: rnd(12, 6) });
    if (frac < .45 && chance(dt * 7)) { const x = d.x + rnd(170, -170), y = d.y + rnd(100, -100); shards(x, y, 4, ['#ffb070', '#ffe6b0'], 140, 3); }
    /* défenses : canons latéraux, cœur central, renforts */
    d.emitT -= dt; d.ringT -= dt; d.core = Math.max(0, d.core - dt * .8);
    const rate = frac < .5 ? .72 : 1;
    if (d.emitT <= 0) {
      d.emitT = 1.5 * rate; d.side *= -1;
      const ex = d.x + d.side * d.w * .41, ey = d.y - h * .18;
      const a = aimAt(ex, ey); for (let i = -1; i <= 1; i++) shot(ex, ey, a + i * .18, 170, 'ball', { r: 8 });
      d['fl' + d.side] = .25; sfx('ehit');
    }
    if (d.ringT <= 0) { d.ringT = 4.2 * rate; d.core = 1; }
    if (d.corePrev > .35 && d.core <= .35) { const n = 14; for (let i = 0; i < n; i++) shot(d.x, d.y + 10, i / n * TAU + v.t, 118, 'orb', { r: 9 }); sfx('ehit'); FX.addShake(3); }
    d.corePrev = d.core;
    for (const s of [-1, 1]) if (d['fl' + s] > 0) d['fl' + s] -= dt;
    v.waveT += dt;
    if (v.waveT > 5 && !v.said.r1) { v.said.r1 = 1; foe('lance', L_W * .25, -50, { ty: 380 }); foe('lance', L_W * .75, -80, { ty: 380 }); }
    if (v.waveT > 13 && !v.said.r2) { v.said.r2 = 1; foe('dard', L_W * .2, -40, { ty: 400 }); foe('dard', L_W * .8, -60, { ty: 420 }); }
    if (v.waveT > 21 && !v.said.r3) { v.said.r3 = 1; foe('orbe', L_W * .5, -60, { ty: 420 }); }
    if (d.hp <= 0) startBoom(v);
  }
  function startBoom(v) {
    go('boom'); const d = v.door; d.hp = 0; v.noFire = false;
    G.ebullets.length = 0; sfx('explode', { big: true }); FX.addShake(14); FX.addFlash(.35, '#ffe2b8');
    for (const e of G.enemies) if (e.nv) { explode(e.x, e.y, 1.2, '#ff3c52', '#ffd0a0'); } G.enemies.length = 0;
  }
  function boomUpdate(v, dt) {
    const d = v.door, h = doorH(d);
    if (chance(dt * 16) && v.t < 1.4) { const x = d.x + rnd(d.w * .45, -d.w * .45), y = d.y + rnd(h * .4, -h * .4); explode(x, y, rnd(2.2, 1.2), '#ff7a3c', '#ffe6b0'); sfx('explode'); FX.addShake(5); }
    if (v.t >= 1.3 && !d.halves) {
      d.halves = [{ x: d.x - d.w / 4, y: d.y, vx: -330, vy: -80, r: 0, vr: -2.4, s: 1 }, { x: d.x + d.w / 4, y: d.y, vx: 330, vy: -60, r: 0, vr: 2.2, s: 1 }];
      FX.addFlash(.8, '#ffffff'); FX.addShake(26); FX.stop && FX.stop(.08); sfx('explode', { big: true });
      shards(d.x, d.y, 70, ['#ffb070', '#ffe6b0', '#ffffff', '#8a8494', '#c27bff'], 520, 9);
      if (typeof SHOCK !== 'undefined') SHOCK.push({ x: d.x, y: d.y, t: 0, life: .6, max: 360, col: '#ffe0b0' });
    }
    if (d.halves) for (const p of d.halves) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.r += p.vr * dt; p.s += dt * 1.1; }
    if (v.t > 3.0) { go('hall'); v.door = null; v.door2 = { x: DOOR2.x, y: -400, w: DOOR2.w, flash: 0, shake: 0, holes: {}, halves: null }; v.waveT = 0; v.waveI = 0; radioSay('cmd', tr(TXT.v3)); }
  }
  function hallUpdate(v, dt) {
    v.waveT += dt;
    while (v.waveI < HALL.length && HALL[v.waveI].t <= v.waveT) { HALL[v.waveI].fn(); v.waveI++; }
    /* le décor avance jusqu'au grand sas */
    const want = v.off > 0 ? 498 / HALL_END : 0;
    v.offV += (want - v.offV) * Math.min(1, dt * 1.5); v.off = Math.max(0, v.off - v.offV * dt);
    v.nearV = v.offV * 3.4;
    v.door2.y = Math.max(-400, DOOR2.y - v.off * 3.4);
    if (v.off <= 0 && v.waveI >= HALL.length && !G.enemies.length) { go('alarm'); v.lbTo = 1; v.noFire = true; G.ebullets.length = 0; radioClear && radioClear(); radioSay('cmd', tr(TXT.v4)); sfx('bossAlarm'); }
  }
  function alarmUpdate(v, dt) {
    autopilot(dt, L_H - 150); v.alarm = v.t;
    for (const at of [.9, 1.8, 2.5, 3.0, 3.4]) if (v.t - dt < at && v.t >= at) { FX.addShake(9 + at * 3); sfx('explode'); v.door2.shake = 10; v.door2.flash = .3; shards(DOOR2.x + rnd(160, -160), DOOR2.y + rnd(100, -100), 10, ['#8a8494', '#5c5468', '#ffb070'], 200, 6); }
    if (v.t > 3.7) {
      go('voraxTalk'); v.lbTo = 1; v.noFire = true; radioClear(); for(const line of NV24ANIME.dialogue()) radioSay('kab',line);
      v.hole = 0; FX.addFlash(.4, '#ffe6d0'); FX.addShake(20); sfx('explode', { big: true });
    }
  }

  /* --------------------------------------------------------------- mains */
  function handFrame(hd) { return hd.fr; }
  function syncHands(b) {
    if (!b || !b.hands) return 0;
    b.hp = Math.max(0, b.hands.reduce((sum, hd) => sum + Math.max(0, hd.hp), 0));
    return b.hp;
  }
  function hurtHand(b, hd, dmg) {
    const v = V();
    if (!b || !b.hands || !hd || hd.dead || !v || v.stage !== 'hands') return;
    hd.hp = Math.max(0, hd.hp - Math.max(0, dmg)); hd.flash = .5; b.by = CUR_OWN;
    if (hd.hp <= 0) {
      hd.dead = true; hd.mode = 'dead'; hd.t = 0; hd.atkT = 999; hd.a = Math.min(hd.a, .72);
      FX.addShake(4); if(window.NV24ANIME) NV24ANIME.sound('12_doigt_blesse');
      popText(hd.x, hd.y - 74, tr(hd.side < 0 ? TXT.leftHand : TXT.rightHand) + ' · 0', '#ff8b9b', 7);
    }
    syncHands(b);
    if (b.hands.every(h => h.dead || h.hp <= 0)) startTear(v);
  }
  function handsUpdate(v, dt) {
    const b = G.boss; if (!b || !b.hands) return;
    b.t=(b.t||0)+dt;
    /* renforts : des défenseurs arrivent en continu pour occuper le joueur
       pendant qu'il tire sur les doigts qui trouent le sas (demande joueur). */
    v.handT = (v.handT || 0) + dt;
    if (v.handT > 3.4 && G.enemies.filter(e => e.nv).length < 4) {
      v.handT = 0;
      if (chance(.5)) { foe('lance', L_W * .24, -50, { ty: L_H * .52 }); foe('lance', L_W * .76, -80, { ty: L_H * .48 }); }
      else foe('dard', L_W * (chance(.5) ? .3 : .7), -50, { ty: 150 });
    }
    for(const hd of b.hands){
      hd.t+=dt;hd.flash=Math.max(0,hd.flash-dt*8);
      hd.x=DOOR2.x+hd.side*DOOR2.w*.14;hd.y=DOOR2.y+18;
      hd.sc=1;hd.a=1;hd.mode=hd.dead?'exhausted':'grip';
    }
    /* tirs du joueur : chaque main possède sa propre réserve de PV. */
    bulletsHit(bu => b.hands.find(hd => !hd.dead && hd.a > .5 && dist2(bu.x, bu.y, hd.x, hd.y) < (33 * hd.sc + bu.r) ** 2), (bu, hd) => {
      hurtHand(b, hd, bu.dmg * 3.2);
      spawnPart({ x: bu.x, y: bu.y, vx: rnd(80, -80), vy: rnd(40, -90), life: .22, col: pick(['#e4d6ff', '#ffffff', '#c27bff']), size: 3, glow: true });
    });
    /* contact */
    for (const p of players()) for (const hd of b.hands) if (!hd.dead && hd.a > .5 && vuln(p) && dist2(p.x, p.y, hd.x, hd.y) < (29 * hd.sc + p.r) ** 2) hitPlayer(p, 1, true);
    syncHands(b);
  }
  function startTear(v) {
    const b = G.boss; go('tear'); v.noFire = true; v.lbTo = 1; G.ebullets.length = 0; b.hp = 1;
    /* les renforts ont fait leur travail : le sas qui cède les emporte */
    for (const e of G.enemies) if (e.nv) explode(e.x, e.y, 1.1, '#ff3c52', '#ffd0a0');
    G.enemies.length = 0;
    for (const hd of b.hands) { hd.mode = 'grip'; hd.t = 0; hd.a = 1; hd.fr = hd.side < 0 ? 4 : 5; }
    sfx('door'); FX.addShake(10);
  }
  function tearUpdate(v, dt) {
    const b = G.boss; autopilot(dt, L_H - 140);
    for (const hd of b.hands) {
      hd.flash = Math.max(0, hd.flash - dt * 4);
      if (v.t < 2.0) {
        const pull = sm((v.t - .6) / 1.4), gx = DOOR2.x + hd.side * (DOOR2.hole + pull * 80), gy = DOOR2.y;
        hd.x += (gx - hd.x) * Math.min(1, dt * 5); hd.y += (gy - hd.y) * Math.min(1, dt * 5); hd.sc += (1 - hd.sc) * Math.min(1, dt * 4);
        if (pull > 0 && chance(dt * 20)) v.door2.shake = 2 + pull * 4; shards(DOOR2.x + rnd(30, -30), DOOR2.y + rnd(120, -120), 2, ['#ffb070', '#c27bff', '#ffffff'], 160, 4);
        FX.addShake(pull * 2);
      } else { hd.y -= 160 * dt; hd.a = Math.max(0, hd.a - dt * 1.6); hd.x += hd.side * 90 * dt; }
    }
    if (v.t >= 2.0 && !v.hole) {
      v.hole = 1; v.holeT = 0; const d2 = v.door2; d2.halves = [{ x: d2.x - d2.w / 4, y: d2.y, vx: -360, vy: -40, r: 0, vr: -2.0, s: 1 }, { x: d2.x + d2.w / 4, y: d2.y, vx: 360, vy: -30, r: 0, vr: 1.9, s: 1 }]; d2.ht = 0; FX.addFlash(.95, '#ffffff'); FX.addShake(32); FX.stop && FX.stop(.12); sfx('explode', { big: true });
      for (let i = 0; i < 8; i++) explode(DOOR2.x + rnd(180, -180), DOOR2.y + rnd(120, -120), rnd(3, 2), '#ff3c52', '#ffe6b0');
      shards(DOOR2.x, DOOR2.y, 90, ['#8a8494', '#5c5468', '#ff3c52', '#ffffff', '#ffb070'], 560, 10);
      if (typeof SHOCK !== 'undefined') SHOCK.push({ x: DOOR2.x, y: DOOR2.y, t: 0, life: .7, max: 420, col: '#ff6070' });
    }
    /* dès que le grand sas est arraché, VORAX (dont les mains font partie) est visible */
    if (v.t > 2.2) {
      go('reveal'); b.nv.stage = 'reveal'; b.hands = null; b.nv.form = 0; b.name = tr(TXT.form1);
      b.hp = b.maxHp = formHp(b); b.vx = DOOR2.x; b.vy = DOOR2.y; b.vz = .45; b.ph = 0; b.atk = null; b.atkT = 1.6; b.atkI = 0; b.flash = 0;
      sfx('bossAlarm');
    }
  }

  /* --------------------------------------------------------------- VORAX */
  const FORM_KEYS = ['form1', 'form2', 'form3'];
  /* Une seule réserve de PV pour les trois formes : la jauge ne se remet plus à zéro.
     Les changements de forme surviennent aux seuils 2/3 et 1/3 de cette réserve. */
  const VORAX_POOL = .72;
  function formHp(b) { return Math.max(1, Math.round(b.nv.vMax * VORAX_POOL)); }
  const ATK = [
    ['laser', 'palms', 'orbs', 'spiral', 'laser', 'rain'],
    ['laser2', 'palms', 'orbs', 'spiral', 'rain', 'laser2', 'palms'],
    ['sweep', 'palms', 'spiral', 'laser2', 'rain', 'palms', 'sweep']
  ];
  function revealUpdate(v, dt) {
    const b = G.boss; autopilot(dt, L_H - 140); b.t = (b.t || 0) + dt;
    const q = eo(v.t / 2.2);
    b.vx = DOOR2.x + (VO.x - DOOR2.x) * q; b.vy = DOOR2.y + (VO.y - DOOR2.y) * q; b.vz = .45 + .55 * q;
    if (v.t > 1.4 && !v.said.intro) { v.said.intro = 1; FX.addShake(18); sfx('explode', { big: true }); /* Vorax has already spoken behind the sealed gate. */ }
    if (v.t > 2.6) { go('vorax'); b.nv.stage = 'vorax'; v.lbTo = 0; v.noFire = false; b.atkT = 1.0; setTimeout(() => { if (on() && G.boss === b && !b.dead) radioSay('cmd', tr(TXT.v6)); }, 9000); }
  }
  function eyes(b) { if (window.NVBOSS && NVBOSS.vorax.ready()) return NVBOSS.vorax.eyes(b, vpt); return [vpt(b, 303, 75), vpt(b, 346, 75)]; }
  function palms(b) {
    const hn = window.NVBOSS && NVBOSS.vorax.ready() ? NVBOSS.vorax.hands(b) : [[120, 370], [525, 370]];
    return hn.map(p => vpt(b, p[0], p[1]));
  }
  function hurtBoss(b, dmg) {
    if (!b || b.dead) return;
    const v = V(); if (!v || !['hands', 'vorax'].includes(v.stage)) return;
    b.flash = .1; b.by = CUR_OWN;
    if (v.stage === 'hands') {
      const alive = b.hands.filter(hd => !hd.dead && hd.hp > 0);
      const each = dmg / Math.max(1, alive.length);
      for (const hd of alive) { hurtHand(b, hd, each); if (v.stage !== 'hands') break; }
      syncHands(b); return;
    }
    b.hp -= dmg;
    const frac = b.hp / b.maxHp, form = b.nv.form | 0;
    /* seuils de la réserve unique : 2/3 → forme 2, 1/3 → forme 3 */
    if (b.hp > 0 && form === 0 && frac <= 2 / 3) { startMorph(v, b, 1); return; }
    if (b.hp > 0 && form === 1 && frac <= 1 / 3) { startMorph(v, b, 2); return; }
    if (b.hp <= 0) {
      if (form < 2) { startMorph(v, b, form + 1); return; }
      b.hp = 0; [b.x, b.y] = vpt(b, 322, 260); b.r = 170;
      go('dead'); v.noFire = false; G.ebullets.length = 0; b.atk = null;
      G.phase = 'boss'; bossDie();
    }
  }
  function startMorph(v, b, to) {
    const from = b.nv.form | 0; to = to === undefined ? from + 1 : to;
    go('morph'); b.nv.stage = 'morph'; b.nv.morphFrom = from; b.nv.form = to; b.nv.morphT = 0;
    b.name = tr(TXT[FORM_KEYS[to]]); b.ph = to; b.atk = null; b.atkT = 1.2; b.atkI = 0; b.roar = 0; b.flash = 0;
    /* la jauge unique continue : pas de remise à zéro, pas de régénération.
       On borne à 1 PV pour qu'un très gros tir ne vide pas la barre avant la dernière forme. */
    b.hp = Math.max(1, b.hp);
    v.noFire = true; v.lbTo = 1; G.ebullets.length = 0; G.bullets.length = 0; G.phase = 'boss';
    for (const p of players()) p.inv = Math.max(p.inv || 0, 4.2);
    sfx('door'); FX.addShake(18); FX.addFlash(.42, from === 0 ? '#c27bff' : '#ff4058');
    radioSay('cmd', tr(to === 1 ? TXT.morph1 : TXT.morph2));
  }
  function morphUpdate(v, dt) {
    const b = G.boss; if (!b) return;
    b.t = (b.t || 0) + dt; b.nv.morphT = v.t;
    /* position stable : le tremblement vient uniquement des secousses d'écran explicites */
    b.vx = VO.x; b.vy = VO.y; b.vz = 1;
    [b.x, b.y] = vpt(b, 322, 220);
    if (v.t > .15 && chance(dt * 24)) {
      const p = vpt(b, rnd(500, 140), rnd(500, 110)); explode(p[0], p[1], rnd(1.4, .6), '#b944ff', '#fff0f4');
    }
    if (v.t > .7 && chance(dt * 34)) {
      const a = rnd(TAU), r = rnd(250, 100), x = b.vx + Math.cos(a) * r, y = b.vy + Math.sin(a) * r * .7;
      spawnPart({ x, y, vx: -Math.cos(a) * r * 2.8, vy: -Math.sin(a) * r * 2, life: .42, col: pick(['#ff2848', '#c27bff', '#ffffff']), size: rnd(6, 2), glow: true });
    }
    for (const at of [.72, 1.42, 2.15]) if (v.t - dt < at && v.t >= at) {
      sfx(at === 2.15 ? 'bossAlarm' : 'explode', { big: true }); FX.addShake(at === 2.15 ? 24 : 14); FX.addFlash(.32, at === 1.42 ? '#ffffff' : '#ff3048');
      if (typeof SHOCK !== 'undefined') SHOCK.push({ x: b.vx, y: b.vy, t: 0, life: .75, max: 420, col: at === 1.42 ? '#ffffff' : '#ff4058' });
    }
    /* la réserve de PV reste figée pendant la transformation (jauge unique non rechargée) */
    if (v.t > 3.0) {
      go('vorax'); b.nv.stage = 'vorax'; b.atk = null; b.atkT = 1.0; b.atkI = 0;
      v.noFire = false; v.lbTo = 0; G.bullets.length = 0; sfx('bossAlarm');
    }
  }
  function voraxUpdate(v, dt) {
    const b = G.boss; if (!b) return;
    b.t = (b.t || 0) + dt; if (b.flash > 0) b.flash -= dt;
    /* VORAX reste stable au repos : plus de oscillation permanente (req. tremblement) */
    b.vx = VO.x; b.vy = VO.y; b.vz = 1;
    [b.x, b.y] = vpt(b, 322, 220);
    const frac = b.hp / b.maxHp, ph = b.nv.form | 0;
    b.ph = ph;
    if (b.roar > 0) b.roar -= dt;
    if (frac < .66 && chance(dt * (ph === 2 ? 12 : 6))) { const p = vpt(b, rnd(470, 170), rnd(500, 120)); spawnPart({ x: p[0], y: p[1], vx: rnd(30, -30), vy: -rnd(70, 30), life: rnd(1.3, .6), col: pick(['#251f2e', '#3a3242']), size: rnd(14, 7) }); }
    if (frac < .34 && chance(dt * 3)) { const p = vpt(b, rnd(470, 170), rnd(480, 140)); explode(p[0], p[1], .9, '#ff3c52', '#ffd0a0'); }
    /* attaques */
    if (!b.atk) {
      b.atkT -= dt;
      if (b.atkT <= 0) {
        const list = ATK[ph], name = list[b.atkI++ % list.length]; b.atk = { name, t: 0, n: 0 };
        if (name.startsWith('laser') || name === 'sweep' || name === 'palms') {
          sfx('alert');
          if (name !== 'palms' && !v.said.laser) { v.said.laser = 1; radioSay('cmd', tr(TXT.v5)); }
          if (name === 'palms' && !v.said.palms) { v.said.palms = 1; radioSay('cmd', tr(TXT.palmWarn)); }
        }
      }
    } else atkUpdate(b, b.atk, dt, ph);
    /* tirs du joueur : tête (point faible), torse, bras */
    const NG = (window.NVBOSS && NVBOSS.vorax.ready()), hd = NG ? NVBOSS.vorax.head(b) : [324, 72], hn = NG ? NVBOSS.vorax.hands(b) : [[120, 370], [525, 370]];
    const head = vpt(b, hd[0], hd[1]), chest = vpt(b, 322, 235), aL = vpt(b, hn[0][0], hn[0][1]), aR = vpt(b, hn[1][0], hn[1][1]), s = VX.s;
    bulletsHit(bu => {
      if (dist2(bu.x, bu.y, head[0], head[1]) < (52 * s + bu.r) ** 2) return 'head';
      const dx = (bu.x - chest[0]) / (150 * s), dy = (bu.y - chest[1]) / (190 * s); if (dx * dx + dy * dy < 1) return 'body';
      if (dist2(bu.x, bu.y, aL[0], aL[1]) < (78 * s) ** 2 || dist2(bu.x, bu.y, aR[0], aR[1]) < (78 * s) ** 2) return 'arm';
      return null;
    }, (bu, zone) => {
      const m = zone === 'head' ? 1.7 : zone === 'arm' ? .55 : 1;
      hurtBoss(b, bu.dmg * 3.2 * m);
      spawnPart({ x: bu.x, y: bu.y, vx: rnd(90, -90), vy: rnd(40, -110), life: .22, col: zone === 'head' ? '#ff5a6a' : pick(['#e4d6ff', '#ffffff']), size: zone === 'head' ? 4 : 3, glow: true });
      if (zone === 'head' && chance(.08)) popText(bu.x, bu.y - 10, tr(TXT.crit), '#ff6a7a', 7);
    });
    /* contact avec le corps */
    const chestC = vpt(b, 322, 260);
    for (const p of players()) { const dx = (p.x - chestC[0]) / (170 * s), dy = (p.y - chestC[1]) / (240 * s); if (vuln(p) && dx * dx + dy * dy < 1) hitPlayer(p, 1, true); }
  }
  function atkUpdate(b, A, dt, ph) {
    A.t += dt; const t = A.t, s = S_();
    const done = (cd) => { b.atk = null; b.atkT = cd * (ph === 2 ? .7 : ph === 1 ? .85 : 1); };
    if (A.name === 'laser' || A.name === 'laser2' || A.name === 'sweep') {
      const charge = A.name === 'laser2' && A.n > 0 ? .85 : 1.5, fire = A.name === 'sweep' ? 2.0 : 1.35;
      if (t < charge) {
        A.ch = t / charge;
        if (A.ch < .55) { const T = target(MID, 500); A.tx = cl(T.x, 60, L_W - 60); }
        if (chance(dt * 40)) { const e = eyes(b)[chance(.5) ? 0 : 1], a = rnd(TAU), r = rnd(70, 40); spawnPart({ x: e[0] + Math.cos(a) * r, y: e[1] + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 3, life: .3, col: pick(['#ff2238', '#ff8a96', '#ffffff']), size: 3, glow: true }); }
      } else if (t < charge + fire) {
        A.ch = 1; const u = (t - charge) / fire;
        if (!A.fired) { A.fired = true; sfx('laser'); FX.addFlash(.12, '#ff2238'); FX.addShake(6); }
        let gap0, gap1, cx = A.tx;
        if (A.name === 'sweep') { cx = MID; gap0 = 250; gap1 = 46; }
        else { gap0 = 170; gap1 = 48; }
        const gap = gap0 + (gap1 - gap0) * eo(u * 1.6);
        A.ends = [cl(cx - gap, -60, L_W + 60), cl(cx + gap, -60, L_W + 60)];
        const E = eyes(b);
        for (const p of players()) { if (!vuln(p)) continue; for (let i = 0; i < 2; i++) if (segHit(p.x, p.y, E[i][0], E[i][1], A.ends[i], L_H + 30, p.r + 7)) { hitPlayer(p, 1, false); break; } }
        if (chance(dt * 30)) for (let i = 0; i < 2; i++) spawnPart({ x: A.ends[i] + rnd(10, -10), y: L_H - rnd(30, 0), vx: rnd(120, -120), vy: -rnd(260, 80), life: .4, col: pick(['#ff2238', '#ffb0b8', '#ffffff']), size: 3, glow: true });
        if (ph === 2 && A.name !== 'sweep') { A.sT = (A.sT || 0) - dt; if (A.sT <= 0) { A.sT = .5; const c = vpt(b, 322, 250); const a = aimAt(c[0], c[1]); for (let i = -1; i <= 1; i++) shot(c[0], c[1], a + i * .3, 120, 'ball', { r: 7 }); } }
      } else {
        A.ends = null; A.ch = 0;
        if (A.name === 'laser2' && A.n === 0) { A.n = 1; A.t = 0; A.fired = false; sfx('alert'); }
        else done(1.0);
      }
    } else if (A.name === 'palms') {
      const charge = 1.3, fire = ph === 2 ? 1.85 : 1.55;
      if (t < charge) {
        A.ch = t / charge;
        if (A.ch < .58) { const T = target(MID, 500); A.tx = cl(T.x, 85, L_W - 85); }
        if (chance(dt * 46)) for (const h of palms(b)) { const a = rnd(TAU), r = rnd(74, 34); spawnPart({ x: h[0] + Math.cos(a) * r, y: h[1] + Math.sin(a) * r, vx: -Math.cos(a) * r * 3.4, vy: -Math.sin(a) * r * 3.4, life: .3, col: pick(['#ff2238', '#ff8a96', '#ffffff']), size: 3, glow: true }); }
      } else if (t < charge + fire) {
        A.ch = 1; const u = (t - charge) / fire;
        if (!A.fired) { A.fired = true; sfx('laser'); FX.addFlash(.14, '#ff2238'); FX.addShake(8); }
        const spread = 112 + Math.sin(u * Math.PI) * (ph === 2 ? 105 : 55);
        A.ends = [cl(A.tx + spread, -40, L_W + 40), cl(A.tx - spread, -40, L_W + 40)];
        const H = palms(b);
        for (const p of players()) { if (!vuln(p)) continue; for (let i = 0; i < 2; i++) if (segHit(p.x, p.y, H[i][0], H[i][1], A.ends[i], L_H + 30, p.r + 8)) { hitPlayer(p, 1, false); break; } }
        if (ph === 2) { A.sT = (A.sT || 0) - dt; if (A.sT <= 0) { A.sT = .42; for (const h of H) { const a = aimAt(h[0], h[1]); for (let j = -1; j <= 1; j++) shot(h[0], h[1], a + j * .22, 145, 'orb', { r: 7 }); } } }
      } else { A.ends = null; A.ch = 0; done(.95); }
    } else if (A.name === 'orbs') {
      A.ch = Math.min(1, t / .9);
      if (t > .9 && A.n < 3) { A.sT = (A.sT || 0) - dt; if (A.sT <= 0) { A.sT = .32; A.n++; for (const [px, py] of ((window.NVBOSS && NVBOSS.vorax.ready()) ? NVBOSS.vorax.hands(b) : [[112, 410], [532, 410]])) { const h = vpt(b, px, py); shot(h[0], h[1], Math.PI / 2 + rnd(.6, -.6), 120, 'missile', { r: 8, steer: 1.4 }); const a = aimAt(h[0], h[1]); for (let i = -2; i <= 2; i++) shot(h[0], h[1], a + i * .2, 150, 'orb', { r: 8 }); } sfx('cannon'); } }
      if (t > 2.4) done(1.1);
    } else if (A.name === 'spiral') {
      A.ch = Math.min(1, t / .6); const c = vpt(b, 322, 250);
      if (t > .6 && t < 3.0) { A.sT = (A.sT || 0) - dt; if (A.sT <= 0) { A.sT = ph === 2 ? .09 : .12; A.ang = (A.ang || 0) + .33; const arms = ph === 0 ? 3 : 4; for (let i = 0; i < arms; i++) shot(c[0], c[1], A.ang + i / arms * TAU, 125, 'ball', { r: 8 }); } }
      if (t > 3.2) done(1.0);
    } else if (A.name === 'rain') {
      A.ch = Math.min(1, t / .5);
      if (t > .5 && t < 2.6) { A.sT = (A.sT || 0) - dt; if (A.sT <= 0) { A.sT = ph === 2 ? .07 : .1; const T = target(MID, 600); let x = rnd(L_W - 20, 20); if (Math.abs(x - T.x) < 40) x += x < T.x ? -50 : 50; shot(cl(x, 10, L_W - 10), -8, Math.PI / 2 + rnd(.08, -.08), 165, 'orb', { r: 8 }); } }
      if (t > 2.9) done(1.0);
    }
  }

  /* ============================================================ BRANCHEMENTS */
  const _startLevel = startLevel;
  startLevel = function (level) { const r = _startLevel.apply(this, arguments); if ((G.level | 0) === FINAL) init(); else G._nv24 = null; return r; };
  const _buildPlan = buildPlan;
  buildPlan = function (level) { if ((level | 0) === FINAL) return [{ t: 9999, fn() { } }]; return _buildPlan(level); };
  /* pas de panneaux d'écrans ni de consoles en décor dans ce secteur */
  const _decorSpawn = decorSpawn;
  decorSpawn = function (list, y, era, layer) {
    const n = list.length, r = _decorSpawn.apply(this, arguments);
    if ((G.level | 0) === FINAL && list.length > n) { const c = CHUNKS[list[list.length - 1].ci]; if (c && (c.id === 'b_ecrans' || c.id === 'b_console')) list.pop(); }
    return r;
  };
  const _props = updatePropSpawns;
  updatePropSpawns = function (dt) { if (G.level === FINAL) return; return _props(dt); };
  const _fire = fireWeapon;
  fireWeapon = function (P) { if (on() && V().noFire) return; return _fire.apply(this, arguments); };
  if (typeof useBomb === 'function') { const _bomb = useBomb; useBomb = function () { if (on() && V().noFire) return; return _bomb.apply(this, arguments); }; }

  const _flow = updateLevelFlow;
  updateLevelFlow = function (dt) {
    if (G.level !== FINAL) return _flow(dt);
    if (!G._nv24 || G._nv24.level !== FINAL) init();
    const v = V();
    if(window.NV24ANIME && !NV24ANIME.ready()) { NV24ANIME.loading(); return; }
    if(v.door && v.door.hp>0) for(const p of players()) p.y=Math.max(p.y,v.door.y+doorH(v.door)/2+p.r+12);
    if(v.door2 && !['reveal','morph','vorax','dead'].includes(v.stage)) for(const p of players()) p.y=Math.max(p.y,v.door2.y+70+p.r);
    if(v.stage==='complete') return _flow(dt);
    /* mort : il faut piloter updateBoss (-> animation d'explosion ANIME) depuis ce flux,
       faute de quoi VORAX resterait figé et la fin de niveau ne se déclencherait pas. */
    if (v.stage === 'dead') { G.phase = 'boss'; if (G.boss) updateBoss(dt); return; }
    G.phase = ['hands', 'tear', 'reveal', 'morph', 'vorax'].includes(v.stage) ? 'boss' : 'nv24'; v.t += dt; v.T += dt;
    /* croisière : plein gaz en approche, le décor décélère et se stabilise devant la base */
    const cruiseTarget = v.stage === 'approach' ? 1 : (['arrive', 'talk', 'sas', 'boom'].includes(v.stage) ? .12 : 0);
    v.cruise += (cruiseTarget - v.cruise) * Math.min(1, dt * 1.4);
    v.sy = (v.sy || 0) + dt * v.cruise;
    v.lb += (v.lbTo - v.lb) * Math.min(1, dt * 3);
    if (v.hole) v.holeT += dt;
    if (v.stage !== 'hall') { v.offV *= Math.max(0, 1 - dt * 2); v.nearV = v.offV * 3.4; }
    switch (v.stage) {
      case 'approach': {
        G.phase = 'waves'; G.plan = APPROACH; v.waveT += dt; G.waveT = v.waveT;
        while (v.waveI < APPROACH.length && APPROACH[v.waveI].t <= v.waveT) { APPROACH[v.waveI].fn(); v.waveI++; }
        if (v.waveI >= APPROACH.length && !G.enemies.length && v.waveT > APPROACH[APPROACH.length - 1].t + 2.5) { go('arrive'); v.lbTo = 1; v.noFire = true; v.waveT = 0; v.waveI = 0; G.ebullets.length = 0; G.phase = 'nv24'; }
        break; }
      case 'arrive': {
        autopilot(dt, L_H - 170);
        if (!v.door) v.door = makeDoor();
        const q = eo(v.t / 3.2); v.door.y = -190 + (300 + 190) * q; v.off = 498 - 40 * q;
        if (v.t > 3.4) { go('talk'); radioClear && radioClear(); radioSay('cmd', tr(TXT.v1)); sfx('alarm'); }
        break; }
      case 'talk':
        autopilot(dt, L_H - 170);
        if (v.t > 5.6) { go('sas'); v.noFire = false; v.lbTo = 0; v.waveT = 0; radioSay('cmd', tr(TXT.v2)); toast(tr(TXT.sasGoal)); sfx('alert'); for (const p of players()) p.inv = Math.max(p.inv || 0, 1); }
        break;
      case 'sas': sasUpdate(v, dt); break;
      case 'boom': boomUpdate(v, dt); break;
      case 'hall': hallUpdate(v, dt); break;
      case 'alarm': alarmUpdate(v, dt); break;
      case 'voraxTalk': autopilot(dt,L_H-150); if(v.t>1 && !RADIO.cur && !RADIO.q.length) { go('hands'); v.lbTo=0; v.noFire=false; v.boss=makeBoss(); NV24ANIME.sound('11_doigts_percement'); } break;
      case 'hands': handsUpdate(v, dt); break;
      case 'tear': tearUpdate(v, dt); break;
      case 'reveal': revealUpdate(v, dt); break;
      case 'morph': morphUpdate(v, dt); break;
      case 'vorax': voraxUpdate(v, dt); break;
    }
    const d2 = v.door2;
    if (d2) { d2.flash = Math.max(0, d2.flash - dt * 3); d2.shake = Math.max(0, d2.shake - dt * 14); if (d2.halves) { d2.ht = (d2.ht || 0) + dt; for (const p of d2.halves) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 240 * dt; p.r += p.vr * dt; p.s += dt * .9; } } }
    /* thème original de VORAX : démarre dès que ses mains trouent le sas et
       couvre tout le final, s'arrête à sa mort (le boss du secteur 24 n'est pas
       créé via spawnBoss, qui lancerait normalement la musique de boss). */
    if (G.boss && !G.boss.dead && ['hands', 'tear', 'reveal', 'morph', 'vorax'].includes(v.stage) && !VORAX_MUSIC.running) { try { Audio2.startBossMusic(23); } catch (e) { } }
    if ((v.stage === 'dead' || v.stage === 'complete') && VORAX_MUSIC.running) VORAX_MUSIC.stop();
    if (G.harvest && G.phase !== 'harvest') updateHarvest(dt);
  };
  const _updateBoss = updateBoss;
  updateBoss = function (dt) {
    const b = G.boss;
    if (on() && b && b.nv) {
      if (b.dead && window.NV24ANIME) return NV24ANIME.updateDeath(b,dt);
      if (b.dead) { const v = V(); b.t = (b.t || 0) + dt; return _updateBoss(dt); }
      return;                                                   /* piloté par updateLevelFlow */
    }
    return _updateBoss(dt);
  };
  const _bossDamage = bossDamage;
  bossDamage = function (dmg, part) {
    const b = G.boss;
    if (on() && b && b.nv) { hurtBoss(b, dmg * .5); return; }   /* bombes : demi-dégâts */
    return _bossDamage(dmg, part);
  };
  const _collide = collideBullets;
  collideBullets = function () { return _collide(); };

  /* ------------------------------------------------------------ DESSIN */
  /* le sas, ses battants arrachés */
  function drawDoor(v) {
    if(window.NV24ANIME) return NV24ANIME.drawDoor(v);
    const s = prep(), d = v.door; if (!s || !d) return;
    useBuf(R.bufNear); const h = doorH(d), t = v.T;
    if (d.halves) {
      for (let i = 0; i < 2; i++) { const p = d.halves[i], S = i ? s.sasR : s.sasL; drawS(S, p.x, p.y, d.w / 2 * p.s, { rot: p.r, a: cl(1 - (v.t - 1.3) / 1.6, 0, 1), red: .2 }); }
      return;
    }
    const jx = d.shake ? rnd(d.shake, -d.shake) : 0, jy = d.shake ? rnd(d.shake * .6, -d.shake * .6) : 0, frac = d.hp / d.max;
    const g = P(), K = KK();
    g.save(); g.globalAlpha = .5; g.fillStyle = '#000'; g.fillRect((d.x - d.w * .48) * K, (d.y + h * .46) * K, d.w * .96 * K, 14 * K); g.restore();
    drawS(s.sas, d.x + jx, d.y + jy, d.w, { flash: d.flash * .45, red: (1 - frac) * .22 + (v.stage === 'talk' ? .08 + .08 * Math.sin(t * 8) : 0) });
    /* fissures incandescentes */
    const dmg = 1 - frac; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const c of d.cracks) { const u = cl((dmg - c.at * .8) * 3, 0, 1); if (u <= 0) continue; const n = Math.max(2, Math.ceil(c.pts.length * u));
      g.strokeStyle = 'rgba(255,' + (140 + 60 * Math.sin(t * 6 + c.at * 9) | 0) + ',70,' + (.55 + .35 * u) + ')'; g.lineWidth = (1.4 + u * 2.2) * K; g.shadowColor = '#ff6a2a'; g.shadowBlur = 10;
      g.beginPath(); for (let i = 0; i < n; i++) { const [px, py] = c.pts[i]; i ? g.lineTo((d.x + jx + px) * K, (d.y + jy + py) * K) : g.moveTo((d.x + jx + px) * K, (d.y + jy + py) * K); } g.stroke(); }
    g.restore();
    /* canons latéraux et cœur */
    for (const sd of [-1, 1]) { const ex = d.x + jx + sd * d.w * .41, ey = d.y + jy - h * .18; glow(ex, ey, 14 + (d['fl' + sd] > 0 ? 26 : 0) + Math.sin(t * 6 + sd) * 3, '255,40,60', .9); }
    const cc = d.core > 0 ? 1 - Math.abs(d.core - .5) * 2 : 0;
    glow(d.x + jx, d.y + jy + 10, 18 + cc * 50, '255,60,40', .45 + cc * .55);
    if (v.stage === 'boom') { glow(d.x, d.y, 120 + v.t * 120, '255,190,120', .4 + v.t * .3); }
    /* barre de vie du sas */
    if (v.stage === 'sas') {
      const bw = 210, bx = d.x - bw / 2, by = d.y + h / 2 + 18;
      fr(bx - 2, by - 2, bw + 4, 9, 'rgba(2,4,10,.9)'); fr(bx, by, bw, 5, 'rgba(90,25,38,.95)'); fr(bx, by, bw * cl(frac, 0, 1), 5, frac < .3 ? '#ff374c' : '#ffb35a');
      hudText(g, tr(TXT.sasName), d.x, by + 17, '#ffe5da', 1.0, { align: 'center', glow: '#ff394e' });
    }
  }

  /* le grand sas : impacts des poings, puis trou béant */
  const holePoly = (() => { const pts = [], n = 24; for (let i = 0; i < n; i++) { const a = i / n * TAU, j = .74 + .26 * Math.abs(Math.sin(i * 7.31 + 1.7)); pts.push([Math.cos(a) * j, Math.sin(a) * j]); } return pts; })();
  function jag(cx, cy, rx, ry) { const g = P(), K = KK(); g.beginPath(); holePoly.forEach(([a, b], i) => i ? g.lineTo((cx + a * rx) * K, (cy + b * ry) * K) : g.moveTo((cx + a * rx) * K, (cy + b * ry) * K)); g.closePath(); }
  function drawDoor2(v) {
    if(window.NV24ANIME) return NV24ANIME.drawGate(v);
    const s = prep(), d = v.door2; if (!s || !d || d.y < -330) return;
    useBuf(R.bufNear); const g = P(), K = KK(), t = v.T;
    if (v.hole) {
      const op = eo(v.holeT / .6), cx = d.x, cy = DOOR2.y, rx = 215 * op, ry = 150 * op;
      g.save(); jag(cx, cy, rx, ry);
      const gr = g.createRadialGradient(cx * K, (cy + 20) * K, 6 * K, cx * K, cy * K, Math.max(rx, 1) * K);
      gr.addColorStop(0, '#3a0812'); gr.addColorStop(.55, '#12030a'); gr.addColorStop(1, '#030105');
      g.fillStyle = gr; g.fill();
      g.lineWidth = (4 + 2 * Math.sin(t * 9)) * K; g.strokeStyle = 'rgba(255,120,60,.9)'; g.shadowColor = '#ff4a2a'; g.shadowBlur = 18; g.stroke();
      g.restore();
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * .3, j = .8 + .2 * Math.sin(i * 3.1); glow(cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j, 12 + 5 * Math.sin(t * 7 + i), '255,110,50', .7); }
    }
    if (d.halves) {
      const a = cl(1 - (d.ht || 0) / 1.7, 0, 1);
      if (a > 0) for (let i = 0; i < 2; i++) { const p = d.halves[i]; drawS(i ? s.sasR : s.sasL, p.x, p.y, d.w / 2 * p.s, { rot: p.r, a, red: .15, dark: .4 }); }
      return;
    }
    const jx = d.shake ? rnd(d.shake, -d.shake) : 0, jy = d.shake ? rnd(d.shake * .5, -d.shake * .5) : 0;
    const alarm = ['alarm', 'hands', 'tear'].includes(v.stage) ? .5 + .5 * Math.sin(t * 10) : 0;
    glow(d.x, d.y, 260, '120,40,200', .18);
    drawS(s.sas, d.x + jx, d.y + jy, d.w, { dark: .45, red: .05 + alarm * .08, flash: d.flash * .5 });
    for (const sx of [-1, 1]) for (const yy of [-.36, .36]) glow(d.x + jx + sx * d.w * .44, d.y + jy + yy * d.w * .66 * .5, 10 + alarm * 16, '255,30,45', .5 + alarm * .5);
    for (const sd of [-1, 1]) {
      if (!d.holes[sd]) continue;
      const hx = d.x + jx + sd * DOOR2.hole, hy = d.y + jy;
      g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(200,140,255,.8)'; g.lineWidth = 2 * K; g.shadowColor = '#a066ff'; g.shadowBlur = 10;
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + sd, r1 = 46, r2 = 70 + (i % 3) * 18; g.beginPath(); g.moveTo((hx + Math.cos(a) * r1) * K, (hy + Math.sin(a) * r1 * .9) * K); g.lineTo((hx + Math.cos(a + .2) * (r1 + r2) / 2) * K, (hy + Math.sin(a + .2) * (r1 + r2) / 2 * .9) * K); g.lineTo((hx + Math.cos(a - .1) * r2) * K, (hy + Math.sin(a - .1) * r2 * .9) * K); g.stroke(); }
      jag(hx, hy, 50, 46); g.fillStyle = '#05030a'; g.shadowBlur = 0; g.fill(); g.lineWidth = 3 * K; g.strokeStyle = 'rgba(255,150,90,.85)'; g.stroke();
      g.restore();
      glow(hx, hy, 60, '150,70,255', .35);
    }
  }
  const _drawProps = drawProps;
  drawProps = function () { _drawProps(); if (!on()) return; const v = V(); if (v.door2) drawDoor2(v); if (v.door) drawDoor(v); };

  /* mains */
  function drawHands(b, v) {
    if(window.NV24ANIME) return NV24ANIME.drawHands(b,v);
    const s = prep(); if (!s || !b.hands) return;
    useBuf(R.bufNear);
    for (const hd of b.hands) {
      if (hd.a <= 0) continue;
      const S = s.hands[hd.fr], w = 190 * hd.sc, t = b.t || 0;
      const o = { a: hd.a, dark: hd.dead ? .62 : 0, flash: Math.max(hd.flash * .32, b.flash > 0 ? .1 : 0), rot: Math.sin(t * 2 + hd.side) * .04 + (hd.mode === 'slam' && hd.t > .55 && hd.t < .8 ? hd.side * -.08 : 0) };
      glow(hd.x, hd.y, 110 * hd.sc, hd.dead ? '70,45,80' : '150,80,255', (hd.dead ? .08 : .25) * hd.a);
      if (hd.mode === 'storm' && hd.t > .5) for (let i = 0; i < 3; i++) bolt(hd.x + rnd(40, -40), hd.y + rnd(40, -40), hd.x + hd.side * -rnd(90, 30), hd.y + rnd(60, -60), Math.floor(t * 20) + i + hd.side * 7, 2, 'rgba(200,140,255,.95)', 14);
      drawS(S, hd.x, hd.y, w, o);
      for (const [dx, dy] of [[-.18, .12], [.05, .2], [.2, .05]]) glow(hd.x + dx * w * (hd.side < 0 ? 1 : -1), hd.y + dy * w, 9, '190,110,255', (.5 + .4 * Math.sin(t * 6 + dx * 20)) * hd.a);
      if (v.stage === 'hands') {
        const bw = Math.max(82, 116 * hd.sc), bx = hd.x - bw / 2, by = hd.y - 104 * hd.sc;
        const frac = cl(hd.hp / Math.max(1, hd.maxHp), 0, 1);
        fr(bx - 2, by - 2, bw + 4, 12, 'rgba(3,4,12,.88)');
        fr(bx, by, bw, 8, 'rgba(255,255,255,.13)');
        fr(bx, by, bw * frac, 8, hd.dead ? '#4a3548' : frac < .3 ? '#ff3048' : '#c27bff');
        hudText(P(), tr(hd.side < 0 ? TXT.leftHand : TXT.rightHand), hd.x, by - 14, hd.dead ? '#8f788b' : '#ffe4ed', .82, { align: 'center', glow: hd.dead ? null : '#ff3048' });
      }
    }
    if (v.bolts) for (const bl of v.bolts) { const a = 1 - bl.t / .25; P().save(); P().globalAlpha = a; bolt(DOOR2.x + rnd(150, -150), DOOR2.y + 60, bl.x, 260, Math.floor(bl.t * 60) + bl.x, 2.4, 'rgba(210,150,255,1)', 18); P().restore(); }
  }
  /* VORAX en marionnette : jambes, torse, bras, tête */
  function drawVorax(b, v, alpha = 1, extra = {}) {
    if (window.NVBOSS && NVBOSS.vorax.draw(b, v, alpha, extra, vpt, VX.s)) return;   /* sprite du pack (nv-boss-sprites) */
    const s = prep(); if (!s) return;
    useBuf(R.bufNear);
    const g = P(), K = KK(), z = b.vz || 1, sc = VX.s * z, t = b.t || 0;
    const A = b.atk, ch = A ? (A.ch || 0) : 0, isLaser = A && (A.name.startsWith('laser') || A.name === 'sweep');
    const laserCh = isLaser ? ch : 0, handCh = A && (A.name === 'orbs' || A.name === 'palms') ? ch : 0;
    const flash = b.flash > 0 ? .16 : 0, red = (extra.red || 0) + laserCh * .09 + (b.roar > 0 ? b.roar * .25 : 0);
    const dark = extra.dark || 0;
    /* halo et réacteurs */
    glow(b.vx, b.vy + 40 * z, 300 * z, laserCh > .2 ? '255,30,50' : '120,60,255', (.18 + laserCh * .2) * alpha);
    for (const [px, py] of [[290, 600], [365, 600]]) { const p = vpt(b, px, py); flame(p[0], p[1] - 6 * z, Math.PI / 2, (40 + Math.sin(t * 9 + px) * 8) * z, 26 * z, t + px, '176,92,255'); }
    const part = (key, ang, dx = 0, dy = 0) => {
      const S = s.parts[key], pv = VP[key].piv, pp = vpt(b, pv[0], pv[1]);
      g.save(); g.translate((pp[0] + dx) * K, (pp[1] + dy) * K); g.rotate(ang); g.globalAlpha = alpha;
      const ox = (S.x - pv[0]) * sc * K, oy = (S.y - pv[1]) * sc * K, w = S.bw * sc * K, h = S.bh * sc * K;
      g.drawImage(S.c, ox, oy, w, h);
      if (dark > 0) { g.globalAlpha = alpha * dark; g.drawImage(S.k, ox, oy, w, h); }
      if (red > 0) { g.globalAlpha = alpha * Math.min(.8, red); g.drawImage(S.r, ox, oy, w, h); }
      if (flash > 0) { g.globalAlpha = alpha * flash; g.drawImage(S.w, ox, oy, w, h); }
      g.restore();
    };
    const br = Math.sin(t * 2.4);
    part('legL', .025 * Math.sin(t * 1.3) - .01, 0, 0);
    part('legR', -.025 * Math.sin(t * 1.3 + .7) + .01, 0, 0);
    /* torse qui respire */
    { const S = s.torso, piv = vpt(b, 322, 330); g.save(); g.translate(piv[0] * K, piv[1] * K); g.scale(1 + br * .006, 1 + br * .012); g.globalAlpha = alpha;
      const ox = (S.x - 322) * sc * K, oy = (S.y - 330) * sc * K, w = S.bw * sc * K, h = S.bh * sc * K;
      g.drawImage(S.c, ox, oy, w, h); if (dark > 0) { g.globalAlpha = alpha * dark; g.drawImage(S.k, ox, oy, w, h); } if (red > 0) { g.globalAlpha = alpha * Math.min(.8, red); g.drawImage(S.r, ox, oy, w, h); } if (flash > 0) { g.globalAlpha = alpha * flash; g.drawImage(S.w, ox, oy, w, h); } g.restore(); }
    const flex = laserCh * .1 + handCh * .14;
    part('armL', .05 * Math.sin(t * 1.6) + flex, 0, 0);
    part('armR', -.05 * Math.sin(t * 1.6 + .5) - flex, 0, 0);
    part('head', .03 * Math.sin(t * 1.1) + laserCh * .02 * Math.sin(t * 30), 0, laserCh * 3 * z);
    /* énergie violette dans les mains */
    if (handCh > 0) for (const [px, py] of [[112, 410], [532, 410]]) { const p = vpt(b, px, py); glow(p[0], p[1], (40 + handCh * 50) * z, '170,90,255', .5 + handCh * .5); for (let i = 0; i < 4; i++) bolt(p[0], p[1], p[0] + rnd(90, -90) * z, p[1] + rnd(90, -90) * z, Math.floor(t * 24) + i + px, 1.8, 'rgba(210,150,255,.95)', 12); }
    if (A && A.name === 'spiral') { const c = vpt(b, 322, 250); glow(c[0], c[1], (30 + ch * 40 + Math.sin(t * 20) * 6) * z, '255,50,70', .5 + ch * .4); }
    /* les yeux */
    const E = eyes(b), eyeRGB = laserCh > .15 || (b.roar > 0) ? '255,30,45' : '190,120,255';
    for (const e of E) {
      glow(e[0], e[1], (14 + laserCh * 46 + Math.sin(t * 7) * 2) * z, eyeRGB, (.75 + laserCh * .25) * alpha * (1 - dark * .3));
      if (laserCh > .3) { g.save(); g.globalAlpha = alpha; ring(e[0], e[1], (8 + laserCh * 22) * z, 1.6, 'rgba(255,90,110,' + (laserCh * .8) + ')'); g.restore(); circle(e[0], e[1], (2 + laserCh * 4) * z, laserCh > .85 ? '#fff4ee' : '#ff3048'); }
    }
  }
  function drawBeams(b) {
    const A = b && b.atk; if (!A || !(A.name.startsWith('laser') || A.name === 'sweep' || A.name === 'palms')) return;
    useBuf(R.bufNear); const g = P(), K = KK(), isPalm = A.name === 'palms', O = isPalm ? palms(b) : eyes(b), t = b.t || 0;
    if (!A.ends && A.ch > .45) {
      /* lignes de visée : les paumes croisent leurs trajectoires. */
      const cx = A.name === 'sweep' ? MID : A.tx, gap = A.name === 'sweep' ? 250 : 170;
      const targets = isPalm ? [cl(cx + 112, -40, L_W + 40), cl(cx - 112, -40, L_W + 40)] : [cx - gap, cx + gap];
      g.save(); g.globalAlpha = (A.ch - .45) * 1.2; g.setLineDash([6 * K, 9 * K]); g.strokeStyle = '#ff4a5c'; g.lineWidth = 1.6 * K;
      targets.forEach((x2, i) => { g.beginPath(); g.moveTo(O[i][0] * K, O[i][1] * K); g.lineTo(x2 * K, (L_H + 30) * K); g.stroke(); });
      g.setLineDash([]); g.restore();
    }
    if (A.ends) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const [x1, y1] = O[i], x2 = A.ends[i], y2 = L_H + 30, wob = Math.sin(t * 60 + i) * 3;
        g.globalAlpha = .35; g.strokeStyle = '#ff1d35'; g.lineWidth = (34 + wob) * K; g.beginPath(); g.moveTo(x1 * K, y1 * K); g.lineTo(x2 * K, y2 * K); g.stroke();
        g.globalAlpha = .9; g.strokeStyle = '#ff2a40'; g.lineWidth = 13 * K; g.beginPath(); g.moveTo(x1 * K, y1 * K); g.lineTo(x2 * K, y2 * K); g.stroke();
        g.globalAlpha = 1; g.strokeStyle = '#fff1ec'; g.lineWidth = 3.4 * K; g.beginPath(); g.moveTo(x1 * K, y1 * K); g.lineTo(x2 * K, y2 * K); g.stroke();
        glow(x1, y1, 30, '255,60,80', 1); glow(x2, L_H - 10, 50, '255,40,60', .8);
      }
      g.restore();
    }
  }
  const _drawBoss = drawBoss;
  drawBoss = function () {
    const b = G.boss, v = V();
    if (!on() || !b || !b.nv) return _drawBoss();
    if (v.stage === 'hands' || v.stage === 'tear') { drawHands(b, v); return; }
    if (v.stage === 'reveal' && window.NV24ANIME) { NV24ANIME.drawBoss(b,v,Math.min(1,v.t/.4)); return; }
    if (v.stage === 'reveal') {
      const s = prep(); if (!s) return;
      const u = v.t, lit = sm((u - .3) / 1.6);
      if (window.NVBOSS && NVBOSS.vorax.ready()) { NVBOSS.vorax.draw(b, v, Math.min(1, u / .4), { dark: 1 - lit }, vpt, VX.s); return; }
      if (u < 3.0) { const z = b.vz, w = 600 * VX.s * 1.1 * z * .91; const eyeX = 340, eyeY = 735; const sc = w / s.smash.bw; const ex = b.vx, ey = b.vy - (319.5 - 75) * VX.s * z; const cx = ex - (eyeX - s.smash.cx) * sc, cy = ey - (eyeY - s.smash.cy) * sc;
        useBuf(R.bufNear); glow(b.vx, b.vy, 340 * z, '255,40,60', .35 * lit);
        drawS(s.smash, cx, cy, w, { a: Math.min(1, u / .4) * (u > 2.6 ? 1 - (u - 2.6) / .4 : 1), dark: 1 - lit });
        const E = [[ex - 20 * z * .9, ey], [ex + 20 * z * .9, ey]]; for (const e of E) glow(e[0], e[1], 26 * z * (.4 + lit), '255,30,45', lit);
      }
      if (u > 2.6) drawVorax(b, v, Math.min(1, (u - 2.6) / .4));
      return;
    }
    if(b.dead && window.NV24ANIME) { NV24ANIME.drawDeath(b); return; }
    if (b.dead) {
      const k = cl(b.deadT / 2.4, 0, 1); if (k >= 1) return;
      const g = P(), K = KK(); g.save(); g.translate(rnd(8, -8) * k * K, rnd(8, -8) * k * K);
      b.vy += .4; drawVorax(b, v, (1 - k) * (Math.floor(b.deadT * 22) % 3 === 0 ? .55 : 1), { red: .3 + k * .5 }); g.restore(); return;
    }
    drawVorax(b, v); drawBeams(b);
  };

  /* ------------------------------------------------------------ DÉCORS
     Une scène peinte par moment du secteur, en fondu enchaîné :
       approche, sas extérieur  → l'espace devant la base de VORAX (elle grossit)
       couloir, alarme, mains   → le couloir du vaisseau amiral (on y avance)
       VORAX                    → la salle du cœur de la base
     Les planches sont dessinées dans le plan lointain, derrière tout le reste. */
  const SCN = { space: IMG('outer-space.webp'), corridor: IMG('flagship-base-corridor.webp'), core: IMG('base-interior.webp') };
  const BGS = { cur: 'space', prev: null, mix: 1, zoom: { space: 1, corridor: 1, core: 1.04 }, t: 0 };
  function sceneOf(v) {
    if (['approach', 'arrive', 'talk', 'sas', 'boom'].includes(v.stage)) return 'space';
    if (['hall', 'alarm', 'hands', 'tear'].includes(v.stage)) return 'corridor';
    return 'core';
  }
  function zoomOf(v, sc) {
    if (sc === 'space') {
      if (v.stage === 'approach') return 1 + .16 * cl(v.waveT / 100, 0, 1);
      return 1.16 + .14 * (v.stage === 'arrive' ? eo(v.t / 3.2) : 1);
    }
    if (sc === 'corridor') return 1 + .32 * cl(1 - v.off / 498, 0, 1);    /* on avance vers le grand sas */
    return 1.04 + .015 * Math.sin(BGS.t * .4);
  }
  function paintScene(g, W, H, key, zoom, alpha, jx, jy) {
    const im = SCN[key]; if (!ok(im) || alpha <= 0) return false;
    const base = Math.max(W / im.naturalWidth, H / im.naturalHeight), sc = base * zoom;
    const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
    /* point de fuite légèrement au-dessus du centre : on avance « vers le haut » */
    const ax = .5, ay = key === 'space' ? .32 : .42;
    g.globalAlpha = alpha;
    g.drawImage(im, W * ax - dw * ax + jx, H * ay - dh * ay + jy, dw, dh);
    return true;
  }
  const _drawWorld24 = drawWorld;
  drawWorld = function (dt) {
    const r = _drawWorld24.apply(this, arguments);
    if(on() && window.NV24ANIME) return r;
    if (!on() || !R.bufFar || !R.bufFar.g) return r;
    const v = V(), layer = R.bufFar, g = layer.g, W = layer.c.width, H = layer.c.height;
    BGS.t += dt || 0;
    if (BGS.v !== v) { BGS.v = v; BGS.cur = sceneOf(v); BGS.prev = null; BGS.mix = 1; }   /* nouveau départ du secteur */
    const want = sceneOf(v);
    if (want !== BGS.cur) { BGS.prev = BGS.cur; BGS.cur = want; BGS.mix = 0; }
    BGS.mix = Math.min(1, BGS.mix + (dt || 0) / 1.3);
    for (const k in BGS.zoom) BGS.zoom[k] += (zoomOf(v, k) - BGS.zoom[k]) * Math.min(1, (dt || 0) * 2.5);
    const d2 = v.door2, sh = d2 && d2.shake ? d2.shake * .6 : 0;
    const jx = sh ? rnd(sh, -sh) : 0, jy = sh ? rnd(sh * .6, -sh * .6) : 0;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = true;
    g.globalAlpha = 1; g.fillStyle = '#04060f'; g.fillRect(0, 0, W, H);
    let any = false;
    if (BGS.prev && BGS.mix < 1) any = paintScene(g, W, H, BGS.prev, BGS.zoom[BGS.prev], 1, jx, jy) || any;
    any = paintScene(g, W, H, BGS.cur, BGS.zoom[BGS.cur], BGS.prev ? sm(BGS.mix) : 1, jx, jy) || any;
    /* voile sombre : la lisibilité des tirs prime sur le décor */
    g.globalAlpha = 1; const sh2 = g.createLinearGradient(0, 0, 0, H);
    sh2.addColorStop(0, 'rgba(3,6,16,.18)'); sh2.addColorStop(.55, 'rgba(3,6,16,.34)'); sh2.addColorStop(1, 'rgba(3,6,16,.46)');
    g.fillStyle = sh2; g.fillRect(0, 0, W, H);
    g.restore();
    /* le plan intermédiaire ne doit pas recouvrir les planches avec un décor d'une autre génération */
    if (any && R.bufFG && R.bufFG.g) { R.bufFG.g.save(); R.bufFG.g.setTransform(1, 0, 0, 1, 0, 0); R.bufFG.g.clearRect(0, 0, R.bufFG.c.width, R.bufFG.c.height); R.bufFG.g.restore(); }
    if (any && R.bufMid && R.bufMid.g) { R.bufMid.g.save(); R.bufMid.g.setTransform(1, 0, 0, 1, 0, 0); R.bufMid.g.clearRect(0, 0, R.bufMid.c.width, R.bufMid.c.height); R.bufMid.g.restore(); }
    return r;
  };
  /* bandes de cinéma, titre, alarme rouge et lumière des rayons */
  const _hud = drawHUD;
  drawHUD = function () {
    if (!on()) return _hud.apply(this, arguments);
    const v = V(), x = PF.x, y = PF.y, w = PF.w, h = PF.h;
    const b = G.boss, A = b && !b.dead && b.atk, laser = A && (A.name.startsWith('laser') || A.name === 'sweep' || A.name === 'palms') ? (A.ends ? 1 : (A.ch || 0) * .45) : 0;
    const red = Math.max((v.stage === 'alarm' || v.stage === 'tear') ? (.5 + .5 * Math.sin(v.T * 12)) * .5 : 0, laser * .32, b && b.roar > 0 ? b.roar * .3 : 0);
    if (red > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = red; const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, h * .25, x + w / 2, y + h / 2, h * .78); vg.addColorStop(0, 'rgba(255,20,40,0)'); vg.addColorStop(1, 'rgba(255,20,40,.6)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h); ctx.restore(); }
    const r = _hud.apply(this, arguments);
    if (v.lb < .01) return r;
    if (typeof hudOvRun === 'function') hudOvRun('nv24lb', bars, [v]); else bars(v);
    return r;
  };
  function bars(v) {
    const x = PF.x, y = PF.y, w = PF.w, h = PF.h, bh = h * .06 * sm(v.lb);
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, bh); ctx.fillRect(x, y + h - bh, w, bh);
    if (v.stage === 'arrive' || (v.stage === 'talk' && v.t < 2)) {
      ctx.globalAlpha = v.stage === 'arrive' ? sm(v.t / .8) : 1 - v.t / 2;
      hudText(ctx, tr(TXT.arrive), x + w / 2, y + h - bh * .62, '#ffd6dc', Math.max(1.1, w / 330), { align: 'center', glow: '#ff2a40' });
    }
    ctx.restore();
    if (v.stage === 'alarm' && !window.NV24ANIME && window.nvAlertDraw) { const X = window.nvAlertText; window.nvAlertDraw(v.t, 3.7, { title: X.tr(X.title), name: X.tr(X.unknown), sub: tr(TXT.gate), y: .58 }); }
  }
  /* =====================================================================
     THÈME DE VORAX — composition originale entièrement synthétisée en
     WebAudio (aucun fichier tiers : libre de droit par construction).
     Ton mythique et oppressant : ralentissement à 68 BPM, ré mineur,
     nappes graves, timbales, double pulsation de cœur, lead plaintif et
     montée de tension en fin de boucle. Remplace la piste MP3 boss23. */
  const VORAX_MUSIC = (() => {
    const ROOT = 36.71;                                   /* D1 */
    const CHORDS = [[0, 3, 7], [-2, 2, 5], [7, 11, 14], [5, 9, 12]];
    const LEAD = [
      [12, -1, 7, -1, 3, -1, 7, -1, 12, -1, 10, 7, 3, -1, -1, -1],
      [10, -1, 7, -1, 5, -1, 7, -1, 10, -1, 12, 10, 7, -1, -1, -1],
      [14, -1, 12, -1, 10, -1, 7, -1, 12, -1, 10, 7, 5, -1, 7, -1],
      [15, -1, 14, 12, 10, 12, 14, -1, 17, -1, -1, 14, 12, -1, 10, -1]
    ];
    const BASS = [0, -1, -1, 0, -1, -1, 7, -1, 0, -1, -1, 7, -1, -1, 0, -1];
    let gain = null, running = false, step = 0, nextT = 0;
    const A = () => Audio2;
    function node() {
      if (gain || !A().musicGain) return gain;
      gain = A().ctx.createGain(); gain.gain.value = 0; gain.connect(A().musicGain); return gain;
    }
    function vol() { return A().muted ? 0 : cl((S.opts.music || 0) / 100, 0, 1) * .9; }
    function start() {
      const au = A(); au.init(); au.unlock(); if (!au.ok || running) return;
      if (!node()) return;
      if (typeof mxStop === 'function') { try { mxStop(.6); } catch (e) { } }
      running = true; step = 0; nextT = au.ctx.currentTime + .12;
      au.running = true; au.mode = 'boss'; au.boss = true;
      gain.gain.cancelScheduledValues(au.ctx.currentTime);
      gain.gain.setTargetAtTime(vol(), au.ctx.currentTime, .8);
    }
    function stop() {
      if (!running) return; running = false;
      const au = A();
      if (gain && au.ctx) gain.gain.setTargetAtTime(0, au.ctx.currentTime, .25);
      try { au.running = false; } catch (e) { }
    }
    function tick() {
      const au = A();
      if (!running || !au.ok || !gain) return;
      gain.gain.setTargetAtTime(vol(), au.ctx.currentTime, .15);
      const sd = 60 / 68 / 4;                            /* double-croche à 68 BPM */
      let guard = 0;
      while (nextT < au.ctx.currentTime + .18 && guard++ < 16) {
        const i = step % 64, bar = Math.floor(i / 16), st = i % 16, chord = CHORDS[bar];
        /* nappe : accord mineur/majeur tenu, deux fois par mesure */
        if (st === 0 || st === 8) for (const n of chord) au.voice(nextT, {
          f: n2f(n + 12, ROOT), dur: sd * 7.4, type: 'sawtooth', vol: .032, dest: gain, send: .65,
          filter: { type: 'lowpass', f: 950, q: .9 }, pan: n === chord[0] ? -.2 : .2
        });
        /* basse profondeur */
        const b = BASS[st];
        if (b >= 0) {
          au.voice(nextT, { f: n2f(b, ROOT), dur: sd * 2.6, type: 'triangle', vol: .2, dest: gain, send: .2 });
          au.voice(nextT, { f: n2f(b, ROOT) / 2, dur: sd * 2.2, type: 'sine', vol: .14, dest: gain });
        }
        /* timbale au début de chaque mesure + double pulsation de cœur */
        if (st === 0) {
          au.voice(nextT, { f: 118, f2: 46, dur: .42, type: 'sine', vol: .26, dest: gain });
          au.noise(nextT, { dur: .22, vol: .14, f: 1400, f2: 120, type: 'lowpass', dest: gain });
        }
        if (st === 3) au.voice(nextT, { f: 62, f2: 48, dur: .16, type: 'sine', vol: .12, dest: gain });
        /* lead mythique : timbre carré adouci, léger vibrato */
        const ln = LEAD[bar][st];
        if (ln >= 0) au.voice(nextT, {
          f: n2f(ln + 24, ROOT), dur: sd * (st % 4 === 0 ? 2.6 : 1.5),
          type: bar === 3 ? 'sawtooth' : 'square', vol: .045, dest: gain, send: .5, vibrato: .004,
          filter: { type: 'lowpass', f: 2600, q: 1.6 }, pan: (st % 2 ? .16 : -.16)
        });
        /* chapeau discret sur les contretemps */
        if (st % 2 === 1) au.noise(nextT, { dur: .03, vol: .012, f: 7800, f2: 3800, type: 'highpass', dest: gain, pan: st % 4 ? .25 : -.25 });
        /* montée de tension : dernier demi-cycle de la boucle */
        if (bar === 3 && st >= 10) {
          const k = (st - 10) / 6;
          au.noise(nextT, { dur: .18, vol: .02 + k * .05, f: 500 + k * 3200, f2: 200, type: 'bandpass', q: 1.4, dest: gain });
          if (st % 2 === 0) au.voice(nextT, { f: n2f(19 + k * 8, ROOT), dur: .3, type: 'sawtooth', vol: .03 + k * .03, dest: gain, send: .7, filter: { type: 'lowpass', f: 1200 + k * 2600, q: 2 } });
        }
        nextT += sd; step++;
      }
    }
    return { start, stop, tick, get running() { return running; } };
  })();
  /* la bande originale MP3 cède la place au thème original sur le secteur 24 */
  if (typeof mxWant === 'function') {
    const _mxWant = mxWant;
    mxWant = function () { if (on() && G.boss) return null; return _mxWant.apply(this, arguments); };
  }
  const _s24SBM = Audio2.startBossMusic.bind(Audio2);
  Audio2.startBossMusic = function (idx) { if (on() && G.boss) { VORAX_MUSIC.start(); return; } return _s24SBM(idx); };
  const _s24Stop = Audio2.stopMusic.bind(Audio2);
  Audio2.stopMusic = function () { VORAX_MUSIC.stop(); return _s24Stop(); };
  const _s24Tick = Audio2.musicTick.bind(Audio2);
  Audio2.musicTick = function () { _s24Tick(); try { VORAX_MUSIC.tick(); } catch (e) { } };

  /* Hooks uniquement présents sur l'URL de test automatisé. */
  if (new URLSearchParams(location.search).has('nv24test') || new URLSearchParams(location.search).has('nv24play')) {
    window.NV24_TEST = { V, go, hurtBoss, hurtHand, syncHands, formHp, startMorph, startTear,
      get boss() { return G.boss; }, get stage() { return V().stage; },
      get music() { return { running: VORAX_MUSIC.running, mxWant: (typeof mxWant === 'function' ? mxWant() : null) }; } };
  }
})();
