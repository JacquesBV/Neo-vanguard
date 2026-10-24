
/* =============================================================================
   INSERT COIN · clin d'œil aux bornes d'arcade
   - Game over : façade de monnayeur, compte à rebours 9 → 0, on glisse la
     pièce dans la fente (téléphone) ou touche 5 / clic sur la fente (PC).
   - « Sueurs froides » : pièce insérée sur le dernier chiffre.
   - À deux : la touche 5 fait rentrer un pilote éliminé en pleine partie.
   - Écran titre : après 30 s sans rien toucher, la borne passe en démo.
   STAGES BONUS · entre deux générations (après les secteurs 4, 8, 12, 16, 20)
   - Casse la navette, Les barils, Le mur de briques.
   ========================================================================== */
(() => {
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const t5 = (fr, en, es, pt, ja) => ({ fr, en, es, pt, ja });
  const tr = o => o[LG()] || o.en || o.fr;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const IMG = n => { const i = new Image(); i.src = 'assets/bonus/' + n; return i; };
  const ART = { shuttle: IMG('shuttle.webp'), debris: IMG('debris.webp'), pad: IMG('pad-bg.webp'), owner: IMG('owner.webp'), barrel: IMG('barrel.webp'), conveyor: IMG('conveyor.webp'), brick: IMG('brick.webp') };
  const ok = i => i && i.complete && i.naturalWidth > 0;
  const sfx = (n, o) => { try { Audio2.sfx(n, o); } catch (e) { } };
  const T = {
    insert: t5('INSERT COIN', 'INSERT COIN', 'INSERT COIN', 'INSERT COIN', 'INSERT COIN'),
    sub: t5('CONTINUER ? GLISSE UNE PIÈCE DANS LA FENTE', 'CONTINUE? SLIDE A COIN INTO THE SLOT', '¿CONTINUAR? DESLIZA UNA MONEDA EN LA RANURA', 'CONTINUAR? DESLIZA UMA MOEDA NA RANHURA', 'コンティニュー？ コインを投入口へ'),
    wallet: t5('TES PIÈCES', 'YOUR COINS', 'TUS MONEDAS', 'AS TUAS MOEDAS', '所持コイン'),
    price: t5('1 CRÉ\u200bDIT = 3 COINS', '1 CRE\u200bDIT = 3 COINS', '1 CRÉ\u200bDITO = 3 COINS', '1 CRÉ\u200bDITO = 3 COINS', '1クレジット = 3コイン'),
    hintPc: t5('TOUCHE 5 · CLIC SUR LA FENTE · OU GLISSE LA PIÈCE', 'KEY 5 · CLICK THE SLOT · OR DRAG THE COIN', 'TECLA 5 · CLIC EN LA RANURA · O ARRASTRA', 'TECLA 5 · CLIQUE NA RANHURA · OU ARRASTA', '5キー · 投入口をクリック · ドラッグ'),
    hintTouch: t5('FAIS GLISSER LA PIÈCE JUSQU’À LA FENTE', 'DRAG THE COIN INTO THE SLOT', 'ARRASTRA LA MONEDA HASTA LA RANURA', 'ARRASTA A MOEDA ATÉ À RANHURA', 'コインを投入口までドラッグ'),
    credit: t5('CRÉ\u200bDIT 01', 'CRE\u200bDIT 01', 'CRÉ\u200bDITO 01', 'CRÉ\u200bDITO 01', 'クレジット 01'),
    skip: t5('ABANDONNER', 'GIVE UP', 'RENDIRSE', 'DESISTIR', 'あきらめる'),
    sweat: t5('SUEURS FROIDES ! Pièce insérée sur le dernier chiffre', 'COLD SWEAT! Coin inserted on the last second', '¡SUDOR FRÍO! Moneda en el último segundo', 'SUORES FRIOS! Moeda no último segundo', '冷や汗！ラスト1秒で投入'),
    challenger: t5('UN NOUVEAU PILOTE ENTRE EN JEU !', 'A NEW PILOT HAS ENTERED THE FIGHT!', '¡UN NUEVO PILOTO ENTRA EN JUEGO!', 'UM NOVO PILOTO ENTRA EM JOGO!', '新たなパイロットが参戦！'),
    p2wait: t5('JOUEUR 2 : APPUIE SUR 5 POUR REVENIR', 'PLAYER 2: PRESS 5 TO JOIN', 'JUGADOR 2: PULSA 5 PARA VOLVER', 'JOGADOR 2: CARREGA 5 PARA VOLTAR', 'P2：5キーで復帰'),
    attract1: t5('INSERT COIN', 'INSERT COIN', 'INSERT COIN', 'INSERT COIN', 'INSERT COIN'),
    attract2: t5('TOUCHE L’ÉCRAN OU APPUIE SUR UNE TOUCHE', 'TOUCH THE SCREEN OR PRESS ANY KEY', 'TOCA LA PANTALLA O PULSA UNA TECLA', 'TOCA NO ECRÃ OU CARREGA NUMA TECLA', '画面タッチまたは任意のキー'),
    hi: t5('MEILLEUR SCORE', 'HI-SCORE', 'RÉCORD', 'RECORDE', 'ハイスコア')
  };

  /* ====================================================== INSERT COIN */
  const box = document.createElement('div'); box.id = 'nvCoin';
  box.innerHTML = '<div class="ic-title"></div><div class="ic-sub"></div><div class="ic-row"><div class="ic-door"><div class="ic-slot"></div></div><div class="ic-cd">9</div></div>' +
    '<div class="ic-wallet"><div class="ic-coin" role="button" aria-label="coin"></div><div class="ic-wtxt"></div></div><div class="ic-hint"></div><button type="button" class="ic-skip"></button><div class="ic-credit"></div>';
  document.body.appendChild(box);
  const $q = s => box.querySelector(s), slot = $q('.ic-slot'), coin = $q('.ic-coin'), cd = $q('.ic-cd');
  let open = false, paid = false, lastSec = -1;
  function texts() {
    $q('.ic-title').textContent = tr(T.insert); $q('.ic-sub').textContent = tr(T.sub);
    $q('.ic-wtxt').innerHTML = tr(T.wallet) + ' <b>' + fmt(S.credits) + '</b><br>' + tr(T.price);
    $q('.ic-hint').textContent = tr(IS_TOUCH ? T.hintTouch : T.hintPc); $q('.ic-skip').textContent = tr(T.skip); $q('.ic-credit').textContent = tr(T.credit);
  }
  function beep(sec) {
    try { const A = Audio2; A.init(); if (!A.ok) return; const t = A.ctx.currentTime + .01; A.voice(t, { f: sec <= 3 ? 660 : 440, dur: .09, type: 'square', vol: .08 }); } catch (e) { }
  }
  function clack() {
    try { const A = Audio2; A.init(); if (!A.ok) return; const t = A.ctx.currentTime + .01;
      A.noise(t, { dur: .05, vol: .35, f: 5200, f2: 2600, type: 'bandpass', q: 2 });
      A.voice(t + .02, { f: 2400, f2: 1900, dur: .06, type: 'triangle', vol: .12 });
      A.noise(t + .2, { dur: .16, vol: .45, f: 700, f2: 120, type: 'lowpass' });
      A.voice(t + .2, { f: 110, f2: 60, dur: .16, type: 'sine', vol: .3 });
      A.voice(t + .55, { f: 988, dur: .08, type: 'square', vol: .1 }); A.voice(t + .63, { f: 1319, dur: .3, type: 'square', vol: .1 }); } catch (e) { }
  }
  function show() {
    if (open) return; open = true; paid = false; lastSec = -1; box.classList.remove('paid'); texts(); box.classList.add('on');
    coin.className = 'ic-coin'; coin.style.cssText = '';
  }
  function hide() { open = false; box.classList.remove('on', 'paid'); coin.className = 'ic-coin'; coin.style.cssText = ''; }
  function insert(fromRect) {
    if (!open || paid || !(G.contT > 0) || S.credits < CONTINUE_COST) return;
    paid = true;
    const last = Math.ceil(G.contT) <= 1;
    const r0 = fromRect || coin.getBoundingClientRect(), rs = slot.getBoundingClientRect();
    coin.className = 'ic-coin fly'; coin.style.left = r0.left + 'px'; coin.style.top = r0.top + 'px'; coin.style.width = r0.width + 'px'; coin.style.height = r0.height + 'px';
    void coin.offsetWidth;
    coin.style.left = (rs.left + rs.width / 2 - r0.width / 2) + 'px'; coin.style.top = (rs.top + rs.height / 2 - r0.height / 2) + 'px';
    clack();
    setTimeout(() => { coin.classList.add('gone'); box.classList.add('paid'); }, 360);
    setTimeout(() => {
      hide(); doContinue();
      if (last) { S.coinSweat = 1; saveGame(); toast(tr(T.sweat)); }
    }, 1150);
  }
  slot.addEventListener('click', () => insert());
  $q('.ic-skip').addEventListener('click', () => { G.contT = 0; try { continueUi(); } catch (e) { } hide(); });
  /* glisser la pièce */
  let drag = null;
  coin.addEventListener('pointerdown', e => {
    if (!open || paid) return; e.preventDefault();
    const r = coin.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    coin.classList.add('drag'); coin.style.width = r.width + 'px'; coin.style.height = r.height + 'px'; coin.style.left = r.left + 'px'; coin.style.top = r.top + 'px';
    try { coin.setPointerCapture(e.pointerId); } catch (err) { }
  });
  const near = (x, y) => { const s = slot.getBoundingClientRect(), m = 40; return x > s.left - m && x < s.right + m && y > s.top - m && y < s.bottom + m; };
  coin.addEventListener('pointermove', e => {
    if (!drag) return; coin.style.left = (e.clientX - drag.dx) + 'px'; coin.style.top = (e.clientY - drag.dy) + 'px';
    slot.classList.toggle('hot', near(e.clientX, e.clientY));
  });
  const drop = e => {
    if (!drag) return; const d = drag; drag = null; slot.classList.remove('hot');
    if (near(e.clientX, e.clientY)) { const r = coin.getBoundingClientRect(); coin.classList.remove('drag'); insert(r); }
    else { coin.className = 'ic-coin'; coin.style.cssText = ''; }
  };
  coin.addEventListener('pointerup', drop); coin.addEventListener('pointercancel', drop);
  /* synchronisation avec le « continuer » du jeu */
  const _ui = continueUi;
  continueUi = function () {
    const r = _ui.apply(this, arguments);
    try {
      const overOn = document.getElementById('scr-over') && document.getElementById('scr-over').classList.contains('on');
      const can = G.contT > 0 && S.credits >= CONTINUE_COST && G.state === 'over';
      if (can && (overOn || G.contT < CONTINUE_TIME - .3)) show();
      if (open && !paid) {
        const sec = Math.max(0, Math.ceil(G.contT));
        cd.textContent = sec; cd.classList.toggle('low', sec <= 3);
        if (sec !== lastSec) { lastSec = sec; if (sec > 0) beep(sec); }
        if (!can) hide();
      }
    } catch (e) { }
    return r;
  };
  const _arm = continueArm;
  continueArm = function () { const r = _arm.apply(this, arguments); try { continueUi(); } catch (e) { } return r; };

  /* nouveau pilote (à deux) */
  const ch = document.createElement('div'); ch.id = 'nvChallenger'; ch.innerHTML = '<span></span>'; document.body.appendChild(ch);
  function challenger() {
    if (!G.twoP || G.state !== 'play' || !G.players) return false;
    const P = G.players.find(p => p && p.out); if (!P) return false;
    if (S.credits < CONTINUE_COST) { toast(tr(T.price)); return true; }
    S.credits -= CONTINUE_COST; saveGame();
    P.out = false; P.lives = 1; P.alive = true; P.hp = P.maxHp; P.inv = 3.5; P.shield = Math.max(P.shield | 0, 1);
    P.x = L_W * (P.id === 1 ? .38 : .62); P.y = L_H - 130;
    ch.querySelector('span').textContent = tr(T.challenger); ch.classList.remove('on'); void ch.offsetWidth; ch.classList.add('on');
    setTimeout(() => ch.classList.remove('on'), 2200);
    FX.stop(.9); FX.addFlash(.6, '#ffffff'); FX.addShake(10); clack(); sfx('alert');
    return true;
  }
  let p2HintT = 0;
  const _upd = update;
  update = function (dt) {
    const r = _upd.apply(this, arguments);
    try {
      if (G.twoP && G.state === 'play' && G.players && G.players.some(p => p.out) && G.players.some(p => !p.out)) {
        p2HintT -= dt; if (p2HintT <= 0) { p2HintT = 6; const P = G.players.find(p => !p.out); popText(L_W / 2, L_H * .55, tr(T.p2wait), '#ffd166', 8); }
      }
    } catch (e) { }
    return r;
  };

  /* écran titre : la borne passe en démonstration */
  const at = document.createElement('div'); at.id = 'nvAttract';
  at.innerHTML = '<div class="a-logo">NEO VANGUARD</div><div class="a-title"></div><div class="a-sub a-hi"></div><div class="a-sub a-tip"></div>';
  document.body.appendChild(at);
  let idle = 0, attract = false, raf = 0;
  const titleOn = () => G.state === 'title' && document.getElementById('scr-title') && document.getElementById('scr-title').classList.contains('on') && !document.querySelector('.screen.dim.on') && !document.querySelector('#nvGate:not(.off)');
  function startAttract() {
    attract = true; document.body.classList.add('nv-attract');
    at.querySelector('.a-title').textContent = tr(T.attract1); at.querySelector('.a-tip').textContent = tr(T.attract2);
    at.querySelector('.a-hi').textContent = tr(T.hi) + '  ' + fmt(S.best | 0);
    const loop = () => { if (!attract) return; sceneDirty = true; raf = requestAnimationFrame(loop); }; loop();
  }
  function stopAttract() { attract = false; cancelAnimationFrame(raf); document.body.classList.remove('nv-attract'); idle = 0; sceneDirty = true; }
  setInterval(() => { if (attract) { if (!titleOn()) stopAttract(); return; } if (titleOn() && !document.hidden) { idle += 1; if (idle >= 30) startAttract(); } else idle = 0; }, 1000);
  const wake = e => { if (attract) { stopAttract(); if (e && e.cancelable) { e.preventDefault(); e.stopImmediatePropagation(); } } idle = 0; };
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, wake, { capture: true, passive: false });
  for (const ev of ['keyup', 'pointerup', 'mousemove']) addEventListener(ev, () => { if (attract) stopAttract(); idle = 0; }, { capture: true, passive: true });

  /* touche 5 : la touche « pièce » des bornes */
  addEventListener('keydown', e => {
    if (e.key !== '5' || e.repeat) return;
    const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA') return;
    if (open) { e.preventDefault(); insert(); return; }
    if (challenger()) e.preventDefault();
  }, true);

  /* ====================================================== STAGES BONUS */
  const B = {
    title: t5('STAGE BONUS', 'BONUS STAGE', 'FASE DE BONUS', 'FASE BÓNUS', 'ボーナスステージ'),
    shuttle: t5('CASSE LA NAVETTE !', 'SMASH THE SHUTTLE!', '¡DESTROZA LA NAVE!', 'DESTRÓI A NAVE!', 'シャトルを壊せ！'),
    shuttleTip: t5('La navette de luxe d’un amiral de VORAX. Réduis-la en miettes !', 'A VORAX admiral’s luxury shuttle. Smash it to pieces!', 'La nave de lujo de un almirante de VORAX. ¡Hazla añicos!', 'A nave de luxo de um almirante de VORAX. Desfá-la em pedaços!', 'ヴォラックス提督の高級シャトル。粉々にしろ！'),
    barrels: t5('LES BARILS !', 'THE BARRELS!', '¡LOS BARRILES!', 'OS BARRIS!', 'バレル！'),
    barrelsTip: t5('Détruis les barils avant qu’ils quittent le tapis roulant.', 'Destroy the barrels before they leave the conveyor.', 'Destruye los barriles antes de que salgan de la cinta.', 'Destrói os barris antes de saírem do tapete.', 'コンベアから落ちる前に壊せ。'),
    wall: t5('LE MUR DE BRIQUES !', 'THE BRICK WALL!', '¡EL MURO DE LADRILLOS!', 'O MURO DE TIJOLOS!', 'レンガの壁！'),
    wallTip: t5('Perce tout le mur blindé avant la fin du temps.', 'Break through the whole armoured wall in time.', 'Rompe todo el muro blindado a tiempo.', 'Rompe todo o muro blindado a tempo.', '時間内に装甲壁を全部壊せ。'),
    perfect: t5('PARFAIT !', 'PERFECT!', '¡PERFECTO!', 'PERFEITO!', 'パーフェクト！'),
    time: t5('TEMPS', 'TIME', 'TIEMPO', 'TEMPO', 'タイム'),
    bonus: t5('BONUS', 'BONUS', 'BONUS', 'BÓNUS', 'ボーナス'),
    owner: [t5('Ma navette… MA NAVETTE ! Trois ans de solde !', 'My shuttle… MY SHUTTLE! Three years of pay!', '¡Mi nave… MI NAVE! ¡Tres años de sueldo!', 'A minha nave… A MINHA NAVE! Três anos de soldo!', '俺のシャトル…俺のシャトルが！給料三年分！'),
      t5('Elle n’avait même pas fini le rodage…', 'It wasn’t even run in yet…', 'Ni siquiera estaba rodada…', 'Nem sequer estava rodada…', 'まだ慣らし運転中だったのに…'),
      t5('VORAX va me retirer ma casquette…', 'VORAX is going to take my cap…', 'VORAX me va a quitar la gorra…', 'O VORAX vai tirar-me o boné…', 'ヴォラックスに帽子を取り上げられる…')],
    destroyed: t5('DÉTRUITS', 'DESTROYED', 'DESTRUIDOS', 'DESTRUÍDOS', '破壊')
  };
  const KINDS = { 4: 'shuttle', 8: 'barrels', 12: 'wall', 16: 'shuttle', 20: 'barrels' };
  const DUR = 30;
  let BS = null;
  const on = () => !!(BS && G.phase === 'nvBonus');
  function begin(kind, lv) {
    hideScreens(); G.state = 'play'; G.phase = 'nvBonus';
    G.enemies.length = 0; G.ebullets.length = 0; G.pickups.length = 0; G.beams.length = 0; G.boss = null; G.props.length = 0;
    try { decorReset(); } catch (e) { }
    for (const P of G.players || []) if (P && !P.out) { P.alive = true; P.inv = 1; P.x = L_W / 2 + (G.players.length > 1 ? (P.id === 1 ? -40 : 40) : 0); P.y = L_H - 130; }
    const dm = (G.stats && G.stats.dmgMul) || 1;
    BS = { kind, lv, t: 0, stage: 'intro', time: DUR, debris: [], flash: 0, shake: 0, score0: G.score | 0, perfect: false, bonus: 0, endT: 0, ownerLine: tr(B.owner[Math.floor(Math.random() * 3)]) };
    if (kind === 'shuttle') Object.assign(BS, { hp: Math.round((130 + lv * 5) * dm), max: 0, frame: 0, x: L_W / 2, y: 300 });
    if (kind === 'barrels') Object.assign(BS, { list: [], spawnT: .3, made: 0, killed: 0, missed: 0, total: 26, scroll: 0 });
    if (kind === 'wall') {
      const cols = 5, rows = 4, w = L_W / cols, h = w * 188 / 240, hp = Math.max(3, Math.round(5 * dm));
      BS.bricks = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) BS.bricks.push({ x: w * c + w / 2, y: 240 + r * h, w, h, hp, max: hp, burst: 0, dead: false, flash: 0 });
    }
    if (BS.hp) BS.max = BS.hp;
    try { radioClear(); } catch (e) { }
    sfx('alert'); FX.addFlash(.4, '#ffffff');
  }
  const _next = startNextLevel;
  startNextLevel = function () {
    const lv = G.level | 0, kind = KINDS[lv];
    G._bonusDone = G._bonusDone || {};
    if (kind && !G._bonusDone[lv] && !G.daily && !G.netOnline && G.state !== 'title') { G._bonusDone[lv] = 1; begin(kind, lv); return; }
    return _next.apply(this, arguments);
  };
  function finish() { BS = null; G.phase = 'clear'; G.state = 'clear'; startNextLevel(); }
  function addDebris(x, y, n, spd) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (spd || 220) * (.4 + Math.random() * .8); BS.debris.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, r: Math.random() * 6, vr: (Math.random() - .5) * 10, f: Math.floor(Math.random() * 12), s: 26 + Math.random() * 22, life: 1.4 + Math.random() }); }
  }
  function hits(test, onHit) {
    for (let i = G.bullets.length - 1; i >= 0; i--) { const bu = G.bullets[i]; const r = test(bu); if (!r) continue; onHit(bu, r); if (!bu.pierce) G.bullets.splice(i, 1); }
  }
  function endStage(perfect) {
    if (BS.stage === 'end') return;
    BS.stage = 'end'; BS.endT = 0; BS.perfect = perfect;
    let bonus = 0;
    if (BS.kind === 'shuttle') bonus = Math.round((1 - Math.max(0, BS.hp) / BS.max) * 200 + (perfect ? 300 + BS.time * 12 : 0));
    else if (BS.kind === 'barrels') bonus = BS.killed * 10 + (perfect ? 300 : 0);
    else { const d = BS.bricks.filter(b => b.dead).length; bonus = d * 12 + (perfect ? 300 + BS.time * 12 : 0); }
    BS.bonus = bonus; G.credits = (G.credits | 0) + bonus; G.runCredits = (G.runCredits | 0) + bonus;
    addScore && addScore(G.player, bonus * 20);
    sfx(perfect ? 'levelup' : 'power'); FX.addFlash(.5, perfect ? '#fff4c0' : '#ffffff');
    G.bullets.length = 0;
  }
  function bonusUpdate(dt) {
    const S0 = BS; S0.t += dt; S0.flash = Math.max(0, S0.flash - dt * 4); S0.shake = Math.max(0, S0.shake - dt * 20);
    for (const P of G.players || []) if (P && !P.out) { P.inv = Math.max(P.inv || 0, .3); if (S0.stage !== 'play') { P.y += (L_H - 130 - P.y) * Math.min(1, dt * 2); } }
    for (const d of S0.debris) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 420 * dt; d.r += d.vr * dt; d.life -= dt; }
    S0.debris = S0.debris.filter(d => d.life > 0 && d.y < L_H + 60);
    if (S0.stage === 'intro') { G.bullets.length = 0; if (S0.t > 2.2) { S0.stage = 'play'; S0.t = 0; sfx('alert'); } return; }
    if (S0.stage === 'end') { S0.endT += dt; G.bullets.length = 0; if (S0.endT > (S0.kind === 'shuttle' ? 5 : 3.6)) finish(); return; }
    S0.time = Math.max(0, DUR - S0.t);
    if (S0.kind === 'shuttle') {
      hits(bu => Math.pow((bu.x - S0.x) / 120, 2) + Math.pow((bu.y - S0.y) / 150, 2) < 1, bu => {
        S0.hp -= bu.dmg || 1; S0.flash = .5; addScore && addScore(G.player, 10);
        spawnPart({ x: bu.x, y: bu.y, vx: (Math.random() - .5) * 160, vy: -Math.random() * 160, life: .25, col: Math.random() < .5 ? '#ffd27a' : '#ffffff', size: 3, glow: true });
        if (Math.random() < .06) addDebris(bu.x, bu.y, 1, 160);
        const f = cl(Math.floor((1 - Math.max(0, S0.hp) / S0.max) * 5), 0, 5);
        if (f > S0.frame) { S0.frame = f; S0.shake = 8; FX.addShake(8); sfx('explode', { big: f >= 4 }); addDebris(S0.x + (Math.random() - .5) * 120, S0.y + (Math.random() - .5) * 160, 5 + f, 300); popText(S0.x, S0.y - 170, '+' + (f * 500), '#ffd166', 10); addScore && addScore(G.player, f * 500); }
        else if (Math.random() < .25) sfx('ehit');
      });
      if (S0.hp <= 0) { S0.frame = 5; addDebris(S0.x, S0.y, 18, 420); FX.addShake(18); sfx('explode', { big: true }); explode(S0.x, S0.y, 3, '#ff9a3c', '#ffe6b0'); endStage(true); }
      else if (S0.time <= 0) endStage(false);
    } else if (S0.kind === 'barrels') {
      const speed = 120 + Math.min(1, S0.t / DUR) * 110; S0.scroll += speed * dt;
      S0.spawnT -= dt;
      if (S0.spawnT <= 0 && S0.made < S0.total) { S0.spawnT = Math.max(.55, 1.2 - S0.t * .025); S0.made++; const lanes = [.4, .5, .6]; S0.list.push({ x: L_W * lanes[Math.floor(Math.random() * 3)] + (Math.random() - .5) * 14, y: -50, hp: 4, burst: 0, flash: 0, spin: (Math.random() - .5) * .6, a: 0 }); }
      for (const b of S0.list) { if (b.burst > 0) { b.burst -= dt; continue; } b.y += speed * dt; b.a += b.spin * dt; b.flash = Math.max(0, b.flash - dt * 6); if (b.y > L_H - 30 && !b.gone) { b.gone = true; S0.missed++; sfx('back'); popText(b.x, L_H - 80, 'RATÉ', '#ff6b7b', 9); } }
      hits(bu => S0.list.find(b => !b.gone && b.burst <= 0 && b.hp > 0 && b.y > 20 && Math.hypot(bu.x - b.x, bu.y - b.y) < 36), (bu, b) => {
        b.hp -= 1; b.flash = .5; sfx('ehit');
        if (b.hp <= 0) { b.burst = .35; S0.killed++; addScore && addScore(G.player, 300); popText(b.x, b.y - 30, '+300', '#ffd166', 8); spawnPart({ x: b.x, y: b.y, vx: 0, vy: -40, life: .4, col: '#c27bff', size: 16, glow: true }); for (let k = 0; k < 8; k++) spawnPart({ x: b.x, y: b.y, vx: (Math.random() - .5) * 300, vy: (Math.random() - .5) * 300, life: .5, col: k % 2 ? '#c27bff' : '#ffd166', size: 4, glow: true }); sfx('explode'); }
      });
      S0.list = S0.list.filter(b => !b.gone && !(b.hp <= 0 && b.burst <= 0));
      const left = S0.total - S0.made + S0.list.length;
      if ((S0.made >= S0.total && !S0.list.length) || S0.time <= 0) endStage(S0.missed === 0 && S0.killed >= S0.total);
      void left;
    } else {
      hits(bu => S0.bricks.find(b => !b.dead && b.burst <= 0 && Math.abs(bu.x - b.x) < b.w / 2 && Math.abs(bu.y - b.y) < b.h / 2), (bu, b) => {
        b.hp -= bu.dmg || 1; b.flash = .5; sfx('ehit');
        spawnPart({ x: bu.x, y: b.y + b.h / 2, vx: (Math.random() - .5) * 140, vy: Math.random() * 120, life: .3, col: '#cfd6e6', size: 3 });
        if (b.hp <= 0) { b.burst = .3; addScore && addScore(G.player, 200); popText(b.x, b.y, '+200', '#ffd166', 8); for (let k = 0; k < 10; k++) spawnPart({ x: b.x, y: b.y, vx: (Math.random() - .5) * 320, vy: (Math.random() - .5) * 260, life: .5, col: k % 3 ? '#9aa0aa' : '#c27bff', size: 5, glow: k % 3 === 0 }); sfx('explode'); FX.addShake(4); }
      });
      for (const b of S0.bricks) if (b.burst > 0) { b.burst -= dt; if (b.burst <= 0) b.dead = true; } else b.flash = Math.max(0, b.flash - dt * 6);
      if (S0.bricks.every(b => b.dead)) endStage(true); else if (S0.time <= 0) endStage(false);
    }
  }
  const _flow = updateLevelFlow;
  updateLevelFlow = function (dt) { if (on()) { bonusUpdate(dt); return; } return _flow.apply(this, arguments); };
  const _bomb = useBomb;
  useBomb = function () { if (on()) return; return _bomb.apply(this, arguments); };
  const _say = radioSay;
  radioSay = function () { if (on()) return; return _say.apply(this, arguments); };

  /* ------------------------------------------------------------ dessin */
  function cover(g, K, img, sy) {
    const W = L_W * K, H = L_H * K, s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s, x = (W - w) / 2;
    if (sy === undefined) { g.drawImage(img, x, (H - h) / 2, w, h); return; }
    const off = ((sy * K) % h + h) % h;
    for (let y = off - h; y < H; y += h) g.drawImage(img, x, y, w, h);
  }
  function cell(g, K, img, n, i, x, y, w, rot, alpha, flash) {
    const cw = img.naturalWidth / n, chh = img.naturalHeight, h = w * chh / cw;
    g.save(); g.translate(x * K, y * K); if (rot) g.rotate(rot); g.globalAlpha *= alpha === undefined ? 1 : alpha;
    g.drawImage(img, i * cw, 0, cw, chh, -w / 2 * K, -h / 2 * K, w * K, h * K);
    if (flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, flash) * .5; g.drawImage(img, i * cw, 0, cw, chh, -w / 2 * K, -h / 2 * K, w * K, h * K); }
    g.restore();
  }
  function drawBonus() {
    useBuf(R.bufNear); const g = PAINT.g, K = PAINT.K, S0 = BS;
    if (S0.kind === 'barrels') { if (ok(ART.conveyor)) cover(g, K, ART.conveyor, S0.scroll); }
    else if (ok(ART.pad)) cover(g, K, ART.pad);
    g.save(); g.fillStyle = (R.era | 0) === 0 ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.18)'; g.fillRect(0, 0, L_W * K, L_H * K); g.restore();
    const jx = S0.shake ? (Math.random() - .5) * S0.shake : 0, jy = S0.shake ? (Math.random() - .5) * S0.shake : 0;
    if (S0.kind === 'shuttle' && ok(ART.shuttle)) {
      g.save(); g.globalAlpha = .4; g.fillStyle = '#000'; g.beginPath(); g.ellipse((S0.x + 10) * K, (S0.y + 20) * K, 110 * K, 150 * K, 0, 0, Math.PI * 2); g.fill(); g.restore();
      cell(g, K, ART.shuttle, 6, S0.frame, S0.x + jx, S0.y + jy, 330, 0, 1, S0.flash);
    }
    if (S0.kind === 'barrels' && ok(ART.barrel)) for (const b of S0.list) { const f = b.burst > 0 ? 3 : cl(4 - b.hp, 0, 2); cell(g, K, ART.barrel, 4, f, b.x, b.y, b.burst > 0 ? 96 : 76, b.a, b.burst > 0 ? Math.min(1, b.burst / .2) : 1, b.flash); }
    if (S0.kind === 'wall' && ok(ART.brick)) for (const b of S0.bricks) { if (b.dead) continue; const f = b.burst > 0 ? 3 : cl(Math.floor((1 - b.hp / b.max) * 3), 0, 2); cell(g, K, ART.brick, 4, f, b.x, b.y, b.w + 1, 0, b.burst > 0 ? Math.min(1, b.burst / .2) : 1, b.flash); }
    if (ok(ART.debris)) for (const d of S0.debris) cell(g, K, ART.debris, 12, d.f, d.x, d.y, d.s, d.r, Math.min(1, d.life));
    if (S0.kind === 'shuttle' && S0.stage === 'end') {
      const u = cl(S0.endT / .6, 0, 1), ox = L_W / 2, oy = L_H * .62 + (1 - u) * 300;
      if (ok(ART.owner) && S0.endT > .4) cell(g, K, ART.owner, 1, 0, ox, oy + Math.sin(S0.endT * 18) * 2, 300, 0, 1);
    }
  }
  const _props = drawProps;
  drawProps = function () { if (on()) { try { drawBonus(); } catch (e) { } return; } return _props.apply(this, arguments); };
  function hudBonus() {
    const S0 = BS, x = PF.x, y = PF.y, w = PF.w, h = PF.h, k = w / L_W, big = Math.max(2, w / 160), mid = Math.max(1.3, w / 260), sm = Math.max(1, w / 380);
    const name = tr(S0.kind === 'shuttle' ? B.shuttle : S0.kind === 'barrels' ? B.barrels : B.wall);
    ctx.save();
    if (S0.stage === 'intro') {
      ctx.globalAlpha = .7; ctx.fillStyle = '#000'; ctx.fillRect(x, y + h * .3, w, h * .22); ctx.globalAlpha = 1;
      hudText(ctx, tr(B.title), x + w / 2, y + h * .32, '#ffd166', big, { align: 'center', glow: '#ff9a2e' });
      hudText(ctx, name, x + w / 2, y + h * .32 + big * 10, '#ffffff', mid, { align: 'center', glow: '#ff2a4a' });
      hudText(ctx, tr(S0.kind === 'shuttle' ? B.shuttleTip : S0.kind === 'barrels' ? B.barrelsTip : B.wallTip), x + w / 2, y + h * .32 + big * 10 + mid * 12, '#ffd9e0', sm, { align: 'center' });
    } else {
      const tt = Math.ceil(S0.time);
      const ty = y + h * .19;
      hudText(ctx, tr(B.time), x + w / 2, ty, '#ffd9a0', sm, { align: 'center' });
      hudText(ctx, String(tt).padStart(2, '0'), x + w / 2, ty + sm * 10, tt <= 5 && S0.stage === 'play' ? '#ff5468' : '#ffffff', big, { align: 'center', glow: '#ff2a4a' });
      let info = '';
      if (S0.kind === 'shuttle') info = Math.round((1 - Math.max(0, S0.hp) / S0.max) * 100) + '%';
      else if (S0.kind === 'barrels') info = tr(B.destroyed) + ' ' + S0.killed + '/' + S0.total;
      else info = tr(B.destroyed) + ' ' + S0.bricks.filter(b => b.dead).length + '/' + S0.bricks.length;
      hudText(ctx, info, x + w / 2, ty + sm * 10 + big * 9, '#ffd166', mid, { align: 'center' });
      if (S0.stage === 'end') {
        const yy = y + h * (S0.kind === 'shuttle' ? .26 : .4);
        ctx.globalAlpha = .72; ctx.fillStyle = '#000'; ctx.fillRect(x, yy - 8, w, big * 9 + mid * 24); ctx.globalAlpha = 1;
        if (S0.perfect) hudText(ctx, tr(B.perfect), x + w / 2, yy, '#7dffb0', big * 1.2, { align: 'center', glow: '#2bff8a' });
        else hudText(ctx, name, x + w / 2, yy, '#ffffff', mid, { align: 'center' });
        hudText(ctx, tr(B.bonus) + ' +' + fmt(S0.bonus) + ' COINS', x + w / 2, yy + big * 11, '#ffd166', mid, { align: 'center', glow: '#ff9a2e' });
        if (S0.kind === 'shuttle' && S0.endT > .9) {
          const by = y + h * .9; ctx.globalAlpha = .8; ctx.fillStyle = '#12040a'; ctx.fillRect(x + w * .06, by - 6, w * .88, sm * 26); ctx.globalAlpha = 1;
          hudText(ctx, '« ' + S0.ownerLine + ' »', x + w / 2, by, '#ffe3e6', sm, { align: 'center' });
        }
      }
    }
    ctx.restore();
  }
  const _hud = drawHUD;
  drawHUD = function () { const r = _hud.apply(this, arguments); if (on()) { try { if (typeof hudOvRun === 'function') hudOvRun('nvBonusHud', hudBonus, []); else hudBonus(); } catch (e) { } } return r; };
  window.nvBonus = { begin: (k, lv) => begin(k, lv || G.level), get: () => BS };
})();
