
/* =============================================================================
   Secteurs FanBoy (1 à 4) : rendu et son fidèles à la console portable LCD.
   (noms maison uniquement : « FanBoy », aucune marque reprise)
   Image : rémanence LCD, flash négatif, effets de raster sur le boss,
           contraste réglable, clignotement des sprites (option), cadre de
           console autour de l'écran sur PC, séquence de démarrage au secteur 1.
   Son   : puce sonore à 4 voies (2 carrés à rapport cyclique, onde 4 bits,
           bruit LFSR), enveloppes à 16 paliers, haut-parleur ou casque, et
           une musique composée pour la puce (un thème par secteur + boss).
   ========================================================================== */
(() => {
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const tr = o => o[LG()] || o.en || o.fr;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const O = S.opts;
  const def = (k, v) => { if (O[k] === undefined) O[k] = v; };
  def('gbGhost', 'low'); def('gbContrast', 'normal'); def('gbFlicker', 1); def('gbChip', 1); def('gbOut', 'speaker'); def('gbBezel', 1);
  const gbEra = () => (R.era | 0) === 0;
  /* pendant l'analyse du support, aucune musique : ni puce, ni piste */
  const calOn = () => !!(window.nvFluid && window.nvFluid.CAL && window.nvFluid.CAL.on);
  const playing = () => !calOn() && ['intro', 'play', 'pause', 'clear'].includes(G.state);

  /* ================================================================ IMAGE */
  const FX0 = { inv: 0, wave: 0, lastPh: null, frame: 0 };
  let prev = null, tmp = null;
  const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const _pal = applyGameBoyPalette;
  applyGameBoyPalette = function (buf) {
    _pal.apply(this, arguments);
    try {
      if (!buf || !buf.g || !buf.c) return;
      const g = buf.g, w = buf.c.width, h = buf.c.height;
      /* flash négatif : les quatre tons s'échangent (foncé ↔ clair) */
      if (FX0.inv > 0) {
        const pal = GB4.map(x => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]);
        const lp = ((TH.livery && TH.livery.gb) || []).map(x => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]);
        const img = g.getImageData(0, 0, w, h), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          for (const P of [pal, lp]) { let hit = -1; for (let k = 0; k < P.length; k++) if (d[i] === P[k][0] && d[i + 1] === P[k][1] && d[i + 2] === P[k][2]) { hit = k; break; }
            if (hit >= 0) { const q = P[P.length - 1 - hit]; d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; break; } }
        }
        g.putImageData(img, 0, 0);
      }
      /* molette de contraste */
      if (O.gbContrast === 'low') { g.save(); g.globalAlpha = .22; g.fillStyle = '#5a7a3a'; g.fillRect(0, 0, w, h); g.restore(); }
      else if (O.gbContrast === 'high') { g.save(); g.filter = 'contrast(1.28)'; g.drawImage(buf.c, 0, 0); g.restore(); }
      /* rémanence : l'image précédente persiste un instant sur l'écran lent */
      const k = O.gbGhost === 'strong' ? .55 : O.gbGhost === 'low' ? .34 : 0;
      if (!prev || prev.width !== w || prev.height !== h) { prev = mkc(w, h); prev.getContext('2d').drawImage(buf.c, 0, 0); }
      else if (k > 0 && G.state !== 'title') { g.save(); g.globalAlpha = k; g.drawImage(prev, 0, 0); g.restore(); }
      prev.getContext('2d').drawImage(buf.c, 0, 0);
      /* raster : lignes décalées en vague, à l'arrivée et à la chute du boss */
      if (FX0.wave > .03) {
        if (!tmp || tmp.width !== w || tmp.height !== h) tmp = mkc(w, h);
        const tg = tmp.getContext('2d'); tg.clearRect(0, 0, w, h); tg.drawImage(buf.c, 0, 0);
        const amp = FX0.wave * w * .018, t = performance.now() / 1000, step = Math.max(2, Math.round(h / 180));
        g.clearRect(0, 0, w, h);
        for (let y = 0; y < h; y += step) { const dx = Math.round(Math.sin(y * .045 + t * 9) * amp); g.drawImage(tmp, 0, y, w, step, dx, y, w, step); }
      }
    } catch (e) { }
  };
  /* déclencheurs */
  const _bomb = useBomb;
  useBomb = function () {
    const r = _bomb.apply(this, arguments);
    /* le flash négatif et le raster ne suivent que si la bombe est RÉELLEMENT
       partie : plus d'effet déclenché pendant l'intro ou l'écran d'analyse */
    if (r && gbEra()) { FX0.inv = .16; FX0.wave = Math.max(FX0.wave, .5); }
    return r;
  };
  const _die = bossDie;
  bossDie = function () { const r = _die.apply(this, arguments); if (gbEra()) { FX0.inv = .3; FX0.wave = 1; } return r; };
  const _upd = update;
  update = function (dt) {
    const r = _upd.apply(this, arguments);
    try {
      FX0.inv = Math.max(0, FX0.inv - dt); FX0.wave = Math.max(0, FX0.wave - dt * .7);
      const b = G.boss;
      if (gbEra() && b) {
        if (b.enter) FX0.wave = Math.max(FX0.wave, .55);
        if (b.dead) FX0.wave = Math.max(FX0.wave, .8);
        if (FX0.lastPh !== null && b.ph !== FX0.lastPh) { FX0.wave = 1; FX0.inv = .12; }
        FX0.lastPh = b.ph;
      } else FX0.lastPh = null;
    } catch (e) { }
    return r;
  };
  /* clignotement des sprites : au plus 5 objets par bande horizontale */
  let bands = null;
  const _actors = drawActorsDepthSorted;
  drawActorsDepthSorted = function () {
    FX0.frame++;
    bands = null;
    if (gbEra() && O.gbFlicker) { bands = new Map(); for (const en of G.enemies) { const k = Math.floor(en.y / 46); if (!bands.has(k)) bands.set(k, []); bands.get(k).push(en); } }
    return _actors.apply(this, arguments);
  };
  const _enemy = drawEnemyOne;
  drawEnemyOne = function (en) {
    if (bands) { const list = bands.get(Math.floor(en.y / 46)); if (list && list.length > 5) { const i = list.indexOf(en); if (((i + FX0.frame) % list.length) >= 5) return; } }
    return _enemy.apply(this, arguments);
  };

  /* séquence de démarrage (tous les secteurs FanBoy) : le logo descend, puis le « ding » */
  let dingDone = false;
  function drawBoot(t) {
    const x = PF.x, y = PF.y, w = PF.w, h = PF.h, gb = (TH.livery && TH.livery.gb) || GB4, s = t * INTRO_DUR;
    /* fondu de sortie : le boot se dissout en fin d'annonce sur le secteur
       prêt à décoller — plus de coupure nette entre les deux écrans */
    const fade = t > .84 ? cl(1 - (t - .84) / .16, 0, 1) : 1;
    ctx.save(); ctx.globalAlpha = fade;
    ctx.fillStyle = gb[3]; ctx.fillRect(x, y, w, h);
    const yy = y + h * .44 * Math.min(1, s / 2.1) - (s < 2.1 ? 0 : 0);
    const sz = Math.max(3, w / 95);
    hudText(ctx, 'NEO VANGUARD', x + w / 2, yy, gb[0], sz, { align: 'center' });
    if (s > 2.1) { ctx.globalAlpha = fade * cl((s - 2.1) / .3, 0, 1); hudText(ctx, '24 SECTEURS · 6 GÉNÉRATIONS', x + w / 2, yy + sz * 10, gb[1], Math.max(1, sz * .42), { align: 'center' }); }
    ctx.restore();
    if (s > 2.15 && !dingDone) { dingDone = true; try { chip.ding(); } catch (e) { } }
  }
  const _ban = drawEraBanner;
  drawEraBanner = function (t) {
    /* démarrage console sur TOUS les secteurs FanBoy (1 à 4) : l'écran de boot
       est exclusif — monde figé derrière, aucun HUD, aucune commande de jeu —
       comme une vraie cartouche qu'on lance. */
    if (gbEra() && G.state === 'intro') { if (t < .05) dingDone = false; return typeof hudOvRun === 'function' ? hudOvRun('banGB', drawBoot, [t]) : drawBoot(t); }
    return _ban.apply(this, arguments);
  };

  /* cadre de console autour de l'écran (PC) */
  function drawBezel() {
    const x = PF.x, y = PF.y, w = PF.w, h = PF.h, top = Math.max(18, h * .028), bot = Math.max(8, h * .012), side = Math.max(6, w * .018);
    const gb = (TH.livery && TH.livery.gb) || GB4;
    ctx.save();
    ctx.fillStyle = '#3c4048';
    ctx.fillRect(x, y, w, top); ctx.fillRect(x, y + h - bot, w, bot); ctx.fillRect(x, y, side, h); ctx.fillRect(x + w - side, y, side, h);
    const gl = ctx.createLinearGradient(x, y, x, y + top); gl.addColorStop(0, 'rgba(255,255,255,.08)'); gl.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = gl; ctx.fillRect(x, y, w, top);
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.strokeRect(x + side - 1, y + top - 1, w - side * 2 + 2, h - top - bot + 2);
    /* deux filets et l'inscription maison */
    const ly = y + top * .5;
    ctx.fillStyle = gb[2]; ctx.fillRect(x + side + 70, ly - 3, w * .16, 1.5);
    ctx.fillStyle = gb[1]; ctx.fillRect(x + side + 70, ly + 1, w * .16, 1.5);
    hudText(ctx, 'NEO VANGUARD · LCD 4 TONS', x + w - side - 8, ly - 5, '#c9ccd2', Math.max(1, top / 18), { align: 'right' });
    /* voyant d'alimentation */
    const on = .75 + .25 * Math.sin(performance.now() / 600);
    ctx.fillStyle = `rgba(255,40,40,${on})`; ctx.shadowColor = '#ff2828'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x + side + 22, ly, Math.max(2.5, top * .17), 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    hudText(ctx, 'POWER', x + side + 32, ly - 4, '#9aa0aa', Math.max(.8, top / 24), {});
    ctx.restore();
  }
  const _hud = drawHUD;
  drawHUD = function () {
    const r = _hud.apply(this, arguments);
    try { if (!window.NV_FANBOY_REFERENCE && !IS_TOUCH && O.gbBezel && gbEra() && playing()) { if (typeof hudOvRun === 'function') hudOvRun('gbBezel', drawBezel, []); else drawBezel(); } } catch (e) { }
    return r;
  };

  /* ================================================================== SON */
  const chip = { ready: false };
  function chipInit() {
    const A = Audio2; if (!A.ok || chip.ready) return A.ok;
    const c = A.ctx, sr = c.sampleRate;
    const pulse = d => { const n = 64, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * d); return c.createPeriodicWave(re, im); };
    chip.duty = { 12: pulse(.125), 25: pulse(.25), 50: pulse(.5), 75: pulse(.75) };
    /* onde 4 bits : 32 paliers, triangle un peu creusé comme les jeux d'époque */
    const tbl = []; for (let i = 0; i < 32; i++) tbl.push(Math.round((i < 16 ? i : 31 - i) * 15 / 15));
    const n = 16, re = new Float32Array(n + 1), im = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) { let a = 0, b = 0; for (let i = 0; i < 32; i++) { const v = tbl[i] / 7.5 - 1, ph = 2 * Math.PI * k * i / 32; a += v * Math.cos(ph); b += v * Math.sin(ph); } re[k] = a / 16; im[k] = b / 16; }
    chip.wave = c.createPeriodicWave(re, im);
    const lfsr = (bits) => { const len = bits === 7 ? 127 * 64 : 32767, buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0); let r = 0x7fff; for (let i = 0; i < len; i++) { const b = (r ^ (r >> 1)) & 1; r = (r >> 1) | (b << 14); if (bits === 7) r = (r & ~0x40) | (b << 6); d[i] = (r & 1) ? .9 : -.9; } return buf; };
    chip.n15 = lfsr(15); chip.n7 = lfsr(7);
    chip.ready = true; return true;
  }
  const quant = v => Math.round(cl(v, 0, 1) * 15) / 15;
  function env(g, t, peak, dur, attack) {
    /* enveloppe à 16 paliers, mise à jour 64 fois par seconde */
    const steps = Math.max(2, Math.round(dur * 64)), top = .32;
    g.gain.setValueAtTime(0, t);
    g.gain.setValueAtTime(quant(peak / top) * top, t + (attack || 0));
    for (let i = 1; i <= steps; i++) { const u = i / steps, v = peak * Math.pow(1 - u, 1.6); g.gain.setValueAtTime(quant(v / top) * top, t + (attack || 0) + u * dur); }
  }
  const panOf = p => O.gbOut === 'headphones' ? (p > .15 ? .85 : p < -.15 ? -.85 : 0) : 0;
  function gbVoice(t, o) {
    const A = Audio2, c = A.ctx, osc = c.createOscillator(), g = c.createGain();
    const f = o.f || 440, dur = o.dur || .1, type = o.type || 'square';
    if (type === 'triangle' || type === 'sine') osc.setPeriodicWave(chip.wave);
    else osc.setPeriodicWave(chip.duty[o.duty || (type === 'sawtooth' ? 12 : 25)] || chip.duty[25]);
    osc.frequency.setValueAtTime(f, t);
    if (o.f2) { const st = Math.max(2, Math.round(dur * 128)); for (let i = 1; i <= st; i++) osc.frequency.setValueAtTime(f * Math.pow(Math.max(20, o.f2) / f, i / st), t + dur * i / st); }
    if (o.vibrato) { const l = c.createOscillator(), lg = c.createGain(); l.type = 'triangle'; l.frequency.value = 5.6; lg.gain.value = f * o.vibrato; l.connect(lg); lg.connect(osc.frequency); l.start(t + Math.min(.12, dur * .4)); l.stop(t + dur + .05); }
    env(g, t, (o.vol || .2) * (type === 'triangle' || type === 'sine' ? 1.25 : 1), dur, o.attack ? Math.min(o.attack, .02) : 0);
    let node = osc; const p = panOf(o.pan || 0);
    if (p) { const pn = c.createStereoPanner(); pn.pan.value = p; osc.connect(pn); node = pn; }
    node.connect(g); g.connect(o.dest || A.sfxGain);
    osc.start(t); osc.stop(t + dur + .06); return osc;
  }
  function gbNoise(t, o) {
    const A = Audio2, c = A.ctx, src = c.createBufferSource(), g = c.createGain(), dur = o.dur || .2;
    src.buffer = (o.metal || (o.f || 0) > 5000) ? chip.n7 : chip.n15; src.loop = true;
    const r0 = cl((o.f || 1200) / 1800, .03, 6), r1 = cl((o.f2 || o.f || 1200) / 1800, .03, 6);
    src.playbackRate.setValueAtTime(r0, t);
    const st = Math.max(2, Math.round(dur * 64)); for (let i = 1; i <= st; i++) src.playbackRate.setValueAtTime(r0 * Math.pow(r1 / r0, i / st), t + dur * i / st);
    env(g, t, (o.vol || .25) * .8, dur, 0);
    let node = src; const p = panOf(o.pan || 0);
    if (p) { const pn = c.createStereoPanner(); pn.pan.value = p; src.connect(pn); node = pn; }
    node.connect(g); g.connect(o.dest || A.sfxGain);
    src.start(t, Math.random() * .2); src.stop(t + dur + .04);
  }
  const useChip = () => O.gbChip !== 0 && (Audio2.era | 0) === 0 && chipInit();
  const _voice = Audio2.voice, _noise = Audio2.noise;
  Audio2.voice = function (t, o) { if (useChip()) { try { return gbVoice(t, o || {}); } catch (e) { } } return _voice.apply(this, arguments); };
  Audio2.noise = function (t, o) { if (useChip()) { try { return gbNoise(t, o || {}); } catch (e) { } } return _noise.apply(this, arguments); };
  /* quelques effets typiques de la puce */
  const _sfx = Audio2.sfx;
  Audio2.sfx = function (name, opt) {
    if (useChip() && this.ok && !this.muted) {
      const t = this.ctx.currentTime + .002, d = this.sfxGain;
      if (name === 'pick' || name === 'coin') { gbVoice(t, { f: 988, dur: .06, duty: 50, vol: .16, dest: d }); gbVoice(t + .06, { f: 1319, dur: .22, duty: 50, vol: .16, dest: d }); return; }
      if (name === 'shoot') { gbVoice(t, { f: 1600, f2: 420, dur: .07, duty: 25, vol: .09, dest: d }); return; }
      if (name === 'explode') { const big = opt && opt.big; gbNoise(t, { f: big ? 900 : 1500, f2: big ? 90 : 240, dur: big ? .7 : .28, vol: big ? .34 : .22, dest: d }); return; }
      if (name === 'ehit') { gbVoice(t, { f: 520, f2: 300, dur: .05, duty: 12, vol: .07, dest: d }); return; }
      if (name === 'power') { [523, 659, 784, 1047].forEach((f, i) => gbVoice(t + i * .05, { f, dur: .08, duty: 50, vol: .12, dest: d })); return; }
    }
    return _sfx.apply(this, arguments);
  };
  chip.ding = () => { const A = Audio2; A.init(); A.unlock(); if (!A.ok || !chipInit()) return; const t = A.ctx.currentTime + .02; gbVoice(t, { f: 1046.5, dur: .07, duty: 50, vol: .2, dest: A.sfxGain }); gbVoice(t + .075, { f: 2093, dur: 1.1, duty: 50, vol: .2, dest: A.sfxGain }); };

  /* haut-parleur de console : son étroit, nasillard, léger souffle */
  let spk = null;
  function route() {
    const A = Audio2; if (!A.ok || !A.comp || !A.master) return;
    const want = O.gbChip !== 0 && O.gbOut !== 'headphones' && (A.era | 0) === 0;
    if (!!spk === want) return;
    try { A.comp.disconnect(); } catch (e) { }
    if (want) {
      const c = A.ctx, hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), pk = c.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 220; lp.type = 'lowpass'; lp.frequency.value = 4300; lp.Q.value = .8; pk.type = 'peaking'; pk.frequency.value = 1900; pk.gain.value = 4; pk.Q.value = 1;
      A.comp.connect(hp); hp.connect(pk); pk.connect(lp); lp.connect(A.master);
      const hiss = c.createBufferSource(); chipInit(); hiss.buffer = chip.n15; hiss.loop = true; hiss.playbackRate.value = 3.2;
      const hg = c.createGain(); hg.gain.value = .0035; hiss.connect(hg); hg.connect(lp); hiss.start();
      spk = { hp, lp, pk, hiss };
    } else {
      if (spk) { try { spk.hiss.stop(); } catch (e) { } }
      spk = null; A.comp.connect(A.master);
    }
  }
  window.nvFanboyRoute = route;
  const _eraFx = Audio2.applyEraFx;
  Audio2.applyEraFx = function () { const r = _eraFx.apply(this, arguments); try { route(); } catch (e) { } return r; };
  const _outMode = Audio2.applyOutputMode;
  Audio2.applyOutputMode = function () {
    const keep = O.audioMode;
    if ((this.era | 0) === 0 && O.gbChip !== 0) O.audioMode = O.gbOut === 'headphones' ? 'stereo' : 'mono';
    try { return _outMode.apply(this, arguments); } finally { O.audioMode = keep; }
  };

  /* ---------------------------------------------- musique pour la puce */
  const SONGS = [
    { bpm: 138, root: 57, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M'], [0, 'm'], [5, 'm'], [10, 'M'], [7, 'M']], seed: 11, lead: 50 },
    { bpm: 146, root: 55, prog: [[0, 'm'], [0, 'm'], [3, 'M'], [10, 'M'], [8, 'M'], [8, 'M'], [10, 'M'], [7, 'm']], seed: 23, lead: 25 },
    { bpm: 128, root: 52, prog: [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M'], [0, 'm'], [3, 'M'], [5, 'm'], [7, 'M']], seed: 37, lead: 50 },
    { bpm: 152, root: 50, prog: [[0, 'm'], [10, 'M'], [8, 'M'], [10, 'M'], [0, 'm'], [3, 'M'], [1, 'M'], [0, 'm']], seed: 53, lead: 25 }
  ];
  const BOSS = { bpm: 164, root: 52, prog: [[0, 'm'], [1, 'M'], [0, 'm'], [10, 'M'], [0, 'm'], [1, 'M'], [8, 'M'], [7, 'M']], seed: 71, lead: 50 };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const triad = q => q === 'M' ? [0, 4, 7] : [0, 3, 7];
  function rng(s) { return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  function compose(song) {
    if (song.notes) return song;
    const R0 = rng(song.seed), notes = [], RH = [
      [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0], [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
      [1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0], [1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]];
    let deg = 0;
    const motifs = [];
    for (let m = 0; m < 4; m++) {   /* quatre motifs d'une mesure, réutilisés deux fois : un thème qui se retient */
      const rh = RH[Math.floor(R0() * RH.length)], mot = [];
      for (let s = 0; s < 16; s++) { if (!rh[s]) { mot.push(null); continue; } deg = cl(deg + Math.round((R0() - .5) * 4), -2, 7); mot.push({ deg, len: rh.slice(s + 1).findIndex(x => x) + 1 || (16 - s) }); }
      motifs.push(mot);
    }
    for (let bar = 0; bar < 8; bar++) notes.push(motifs[[0, 1, 0, 2, 0, 1, 3, 2][bar]]);
    song.notes = notes; return song;
  }
  const SCALE = [0, 2, 3, 5, 7, 8, 10];
  const degToSemi = (deg, chordRoot) => { const o = Math.floor(deg / 7), k = ((deg % 7) + 7) % 7; return chordRoot + SCALE[k] + o * 12; };
  const GM = { step: 0, next: 0, key: null, on: false };
  function gmWant() {
    if (O.gbChip === 0 || (G.eraIdx | 0) !== 0 || !playing()) return null;
    if (G.phase === 'bossWarn') return 'silent';
    if (G.boss && !G.boss.dead && G.phase === 'boss') return 'boss';
    return 'song' + clamp((G.level | 0) - 1, 0, 3);
  }
  function gmSchedule(song, i, t, sd) {
    const A = Audio2, M = A.musicGain, bar = Math.floor(i / 16) % 8, st = i % 16;
    const [cr, q] = song.prog[bar], root = song.root + cr, tri = triad(q), isBoss = song === BOSS;
    /* voie 1 : mélodie, avec vibrato sur les notes tenues */
    const n = song.notes[bar][st];
    if (n) { const semi = degToSemi(n.deg, song.root + 12); gbVoice(t, { f: mf(semi), dur: sd * n.len * .95, duty: song.lead, vol: .13, dest: M, vibrato: n.len >= 3 ? .012 : 0, pan: -.5 }); }
    /* voie 2 : arpège rapide de l'accord (trois notes par double croche) */
    for (let k = 0; k < 3; k++) gbVoice(t + k * sd / 3, { f: mf(root + 12 + tri[(st + k) % 3]), dur: sd / 3 * .9, duty: 12, vol: .045, dest: M, pan: .5 });
    /* voie 3 : basse sur l'onde 4 bits */
    if (st % 2 === 0) { const b = st % 4 === 0 ? root - 12 : root - 12 + (st % 8 === 2 ? 12 : 7); gbVoice(t, { f: mf(b), dur: sd * 1.8, type: 'triangle', vol: .16, dest: M }); }
    /* voie 4 : batterie au bruit */
    const kick = isBoss ? st % 4 === 0 : (st === 0 || st === 8 || st === 10);
    if (kick) gbNoise(t, { f: 380, f2: 60, dur: .09, vol: .3, dest: M });
    if (st === 4 || st === 12) gbNoise(t, { f: 2400, f2: 900, dur: .12, vol: .22, dest: M });
    if (st % 2 === 1) gbNoise(t, { f: 9000, dur: .03, vol: .07, metal: true, dest: M, pan: .4 });
  }
  const _mtick = Audio2.musicTick;
  Audio2.musicTick = function () {
    const want = gmWant();
    if (!want) { GM.on = false; return _mtick.apply(this, arguments); }
    this.running = false;
    if (!this.ok || this.muted || !chipInit()) return;
    if (want === 'silent') { GM.key = want; return; }
    const song = compose(want === 'boss' ? BOSS : SONGS[+want.slice(4)]);
    const now = this.ctx.currentTime;
    if (GM.key !== want || !GM.on) { GM.key = want; GM.on = true; GM.step = 0; GM.next = now + .12; }
    const sd = 60 / song.bpm / 4;
    if (GM.next < now - .5) GM.next = now + .05;
    while (GM.next < now + .16) { gmSchedule(song, GM.step, GM.next, sd); GM.step = (GM.step + 1) % 128; GM.next += sd; }
  };
  /* la piste enregistrée se tait pendant que la puce joue, et reste tue
     pendant l'analyse du support (l'écran de mesure est silencieux) */
  if (typeof mxWant === 'function') { const _mw = mxWant; mxWant = function () { return (gmWant() || calOn()) ? null : _mw.apply(this, arguments); }; }
  /* et elle ne démarre même pas au-dessus : sur FanBoy, la puce sonore EST la
     musique du secteur — plus jamais deux musiques simultanées. */
  const _sm = Audio2.startMusic;
  Audio2.startMusic = function (e) {
    if ((e | 0) === 0 && O.gbChip !== 0) return;
    return _sm.apply(this, arguments);
  };

  /* ============================================================ OPTIONS */
  const L5 = (fr, en) => (LG() === 'fr' ? fr : en);
  function row(parent, label, hint, key, choices, after) {
    const d = document.createElement('div'); d.className = 'opt';
    const w = document.createElement('div'), lab = document.createElement('label'); lab.textContent = label;
    const h = document.createElement('span'); h.className = 'hint'; h.textContent = hint; lab.appendChild(h); w.appendChild(lab);
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    const sel = document.createElement('select'); sel.className = 'sw'; sel.style.maxWidth = 'min(100%,240px)';
    for (const [v, n] of choices) { const o = document.createElement('option'); o.value = String(v); o.textContent = n; sel.appendChild(o); }
    sel.value = String(O[key]);
    sel.onchange = () => { const v = sel.value; O[key] = /^\d+$/.test(v) ? +v : v; saveGame(); try { after && after(); } catch (e) { } try { Audio2.sfx('ui'); } catch (e) { } };
    ctl.appendChild(sel); d.append(w, ctl); parent.appendChild(d);
  }
  const _build = buildOptions;
  buildOptions = function () {
    const r = _build.apply(this, arguments);
    try {
      const body = document.querySelector('#optBody .opt-section-body'); if (!body) return r;
      const yes = L5('Oui', 'On'), no = L5('Non', 'Off');
      row(body, L5('Rémanence LCD', 'LCD ghosting'), L5('Secteurs FanBoy : les objets laissent une légère traînée, comme sur l’écran lent d’origine', 'FanBoy sectors: moving objects leave a faint trail, like the original slow screen'), 'gbGhost', [['off', no], ['low', L5('Légère', 'Light')], ['strong', L5('Forte', 'Strong')]]);
      row(body, L5('Contraste LCD', 'LCD contrast'), L5('Comme la molette sur le côté de la console', 'Like the wheel on the side of the console'), 'gbContrast', [['low', L5('Faible', 'Low')], ['normal', 'Normal'], ['high', L5('Fort', 'High')]]);
      row(body, L5('Clignotement des sprites', 'Sprite flicker'), L5('Au-delà de 5 ennemis sur une même ligne, ils clignotent comme sur la vraie console', 'Above 5 enemies on one line they flicker, as on the real console'), 'gbFlicker', [[0, no], [1, yes]]);
      if (!IS_TOUCH) row(body, L5('Cadre de console (PC)', 'Console frame (PC)'), L5('Coque noire NV-01, commandes réactives et cadre LED autour de l’écran FanBoy', 'Black NV-01 shell, reactive controls and LED frame around the FanBoy screen'), 'gbBezel', [[1, yes], [0, no]]);
      row(body, L5('Puce sonore FanBoy', 'FanBoy sound chip'), L5('Secteurs 1 à 4 : 4 voies (2 carrés, onde 4 bits, bruit) et une musique composée pour la puce', 'Sectors 1-4: 4 channels (2 pulses, 4-bit wave, noise) and music written for the chip'), 'gbChip', [[1, yes], [0, no]], () => { route(); Audio2.applyOutputMode(); });
      row(body, L5('Sortie sonore FanBoy', 'FanBoy audio output'), L5('Haut-parleur : son étroit et mono · Casque : stéréo séparée', 'Speaker: narrow mono sound · Headphones: hard-panned stereo'), 'gbOut', [['speaker', L5('Haut-parleur', 'Speaker')], ['headphones', L5('Casque', 'Headphones')]], () => { route(); Audio2.applyOutputMode(); });
    } catch (e) { }
    return r;
  };
})();
