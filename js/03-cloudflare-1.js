(function(){function c(){var b=a.contentDocument||(a.contentWindow&&a.contentWindow.document);if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'a4bd9b21c941d646',t:'MTc5MjIyMjMxMA=='};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
/* ---- 99_ship0.js ---- */

/* =========================================================================
   VAISSEAU DU JOUEUR — ÈRE GAME BOY
   Redessiné à la main, pixel par pixel, d'après le chasseur de l'écran
   titre : nez long et effilé, bande rouge en chevron qui enserre la verrière,
   cockpit cerclé, grandes ailes en flèche, deux canons jumelés sous chaque
   aile, nacelles avec prises d'air, tuyère centrale.
   Seize pixels de large sur vingt-deux de haut, quatre teintes de la livrée :
     0 = contour / verrière sombre     1 = bande rouge, prises d'air
     2 = coque dans l'ombre            3 = coque éclairée
   Chaque chaîne est la moitié gauche d'une rangée (miroir à droite).
   ========================================================================= */
(function () {
  'use strict';
  if (typeof bakeSprite !== 'function' || typeof spriteBox !== 'function') return;
  var HALF = [
    '.......0',
    '......03',
    '......03',
    '......03',
    '.....023',
    '.....023',
    '.....013',
    '...01100',
    '...03101',
    '..203103',
    '2.003101',
    '2.003101',
    '2.003100',
    '2.003133',
    '2.023133',
    '.0223133',
    '02223133',
    '02222233',
    '02222233',
    '.0222033',
    '...00103',
    '.....0.0'
  ];
  var SW = 16, SH = HALF.length;
  var SHIP0_BOX = { w: SW * 4, h: SH * 4 };             /* 4 pixels logiques par pixel d'art */
  var CACHE = {};
  function isShip0(id) { return id === 'falcon' && typeof R !== 'undefined' && R.era === 0; }

  var _box = spriteBox;
  spriteBox = function (id) { return isShip0(id) ? SHIP0_BOX : _box(id); };

  var _bake = bakeSprite;
  bakeSprite = function (id, era, kind, hue, sat, light, frame) {
    if (id !== 'falcon' || era !== 0 || kind !== 'player') return _bake(id, era, kind, hue, sat, light, frame);
    var gb = (typeof TH !== 'undefined' && TH.livery && TH.livery.gb) || ['#0F2E1C', '#2f5c27', '#6f8a1f', '#a3ad35'];
    var flashCol = (typeof hitFxColor === 'function') ? hitFxColor(0) : gb[3];
    var key = gb.join('|') + '|' + flashCol;
    var rec = CACHE[key];
    if (rec) return rec;
    var c = document.createElement('canvas'); c.width = SW; c.height = SH;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    for (var y = 0; y < SH; y++) {
      var half = HALF[y], row = half + half.split('').reverse().join('');
      for (var x = 0; x < SW; x++) {
        var ch = row.charAt(x); if (ch === '.') continue;
        g.fillStyle = gb[ch.charCodeAt(0) - 48]; g.fillRect(x, y, 1, 1);
      }
    }
    var cf = document.createElement('canvas'); cf.width = SW; cf.height = SH;
    var gf = cf.getContext('2d'); gf.imageSmoothingEnabled = false;
    gf.drawImage(c, 0, 0); gf.globalCompositeOperation = 'source-in';
    gf.fillStyle = flashCol; gf.fillRect(0, 0, SW, SH);
    /* drawSpriteTo utilise aussi le contour cuit : sans lui, drawImage(undefined)
       levait une exception à chaque frame et figeait le niveau sur mobile. */
    var co = document.createElement('canvas'); co.width = SW + 2; co.height = SH + 2;
    var go = co.getContext('2d'); go.imageSmoothingEnabled = false;
    for (var oy = 0; oy <= 2; oy++) for (var ox = 0; ox <= 2; ox++) go.drawImage(c, ox, oy);
    go.globalCompositeOperation = 'source-in'; go.fillStyle = gb[0]; go.fillRect(0, 0, co.width, co.height);
    go.globalCompositeOperation = 'source-over'; go.drawImage(c, 1, 1);
    rec = CACHE[key] = { c: c, cf: cf, outline: co, W: SW, H: SH };
    return rec;
  };
  window.__nvShip0 = { HALF: HALF, SW: SW, SH: SH };
})();


/* ---- 99_options_gfx.js ---- */
/* =============================================================================
   OPTIONS GRAPHIQUES REFAITES · PLEIN ÉCRAN ON/OFF · VOIX ROBOT SUR PC
   -----------------------------------------------------------------------------
   Onglet « Graphismes » (commun) : profil de qualité, plein écran, éclairage,
   particules, secousses, FPS, lissage, CRT.
   Onglet « Options PC »  : résolution, cadence jusqu'à 240 i/s, moteur de
   rendu, cadre arcade, halo / aberration / grain / vignette / flou de
   mouvement réglables au pourcent, filtrage haute qualité, pause auto.
   Onglet « Options mobile » : économie de batterie, résolution, cadence,
   moteur, vibrations, écran toujours allumé, boutons tactiles (taille,
   opacité, main gauche).
   L'ancien « Aperçu graphique » est supprimé : il ne changeait que le décor
   des menus et laissait croire qu'il réglait la qualité du jeu.
   ========================================================================= */
(function () {
  'use strict';
  const T = (fr, en) => (typeof LANG !== 'undefined' && LANG === 'fr') ? fr : en;
  const DEF = {
    fxBloom: 100, fxCA: 100, fxGrain: 100, fxVig: 100, fxMB: 100, fxParts: 100, fxLight: 1, fxHQ: 1, glowIntensity: 145, glowRadius: 125, glowManual: 0,
    blurPause: 1, mobRes: 'auto', batt: 0, haptic: 1, awake: 1, tSize: 'm', tAlpha: 100, lefty: 0, voiceRobot: 60
  };
  const nvv = k => { const v = S.opts[k]; return v === undefined ? DEF[k] : v; };
  window.nvv = nvv;
  const battOn = () => IS_TOUCH && !!nvv('batt');

  /* l'ancien aperçu graphique ne doit plus forcer une génération dans les menus */
  try { S.opts.preview = 0; } catch (e) {}

  /* ---------------------------------------------------------------- cadence */
  window.nvCap = function () {
    const o = S.opts.frameRate;
    let cap = o === 'auto' ? (IS_TOUCH ? 60 : 144) : clamp(Number(o) || 60, 30, 240);
    if (battOn()) cap = Math.min(cap, 30);
    return cap;
  };

  /* ------------------------------------------------------ particules, lumière */
  const partMul = () => clamp(nvv('fxParts') / 100, 0.1, 1) * (battOn() ? 0.55 : 1);
  {
    const _sp = spawnPart;
    spawnPart = function (o) {
      const m = partMul();
      if (m < 0.995 && Math.random() > m) return null;
      return _sp.apply(this, arguments);
    };
    const _al = addLight;
    addLight = function () { if (!nvv('fxLight') || battOn()) return; return _al.apply(this, arguments); };
  }

  /* ----------------------------------------------- effets du moteur GPU (PC) */
  {
    const _gp = gpuPresent;
    gpuPresent = function () {
      try {
        const s = GPU.tex && GPU.tex.source;
        if (s && !s.__nvFx) {
          const u0 = s.update;
          s.update = function () {
            try {
              const u = GPU.u.uniforms, fx = u.uFx;
              if (fx) { fx[0] *= nvv('fxCA') / 100; fx[2] *= nvv('fxVig') / 100; fx[3] *= nvv('fxGrain') / 100; }
              u.uMB = (u.uMB || 0) * nvv('fxMB') / 100;
              const b = nvv('fxBloom') / 100;
              GPU.glow.alpha *= b; if (b < 0.01) GPU.glow.visible = false;
            } catch (e) {}
            return u0.apply(this, arguments);
          };
          s.__nvFx = true;
        }
      } catch (e) {}
      return _gp.apply(this, arguments);
    };
  }

  /* ------------------------------ résolution mobile, filtrage, cadence fixe */
  {
    const _rv = resizeView;
    resizeView = function () {
      if (IS_TOUCH) { const m = nvv('mobRes'); if (m !== 'auto') PERF.tier = clamp(parseInt(m, 10) || 0, 0, DPR_TIERS.length - 1); }
      const r = _rv.apply(this, arguments);
      try { if (!IS_TOUCH) ctx.imageSmoothingQuality = (nvv('fxHQ') && S.opts.graphics !== 'economy') ? 'high' : 'low'; } catch (e) {}
      return r;
    };
    const _pa = perfAdapt;
    perfAdapt = function () { if (IS_TOUCH && nvv('mobRes') !== 'auto') return; return _pa.apply(this, arguments); };
  }

  /* --------------------------------------------------------------- plein écran */
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsOK = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  function fsSync() {
    const on = !!fsEl();
    document.querySelectorAll('[data-nvfs]').forEach(b => {
      b.classList.toggle('on', on); b.textContent = on ? 'ON' : 'OFF'; b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('.nvFsState').forEach(e => { e.textContent = on ? 'ON' : 'OFF'; e.style.color = on ? '#7dff9b' : '#9fb0cc'; });
  }
  toggleFullscreen = function () {
    const el = document.documentElement;
    if (!fsEl()) {
      const rq = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!rq) { toast(T('Plein écran indisponible sur cet appareil', 'Fullscreen is not available on this device'), true); return; }
      try { const p = rq.call(el); if (p && p.catch) p.catch(() => { fsSync(); }); } catch (e) { fsSync(); }
    } else {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) try { const p = ex.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }
  };
  document.addEventListener('fullscreenchange', fsSync);
  document.addEventListener('webkitfullscreenchange', fsSync);
  /* la tuile du menu titre affiche aussi l'état */
  try {
    const tile = document.querySelector('[data-act="fullscreen"] b');
    if (tile && !tile.querySelector('.nvFsState')) {
      const em = document.createElement('em'); em.className = 'nvFsState';
      em.style.cssText = 'font-style:normal;margin-left:8px;font-size:.78em;letter-spacing:.12em';
      tile.appendChild(em);
    }
  } catch (e) {}
  fsSync();

  /* -------------------------------------------------- tactile : boutons, haptique */
  {
    const st = document.createElement('style');
    st.textContent =
      'body.nvT-s .tbtn{font-size:11px;padding:8px 11px}' +
      'body.nvT-l .tbtn{font-size:15px;padding:16px 21px}body.nvT-l .tbtn.prev{padding:16px 17px}' +
      '#touchui .tbtn{opacity:var(--nvTa,1)}' +
      'body.nvLeft #touchui{flex-direction:row-reverse;padding:0 12px 14px 46px}' +
      'body.nvLeft #tpause{right:auto;left:max(6px,env(safe-area-inset-left))}' +
      '#optBody .opt.nvOff{opacity:.45}' +
      '#optBody .opt-sub{padding:10px 2px 2px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7fe3ff;border-top:1px solid rgba(127,227,255,.18);margin-top:6px;grid-column:1/-1}';
    document.head.appendChild(st);
  }
  function touchApply() {
    const b = document.body; if (!b) return;
    b.classList.toggle('nvT-s', nvv('tSize') === 's');
    b.classList.toggle('nvT-l', nvv('tSize') === 'l');
    b.classList.toggle('nvLeft', !!nvv('lefty'));
    b.style.setProperty('--nvTa', String(clamp(nvv('tAlpha'), 20, 100) / 100));
  }
  touchApply();
  let lastVib = 0;
  const vib = p => { try { if (IS_TOUCH && navigator.vibrate && nvv('haptic')) navigator.vibrate(p); } catch (e) {} };
  if (typeof FX !== 'undefined' && FX.addShake) {
    const _as = FX.addShake;
    FX.addShake = function (n) {
      const r = _as.apply(this, arguments);
      if (IS_TOUCH && n >= 4 && G.state === 'play') { const t = performance.now(); if (t - lastVib > 150) { lastVib = t; vib(Math.min(70, Math.round(10 + n * 4))); } }
      return r;
    };
  }
  { const _ub = useBomb; useBomb = function () { const r = _ub.apply(this, arguments); vib([25, 30, 45]); return r; }; }
  /* écran toujours allumé en partie (tactile) */
  {
    let wl = null, pending = false;
    setInterval(() => {
      if (!IS_TOUCH || !('wakeLock' in navigator)) return;
      const want = !!nvv('awake') && !document.hidden && ['play', 'intro', 'pause', 'warp', 'story'].includes(G.state);
      if (want && !wl && !pending) {
        pending = true;
        navigator.wakeLock.request('screen').then(l => { wl = l; l.addEventListener('release', () => { wl = null; }); }).catch(() => {}).then(() => { pending = false; });
      } else if (!want && wl) { try { wl.release(); } catch (e) {} wl = null; }
    }, 3000);
  }
  /* PC : pause automatique quand la fenêtre perd le focus */
  addEventListener('blur', () => { try { if (!IS_TOUCH && nvv('blurPause') && G.state === 'play') pauseGame(); } catch (e) {} });

  /* ============================================================ OPTIONS (UI) */
  const PROFILE_INFO = {
    auto: () => T('Détecte le téléphone ou le PC, choisit un palier de départ adapté puis réduit la charge si le jeu ralentit.', 'Detects phone or PC, starts at a suitable quality tier, then reduces load if the game slows down.'),
    economy: () => T('Fluidité maximale : résolution plafonnée à 0,8×, halo et aberration réduits.', 'Maximum smoothness: resolution capped at 0.8×, reduced glow and aberration.'),
    balanced: () => T('Bon compromis : résolution plafonnée à 1,25×, effets complets.', 'Good balance: resolution capped at 1.25×, full effects.'),
    ultra: () => T('Qualité maximale : résolution jusqu’à 2×, tous les effets.', 'Top quality: resolution up to 2×, every effect.')
  };
  const RESET_KEYS = ['fxBloom', 'fxCA', 'fxGrain', 'fxVig', 'fxMB', 'fxParts', 'fxLight', 'fxHQ', 'glowIntensity', 'glowRadius', 'glowManual'];

  function mkSection(body, key, title, desc) {
    const s = document.createElement('section'); s.className = 'opt-section'; s.dataset.section = key;
    s.innerHTML = '<div class="opt-section-head"><h2 class="opt-section-title"></h2><p class="opt-section-desc"></p></div><div class="opt-section-body"></div>';
    s.querySelector('.opt-section-title').textContent = title;
    s.querySelector('.opt-section-desc').textContent = desc;
    body.appendChild(s); return s.querySelector('.opt-section-body');
  }
  function mkRow(parent, label, hint) {
    const d = document.createElement('div'); d.className = 'opt';
    const w = document.createElement('div'), lab = document.createElement('label'); lab.textContent = label;
    const h = document.createElement('span'); h.className = 'hint'; h.textContent = hint || ''; lab.appendChild(h); w.appendChild(lab);
    const ctl = document.createElement('div'); ctl.className = 'ctl';
    d.append(w, ctl); parent.appendChild(d);
    return { d, ctl, hint: h };
  }
  function mkSeg(r, items, cur, pick) {
    const seg = document.createElement('div'); seg.className = 'seg'; r.ctl.appendChild(seg);
    const bs = items.map(([v, lab]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = lab; b.className = String(cur) === String(v) ? 'sel' : '';
      b.onclick = () => { bs.forEach(x => x.className = ''); b.className = 'sel'; try { Audio2.sfx('ui'); } catch (e) {} pick(v, r); saveGame(); };
      seg.appendChild(b); return b;
    });
    return seg;
  }
  function mkToggle(r, key, after, getv, setv) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sw';
    const get = getv || (() => !!nvv(key));
    const paint = () => { const on = !!get(); b.classList.toggle('on', on); b.textContent = on ? 'ON' : 'OFF'; b.setAttribute('aria-pressed', String(on)); };
    b.onclick = () => { if (setv) setv(!get()); else S.opts[key] = get() ? 0 : 1; paint(); try { Audio2.sfx('ui'); } catch (e) {} saveGame(); if (after) after(); };
    paint(); r.ctl.appendChild(b); return b;
  }
  function mkSlider(r, key, min, max, step, fmt, after, live) {
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = live ? live.get() : nvv(key);
    const out = document.createElement('span'); out.style.cssText = 'min-width:48px;text-align:right;color:#ffe066';
    const f = fmt || (v => v + '%'); out.textContent = f(+inp.value);
    inp.oninput = () => { const v = +inp.value; if (live) live.set(v); else S.opts[key] = v; out.textContent = f(v); saveGame(); if (after) after(v); };
    r.ctl.append(inp, out); return inp;
  }
  function mkSelect(r, key, entries, change) {
    const sel = document.createElement('select'); sel.className = 'sw'; sel.style.maxWidth = 'min(100%, 290px)';
    entries.forEach(([v, name]) => { const op = document.createElement('option'); op.value = v; op.textContent = name; sel.appendChild(op); });
    { const cur = S.opts[key]; sel.value = String(cur === undefined ? (DEF[key] === undefined ? 'auto' : DEF[key]) : cur); }
    sel.onchange = () => { S.opts[key] = sel.value; saveGame(); change(sel.value); try { Audio2.sfx('ui'); } catch (e) {} };
    r.ctl.appendChild(sel); return sel;
  }
  const applyRes = () => { try { sideRes = resizeView().sideRes; syncTitleZone(); } catch (e) {} };
  const applyNativeRes = () => {
    try { setEra(R.era, true); sideRes = resizeView().sideRes; syncTitleZone(); }
    catch (e) { console.warn('Native render mode unavailable', e); }
  };
  function gpuState() {
    const o = S.opts;
    return o.gpu === '2d' ? T('Rendu 2D imposé', '2D rendering forced')
      : (GPU.ready ? 'GPU · ' + T('qualité ', 'quality ') + (GPU.q | 0) + '/2' + (GPU.fps > 0 ? ' · ' + GPU.fps + ' i/s' : '')
        : (GPU.err ? T('GPU indisponible — ', 'GPU unavailable — ') + GPU.err
          : (IS_TOUCH && (o.gpu === undefined || o.gpu === 'auto') ? T('Rendu 2D (auto sur téléphone)', '2D rendering (auto on phones)') : T('GPU en cours d’initialisation…', 'GPU starting…'))));
  }
  function engineRow(parent) {
    const r = mkRow(parent, T('Moteur de rendu', 'Render engine'),
      IS_TOUCH ? T('AUTO = 2D sur téléphone (plus sûr) · GPU = effets avancés, plus gourmand', 'AUTO = 2D on phones (safer) · GPU = advanced effects, heavier')
        : T('WebGL 2 (PixiJS) : halo, aberration, onde de choc sur le GPU', 'WebGL 2 (PixiJS): glow, aberration, shockwave on the GPU'));
    const st = document.createElement('span'); st.className = 'hint'; st.style.color = '#7fe3ff'; st.textContent = gpuState(); r.d.querySelector('label').appendChild(st);
    mkSeg(r, [['auto', 'AUTO'], ['gpu', 'GPU'], ['2d', '2D']], S.opts.gpu === undefined ? 'auto' : S.opts.gpu, v => {
      S.opts.gpu = v; gpuApply(); applyRes();
      toast(v === '2d' ? T('Moteur : canevas 2D', 'Engine: 2D canvas') : (GPU.ready ? T('Moteur : WebGL 2 (GPU)', 'Engine: WebGL 2 (GPU)') : T('Moteur : GPU indisponible', 'Engine: GPU unavailable')), true);
      st.textContent = gpuState();
      document.querySelectorAll('#optBody .opt[data-gpufx]').forEach(e => e.classList.toggle('nvOff', v === '2d'));
    });
    return r;
  }

  const _prev = buildOptions;
  buildOptions = function () {
    _prev.apply(this, arguments);
    const body = document.getElementById('optBody'); if (!body) return;
    const o = S.opts;
    if (o.preview) o.preview = 0;
    /* on repart d'une page propre pour les deux onglets d'affichage */
    ['display', 'displayAdvanced'].forEach(k => { const s = body.querySelector('[data-section="' + k + '"]'); if (s) s.remove(); });
    const oldTabs = body.querySelector('#optTabs');
    const names = {};
    if (oldTabs) oldTabs.querySelectorAll('button').forEach(b => { names[b.dataset.tab] = b.textContent; });

    /* ---------------------------------------------------------- Graphismes */
    const g = mkSection(body, 'display', T('Graphismes', 'Graphics'), T('Qualité et effets communs à toutes les machines', 'Quality and effects shared by every device'));
    {
      const r = mkRow(g, T('Profil de qualité', 'Quality profile'), PROFILE_INFO[o.graphics || 'auto']());
      mkSeg(r, [['auto', 'AUTO'], ['economy', T('PERFORMANCE', 'PERFORMANCE')], ['balanced', T('ÉQUILIBRÉ', 'BALANCED')], ['ultra', 'ULTRA']], o.graphics || 'auto', (v, rr) => {
        o.graphics = v; applyNVGraphics(); applyRes();
        const glowQuality = { economy:[105,95], balanced:[145,125], ultra:[180,150] };
        if (glowQuality[v]) { [o.glowIntensity, o.glowRadius] = glowQuality[v]; o.glowManual = 1; }
        else { o.glowManual = 0; if (typeof nvApplyAutoGlow === 'function') nvApplyAutoGlow(); }
        saveGame(); rr.hint.textContent = PROFILE_INFO[v]();
        toast(T('Profil : ', 'Profile: ') + v.toUpperCase(), true);
      });
    }
    {
      const r = mkRow(g, T('Plein écran', 'Fullscreen'), T('F pour basculer à tout moment', 'Press F to toggle at any time'));
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.dataset.nvfs = '1';
      if (!fsOK) { b.textContent = T('INDISPONIBLE', 'N/A'); b.disabled = true; b.style.opacity = '.5'; }
      else b.onclick = () => { try { Audio2.sfx('ui'); } catch (e) {} toggleFullscreen(); };
      r.ctl.appendChild(b); fsSync();
    }
    mkToggle(mkRow(g, T('Éclairage dynamique', 'Dynamic lighting'), T('Les explosions éclairent le décor (secteurs 3 et +) · désactiver = plus fluide', 'Explosions light up the scenery (sectors 3+) · off = smoother')), 'fxLight');
    mkSlider(mkRow(g, T('Intensité des halos lumineux', 'Glow intensity'), T('Renforce les halos, rayons et lumières d’impact dans le décor', 'Brightens scenery glows, light rays and impact lights')), 'glowIntensity', 0, 200, 5, v => v + '%', () => { o.glowManual = 1; saveGame(); });
    mkSlider(mkRow(g, T('Portée des halos', 'Glow radius'), T('Agrandit ou resserre la diffusion de la lumière autour des effets', 'Expands or tightens the light spread around effects')), 'glowRadius', 50, 200, 5, v => v + '%', () => { o.glowManual = 1; saveGame(); });
    mkSlider(mkRow(g, T('Densité des particules', 'Particle density'), T('Étincelles, débris, fumée · baisser aide les petites machines', 'Sparks, debris, smoke · lowering helps weak machines')), 'fxParts', 10, 100, 5);
    mkSlider(mkRow(g, T('Secousses', 'Screen shake'), T('Intensité du screen-shake', 'Screen-shake strength')), 'shake', 0, 150, 5);
    mkToggle(mkRow(g, T('Compteur FPS', 'FPS counter'), T('Affiche les performances et le nombre de particules', 'Shows performance and particle count')), 'fps');
    mkToggle(mkRow(g, T('Lissage HD', 'HD smoothing'), T('Adoucit les pixels en secteur HD', 'Softens pixels in HD sectors')), 'smooth');
    {
      const r = mkRow(g, T('Réglages graphiques par défaut', 'Default graphics settings'), T('Remet profil, résolution, cadence et effets à zéro', 'Resets profile, resolution, frame rate and effects'));
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.textContent = T('↺ RÉINITIALISER', '↺ RESET');
      b.onclick = () => {
        RESET_KEYS.forEach(k => { delete o[k]; });
        o.graphics = 'auto'; o.resolution = 'auto'; o.consoleRes = 'auto'; o.frameRate = 'auto'; o.mobRes = 'auto'; o.crt = 'auto'; o.crtMask = 'auto'; o.shaderPreset = 'system'; o.crtScan = 12; o.crtMaskStrength = 5; o.crtVignette = 0; o.colorFilter = 'none'; o.videoStandard = 'auto'; o.scanlineMode = 'classic'; o.outlineStrength = 140; o.shaderSmooth = false; o.smooth = false; o.batt = 0; PERF.tier = 0;
        applyNVGraphics(); applyNativeRes(); applyRes(); saveGame(); try { Audio2.sfx('ui'); } catch (e) {}
        toast(T('Réglages graphiques réinitialisés', 'Graphics settings reset'), true); buildOptions();
      };
      r.ctl.appendChild(b);
    }

    /* -------------------------------------------------------- Shaders & filtres */
    const sh = mkSection(body, 'shaders', T('Shaders & filtres', 'Shaders & filters'), T('Préréglages CRT et filtres couleur appliqués uniquement à la zone de jeu', 'CRT presets and colour filters applied only to the playfield'));
    const shaderPresets = {
      system: { crt: 'auto', mask: 'auto', scan: 12, maskPower: 5, filter: 'none', standard: 'auto', scanMode: 'classic', smooth: false, shaderSmooth: false, vig: 0 },
      pixel:  { crt: 'off', mask: 'off', scan: 0, maskPower: 0, filter: 'none', standard: 'rgb', scanMode: 'off', smooth: false, shaderSmooth: false, vig: 0 },
      rgb:    { crt: 'on', mask: 'aperture', scan: 16, maskPower: 6, filter: 'none', standard: 'rgb', scanMode: 'fine', smooth: false, shaderSmooth: false, vig: 8 },
      arcade: { crt: 'on', mask: 'shadow', scan: 19, maskPower: 8, filter: 'vivid', standard: 'rgb', scanMode: 'thick', smooth: false, shaderSmooth: false, vig: 14 },
      comp:   { crt: 'on', mask: 'off', scan: 12, maskPower: 0, filter: 'composite', standard: 'ntsc', scanMode: 'soft', smooth: false, shaderSmooth: true, vig: 10 },
      green:  { crt: 'on', mask: 'shadow', scan: 12, maskPower: 5, filter: 'green', standard: 'auto', scanMode: 'classic', smooth: false, shaderSmooth: false, vig: 8 },
      amber:  { crt: 'on', mask: 'aperture', scan: 10, maskPower: 3, filter: 'amber', standard: 'pal', scanMode: 'interlace', smooth: false, shaderSmooth: false, vig: 8 }
    };
    const setShaderPreset = key => {
      if (key === 'custom') { o.shaderPreset = 'custom'; saveGame(); buildOptions(); return; }
      const preset = shaderPresets[key] || shaderPresets.system;
      o.shaderPreset = key; o.crt = preset.crt; o.crtMask = preset.mask; o.crtScan = preset.scan;
      o.crtMaskStrength = preset.maskPower; o.colorFilter = preset.filter; o.videoStandard = preset.standard; o.scanlineMode = preset.scanMode; o.outlineStrength = 140; o.shaderSmooth = !!preset.shaderSmooth; o.crtVignette = preset.vig;
      saveGame(); buildOptions();
    };
    mkSelect(mkRow(sh, T('Profil de rendu', 'Render preset'), T('Pixel net, tube RGB, masque arcade, composite ou moniteur monochrome', 'Sharp pixels, RGB tube, arcade mask, composite or monochrome display')), 'shaderPreset', [
      ['system', T('Système · automatique', 'System · automatic')], ['custom', T('Personnalisé', 'Custom')], ['pixel', T('Pixel perfect · sans filtre', 'Pixel perfect · no filter')],
      ['rgb', 'CRT · RGB aperture'], ['arcade', T('CRT · masque arcade', 'CRT · arcade mask')], ['comp', T('Composite · doux', 'Composite · soft')],
      ['green', T('Moniteur · phosphore vert', 'Monitor · green phosphor')], ['amber', T('Moniteur · phosphore ambre', 'Monitor · amber phosphor')],
      ['fanboy', T('FanBoy · LCD quatre teintes', 'FanBoy · four-tone LCD')]
    ], setShaderPreset);
    const machineRasters = { gb:'gb', nes:'nes', snes:'snes224', gba:'gba160', megadrive:'md224', neogeo:'neo', arcade:'arcade224' };
    const machineGlow = { gb:[20,70], nes:[40,80], snes:[100,105], gba:[115,115], megadrive:[125,120], neogeo:[150,135], arcade:[165,145] };
    const machineVisuals = { gb:['fanboy','rgb','fine','off','rgb'], nes:['pixel','ntsc','classic','off','ntsc'], snes:['rgb','rgb','classic','aperture','rgb'], gba:['rgb','rgb','fine','aperture','rgb'], megadrive:['rgb','rgb','classic','aperture','rgb'], neogeo:['arcade','rgb','thick','shadow','rgb'], arcade:['arcade','rgb','thick','shadow','rgb'] };
    mkSelect(mkRow(sh, T('Profil machine', 'Machine profile'), T('Associe un raster, une palette, un masque CRT et un timbre audio ; Auto suit les niveaux', 'Sets raster, palette, CRT mask and audio tone; Auto follows the levels')), 'machineProfile', [
      ['auto', T('Automatique · selon le niveau', 'Automatic · follow level')], ['gb','FanBoy'], ['nes','FanBoy 8'], ['snes','Super FanBoy'], ['gba','FanBoy Advance'], ['megadrive','MegaFan'], ['neogeo','NeoFan'], ['arcade',T('Arcade générique','Generic arcade')]
    ], id => {
      const r = machineRasters[id] || 'auto'; o.consoleRes = r; o.glowManual = 0;
      if (id !== 'auto') {
        [o.glowIntensity, o.glowRadius] = machineGlow[id] || [145,125];
        const v = machineVisuals[id]; o.shaderPreset = v[0]; o.videoStandard = v[1]; o.scanlineMode = v[2]; o.crtMask = v[3]; o.colorFilter = 'none'; o.crt = 'on';
        o.audioMode = (id === 'gb' || id === 'nes') ? 'mono' : 'stereo';
      } else { if (typeof nvApplyAutoGlow === 'function') nvApplyAutoGlow(); o.shaderPreset = 'system'; o.videoStandard = 'auto'; o.scanlineMode = 'classic'; o.crtMask = 'auto'; o.colorFilter = 'none'; o.crt = 'auto'; }
      try { applyNativeRes(); Audio2.applyOutputMode(); if (typeof nvApplyMachineAudio === 'function') nvApplyMachineAudio(); } catch (e) {}
      saveGame(); toast(id === 'auto' ? T('Profil machine automatique', 'Automatic machine profile') : T('Profil machine : ', 'Machine profile: ') + id.toUpperCase(), true); buildOptions();
    });
    mkSelect(mkRow(sh, T('Standard vidéo', 'Video standard'), T('RGB direct, PAL doux, NTSC composite ou sélection automatique', 'Direct RGB, soft PAL, composite NTSC or automatic')), 'videoStandard', [
      ['auto', T('Automatique', 'Automatic')], ['rgb', 'RGB'], ['pal', 'PAL'], ['ntsc', 'NTSC']
    ], () => { o.shaderPreset = 'custom'; saveGame(); });
    mkSelect(mkRow(sh, T('Mode de scanlines', 'Scanline mode'), T('Désactivées, fines, classiques, épaisses, douces ou entrelacées', 'Off, fine, classic, thick, soft or interlaced')), 'scanlineMode', [
      ['off', T('Désactivées', 'Off')], ['fine', T('Fines · 2 lignes', 'Fine · 2-line')], ['classic', T('Classiques · 3 lignes', 'Classic · 3-line')],
      ['thick', T('Épaisses · doubles', 'Thick · double')], ['soft', T('Douces · atténuées', 'Soft · reduced')], ['interlace', T('Entrelacées', 'Interlaced')]
    ], () => { o.shaderPreset = 'custom'; saveGame(); });
    {
      const r = mkRow(sh, T('Contours des sprites', 'Sprite outlines'), T('Régle l’épaisseur du trait sombre autour des vaisseaux et ennemis, de 0 à 200 %', 'Adjusts the dark outline thickness around ships and enemies, from 0 to 200%'));
      mkSlider(r, 'outlineStrength', 0, 200, 10, v => v + '%', () => { o.shaderPreset = 'custom'; saveGame(); });
    }
    {
      const r = mkRow(sh, T('Lignes de balayage', 'Scanline strength'), T('Intensité des lignes horizontales ; 0 = désactivées', 'Horizontal line strength; 0 = disabled'));
      mkSlider(r, 'crtScan', 0, 40, 1, v => v + '%', () => { o.shaderPreset = 'custom'; saveGame(); });
    }
    {
      const r = mkRow(sh, T('Masque phosphore', 'Phosphor mask'), T('Force de la trame RGB ou des points arcade ; 0 = désactivé', 'RGB grille or arcade dot strength; 0 = disabled'));
      mkSlider(r, 'crtMaskStrength', 0, 20, 1, v => v + '%', () => { o.shaderPreset = 'custom'; saveGame(); });
    }
    mkSelect(mkRow(sh, T('Filtre couleur', 'Colour filter'), T('Étalonnage appliqué à l’image du jeu ; HUD et bezel préservés', 'Colour grade applied to gameplay; HUD and bezel preserved')), 'colorFilter', [
      ['none', T('Aucun', 'None')], ['vivid', T('Couleurs vives', 'Vivid colours')], ['composite', T('Composite doux', 'Soft composite')],
      ['green', T('Phosphore vert', 'Green phosphor')], ['amber', T('Phosphore ambre', 'Amber phosphor')], ['mono', T('Monochrome', 'Monochrome')]
    ], () => { o.shaderPreset = 'custom'; saveGame(); });
    {
      const r = mkRow(sh, T('Vignettage CRT', 'CRT vignette'), T('Assombrissement léger des bords de l’image de jeu', 'Subtle darkening at the edges of the gameplay image'));
      mkSlider(r, 'crtVignette', 0, 60, 1, v => v + '%', () => { o.shaderPreset = 'custom'; saveGame(); });
    }
    {
      const r = mkRow(sh, T('Lissage de l’image', 'Image smoothing'), T('Adoucit le rendu, utile avec le profil composite', 'Softens the picture; useful with the composite preset'));
      mkToggle(r, 'shaderSmooth', null, () => !!o.shaderSmooth, value => { o.shaderSmooth = value; o.shaderPreset = 'custom'; });
    }
    {
      const r = mkRow(sh, T('Masque de tube', 'Display mask'), T('Grille RGB, points arcade, automatique selon le matériel ou aucun', 'RGB grille, arcade dots, automatic by hardware, or none'));
      mkSeg(r, [['auto', 'AUTO'], ['aperture', 'RGB'], ['shadow', 'DOT'], ['off', 'OFF']], o.crtMask || 'auto', v => { o.crtMask = v; o.shaderPreset = 'custom'; });
    }

    /* ------------------------------------------------ Audio : sortie & DSP */
    const au = body.querySelector('[data-section="audio"] .opt-section-body');
    if (au) {
      const sub = document.createElement('div'); sub.className = 'opt-sub'; sub.textContent = T('Sortie et traitement audio', 'Audio output and processing'); au.appendChild(sub);
      mkSelect(mkRow(au, T('Canaux de sortie', 'Output channels'), T('Mono additionne gauche et droite ; stéréo conserve le panoramique du jeu', 'Mono sums left and right; stereo keeps game panning')), 'audioMode', [ ['auto',T('Auto · FanBoy mono sur mobile','Auto · FanBoy mono on mobile')], ['mono','Mono'], ['stereo','Stéréo · Stereo'] ], () => Audio2.applyOutputMode());
      mkSlider(mkRow(au, T('Gain de sortie', 'Output gain'), T('Gain général en décibels, avant la sortie système', 'Overall gain in decibels, before system output')), 'audioGainDb', -12, 12, 1, v => (v > 0 ? '+' : '') + v + ' dB', () => Audio2.applyVolumes());
      mkSelect(mkRow(au, T('Compression dynamique', 'Dynamic range compression'), T('Limite les écarts de volume, comme le compresseur audio des émulateurs', 'Reduces volume swings, like emulator audio compressors')), 'audioDynamics', [ ['off',T('Désactivée','Off')], ['light',T('Légère','Light')], ['normal',T('Normale','Normal')], ['strong',T('Forte','Strong')] ], () => Audio2.applyDynamics());
      mkSlider(mkRow(au, T('Réverbération et écho', 'Reverb and echo'), T('Intensité des effets spatiaux selon le profil sonore', 'Spatial effect amount, shaped by the sound profile')), 'audioSpace', 0, 150, 5, v => v + '%', () => Audio2.applyEraFx());
      mkSelect(mkRow(au, T('Latence audio', 'Audio latency'), T('Faible = réactif ; Stable = plus tolérant aux ralentissements. Pris en compte à la création audio', 'Low = responsive; Stable = more tolerant of slowdowns. Used when audio starts')), 'audioLatency', [ ['low',T('Faible · priorité à la réactivité','Low · responsiveness first')], ['balanced',T('Équilibrée','Balanced')], ['stable',T('Stable · priorité à la continuité','Stable · continuity first')] ], () => toast(T('Latence mémorisée · redémarrez le jeu pour reconstruire le moteur audio', 'Latency saved · restart the game to rebuild the audio engine'), true));
    }

    /* ------------------------------------------------------------- Options PC */
    if (!IS_TOUCH) {
      const p = mkSection(body, 'pc', T('Options PC', 'PC options'), T('Réglages poussés pour ordinateur : résolution, cadence, effets GPU', 'Advanced desktop settings: resolution, frame rate, GPU effects'));
      mkSelect(mkRow(p, T('Raster natif des consoles', 'Console native raster'), T('Le raster d’origine est pivoté pour le shmup vertical puis ajusté sans couper ni déformer le terrain', 'Original raster is rotated for the vertical shooter, then fitted without cropping or distorting the playfield')), 'consoleRes', [
        ['auto', T('Auto · selon le niveau', 'Auto · follow level')], ['gb', 'FanBoy · 160×144'], ['nes', 'FanBoy 8 · 256×240'], ['gba160', 'FanBoy Advance · 240×160'],
        ['snes224', 'Super FanBoy NTSC · 256×224'], ['snes239', 'Super FanBoy PAL · 256×239'],
        ['md224', 'MegaFan NTSC · 320×224'], ['md240', 'MegaFan PAL · 320×240'], ['neo', 'NeoFan · 320×224'], ['arcade224', T('Arcade · raster de référence 320×224', 'Arcade · 320×224 reference raster')]
      ], () => { applyNativeRes(); toast(T('Raster natif appliqué, cadrage adapté à l’écran', 'Native raster applied and fitted to screen'), true); });
      mkSelect(mkRow(p, T('Résolution du rendu', 'Render resolution'), T('Résolution interne du jeu ; l’écran reste réglé par le système', 'Internal game resolution; the display itself is set by the system')), 'resolution', [
        ['auto', T('Auto · adaptatif', 'Auto · adaptive')], ['720', '720p · ' + T('performance', 'performance')], ['900', '900p · ' + T('équilibrée', 'balanced')],
        ['1080', '1080p · ' + T('nette', 'sharp')], ['1440', '1440p · ' + T('haute définition', 'high definition')], ['2160', '2160p · 4K']
      ], () => { applyRes(); toast(T('Résolution interne : ', 'Internal resolution: ') + (o.resolution === 'auto' ? 'Auto' : o.resolution + 'p'), true); });
      mkSelect(mkRow(p, T('Fréquence d’images', 'Frame rate'), T('Auto = jusqu’à 144 i/s, calé sur l’écran · 240 i/s pour les moniteurs rapides', 'Auto = up to 144 fps, locked to your display · 240 fps for fast monitors')), 'frameRate', [
        ['auto', 'Auto'], ['30', '30 i/s'], ['60', '60 i/s'], ['75', '75 i/s'], ['90', '90 i/s'], ['120', '120 i/s'], ['144', '144 i/s'], ['165', '165 i/s'], ['240', '240 i/s']
      ], () => toast(T('Fréquence cible : ', 'Target frame rate: ') + (o.frameRate === 'auto' ? 'Auto' : o.frameRate + ' i/s'), true));
      engineRow(p);
      const bz = body.querySelector('#bzOptRow');
      if (bz) p.appendChild(bz);
      const sub = document.createElement('div'); sub.className = 'opt-sub';
      sub.textContent = T('Effets de post-traitement (moteur GPU)', 'Post-processing effects (GPU engine)'); p.appendChild(sub);
      const fxRow = (key, label, hint, max) => {
        const r = mkRow(p, label, hint); r.d.dataset.gpufx = '1'; r.d.classList.toggle('nvOff', o.gpu === '2d');
        mkSlider(r, key, 0, max || 150, 5); return r;
      };
      fxRow('fxBloom', T('Halo lumineux (bloom)', 'Glow (bloom)'), T('0 % = coupé : une passe de flou en moins', '0% = off: one blur pass less'));
      fxRow('fxCA', T('Aberration chromatique', 'Chromatic aberration'), T('Franges colorées sur les bords (secteurs 3 et +)', 'Colour fringes on the edges (sectors 3+)'));
      fxRow('fxGrain', T('Grain de pellicule', 'Film grain'), T('Texture fine sur l’image', 'Fine texture over the picture'));
      fxRow('fxVig', T('Vignettage', 'Vignette'), T('Assombrit les coins de l’écran', 'Darkens the screen corners'));
      fxRow('fxMB', T('Flou de mouvement', 'Motion blur'), T('Traînée à grande vitesse (secteur HD)', 'Streaks at high speed (HD sector)'));
      const sub2 = document.createElement('div'); sub2.className = 'opt-sub'; sub2.textContent = T('Confort', 'Comfort'); p.appendChild(sub2);
      mkToggle(mkRow(p, T('Filtrage haute qualité', 'High-quality filtering'), T('Réduction nette de l’image vers l’écran · couper si le jeu rame', 'Sharper downscale to the screen · switch off if the game struggles')), 'fxHQ', applyRes);
      mkToggle(mkRow(p, T('Pause automatique', 'Auto-pause'), T('Met la partie en pause quand la fenêtre perd le focus', 'Pauses the game when the window loses focus')), 'blurPause');
    }

    /* ---------------------------------------------------------- Options mobile */
    if (IS_TOUCH) {
      const m = mkSection(body, 'mobile', T('Options mobile', 'Mobile options'), T('Réglages dédiés au téléphone et à la tablette : batterie, fluidité, boutons tactiles', 'Phone and tablet settings: battery, smoothness, touch buttons'));
      mkSelect(mkRow(m, T('Raster natif des consoles', 'Console native raster'), T('Orientation verticale et mise à l’échelle pixel perfect ; le jeu garde son cadrage et ses proportions', 'Portrait orientation and pixel-perfect scaling; the game keeps its framing and proportions')), 'consoleRes', [
        ['auto', T('Auto · selon le niveau', 'Auto · follow level')], ['gb', 'FanBoy · 160×144'], ['nes', 'FanBoy 8 · 256×240'], ['gba160', 'FanBoy Advance · 240×160'],
        ['snes224', 'Super FanBoy NTSC · 256×224'], ['snes239', 'Super FanBoy PAL · 256×239'],
        ['md224', 'MegaFan NTSC · 320×224'], ['md240', 'MegaFan PAL · 320×240'], ['neo', 'NeoFan · 320×224'], ['arcade224', T('Arcade · raster de référence 320×224', 'Arcade · 320×224 reference raster')]
      ], () => { applyNativeRes(); toast(T('Raster natif appliqué, cadrage adapté au téléphone', 'Native raster applied and fitted to phone'), true); });
      mkToggle(mkRow(m, T('Économie de batterie', 'Battery saver'), T('30 i/s, moitié moins de particules, pas d’éclairage dynamique : l’appareil chauffe moins', '30 fps, half the particles, no dynamic lighting: your device runs cooler')), 'batt', () => { applyRes(); });
      mkSelect(mkRow(m, T('Résolution du rendu', 'Render resolution'), T('Plus bas = plus fluide et moins chaud · Auto s’adapte si ça ralentit', 'Lower = smoother and cooler · Auto adapts if it slows down')), 'mobRes', [
        ['auto', T('Auto · adaptatif', 'Auto · adaptive')], ['0', T('Native · nette', 'Native · sharp')], ['1', T('Haute · 1,5×', 'High · 1.5×')],
        ['2', T('Standard · 1,25×', 'Standard · 1.25×')], ['3', T('Économie · 1×', 'Saver · 1×')], ['4', T('Minimale · 0,8×', 'Minimal · 0.8×')]
      ], v => { if (v === 'auto') PERF.tier = 0; applyRes(); toast(T('Résolution mobile : ', 'Mobile resolution: ') + v, true); });
      mkSelect(mkRow(m, T('Fréquence d’images', 'Frame rate'), T('Auto = 60 i/s · 90 et 120 i/s pour les écrans rapides', 'Auto = 60 fps · 90 and 120 fps for fast screens')), 'frameRate', [
        ['auto', 'Auto'], ['30', '30 i/s · ' + T('batterie', 'battery')], ['45', '45 i/s'], ['60', '60 i/s'], ['90', '90 i/s'], ['120', '120 i/s']
      ], () => toast(T('Fréquence cible : ', 'Target frame rate: ') + (o.frameRate === 'auto' ? 'Auto' : o.frameRate + ' i/s'), true));
      engineRow(m);
      {
        const ok = !!navigator.vibrate;
        const r = mkRow(m, T('Vibrations', 'Haptics'), ok ? T('Retour haptique sur les gros impacts et les bombes', 'Haptic feedback on big hits and bombs') : T('Non pris en charge par ce navigateur', 'Not supported by this browser'));
        const b = mkToggle(r, 'haptic', () => vib(30)); if (!ok) { b.disabled = true; b.style.opacity = '.5'; }
      }
      {
        const ok = 'wakeLock' in navigator;
        const r = mkRow(m, T('Écran toujours allumé', 'Keep screen awake'), ok ? T('Empêche la mise en veille pendant une partie', 'Stops the screen from sleeping during a run') : T('Non pris en charge par ce navigateur', 'Not supported by this browser'));
        const b = mkToggle(r, 'awake'); if (!ok) { b.disabled = true; b.style.opacity = '.5'; }
      }
      const sub = document.createElement('div'); sub.className = 'opt-sub'; sub.textContent = T('Boutons tactiles', 'Touch buttons'); m.appendChild(sub);
      mkSeg(mkRow(m, T('Taille des boutons', 'Button size'), T('Bombe et armes en bas de l’écran', 'Bomb and weapon buttons at the bottom')), [['s', T('PETITS', 'SMALL')], ['m', T('NORMAUX', 'NORMAL')], ['l', T('GRANDS', 'LARGE')]], nvv('tSize'), v => { S.opts.tSize = v; touchApply(); });
      mkSlider(mkRow(m, T('Opacité des boutons', 'Button opacity'), T('Plus transparents, ils masquent moins l’action', 'More transparent, they hide less of the action')), 'tAlpha', 30, 100, 5, null, touchApply);
      mkToggle(mkRow(m, T('Mode gaucher', 'Left-handed mode'), T('Inverse les boutons et déplace la pause à gauche', 'Swaps the buttons and moves pause to the left')), 'lefty', touchApply);
    }

    /* ------------------------------------------------------------ onglets */
    if (oldTabs) oldTabs.remove();
    const tabs = document.createElement('nav'); tabs.id = 'optTabs'; tabs.setAttribute('aria-label', T('Catégories des options', 'Option categories')); tabs.setAttribute('role', 'tablist');
    body.insertBefore(tabs, body.firstChild);
    const sections = [...body.querySelectorAll('.opt-section')];
    const activate = key => {
      S.opts.optTab = key;
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
      sections.forEach(sec => { sec.hidden = sec.dataset.section !== key; sec.setAttribute('aria-hidden', String(sec.hidden)); });
    };
    const defs = [['display', T('Graphismes', 'Graphics')],
      ['shaders', T('Shaders & filtres', 'Shaders & filters')],
      [IS_TOUCH ? 'mobile' : 'pc', IS_TOUCH ? T('Écran mobile', 'Mobile display') : T('Écran PC', 'PC display')],
      ['audio', T('Audio', 'Audio')], ['interface', T('Interface', 'Interface')], ['gameplay', T('Jeu', 'Game')],
      ['controls', T('Commandes', 'Controls')], ['save', T('Sauvegarde', 'Save')]];
    defs.forEach(([key, title]) => {
      const panel = sections.find(sec => sec.dataset.section === key); if (!panel) return;
      const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = key; b.textContent = title; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'opt-panel-' + key);
      panel.id = 'opt-panel-' + key; panel.setAttribute('role', 'tabpanel');
      b.onclick = () => { activate(key); saveGame(); try { Audio2.sfx('ui'); } catch (e) {} };
      tabs.appendChild(b);
    });
    const shopLink = document.createElement('button'); shopLink.type = 'button'; shopLink.className = 'opt-shop-link'; shopLink.textContent = T('HANGAR & BOUTIQUE', 'HANGAR & SHOP'); shopLink.setAttribute('aria-label', T('Ouvrir le Hangar et la boutique', 'Open hangar and shop'));
    shopLink.onclick = () => { shopMode = 'buy'; shopTab = 'hangar'; SHOP_NAV_STACK.length = 0; showScreen('shop'); buildShop(); try { Audio2.sfx('ui'); } catch (e) {} };
    tabs.appendChild(shopLink);
    activate(tabs.querySelector('[data-tab="' + (o.optTab || 'display') + '"]') ? o.optTab : 'display');
    fsSync();
  };

  /* ============================================================ VOIX DU DROÏDE
     Pourquoi l'effet robot disparaissait sur PC :
       · le choix automatique préférait « Google français », une voix EN LIGNE
         qui ignore la hauteur et le débit (donc plus aucune voix grave) ;
       · la liste de voix pouvait rester vide en cache ;
       · le bourdonnement de fond était presque inaudible.
     Correctifs : voix locales d'abord (elles obéissent à la hauteur), liste
     jamais mise en cache vide, relance périodique de la synthèse (Chrome la
     coupe vers 15 s) et surtout une vraie couche « robot » synthétisée par le
     jeu (porteuse + formants + trémolo, battue sur le rythme des mots), qui
     marche avec N'IMPORTE QUELLE voix, locale ou en ligne.                    */
  if (DROID.ok) {
    const ss = window.speechSynthesis;
    const ROB = { n: null, timer: 0, lastB: 0, u0: 0 };
    const MALE_PREF = /thomas|nicolas|paul|claude|henri|guy|daniel|george|jorge|diego|joaquim|ricardo|otoya|ichiro|male|homme/i;
    function rate(v, wl, g) {
      let s = 0;
      if (v.localService) s += 100;
      if (!v.localService && /google/i.test(v.name)) s -= 30;
      if (/natural|neural|online/i.test(v.name)) s -= 20;
      const vg = voGender(v);
      if (vg === g) s += 30; else if (vg === 'unknown') s += 10;
      if (g === 'male' && MALE_PREF.test(v.name)) s += 8;
      if (/microsoft/i.test(v.name)) s += 4;
      if (v.default) s += 2;
      return s;
    }
    {
      const _dv = droidVoice;
      droidVoice = function (code) {
        if (!DROID.ok) return null;
        const all = ss.getVoices() || [];
        if (!all.length) { DROID.voices = null; return _dv.call(this, code); }     /* jamais de liste vide en cache */
        const wl = code.slice(0, 2).toLowerCase();
        const mine = all.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(wl) && !voIsCanadianFr(v));
        if (S.opts.voiceName) { const v = mine.find(x => x.name === S.opts.voiceName); if (v) return v; }
        if (!mine.length) return null;
        const g = S.opts.voiceGender || 'male';
        let best = null, bs = -1e9;
        for (const v of mine) { const s = rate(v, wl, g); if (s > bs) { bs = s; best = v; } }
        return best;
      };
    }
    /* la couche robot */
    function robLevel() { return 0.085 * clamp(nvv('voiceRobot') / 100, 0, 1.5) * clamp((S.opts.voiceVol === undefined ? 100 : S.opts.voiceVol) / 100, 0, 1); }
    function robPulse(k) {
      const n = ROB.n; if (!n) return;
      const t = Audio2.ctx.currentTime, L = robLevel() * (k || 1);
      try {
        n.env.gain.cancelScheduledValues(t);
        n.env.gain.setTargetAtTime(L, t, 0.008);
        n.env.gain.setTargetAtTime(L * 0.22, t + 0.07, 0.06);
      } catch (e) {}
    }
    function robStart() {
      if (ROB.n || S.opts.voiceStyle === 'human') return;
      if (robLevel() <= 0.002 || !Audio2.ok || !Audio2.ctx || Audio2.muted) return;
      try {
        const c = Audio2.ctx, t = c.currentTime, fem = S.opts.voiceGender === 'female';
        const f0 = fem ? 150 : 92;
        const a = c.createOscillator(); a.type = 'sawtooth'; a.frequency.value = f0;
        const b = c.createOscillator(); b.type = 'square'; b.frequency.value = f0 * 1.505; b.detune.value = 9;
        const mix = c.createGain(); mix.gain.value = 0.5;
        const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 5;
        const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1250; f2.Q.value = 7;
        const am = c.createGain(); am.gain.value = 0.5;
        const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 31;
        const lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
        const env = c.createGain(); env.gain.value = 0.0001;
        a.connect(mix); b.connect(mix); mix.connect(f1); mix.connect(f2); f1.connect(am); f2.connect(am); am.connect(env); env.connect(c.destination);
        a.start(t); b.start(t); lfo.start(t);
        ROB.n = { a, b, lfo, env }; ROB.lastB = 0;
        robPulse(1);
        /* si le moteur n'émet pas d'événements « mot » (voix en ligne), on bat la mesure nous-mêmes */
        ROB.timer = setInterval(() => { if (performance.now() - ROB.lastB > 420) robPulse(0.55 + Math.random() * 0.45); }, 210);
      } catch (e) { ROB.n = null; }
    }
    function robStop() {
      clearInterval(ROB.timer); ROB.timer = 0;
      const n = ROB.n; if (!n) return; ROB.n = null;
      try {
        const t = Audio2.ctx.currentTime;
        n.env.gain.cancelScheduledValues(t); n.env.gain.setTargetAtTime(0.0001, t, 0.04);
        n.a.stop(t + 0.25); n.b.stop(t + 0.25); n.lfo.stop(t + 0.25);
      } catch (e) {}
    }
    {
      const _hs = droidHumStart, _hp = droidHumStop;
      droidHumStart = function () { try { robStart(); } catch (e) {} return _hs.apply(this, arguments); };
      droidHumStop = function () { try { robStop(); } catch (e) {} return _hp.apply(this, arguments); };
    }
    /* les événements « mot » battent la mesure ; « start » arme la relance anti-coupure */
    {
      const _sp = ss.speak;
      ss.speak = function (u) {
        try {
          u.addEventListener('boundary', () => { ROB.lastB = performance.now(); robPulse(1); });
          u.addEventListener('start', () => { ROB.u0 = performance.now(); });
        } catch (e) {}
        return _sp.call(this, u);
      };
    }
    setInterval(() => {
      try { if (DROID.busy && ss.speaking && !ss.paused && performance.now() - ROB.u0 > 8000) { ss.pause(); ss.resume(); ROB.u0 = performance.now() - 2000; } } catch (e) {}
    }, 5000);
    /* curseur « Effet robot » dans les réglages de voix */
    {
      const _rows = voiceOptionsRows;
      voiceOptionsRows = function (add) {
        _rows(add);
        const o = S.opts; if (!o.speech) return;
        const r = add(`<div><label>${T('Effet robot', 'Robot effect')}<span class="hint">${T('Couche métallique ajoutée par le jeu : marche avec toutes les voix, y compris celles en ligne (☁)', 'Metallic layer added by the game: works with every voice, including online ones (☁)')}</span></label></div>
          <div class="ctl"><input type="range" min="0" max="100" step="5" value="${nvv('voiceRobot')}"><span style="min-width:48px;text-align:right;color:#ffe066">${nvv('voiceRobot')}%</span></div>`);
        const inp = r.querySelector('input'), out = r.querySelector('.ctl span');
        inp.oninput = () => { o.voiceRobot = +inp.value; out.textContent = o.voiceRobot + '%'; saveGame(); };
        inp.onchange = () => { try { voSample(null); } catch (e) {} };
        const listen = r.previousElementSibling && r.previousElementSibling.querySelector('#voListen') ? r.previousElementSibling : null;
        if (listen) listen.parentNode.insertBefore(r, listen);
        const v = (() => { try { return droidVoice((LANGS.find(l => l.id === LANG) || LANGS[0]).code); } catch (e) { return null; } })();
        if (v && !v.localService) {
          const n = document.createElement('div'); n.className = 'opt';
          n.innerHTML = `<div><label>☁ ${T('Voix en ligne sélectionnée', 'Online voice selected')}<span class="hint">${T('Ces voix ignorent la hauteur : choisis une voix locale (sans ☁) pour un timbre vraiment grave.', 'Online voices ignore pitch: pick a local voice (no ☁) for a truly deep timbre.')}</span></label></div><div class="ctl"></div>`;
          r.parentNode.insertBefore(n, r);
        }
      };
    }
  }
})();


/* ---- 99_menus_pc.js ---- */
/* =============================================================================
   MENUS PC : ils occupent enfin la place de l'écran
   -----------------------------------------------------------------------------
   Sur un grand écran, options, boutique, records, codes... restaient dans une
   boîte de 680 à 1000 px, au milieu d'un grand vide. Sur PC (souris), tout ce
   qui n'est pas le jeu est maintenant mis à l'échelle de la fenêtre (textes,
   boutons, cartes) et les panneaux s'élargissent : les options passent sur
   deux colonnes, la boutique et les codes affichent plus de cartes par ligne.
   Le tactile et les petites fenêtres gardent exactement l'ancienne mise en page.
   ========================================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  function nvzApply() {
    const W = innerWidth, H = innerHeight;
    const pc = !IS_TOUCH && W >= 900 && H >= 560;
    const z = pc ? clamp(Math.min(W / 1280, H / 760), 1, 1.7) : 1;
    root.style.setProperty('--nvz', z.toFixed(3));
    root.style.setProperty('--nvzt', (pc ? clamp(H / 1040, 1, Math.min(1.4, z)) : 1).toFixed(3));   /* l'écran titre doit tenir en hauteur */
    root.classList.toggle('nvpc', pc);
  }
  nvzApply();
  addEventListener('resize', nvzApply);
  document.addEventListener('fullscreenchange', () => { setTimeout(nvzApply, 60); setTimeout(nvzApply, 400); });
  const st = document.createElement('style');
  st.textContent = `
  html.nvpc .panel{zoom:var(--nvz);max-height:calc(94vh / var(--nvz));width:min(1000px,calc(96vw / var(--nvz)))}
  html.nvpc .panel.narrow{width:min(680px,calc(94vw / var(--nvz)))}
  html.nvpc #scr-options .panel.narrow{width:min(1180px,calc(96vw / var(--nvz)))}
  html.nvpc #scr-shop .panel{width:min(1560px,calc(96vw / var(--nvz)))}
  html.nvpc #scr-records .panel,html.nvpc #scr-cheats .panel{width:min(1320px,calc(96vw / var(--nvz)))}
  html.nvpc #scr-help .panel.narrow,html.nvpc #scr-credits .panel.narrow{width:min(860px,calc(94vw / var(--nvz)))}
  html.nvpc #scr-online .panel.narrow{width:min(860px,calc(94vw / var(--nvz)))}
  html.nvpc #scr-online .panel.narrow,html.nvpc #scr-victory .panel.narrow,html.nvpc #scr-clear .panel.narrow,
  html.nvpc #scr-pause .panel.narrow,html.nvpc #scr-over .panel.narrow{max-width:none}
  html.nvpc #scr-victory .panel.narrow,html.nvpc #scr-clear .panel.narrow,html.nvpc #scr-over .panel.narrow{width:min(720px,calc(94vw / var(--nvz)))}
  html.nvpc #scr-pause .panel.narrow{width:min(480px,calc(94vw / var(--nvz)))}
  /* options : deux colonnes quand le panneau est large */
  html.nvpc #scr-options .opt-section-body{container-type:inline-size}
  @container (min-width:900px){
    #scr-options .opt-section-body>.opt{grid-column:auto}
  }
  html.nvpc #scr-options .opt-section{padding:14px 18px 10px}
  @media (min-width:1500px){
    html.nvpc #scr-options .opt-section-body{display:block;columns:2;column-gap:34px}
    html.nvpc #scr-options .opt-section-body>.opt{break-inside:avoid}
    html.nvpc #scr-options .opt-section-body>.opt-sub{column-span:all;margin-top:10px}
  }
  /* boutique : cartes plus nombreuses par ligne */
  html.nvpc #scr-shop .grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
  html.nvpc .hangar{grid-template-columns:minmax(300px,420px) 1fr}
  /* codes : plusieurs colonnes */
  html.nvpc #scr-cheats #cheatGrid{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
  /* menu titre : colonne de gauche plus grande, sans manger tout le visuel */
  html.nvpc #nvTitle .nv-left{zoom:var(--nvzt)}
  /* fenêtres modales de la boutique / négociation */
  html.nvpc #buyModal>*,html.nvpc #negoModal>*{zoom:min(var(--nvz),1.5)}
  `;
  document.head.appendChild(st);
})();


/* ---- 99_shop_art.js ---- */
/* Boutique illustrée : nouveaux rendus des 7 vaisseaux (SHIP_ART remplacé),
   images d'équipement (armes, améliorations, bombe) et aperçus dessinés en
   canvas pour livrées, traînées et auras. Aucune dépendance réseau.        */
(function nvShopArt() {
  const SHIPS_IMG = {"falcon": "assets/media/ships-shop/falcon.webp", "falconA": "assets/media/ships-shop/falconA.webp", "falconB": "assets/media/ships-shop/falconB.webp", "viper": "assets/media/ships-shop/viper.webp", "titan": "assets/media/ships-shop/titan.webp", "spectre": "assets/media/ships-shop/spectre.webp", "singularis": "assets/media/ships-shop/singularis.webp"};   /* réacteurs éteints, Singularis ajouté */
  const ITEMS_IMG = {"bomb": "assets/media/media-108.webp", "credit": "assets/media/media-109.webp", "dmg": "assets/media/media-110.webp", "drone": "assets/media/media-111.webp", "engine": "assets/media/media-112.webp", "hull": "assets/media/media-113.webp", "laser": "assets/media/media-114.webp", "luck": "assets/media/media-115.webp", "magnet": "assets/media/media-116.webp", "plasma": "assets/media/media-117.webp", "pulse": "assets/media/media-118.webp", "rail": "assets/media/media-119.webp", "rate": "assets/media/media-120.webp", "shield": "assets/media/media-121.webp", "spread": "assets/media/media-122.webp"};
  /* 1) nouveaux rendus des vaisseaux : le plateau, la modale d'achat et les cartes les utilisent */
  const reTint = () => { try { SV_TINT.clear(); } catch (e) {} };
  for (const k in SHIPS_IMG) {
    SHIP_ART[k] = SHIPS_IMG[k];
    const im = new Image(); im.onload = () => { reTint(); try { if (typeof shopTab !== 'undefined' && document.getElementById('scr-shop') && document.getElementById('scr-shop').classList.contains('on')) buildShop(); } catch (e) {} };
    im.src = SHIPS_IMG[k]; SV_IMG[k] = im;
  }
  /* images d'équipement (fond noir : fusion « screen ») */
  ITEMS_IMG.homing = 'assets/media/homing-item.webp';   /* image détourée (fond transparent) : pas de fusion « screen » */
  const IT = {};
  for (const k in ITEMS_IMG) { const im = new Image(); im.src = ITEMS_IMG[k]; IT[k] = im; }
  const WCOL = { pulse: '63,220,255', spread: '255,170,60', laser: '255,70,120', plasma: '150,255,140', rail: '120,170,255', homing: '99,220,255', bomb: '255,110,60',
    hull: '120,200,255', engine: '80,170,255', rate: '255,224,102', drone: '90,230,255', shield: '70,220,255', magnet: '255,90,90', credit: '255,210,90', dmg: '255,90,60', luck: '120,255,160' };
  const css = document.createElement('style'); css.id = 'nvShopArtCss';
  css.textContent = `
  .nvArt{position:relative;height:122px;margin:0 0 9px;border-radius:9px;overflow:hidden;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(ellipse at 50% 62%,rgba(var(--nva,63,182,255),.30),rgba(6,10,20,.92) 72%),#060a14;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
  .nvArt::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.07),transparent 38%)}
  .nvArt canvas{filter:brightness(1.14) contrast(1.06)}
  .nvArt img,.nvArt canvas{position:relative;width:100%;height:100%;object-fit:contain;transition:transform .35s cubic-bezier(.2,.8,.2,1),filter .3s}
  .nvArt img{mix-blend-mode:screen}
  .nvArt img[src*="homing-item"],.nvChipImg[src*="homing-item"]{mix-blend-mode:normal;filter:drop-shadow(0 4px 6px rgba(0,0,0,.55))}
  .nvArt img[src*="homing-item"]{width:88%;height:88%}
  .card:hover .nvArt img,.card:hover .nvArt canvas{transform:scale(1.07)}
  .card.locked .nvArt img{filter:saturate(.8) brightness(.92)}
  .card.locked .nvArt canvas{filter:brightness(1.05) saturate(.85)}
  .nvArt.sh{height:132px}
  .card .badge{z-index:2}
  .nvChipImg{height:20px;width:auto;margin:-5px 6px -5px -4px;vertical-align:middle;mix-blend-mode:screen;border-radius:3px}
  html.nvpc .nvArt{height:150px}
  html.nvpc .nvArt.sh{height:164px}
  `;
  document.head.appendChild(css);
  /* ---------- utilitaires de dessin ---------- */
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function glowBg(g, w, h, col, a, cy) {
    const y = h * (cy || .56), r = w * .5, k = (h * .5) / r * 0.98;
    g.save(); g.translate(w / 2, y); g.scale(1, k);
    const gr = g.createRadialGradient(0, 0, 2, 0, 0, r);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(.6, `rgba(${col},${a * .3})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(-w / 2, -y / k, w, h / k); g.restore();
  }
  function drawShip(g, w, h, shipId, liveryId, k, redo) {
    const t = svTinted(shipId in SV_IMG ? shipId : 'falcon', liveryId);
    if (!t) { const im = SV_IMG[shipId] || SV_IMG.falcon; if (im && redo && !im.complete) im.addEventListener('load', redo, { once: true }); return null; }
    const s = w * (k || .96);
    g.drawImage(t.c, (w - s) / 2, (h - s) / 2 + h * .02, s, s);
    return t.pal;
  }
  function star(g, x, y, r) {
    g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  }
  /* ---------- auras ---------- */
  function auraLayer(g, w, h, id, col, front) {
    const R = rng(id.length * 977 + 13), cx = w / 2, cy = h * .56, rx = w * .36, ry = h * .34;
    g.save(); g.globalCompositeOperation = 'lighter';
    if (id === 'flame') {
      if (!front) { glowBg(g, w, h, '255,110,30', .55, .6); }
      for (let i = 0; i < 22; i++) {
        const a = Math.PI * (0.05 + 0.9 * i / 21) + Math.PI, ex = cx + Math.cos(a) * rx * (.8 + R() * .3), ey = cy + Math.sin(a) * ry * (.8 + R() * .3) * .9;
        if ((ey < cy) === !!front) continue;
        const ln = 20 + R() * 34, ox = Math.cos(a), oy = Math.sin(a) - .35;
        const gr = g.createLinearGradient(ex, ey, ex + ox * ln, ey + oy * ln);
        gr.addColorStop(0, 'rgba(255,230,120,.9)'); gr.addColorStop(.5, 'rgba(255,120,30,.6)'); gr.addColorStop(1, 'rgba(255,40,0,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(ex - 6, ey); g.quadraticCurveTo(ex + ox * ln * .5 - 3, ey + oy * ln * .6, ex + ox * ln, ey + oy * ln); g.quadraticCurveTo(ex + ox * ln * .5 + 6, ey + oy * ln * .4, ex + 6, ey); g.fill();
      }
    } else if (id === 'cryo') {
      if (!front) glowBg(g, w, h, '110,230,255', .5, .56);
      for (let i = 0; i < 18; i++) {
        const a = R() * 6.283, d = .75 + R() * .35, x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d * 1.05;
        if ((y < cy) === !!front) continue;
        const ln = 12 + R() * 22, an = a + (R() - .5) * .8;
        g.fillStyle = `rgba(${200 + R() * 55 | 0},245,255,${.55 + R() * .35})`;
        g.beginPath(); g.moveTo(x + Math.cos(an + 1.57) * 3, y + Math.sin(an + 1.57) * 3); g.lineTo(x + Math.cos(an) * ln, y + Math.sin(an) * ln); g.lineTo(x + Math.cos(an - 1.57) * 3, y + Math.sin(an - 1.57) * 3); g.closePath(); g.fill();
      }
      if (front) { g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 10; i++) star(g, cx + (R() - .5) * w * .8, cy + (R() - .5) * h * .7, 2 + R() * 3); }
    } else if (id === 'volt') {
      if (!front) glowBg(g, w, h, '170,120,255', .4, .56);
      if (front) {
        g.strokeStyle = 'rgba(225,205,255,.95)'; g.shadowColor = '#b48cff'; g.shadowBlur = 10; g.lineWidth = 1.6; g.lineJoin = 'round';
        for (let i = 0; i < 7; i++) {
          let a = R() * 6.283, x = cx + Math.cos(a) * rx * .55, y = cy + Math.sin(a) * ry * .5; g.beginPath(); g.moveTo(x, y);
          for (let j = 0; j < 7; j++) { a += (R() - .5) * 1.1; x += Math.cos(a) * 11 + (x - cx) * .03; y += Math.sin(a) * 9 + (y - cy) * .03; g.lineTo(x, y); }
          g.stroke();
        }
      }
    } else if (id === 'gold') {
      if (!front) { glowBg(g, w, h, '255,200,60', .5, .56); }
      g.strokeStyle = 'rgba(255,220,110,.75)'; g.shadowColor = '#ffd45a'; g.shadowBlur = 8; g.lineWidth = 2;
      const rings = front ? [[1.05, .5]] : [[.85, .78], [1.2, .4]];
      for (const [k, al] of rings) { g.globalAlpha = al; g.beginPath(); g.ellipse(cx, cy, rx * k, ry * k * .82, 0, front ? 0 : Math.PI, front ? Math.PI : 6.283); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = 'rgba(255,240,170,.95)';
      if (front) for (let i = 0; i < 9; i++) star(g, cx + (R() - .5) * w * .85, cy + (R() - .5) * h * .8, 3 + R() * 4);
    }
    g.restore();
  }
  function drawAuraBanner(c, auraId, shipId, liveryId) {
    const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    const au = AURAS.find(a => a.id === auraId) || {};
    const redo = () => drawAuraBanner(c, auraId, shipId, liveryId);
    if (auraId !== 'none') auraLayer(g, w, h, auraId, au.col, false);
    g.save(); if (au.col) { g.shadowColor = au.col; g.shadowBlur = 14; }
    const pal = drawShip(g, w, h, shipId, liveryId, .92, redo); g.restore();
    if (auraId !== 'none') auraLayer(g, w, h, auraId, au.col, true);
  }
  /* ---------- traînées ---------- */
  function drawTrailBanner(c, id) {
    const g = c.getContext('2d'), w = c.width, h = c.height, R = rng(id.length * 331 + 7);
    g.clearRect(0, 0, w, h);
    const nx = w * .74, ny = h * .52;
    const pal = { pixel: ['255,200,60', '255,110,30'], plasma: ['120,235,255', '60,120,255'], ion: ['210,235,255', '110,170,255'], quantum: ['200,160,255', '120,90,255'] }[id] || ['120,235,255', '60,120,255'];
    g.save(); g.globalCompositeOperation = 'lighter';
    if (id === 'pixel') {
      const px = 9;
      for (let i = 0; i < 46; i++) {
        const d = i / 46, x = Math.round((nx - d * w * .66) / px) * px, y = Math.round((ny + (R() - .5) * (6 + d * 40)) / px) * px, sz = px * (1 - d * .55) | 0 || 3;
        g.fillStyle = `rgba(${d < .4 ? pal[0] : pal[1]},${1 - d * .85})`; g.fillRect(x, y, sz, sz);
      }
    } else if (id === 'plasma') {
      for (let i = 0; i < 4; i++) {
        const gr = g.createLinearGradient(nx, 0, nx - w * .7, 0); gr.addColorStop(0, `rgba(${pal[0]},${.8 - i * .15})`); gr.addColorStop(.5, `rgba(${pal[1]},${.4 - i * .07})`); gr.addColorStop(1, `rgba(${pal[1]},0)`);
        g.fillStyle = gr; g.beginPath(); g.moveTo(nx, ny - 9 - i * 4); g.quadraticCurveTo(nx - w * .35, ny - 22 - i * 9, nx - w * .7, ny); g.quadraticCurveTo(nx - w * .35, ny + 22 + i * 9, nx, ny + 9 + i * 4); g.fill();
      }
      glowBg(g, w, h, pal[1], .35, .52);
    } else if (id === 'ion') {
      for (let i = 0; i < 9; i++) {
        const oy = (i - 4) * 7 + (R() - .5) * 4, ln = w * (.35 + R() * .4), x0 = nx - R() * 14;
        const gr = g.createLinearGradient(x0, 0, x0 - ln, 0); gr.addColorStop(0, `rgba(${pal[0]},.95)`); gr.addColorStop(1, `rgba(${pal[1]},0)`);
        g.strokeStyle = gr; g.lineWidth = 2.2 - Math.abs(i - 4) * .22; g.beginPath(); g.moveTo(x0, ny + oy * .5); g.quadraticCurveTo(x0 - ln * .5, ny + oy * .8, x0 - ln, ny + oy * 1.8); g.stroke();
        g.fillStyle = `rgba(255,255,255,.9)`; g.beginPath(); g.arc(x0, ny + oy * .5, 2, 0, 6.283); g.fill();
      }
    } else if (id === 'quantum') {
      g.strokeStyle = `rgba(${pal[1]},.35)`; g.lineWidth = 1.4;
      for (let k = 1; k <= 3; k++) { g.globalAlpha = 1 / (k + .6); g.beginPath(); g.arc(nx - k * 34, ny, 10 + k * 3, 0, 6.283); g.stroke(); }
      g.globalAlpha = 1;
      for (let i = 0; i < 40; i++) {
        const d = i / 40, x = nx - d * w * .68, y = ny + Math.sin(d * 14 + i) * (8 + d * 28) * (i % 2 ? 1 : -1);
        g.fillStyle = `rgba(${i % 3 ? pal[0] : pal[1]},${1 - d * .8})`; g.beginPath(); g.arc(x, y, 3.2 - d * 2, 0, 6.283); g.fill();
      }
      glowBg(g, w, h, pal[1], .3, .52);
    }
    g.restore();
    /* tuyère */
    const gr = g.createLinearGradient(0, ny - 14, 0, ny + 14); gr.addColorStop(0, '#e8eefb'); gr.addColorStop(.5, '#8e9bb5'); gr.addColorStop(1, '#4a566e');
    g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(nx, ny - 14, 40, 28, 5) : g.rect(nx, ny - 14, 40, 28); g.fill();
    g.fillStyle = `rgb(${pal[0]})`; g.shadowColor = `rgb(${pal[1]})`; g.shadowBlur = 14; g.beginPath(); g.ellipse(nx + 1, ny, 5, 10, 0, 0, 6.283); g.fill(); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(nx + 8, ny - 12, 28, 3);
  }
  /* ---------- modale d'achat : vignette d'équipement ---------- */
  function drawItemModal(cv, key) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height; g.clearRect(0, 0, w, h);
    g.fillStyle = '#060a14'; g.fillRect(0, 0, w, h); glowBg(g, w, h, WCOL[key] || '63,182,255', .38, .5);
    const im = IT[key]; if (!im) return false;
    const draw = () => { g.globalCompositeOperation = key === 'homing' ? 'source-over' : 'lighter'; const k = Math.min(w / im.naturalWidth, h / im.naturalHeight) * 1.0; const iw = im.naturalWidth * k, ih = im.naturalHeight * k; g.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); g.globalCompositeOperation = 'source-over'; };
    if (im.complete && im.naturalWidth) draw(); else im.addEventListener('load', draw, { once: true });
    return true;
  }
  const _openConfirm = openConfirm;
  openConfirm = function (listKey, id, price) {
    _openConfirm(listKey, id, price);
    try {
      const cv = document.getElementById('bmHolo'); if (!cv || !CONFIRM.open) return;
      let key = null; if (listKey === 'weapons' || listKey === 'upgrades') key = id; else if (listKey === 'bombs') key = 'bomb';
      if (key && IT[key]) { holoStop(cv); drawItemModal(cv, key); }
      else if (listKey === 'trails') { holoStop(cv); const g = cv.getContext('2d'); g.fillStyle = '#060a14'; g.fillRect(0, 0, cv.width, cv.height); const c = mk(360, 200); drawTrailBanner(c, id); g.drawImage(c, 0, (cv.height - cv.width * 200 / 360) / 2, cv.width, cv.width * 200 / 360); }
      else if (listKey === 'auras') { holoStop(cv); const c = mk(360, 200); const g = cv.getContext('2d'); const paint = () => { g.fillStyle = '#060a14'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(c, 0, (cv.height - cv.width * 200 / 360) / 2, cv.width, cv.width * 200 / 360); }; drawAuraBanner(c, id, S.sel.ship, S.sel.livery); paint(); setTimeout(paint, 250); setTimeout(paint, 900); }
    } catch (e) { console.warn('nvShopArt modal', e); }
  };
  /* ---------- cartes de la boutique ---------- */
  function addBanner(card, kind, cls, accent) {
    if (!card || card.querySelector('.nvArt')) return null;
    const d = document.createElement('div'); d.className = 'nvArt' + (cls ? ' ' + cls : '');
    if (accent) d.style.setProperty('--nva', accent);
    card.insertBefore(d, card.firstChild); return d;
  }
  function itemBanner(card, key) {
    const im = IT[key]; if (!im) return;
    const d = addBanner(card, 'item', '', WCOL[key]); if (!d) return;
    const e = new Image(); e.src = im.src; e.alt = ''; e.decoding = 'async'; e.draggable = false; d.appendChild(e);
  }
  function canvasBanner(card, cls, accent, paint) {
    const d = addBanner(card, 'cv', cls, accent); if (!d) return;
    const c = mk(360, 200); d.appendChild(c); paint(c);
  }
  function decorateShop() {
    const grid = document.getElementById('shopGrid'); if (!grid || typeof shopTab === 'undefined') return;
    if (shopTab === 'hangar') { decorateHangar(grid); return; }
    const cards = [...grid.querySelectorAll('.card.shop-item')];
    if (shopTab === 'ships') {
      cards.forEach((el, i) => { const s = SHIPS[i]; if (!s) return; canvasBanner(el, 'sh', '63,182,255', c => drawShipOn(c, s.id, S.sel.livery)); });
    } else if (shopTab === 'weapons') {
      cards.forEach((el, i) => {
        if (i < WEAPONS.length) itemBanner(el, WEAPONS[i].id);
        else if (i === WEAPONS.length) itemBanner(el, 'bomb');
        else {
          const skin = BULLET_SKINS[i - WEAPONS.length - 1]; if (!skin) return;
          canvasBanner(el, '', '63,182,255', c => {
            const g = c.getContext('2d'); g.fillStyle = '#070d1a'; g.fillRect(0,0,c.width,c.height);
            [skin.glow, skin.main, skin.lite].forEach((col,j) => { g.fillStyle=col; g.fillRect(76+j*68,88,42,24); g.fillStyle=col; g.fillRect(89+j*68,68,16,64); });
          });
        }
      });
    } else if (shopTab === 'upgrades') {
      const list = UPGRADES.filter(x => !x.consumable); cards.forEach((el, i) => { if (list[i]) itemBanner(el, list[i].id); });
    } else if (shopTab === 'custom') {
      const nL = LIVERIES.length, nT = TRAILS.length;
      cards.forEach((el, i) => {
        if (i < nL) { const it = LIVERIES[i]; canvasBanner(el, 'sh', '63,182,255', c => drawShipOn(c, S.sel.ship, it.id)); }
        else if (i < nL + nT) { const it = TRAILS[i - nL]; canvasBanner(el, '', '120,160,255', c => drawTrailBanner(c, it.id)); }
        else { const it = AURAS[i - nL - nT]; if (it) canvasBanner(el, 'sh', it.col ? hexRgb(it.col) : '63,182,255', c => drawAuraBanner(c, it.id, S.sel.ship, S.sel.livery)); }
      });
    }
  }
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255); }
  function drawShipOn(c, shipId, liveryId) {
    const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    const pal = drawShip(g, w, h, shipId, liveryId, .98, () => drawShipOn(c, shipId, liveryId));
    if (pal) { c.parentNode && c.parentNode.style.setProperty('--nva', pal.energy.join(',')); }
  }
  function decorateHangar(grid) {
    grid.querySelectorAll('.chip[data-k="weapons"]').forEach(b => { const id = b.dataset.id; if (IT[id] && !b.querySelector('.nvChipImg')) { const i = new Image(); i.src = IT[id].src; i.className = 'nvChipImg'; b.insertBefore(i, b.firstChild); } });
    const ups = UPGRADES.filter(u => !u.consumable);
    const row = [...grid.querySelectorAll('.hrow')].find(r => /INSTALL/i.test((r.querySelector('.hlab') || {}).textContent || '') || r.querySelectorAll('.chip[style*="cursor:default"]').length);
    if (row) row.querySelectorAll('.chip').forEach((b, i) => { const u = ups[i]; if (u && IT[u.id] && !b.querySelector('.nvChipImg')) { const im = new Image(); im.src = IT[u.id].src; im.className = 'nvChipImg'; b.insertBefore(im, b.firstChild); } });
  }
  const _buildShop = buildShop;
  buildShop = function () { _buildShop.apply(this, arguments); try { decorateShop(); } catch (e) { console.warn('nvShopArt', e); } };
  window.__nvShopArt = { IT, ships: Object.keys(SHIPS_IMG), items: Object.keys(ITEMS_IMG) };
})();


/* ---- 99_campaign2.js : variété (ennemis, boss, décors), base de VORAX, difficulté croissante ---- */
{

/* ---- 99_campaign2.js — A : ennemis nouveaux, courbe de difficulté, plan de vagues ------------------
   Treize engins inédits, six mini-boss de plus, une table de rosters par secteur (24 lignes) et un
   plan de vagues « à budget » : la menace totale de chaque vague ne dépend que du niveau global
   (1 → 24), jamais de la zone ni de la génération. Résultat : la difficulté ne retombe plus.     */
{
  const RR = (x, y, w, h, c) => { const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2;
    return [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]]; };
  const spikes = (n, r0, r1, w) => { const out = []; for (let i = 0; i < n; i++) { const a = i / n * TAU;
    const ca = Math.cos(a), sa = Math.sin(a), pa = Math.cos(a + w), pb = Math.sin(a + w), qa = Math.cos(a - w), qb = Math.sin(a - w);
    out.push([[ca * r1, sa * r1], [pa * r0, pb * r0], [qa * r0, qb * r0]]); } return out; };
  const saw = [];
  spikes(10, 0.72, 1.0, 0.2).forEach(p => saw.push(P(p, MAT.TRIM)));
  const spk = [];
  spikes(8, 0.62, 0.98, 0.26).forEach(p => spk.push(P(p, MAT.WING)));
  Object.assign(SIL, {
    /* orbiteur : noyau cerclé, deux satellites (dessinés par-dessus, en mouvement) */
    orbiter: { w: 1.0, parts: [
      P(discPiece(0.52, 0, 0, 14), MAT.HULL), P(discPiece(0.38, 0, 0, 14), MAT.WING, 0, 'panel'),
      P(discPiece(0.2, 0, 0, 12), MAT.DARK), P(discPiece(0.11, 0, 0, 10), MAT.GLOW),
      ...ringPiece(0.66, 0.82, 4, 0.7, 0, 0, 0.4).map(p => P(p, MAT.TRIM, 1)),
      P(rectP(0, -0.9, 0.12, 0.2), MAT.ACCENT, 1), P(rectP(0, 0.9, 0.12, 0.2), MAT.ACCENT, 1),
    ] },
    /* fonceur : une dague plate, nez en bas */
    dasher: { w: 0.72, parts: [
      P([[0, -1], [0.3, 0.05], [0.56, 0.74], [0, 0.46], [-0.56, 0.74], [-0.3, 0.05]], MAT.HULL),
      P([[0, -0.78], [0.16, 0.0], [0, 0.3], [-0.16, 0.0]], MAT.WING, 0, 'panel'),
      P([[0, -0.4], [0.07, -0.1], [0, 0.04], [-0.07, -0.1]], MAT.GLOW),
      P([[0.26, 0.1], [0.52, 0.62], [0.36, 0.56]], MAT.TRIM, 1), P([[-0.26, 0.1], [-0.52, 0.62], [-0.36, 0.56]], MAT.TRIM, 1),
      P(rectP(0, 0.56, 0.12, 0.2), MAT.ENGINE),
    ] },
    /* furtif : une raie plate, œil unique */
    cloaker: { w: 1.24, parts: [
      P([[0, -0.74], [1, 0.4], [0.52, 0.24], [0, 0.66], [-0.52, 0.24], [-1, 0.4]], MAT.HULL),
      P([[0, -0.5], [0.62, 0.26], [0, 0.46], [-0.62, 0.26]], MAT.WING, 0, 'panel'),
      P(ellipsePiece(0.16, 0.22, 0, 0.02, 10), MAT.DARK), P(ellipsePiece(0.08, 0.11, 0, 0.02, 8), MAT.GLOW),
      P(rectP(-0.62, 0.34, 0.26, 0.06), MAT.TRIM, 1), P(rectP(0.62, 0.34, 0.26, 0.06), MAT.TRIM, 1),
      P(rectP(0, 0.7, 0.2, 0.1), MAT.ENGINE),
    ] },
    /* scie : disque denté qui tourne */
    bladespin: { w: 1.0, parts: [
      ...saw, P(discPiece(0.76, 0, 0, 16), MAT.HULL), P(discPiece(0.56, 0, 0, 14), MAT.WING, 0, 'panel'),
      P(discPiece(0.3, 0, 0, 12), MAT.DARK), P(discPiece(0.14, 0, 0, 10), MAT.GLOW),
      P(rectP(0, 0, 1.2, 0.07), MAT.ACCENT, 1), P(rectP(0, 0, 0.07, 1.2), MAT.ACCENT, 1),
    ] },
    /* rampant : tourelle sur rail, le canon pointe vers le haut du sprite */
    crawler: { w: 0.9, parts: [
      P(RR(0, 0.24, 0.92, 0.62, 0.14), MAT.HULL), P(RR(0, 0.24, 0.72, 0.44, 0.1), MAT.WING, 0, 'panel'),
      P(rectP(0, -0.52, 0.22, 0.86), MAT.DARK), P(rectP(0, -0.52, 0.1, 0.86), MAT.TRIM, 1),
      P(discPiece(0.2, 0, 0.02, 10), MAT.GLASS, 1), P(discPiece(0.09, 0, 0.02, 8), MAT.GLOW),
      P(rectP(-0.44, 0.6, 0.2, 0.2), MAT.ENGINE), P(rectP(0.44, 0.6, 0.2, 0.2), MAT.ENGINE),
    ] },
    /* médecin : capsule blanche à croix, rotors */
    medic: { w: 1.1, parts: [
      P(ellipsePiece(0.62, 0.66, 0, 0, 16), MAT.HULL), P(ellipsePiece(0.5, 0.54, 0, 0, 14), MAT.WING, 0, 'panel'),
      P(rectP(0, 0, 0.62, 0.2), MAT.GLOW), P(rectP(0, 0, 0.2, 0.62), MAT.GLOW),
      P(discPiece(0.18, -0.84, -0.06, 10), MAT.TRIM, 1), P(discPiece(0.18, 0.84, -0.06, 10), MAT.TRIM, 1),
      P(rectP(-0.62, -0.06, 0.3, 0.07), MAT.DARK), P(rectP(0.62, -0.06, 0.3, 0.07), MAT.DARK),
      P(rectP(0, 0.7, 0.24, 0.14), MAT.ENGINE),
    ] },
    /* serpent : tête en fer de lance, mandibules */
    serpent: { w: 0.84, parts: [
      P([[0, -0.96], [0.5, -0.1], [0.42, 0.64], [0, 0.82], [-0.42, 0.64], [-0.5, -0.1]], MAT.HULL),
      P([[0.5, -0.1], [0.92, -0.62], [0.74, 0.12]], MAT.TRIM), P([[-0.5, -0.1], [-0.92, -0.62], [-0.74, 0.12]], MAT.TRIM),
      P([[0, -0.7], [0.26, -0.1], [0, 0.34], [-0.26, -0.1]], MAT.WING, 0, 'panel'),
      P(discPiece(0.12, -0.14, -0.12, 8), MAT.GLOW), P(discPiece(0.12, 0.14, -0.12, 8), MAT.GLOW),
      P(rectP(0, 0.7, 0.2, 0.16), MAT.ENGINE),
    ] },
    segment: { w: 0.9, parts: [
      P(ellipsePiece(0.8, 0.8, 0, 0, 14), MAT.HULL), P(ellipsePiece(0.56, 0.56, 0, 0, 12), MAT.WING, 0, 'panel'),
      P(discPiece(0.22, 0, 0, 10), MAT.GLOW), P(rectP(0, 0, 1.5, 0.12), MAT.TRIM, 1),
    ] },
    /* boulet : sphère hérissée de pointes */
    bouncer: { w: 1.0, parts: [
      ...spk, P(discPiece(0.7, 0, 0, 16), MAT.HULL), P(discPiece(0.5, 0, 0, 14), MAT.WING, 0, 'panel'),
      P(discPiece(0.26, 0, 0, 12), MAT.DARK), P(discPiece(0.13, 0, 0, 10), MAT.GLOW),
    ] },
    /* canonnière : aile large, deux canons, pods de missiles */
    gunship: { w: 1.5, parts: [
      P([[-1, 0.3], [-0.5, -0.3], [-0.2, -0.46], [0.2, -0.46], [0.5, -0.3], [1, 0.3], [0.7, 0.62], [-0.7, 0.62]], MAT.HULL),
      P([[-0.62, 0.22], [-0.3, -0.2], [0.3, -0.2], [0.62, 0.22], [0.4, 0.44], [-0.4, 0.44]], MAT.WING, 0, 'panel'),
      P(rectP(-0.46, -0.66, 0.1, 0.62), MAT.DARK), P(rectP(0.46, -0.66, 0.1, 0.62), MAT.DARK),
      P(rectP(-0.46, -0.66, 0.05, 0.62), MAT.TRIM, 1), P(rectP(0.46, -0.66, 0.05, 0.62), MAT.TRIM, 1),
      P(ellipsePiece(0.16, 0.26, 0, -0.1, 10), MAT.GLASS, 1), P(discPiece(0.08, 0, -0.1, 8), MAT.GLOW),
      P(rectP(-0.84, 0.36, 0.2, 0.3), MAT.DARK), P(rectP(0.84, 0.36, 0.2, 0.3), MAT.DARK),
      P(rectP(-0.3, 0.7, 0.18, 0.16), MAT.ENGINE), P(rectP(0.3, 0.7, 0.18, 0.16), MAT.ENGINE),
      P(rectP(0, 0.3, 1.3, 0.05), MAT.TRIM, 2, 'rivet'),
    ] },
    /* pulsar : hexagone à émetteur central, six ailerons */
    pulsar: { w: 1.1, parts: [
      ...spikes(6, 0.5, 1.0, 0.3).map(p => P(p, MAT.WING)),
      P(discPiece(0.62, 0, 0, 6), MAT.HULL), P(discPiece(0.46, 0, 0, 6), MAT.WING, 0, 'panel'),
      ...ringPiece(0.3, 0.4, 3, 0.5, 0, 0, 0).map(p => P(p, MAT.TRIM, 1)),
      P(discPiece(0.22, 0, 0, 12), MAT.DARK), P(discPiece(0.14, 0, 0, 10), MAT.GLOW),
    ] },
    /* prisme : un cristal triangulaire, trois pointes lumineuses */
    prism: { w: 0.98, parts: [
      P([[0, -1], [0.92, 0.68], [-0.92, 0.68]], MAT.HULL),
      P([[0, -0.66], [0.58, 0.46], [-0.58, 0.46]], MAT.WING, 0, 'panel'),
      P([[0, -0.3], [0.3, 0.26], [-0.3, 0.26]], MAT.GLASS, 1), P(discPiece(0.1, 0, 0.1, 8), MAT.GLOW),
      P(discPiece(0.08, 0, -0.9, 8), MAT.ACCENT, 1), P(discPiece(0.08, 0.84, 0.64, 8), MAT.ACCENT, 1), P(discPiece(0.08, -0.84, 0.64, 8), MAT.ACCENT, 1),
      P(rectP(0, 0.76, 0.5, 0.12), MAT.ENGINE),
    ] },
    /* foreuse : un cône strié, nez en bas */
    drillbot: { w: 0.66, parts: [
      P([[0, -1], [0.46, -0.1], [-0.46, -0.1]], MAT.TRIM), P([[0, -0.7], [0.3, -0.18], [-0.3, -0.18]], MAT.DARK, 0, 'vent'),
      P(RR(0, 0.34, 0.84, 0.86, 0.14), MAT.HULL), P(RR(0, 0.34, 0.6, 0.6, 0.1), MAT.WING, 0, 'panel'),
      P(discPiece(0.15, 0, 0.3, 8), MAT.GLOW), P(rectP(-0.3, 0.84, 0.18, 0.2), MAT.ENGINE), P(rectP(0.3, 0.84, 0.18, 0.2), MAT.ENGINE),
    ] },
    /* faucheur : ailes courbes en arc */
    swooper: { w: 1.1, parts: [
      P([[0, -0.84], [1, 0.34], [0.66, 0.2], [0.26, 0.64], [0, 0.3], [-0.26, 0.64], [-0.66, 0.2], [-1, 0.34]], MAT.HULL),
      P([[0, -0.56], [0.52, 0.14], [0.2, 0.3], [0, 0.12], [-0.2, 0.3], [-0.52, 0.14]], MAT.WING, 0, 'panel'),
      P(ellipsePiece(0.1, 0.16, 0, -0.18, 8), MAT.GLASS, 1), P(discPiece(0.06, 0, -0.18, 8), MAT.GLOW),
      P(rectP(0, 0.52, 0.12, 0.14), MAT.ENGINE),
    ] },
  });
  Object.assign(SPRITE_H, { orbiter: 74, dasher: 84, cloaker: 72, bladespin: 70, crawler: 70, medic: 70, serpent: 78, segment: 46,
    bouncer: 62, gunship: 96, pulsar: 94, prism: 80, drillbot: 92, swooper: 70 });
  Object.assign(ETYPES, {
    swooper:  { hp: 4,  r: 20, sc: 90,  cr: [1, 4],  mv: 'swoop',   mvx: 1,   fire: { n: 1, cd: 2.6, sp: 1, kind: 'aimed' }, tiers: 1 },
    bouncer:  { hp: 7,  r: 22, sc: 120, cr: [1, 5],  mv: 'bounce',  mvx: 1,   fire: null, tiers: 2 },
    serpent:  { hp: 9,  r: 22, sc: 190, cr: [3, 7],  mv: 'serpent', mvx: 1,   fire: { n: 1, cd: 2.2, sp: 1, kind: 'aimed' }, tiers: 2 },
    segment:  { hp: 4,  r: 15, sc: 50,  cr: [0, 2],  mv: 'segment', mvx: 1,   fire: null, tiers: 1 },
    dasher:   { hp: 6,  r: 19, sc: 140, cr: [2, 5],  mv: 'dash',    mvx: 1,   fire: null, tiers: 2 },
    crawler:  { hp: 10, r: 22, sc: 170, cr: [3, 6],  mv: 'wall',    mvx: 0.55, fire: { n: 2, cd: 2.0, sp: 1, kind: 'fan', arc: 0.34 }, tiers: 2 },
    bladespin:{ hp: 9,  r: 22, sc: 150, cr: [2, 6],  mv: 'sine',    mvx: 1,   fire: null, tiers: 2 },
    drillbot: { hp: 8,  r: 18, sc: 160, cr: [2, 6],  mv: 'drill',   mvx: 1,   fire: null, tiers: 3 },
    orbiter:  { hp: 14, r: 26, sc: 230, cr: [4, 8],  mv: 'orbit',   mvx: 1,   fire: { n: 6, cd: 2.5, sp: 0.9, kind: 'ring' }, tiers: 3 },
    cloaker:  { hp: 10, r: 24, sc: 220, cr: [3, 8],  mv: 'phase',   mvx: 1,   fire: { n: 3, cd: 1.6, sp: 1.05, kind: 'fan', arc: 0.8 }, tiers: 3 },
    medic:    { hp: 10, r: 25, sc: 260, cr: [4, 9],  mv: 'support', mvx: 1,   fire: null, tiers: 3, heal: true },
    gunship:  { hp: 30, r: 40, sc: 360, cr: [7, 13], mv: 'strafe',  mvx: 1,   fire: { n: 3, cd: 2.6, sp: 1.1, kind: 'burst', shots: 3, arc: 0.5, gap: 0.12 }, tiers: 4 },
    prism:    { hp: 18, r: 28, sc: 300, cr: [5, 11], mv: 'hover',   mvx: 0.5, fire: { n: 3, cd: 3.0, sp: 1.15, kind: 'burst', shots: 3, arc: 1.0, gap: 0.09 }, tiers: 4 },
    pulsar:   { hp: 24, r: 34, sc: 340, cr: [6, 12], mv: 'hover',   mvx: 0.4, fire: { n: 16, cd: 3.4, sp: 0.95, kind: 'pulse' }, tiers: 4 },
    /* mini-boss supplémentaires */
    mBlade:   { hp: 170, r: 52, sc: 2600, cr: [50, 70], mv: 'bounce',  mvx: 0.8, fire: { n: 8, cd: 2.3, sp: 0.9, kind: 'ring' }, tiers: 9, mini: true, scale: 2.5, aim: { n: 3, cd: 1.8, arc: 0.5 } },
    mOrbit:   { hp: 200, r: 52, sc: 3000, cr: [60, 80], mv: 'orbit',   mvx: 0.8, fire: { n: 3, cd: 1.1, sp: 1.0, kind: 'spiral' }, tiers: 9, mini: true, scale: 2.1 },
    mGunship: { hp: 240, r: 60, sc: 3300, cr: [60, 90], mv: 'strafe',  mvx: 0.8, fire: { n: 4, cd: 2.1, sp: 1.05, kind: 'burst', shots: 4, arc: 0.7, gap: 0.12 }, tiers: 9, mini: true, scale: 1.6 },
    mPrism:   { hp: 220, r: 50, sc: 3500, cr: [60, 90], mv: 'hover',   mvx: 0.6, fire: { n: 3, cd: 2.4, sp: 1.15, kind: 'burst', shots: 5, arc: 1.3, gap: 0.09 }, tiers: 9, mini: true, scale: 2.0 },
    mPhantom: { hp: 210, r: 50, sc: 3500, cr: [60, 90], mv: 'phase',   mvx: 0.8, fire: { n: 5, cd: 1.7, sp: 1.0, kind: 'fan', arc: 1.0 }, tiers: 9, mini: true, scale: 2.0, aim: { n: 1, cd: 1.0, arc: 0, sp: 1.7 } },
    mPulsar:  { hp: 280, r: 54, sc: 4000, cr: [80, 110], mv: 'patrol', mvx: 0.45, fire: { n: 18, cd: 2.8, sp: 1.0, kind: 'pulse' }, tiers: 9, mini: true, scale: 1.8, aim: { n: 4, cd: 2.2, arc: 0.6 } },
  });
  Object.assign(ETHEME, {
    swooper: { hue: 175, sat: 0.6, light: 0.46 }, bouncer: { hue: 28, sat: 0.8, light: 0.48 }, serpent: { hue: 95, sat: 0.65, light: 0.44 },
    segment: { hue: 110, sat: 0.6, light: 0.4 }, dasher: { hue: 355, sat: 0.8, light: 0.5 }, crawler: { hue: 205, sat: 0.35, light: 0.42 },
    bladespin: { hue: 190, sat: 0.2, light: 0.55 }, drillbot: { hue: 38, sat: 0.7, light: 0.46 }, orbiter: { hue: 280, sat: 0.55, light: 0.48 },
    cloaker: { hue: 240, sat: 0.5, light: 0.36 }, medic: { hue: 145, sat: 0.55, light: 0.55 }, gunship: { hue: 15, sat: 0.55, light: 0.42 },
    prism: { hue: 300, sat: 0.7, light: 0.52 }, pulsar: { hue: 330, sat: 0.65, light: 0.46 },
    mBlade: { hue: 195, sat: 0.3, light: 0.52 }, mOrbit: { hue: 275, sat: 0.6, light: 0.5 }, mGunship: { hue: 18, sat: 0.6, light: 0.46 },
    mPrism: { hue: 295, sat: 0.7, light: 0.52 }, mPhantom: { hue: 235, sat: 0.55, light: 0.4 }, mPulsar: { hue: 335, sat: 0.7, light: 0.5 },
  });
  Object.assign(EID, { swooper: 'swooper', bouncer: 'bouncer', serpent: 'serpent', segment: 'segment', dasher: 'dasher', crawler: 'crawler',
    bladespin: 'bladespin', drillbot: 'drillbot', orbiter: 'orbiter', cloaker: 'cloaker', medic: 'medic', gunship: 'gunship', prism: 'prism',
    pulsar: 'pulsar', mBlade: 'bladespin', mOrbit: 'orbiter', mGunship: 'gunship', mPrism: 'prism', mPhantom: 'cloaker', mPulsar: 'pulsar' });
  Object.assign(ENEMY_FLIP, { swooper: 1, serpent: 1, segment: 1, cloaker: 1, drillbot: 1, gunship: 1, prism: 1, pulsar: 1, medic: 1, mGunship: 1, mPrism: 1, mPhantom: 1, mPulsar: 1 });
  Object.assign(ENAMES, { swooper: 'FAUCHEUR', bouncer: 'BOULET', serpent: 'SERPENT', segment: 'ANNEAU', dasher: 'FONCEUR', crawler: 'RAMPANT',
    bladespin: 'SCIE', drillbot: 'FOREUSE', orbiter: 'ORBITEUR', cloaker: 'FURTIF', medic: 'MÉDECIN', gunship: 'CANONNIÈRE', prism: 'PRISME', pulsar: 'PULSAR',
    mBlade: 'SCIE-MÈRE', mOrbit: 'ORBITEUR ALPHA', mGunship: 'CANONNIÈRE LOURDE', mPrism: 'PRISME-ROI', mPhantom: 'FANTÔME', mPulsar: 'PULSAR-MÈRE' });
  if (typeof LDATA !== 'undefined') {
    const add = (fr, en) => { if (!LDATA[fr]) LDATA[fr] = [en]; };
    add('FAUCHEUR', 'REAPER'); add('BOULET', 'SPIKEBALL'); add('SERPENT', 'SERPENT'); add('ANNEAU', 'LINK'); add('FONCEUR', 'DASHER'); add('RAMPANT', 'CRAWLER');
    add('SCIE', 'SAWBLADE'); add('FOREUSE', 'DRILLER'); add('ORBITEUR', 'ORBITER'); add('FURTIF', 'STEALTH'); add('MÉDECIN', 'MEDIC'); add('CANONNIÈRE', 'GUNSHIP');
    add('PRISME', 'PRISM'); add('PULSAR', 'PULSAR'); add('SCIE-MÈRE', 'MOTHER SAW'); add('ORBITEUR ALPHA', 'ALPHA ORBITER'); add('CANONNIÈRE LOURDE', 'HEAVY GUNSHIP');
    add('PRISME-ROI', 'PRISM KING'); add('FANTÔME', 'PHANTOM'); add('PULSAR-MÈRE', 'MOTHER PULSAR');
    if (typeof LIDX !== 'undefined') LIDX = null; if (typeof LCACHE !== 'undefined') LCACHE.clear();
  }
  /* vectoriel HD : chaque nouvelle silhouette passe par le rendu générique */
  for (const id of Object.keys(SIL)) if (!VEC[id]) VEC[id] = VEC._generic(id);
}

/* ---- difficulté : une seule courbe, celle du niveau global ------------------------------------- */
const NV_NEW = {}; for (const k of ['swooper','bouncer','serpent','segment','dasher','crawler','bladespin','drillbot','orbiter','cloaker','medic','gunship','prism','pulsar']) NV_NEW[k] = 1;
const nvDL = L => (clamp(L | 0 || 1, 1, MAX_LEVEL) - 1) / (MAX_LEVEL - 1);
/* cadence de tir des ennemis : 1,2× plus lente au niveau 1, 0,68× au niveau 24 */
const nvFireMul = L => 1.22 - 0.28 * nvDL(L);
/* cadence des attaques de boss : même principe, plus resserrée */
const nvBossCd = L => 1.25 - 0.25 * nvDL(L);   /* plus de répit isolé au secteur 12 */
/* PV de boss : strictement croissants (le palier de zone ne dépasse jamais la marche suivante) */
function nvBossHp(L) {
  L = clamp(L | 0 || 1, 1, MAX_LEVEL);
  const base = 720 + 150 * (L - 1);
  return Math.round((base + (L % 4 === 0 ? 45 : 0)) * (L === MAX_LEVEL ? 1.12 : 1));
}
/* PV d'un mini-boss : même courbe pour tous les types */
const nvMiniHp = L => 92 + 4 * (clamp(L | 0 || 1, 1, MAX_LEVEL) - 1);
/* Les petits ennemis doivent céder après une courte rafale, même en fin de campagne. */
const nvEnemyDurability = L => 0.76 - 0.08 * nvDL(L);

{
  const _spawnEnemy = spawnEnemy;
  spawnEnemy = function (kind, x, y, opt = {}) {
    const T = ETYPES[kind] || {};
    if (T.mini && opt.hpMul === undefined) opt = Object.assign({}, opt, { hpMul: nvMiniHp(G.level) / T.hp });
    if (!T.mini) opt = Object.assign({}, opt, { hpMul: (opt.hpMul || 1) * nvEnemyDurability(G.level) * (G.nvHpNorm || 1) });
    const e = _spawnEnemy(kind, x, y, opt);
    const fm = nvFireMul(G.level) * 1.2 * (G.nvFireNorm || 1);
    if (e.fire) e.fire = Object.assign({}, e.fire, { cd: e.fire.cd * fm });
    if (e.aim) e.aim = Object.assign({}, e.aim, { cd: e.aim.cd * fm });
    e.nt = 0; e.life = (T.mini || !NV_NEW[kind] || kind === 'segment') ? 1e9 : (12 + rnd(4));
    if (kind === 'swooper') { e.dir = x < L_W / 2 ? 1 : -1; e.sx = x; }
    if (kind === 'bouncer' || kind === 'mBlade') { e.bvx = (chance(0.5) ? -1 : 1) * (kind === 'mBlade' ? 110 : 150); }
    if (kind === 'crawler') { e.side = x < L_W / 2 ? 1 : -1; e.x0 = x; }
    if (kind === 'dasher') { e.ph = 0; e.dashes = 0; e.pt = 0; e.ty = opt.ty || rnd(220, 110); }
    if (kind === 'drillbot') { e.ph = 0; e.pt = 0; e.ty = rnd(130, 70); e.tx = x; }
    if (kind === 'orbiter' || kind === 'mOrbit') { e.oa = rnd(TAU); e.ay = y; e.ax = clamp(x, 120, L_W - 120); e.orad = kind === 'mOrbit' ? 110 : 62; e.ty = opt.ty || rnd(250, 150); }
    if (kind === 'cloaker' || kind === 'mPhantom') { e.ph = 0; e.pt = 0; e.cloakA = 1; e.fire0 = e.fire; e.ty = opt.ty || rnd(230, 130); }
    if (kind === 'medic') { e.healT = 0.6; e.targets = []; e.ty = rnd(190, 110); }
    if (kind === 'gunship' || kind === 'mGunship') { e.ty = opt.ty || rnd(190, 120); e.sdir = chance(0.5) ? -1 : 1; }
    if (kind === 'serpent') { e.trail = []; e.trT = 0; }
    return e;
  };
}

/* ---- mouvements nouveaux : passe avant l'original, qui ignore ces schémas ---------------------- */
{
  const _updateEnemies = updateEnemies;
  const _enemyFire = enemyFire;
  const CUSTOM = { swoop: 1, bounce: 1, serpent: 1, segment: 1, dash: 1, wall: 1, sine: 1, drill: 1, orbit: 1, phase: 1, support: 1, strafe: 1, leave: 1 };
  const ring16 = (e, n, a0, gapA, sp, s) => {
    for (let k = 0; k < n; k++) {
      const a = a0 + k / n * TAU;
      if (gapA !== undefined && Math.abs(Math.atan2(Math.sin(a - gapA), Math.cos(a - gapA))) < 0.34) continue;
      eb(e.x, e.y, a, 118 * sp * s.bs, 'ball', { r: 10 });
    }
  };
  enemyFire = function (e, f, s) {
    if (f.kind === 'burst') { e.bq = f.n || 3; e.bqT = 0; e.bqF = f; return; }
    if (f.kind === 'pulse') {
      const P = G.player, a0 = P && P.alive ? Math.atan2(P.y - e.y, P.x - e.x) : Math.PI / 2;
      ring16(e, f.n || 16, a0 + 0.1, a0, f.sp || 1, s); e.p2T = 0.5; e.p2A = a0; e.p2N = f.n || 16; e.p2S = f.sp || 1;
      Audio2.sfx('ehit'); return;
    }
    return _enemyFire(e, f, s);
  };
  updateEnemies = function (dt) {
    const P = G.player, s = eScale();
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      e.nt = (e.nt || 0) + dt;
      /* tirs en rafale / double anneau de pulsar */
      if (e.bq > 0) { e.bqT -= dt; if (e.bqT <= 0) { e.bqT = e.bqF.gap || 0.12; e.bq--; aimedShot(e.x, e.y + 12, e.bqF.shots || 3, e.bqF.arc || 0.5, e.bqF.sp || 1.1, s); } }
      if (e.p2T > 0) { e.p2T -= dt; if (e.p2T <= 0) { ring16(e, e.p2N, e.p2A + Math.PI / e.p2N, undefined, e.p2S * 0.92, s); } }
      /* tout engin qui s'attarde finit par repartir : le secteur ne reste jamais bloqué */
      if (e.nt > e.life && e.mv !== 'leave' && (CUSTOM[e.mv] || e.mv === 'hover')) { e.mv = 'leave'; e.fire = null; e.aim = null; }
      const sp = SCROLL.speed * e.mvx;
      switch (e.mv) {
        case 'swoop': {                                   /* arc en travers de l'écran */
          const a = e.nt * 0.85;
          e.x = e.dir > 0 ? 30 + (L_W - 60) * (a / Math.PI) : (L_W - 30) - (L_W - 60) * (a / Math.PI);
          e.y = -30 + Math.sin(Math.min(a, Math.PI)) * (190 + e.phase * 12);
          if (a > Math.PI * 1.14) e.y += 260 * dt * 3;
          break; }
        case 'bounce': {
          e.x += e.bvx * dt;
          if (e.x < 24 && e.bvx < 0 || e.x > L_W - 24 && e.bvx > 0) e.bvx *= -1;
          if (e.mini) {
            if (e.bvy === undefined) e.bvy = 70;
            if (e.y < 100) e.y += sp * 1.2 * dt; else { e.y += e.bvy * dt; if (e.y > 300 && e.bvy > 0 || e.y < 110 && e.bvy < 0) e.bvy *= -1; }
          } else e.y += sp * 0.72 * dt;
          break; }
        case 'sine': e.y += sp * 1.3 * dt; e.x = e.x0 + Math.sin(e.nt * 2.6 + e.phase) * 110; break;
        case 'serpent': {
          e.y += sp * 0.82 * dt; e.x = clamp(e.x0 + Math.sin(e.nt * 1.5 + e.phase) * 130, 30, L_W - 30);
          e.trT -= dt; if (e.trT <= 0) { e.trT = 0.045; e.trail.unshift({ x: e.x, y: e.y }); if (e.trail.length > 180) e.trail.pop(); }
          break; }
        case 'segment': {
          const h = e.lead;
          if (!h || G.enemies.indexOf(h) < 0 || !h.trail) { e.mv = 'dive'; e.x0 = e.x; e.lead = null; break; }
          const k = Math.min(h.trail.length - 1, e.idx * 4), p = h.trail[k];
          if (p) { e.x = p.x; e.y = p.y; }
          break; }
        case 'dash': {
          if (e.ph === 0) { if (e.y < e.ty) e.y += sp * 1.5 * dt; else { e.ph = 1; e.pt = 0.75; e.dd = P && P.alive ? (P.x > e.x ? 1 : -1) : e.dir; } }
          else if (e.ph === 1) { e.pt -= dt; if (e.pt <= 0) e.ph = 2; }
          else if (e.ph === 2) { e.x += e.dd * 430 * dt; if (e.x < 22 && e.dd < 0 || e.x > L_W - 22 && e.dd > 0) { e.ph = 3; e.pt = 0.55; e.dashes++; } }
          else { e.pt -= dt; if (e.pt <= 0) { if (e.dashes >= 2) { e.mv = 'leave'; } else { e.ph = 1; e.pt = 0.65; e.dd = -e.dd; e.ty = e.y + 60; } } }
          break; }
        case 'wall': {
          e.x = e.side > 0 ? 22 : L_W - 22;
          e.y += (e.y < e.ty ? sp * 1.4 : sp * 0.5) * dt;
          break; }
        case 'drill': {
          if (e.ph === 0) {
            if (e.y < e.ty) e.y += sp * 1.8 * dt;
            else { e.pt += dt; if (e.pt < 0.9 && P && P.alive) e.x = lerp2(e.x, P.x, dt * 4); if (e.pt > 1.4) { e.ph = 1; e.v = 80; } }
          } else { e.v = Math.min(560, e.v + 900 * dt); e.y += e.v * dt; }
          break; }
        case 'orbit': {
          if (e.ay < e.ty) e.ay += sp * 1.1 * dt; else e.ay += 4 * dt;
          e.oa += dt * (e.mini ? 0.7 : 1.3);
          e.x = e.ax + Math.cos(e.oa) * e.orad; e.y = e.ay + Math.sin(e.oa) * e.orad * 0.55;
          if (e.mini) e.ay = Math.min(e.ay, 215);
          break; }
        case 'phase': {
          if (e.y < e.ty) { e.y += sp * 1.2 * dt; e.cloakA = 1; }
          else {
            e.pt += dt; const vis = e.mini ? 2.4 : 2.1, inv = e.mini ? 1.5 : 1.5, cyc = vis + inv, u = e.pt % cyc;
            if (u > vis) {
              e.cloakA = Math.max(0.12, 1 - (u - vis) / 0.25 * 0.88); e.fire = null;
              if (!e.cl) { e.cl = true; }
            } else {
              if (e.cl) { e.cl = false; e.x0 = clamp(P && P.alive ? P.x + rnd(150, -150) : rnd(L_W - 80, 80), 70, L_W - 70); e.x = e.x0; e.fireT = 0.5; explode(e.x, e.y, 0.6, TH.eBoss, TH.eBossLite); }
              e.cloakA = Math.min(1, e.cloakA + dt * 4); e.fire = e.fire0;
            }
            e.x = e.x0 + Math.sin(e.nt * 0.9) * 22;
          }
          e.spawnT = e.cloakA < 1 ? Math.min(0.9, (1 - e.cloakA) + 0.02) : 0;
          break; }
        case 'support': {
          if (e.y < e.ty) e.y += sp * 1.2 * dt;
          e.x = clamp(e.x0 + Math.sin(e.nt * 0.7 + e.phase) * 90, 40, L_W - 40);
          e.healT -= dt; e.targets.length = 0;
          if (e.healT <= 0) {
            e.healT = 0.5;
            for (const o of G.enemies) if (o !== e && !o.mini && o.kind !== 'medic' && o.hp < o.maxHp && dist2(o.x, o.y, e.x, e.y) < 150 * 150) { o.hp = Math.min(o.maxHp, o.hp + Math.max(1, o.maxHp * 0.08)); e.targets.push(o); e.show = 0.2; }
          }
          if (e.show > 0) e.show -= dt;
          break; }
        case 'strafe': {
          if (e.y < e.ty) e.y += sp * 1.3 * dt;
          else { const tx = P && P.alive ? P.x : L_W / 2; e.x += clamp(tx - e.x, -1, 1) * 46 * dt; e.y += 6 * dt; }
          break; }
        case 'leave': e.y += 230 * dt; e.fire = null; break;
      }
      /* l'original ne reconnaît pas ces schémas : on lui laisse faire tirs, collisions et sorties.
         Le temps e.t est incrémenté par lui. */
    }
    _updateEnemies(dt);
  };
}

/* ---- rendu des nouveaux engins : rotation propre, furtivité, animations ----------------------- */
{
  const NVK = {};
  for (const k of ['swooper', 'bouncer', 'serpent', 'segment', 'dasher', 'crawler', 'bladespin', 'drillbot', 'orbiter', 'cloaker', 'medic', 'gunship', 'prism', 'pulsar',
    'mBlade', 'mOrbit', 'mGunship', 'mPrism', 'mPhantom', 'mPulsar']) NVK[k] = 1;
  const rotOf = en => {
    switch (en.kind) {
      case 'bladespin': case 'mBlade': return en.nt * (en.mini ? 5 : 9);
      case 'bouncer': return en.nt * 3.2;
      case 'pulsar': case 'mPulsar': return en.nt * 0.8;
      case 'orbiter': case 'mOrbit': return en.nt * 0.5;
      case 'medic': return Math.sin(en.nt * 2) * 0.12 + Math.PI;
      case 'crawler': return en.side > 0 ? Math.PI / 2 : -Math.PI / 2;
      case 'dasher': return en.ph === 2 ? en.dd * Math.PI / 2 : (en.ph === 1 || en.ph === 3 ? Math.PI + Math.sin(en.nt * 40) * 0.08 : Math.PI);
      case 'swooper': { const a = en.nt * 0.85; return Math.PI + (en.dir > 0 ? -1 : 1) * Math.cos(Math.min(a, Math.PI)) * 0.7; }
      case 'serpent': return Math.PI + Math.cos(en.nt * 1.5 + en.phase) * 0.35;
      default: return ENEMY_FLIP[en.kind] ? Math.PI : 0;
    }
  };
  const _drawEnemyOne = drawEnemyOne;
  drawEnemyOne = function (en, g, K, e) {
    if (!NVK[en.kind]) return _drawEnemyOne(en, g, K, e);
    const th = ETHEME[en.kind] || ETHEME.drone, T = ETYPES[en.kind] || {};
    const flash = en.flash > 0 ? (e === 0 ? 1 : e === 1 ? 0.42 : 0.22) : 0;
    let alpha = 1;
    const sb = spriteBox(EID[en.kind]);
    if (e <= 1) { g.globalAlpha = 0.25 * alpha; fr(en.x - sb.w * 0.28, en.y + sb.h * 0.36, sb.w * 0.56, 4, TH.bg); g.globalAlpha = 1; }
    drawSpriteTo(g, K, EID[en.kind], en.x, en.y, { kind: 'enemy', hue: th.hue, sat: th.sat, light: th.light, rot: rotOf(en), scale: T.scale || 1, flash, alpha,
      frame: (Math.floor(en.nt * (en.kind === 'segment' ? 6 : 9) + (en.phase * 4 | 0)) & 3) });
    if (typeof drawEnemyExtra === 'function') drawEnemyExtra(en, g, K, e);
    if ((en.mini || en.kind === 'gunship' || en.kind === 'pulsar') && en.hp < en.maxHp) {
      const w = en.mini ? 96 : 54, hb = 4, yy = en.y - sb.h * (T.scale || 1) * 0.6;
      fr(en.x - w / 2, yy, w, hb, 'rgba(0,0,0,.6)'); fr(en.x - w / 2, yy, w * (en.hp / en.maxHp), hb, TH.eb);
    }
  };
  const _drawEnemyExtra = drawEnemyExtra;
  drawEnemyExtra = function (en, g, K, e) {
    _drawEnemyExtra(en, g, K, e);
    const c1 = e === 0 ? TH.livery.gb[3] : TH.eBossLite, c2 = e === 0 ? TH.livery.gb[2] : TH.danger;
    const hi = en.nt !== undefined;
    if (!hi) return;
    switch (en.kind) {
      case 'orbiter': case 'mOrbit': {
        const rr = (en.mini ? 46 : 30);
        for (let k = 0; k < 2; k++) { const a = en.nt * 3.2 + k * Math.PI; circle(en.x + Math.cos(a) * rr, en.y + Math.sin(a) * rr * 0.8, en.mini ? 6 : 4, c1); }
        break; }
      case 'dasher':
        if (en.ph === 1) { g.globalAlpha = 0.5 + 0.4 * Math.sin(en.nt * 40); fr(0, en.y - 1, L_W, 2, c2); g.globalAlpha = 1; }
        break;
      case 'drillbot':
        if (en.ph === 0 && en.y >= en.ty) { g.globalAlpha = 0.35 + 0.35 * Math.sin(en.nt * 30); fr(en.x - 1, en.y + 20, 2, L_H, c2); g.globalAlpha = 1; }
        else if (en.ph === 1 && e >= 1) { g.globalAlpha = 0.4; fr(en.x - 3, en.y - 70, 6, 60, c1); g.globalAlpha = 1; }
        break;
      case 'medic':
        if (en.show > 0 && en.targets) for (const o of en.targets) { g.globalAlpha = 0.7; line(en.x, en.y, o.x, o.y, 2, c1); g.globalAlpha = 1; }
        if (e >= 2) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.14; circle(en.x, en.y, 150, c1); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
        break;
      case 'pulsar': case 'mPulsar': {
        const ch = en.fire ? clamp(1 - en.fireT / 0.8, 0, 1) : 0;
        if (ch > 0) ring(en.x, en.y, 14 + (1 - ch) * 40, 2, c1);
        break; }
      case 'prism': case 'mPrism': {
        const ch = en.fire ? clamp(1 - en.fireT / 0.7, 0, 1) : 0;
        if (ch > 0) { circle(en.x, en.y - 10, 3 + ch * 6, c1); }
        break; }
      case 'gunship': case 'mGunship':
        if (en.bq > 0) { circle(en.x - 18, en.y - 36, 4, c1); circle(en.x + 18, en.y - 36, 4, c1); }
        break;
      case 'crawler':
        if (en.y > 0) { g.globalAlpha = 0.5; fr(en.side > 0 ? 0 : L_W - 5, en.y - 40, 5, 80, e === 0 ? TH.livery.gb[1] : TH.bg3); g.globalAlpha = 1; }
        break;
    }
  };
}

/* ---- le plan de vagues : un budget de menace par vague, fonction du niveau seul ---------------- */
const NV_POOL = [
  /*  1 */ ['drone', 'stinger', 'swooper'],
  /*  2 */ ['drone', 'stinger', 'swooper', 'kamikaze'],
  /*  3 */ ['stinger', 'swooper', 'runner', 'bouncer'],
  /*  4 */ ['stinger', 'runner', 'bomber', 'turret', 'serpent'],
  /*  5 */ ['drone', 'runner', 'turret', 'dasher', 'serpent'],
  /*  6 */ ['stinger', 'bomber', 'kamikaze', 'weaver', 'bouncer'],
  /*  7 */ ['turret', 'weaver', 'crawler', 'dasher', 'phalanx'],
  /*  8 */ ['runner', 'phalanx', 'mine', 'crawler', 'bladespin', 'bomber'],
  /*  9 */ ['stinger', 'shielder', 'splitter', 'serpent', 'drillbot'],
  /* 10 */ ['shielder', 'bomber', 'lancer', 'weaver', 'bladespin'],
  /* 11 */ ['splitter', 'missileer', 'shielder', 'dasher', 'drillbot', 'crawler'],
  /* 12 */ ['shielder', 'missileer', 'phalanx', 'tanker', 'lancer', 'orbiter'],
  /* 13 */ ['runner', 'mine', 'bouncer', 'orbiter', 'shielder', 'drone'],
  /* 14 */ ['mine', 'layer', 'bomber', 'lancer', 'cloaker', 'bladespin'],
  /* 15 */ ['layer', 'tanker', 'kamikaze', 'shielder', 'medic', 'serpent'],
  /* 16 */ ['stinger', 'mine', 'tanker', 'lancer', 'medic', 'gunship', 'bomber'],
  /* 17 */ ['sniper', 'splitter', 'serpent', 'orbiter', 'cloaker', 'mine'],
  /* 18 */ ['sniper', 'missileer', 'phalanx', 'drillbot', 'prism', 'lancer'],
  /* 19 */ ['sniper', 'weaver', 'tanker', 'prism', 'medic', 'orbiter', 'bladespin'],
  /* 20 */ ['sniper', 'missileer', 'tanker', 'lancer', 'pulsar', 'gunship', 'layer'],
  /* 21 */ ['crawler', 'turret', 'sniper', 'dasher', 'cloaker', 'shielder', 'carrier'],
  /* 22 */ ['gunship', 'bomber', 'drillbot', 'missileer', 'carrier', 'medic', 'prism'],
  /* 23 */ ['pulsar', 'orbiter', 'tanker', 'lancer', 'phalanx', 'bladespin', 'cloaker', 'medic'],
  /* 24 */ ['carrier', 'tanker', 'pulsar', 'gunship', 'prism', 'medic', 'orbiter', 'cloaker', 'lancer', 'phalanx', 'kamikaze'],
];
/* gardiens de mi-parcours : jamais le même deux secteurs de suite */
const NV_MINI1 = ['mGuardian', 'mBlade', 'mForeman', 'mOrbit', 'mMatriarch', 'mGunship', 'mCroupier', 'mPrism', 'mArchivist', 'mPhantom', 'mHerald', 'mPulsar',
  'mCroupier', 'mBlade', 'mMatriarch', 'mGunship', 'mPhantom', 'mArchivist', 'mOrbit', 'mPrism', 'mForeman', 'mHerald', 'mPulsar', 'mGunship'];
const nvMini2 = L => NV_MINI1[(L + 6) % 24];
/* menace d'un engin : PV × (1,5 s'il tire) × (1,3 s'il engendre ou se scinde) */
const nvThreat = k => { const T = ETYPES[k]; return Math.max(2, T.hp) * (T.fire ? 1.5 : 1) * ((T.split || T.spawner || T.layer) ? 1.3 : 1) * (T.heal ? 0.6 : 1); };
const nvCap = k => { const t = ETYPES[k].tiers || 1; return t >= 4 ? 2 : t === 3 ? 4 : t === 2 ? 6 : 7; };

function nvFormSnake(n) {
  const x = rnd(L_W - 150, 150);
  const head = spawnEnemy('serpent', x, -30, { amp: 60 });
  head.x0 = x;
  for (let j = 0; j < (n + 2) * 4 + 4; j++) head.trail.push({ x, y: -30 - j * 5 });
  for (let i = 1; i <= n; i++) { const s = spawnEnemy('segment', x, -30 - i * 20); s.lead = head; s.idx = i; }
}
function nvForm(kind, n, opt) {
  switch (kind) {
    case 'serpent': return nvFormSnake(Math.min(7, 3 + n));
    case 'swooper': { const d = chance(0.5) ? 1 : -1; for (let i = 0; i < n; i++) spawnEnemy(kind, d > 0 ? 30 : L_W - 30, -30 - i * 30, Object.assign({ dir: d }, opt)); return; }
    case 'bouncer': case 'bladespin': { for (let i = 0; i < n; i++) spawnEnemy(kind, rnd(L_W - 60, 60), -30 - i * 90, opt); return; }
    case 'dasher': { for (let i = 0; i < n; i++) spawnEnemy(kind, rnd(L_W - 60, 60), -30 - i * 50, Object.assign({ ty: 90 + i * 55 }, opt)); return; }
    case 'crawler': { for (let i = 0; i < n; i++) spawnEnemy(kind, i % 2 ? L_W - 22 : 22, -30 - (i >> 1) * 110, Object.assign({ ty: 120 + (i >> 1) * 60 }, opt)); return; }
    case 'drillbot': { for (let i = 0; i < n; i++) spawnEnemy(kind, L_W * (i + 1) / (n + 1), -30 - i * 18, opt); return; }
    case 'orbiter': case 'cloaker': case 'medic': case 'gunship': case 'prism': case 'pulsar': {
      for (let i = 0; i < n; i++) spawnEnemy(kind, L_W * (i + 1) / (n + 1) + rnd(30, -30), -40 - i * 40, opt); return; }
    default: return formFor(kind, n, opt);
  }
}
function nvSpawnMini(kind) {
  const e = spawnEnemy(kind, L_W / 2 + rnd(80, -80), -120, { ty: 190 });
  Audio2.sfx('alert'); G.midBossDone = true;
  radioSay('cmd', L('Signature lourde en approche : ') + L(ENAMES[kind]) + L('. Reste mobile.'));
  return e;
}
/* 24 séquences de secteurs conçues à la main. Chaque code est une formation de combat,
   pas un tirage de roster : ouverture, motif-signature, contre-attaque, respiration et finale. */
const NV_STAGE_ACTS = [
  'V RUSH PAIRED SWEEP RING COLUMN MINE V SHIELD DIVE GATE',
  'COLUMN PAIRED RUSH MINE SWEEP V SHIELD MIRROR DIVE GATE',
  'RING RUSH SWEEP COLUMN PAIRED SNAKE MINE V DIVE SHIELD GATE',
  'MINE COLUMN PAIRED SWEEP RUSH SHIELD RING V DIVE MIRROR GATE',
  'V SWEEP COLUMN PAIRED DASH RING SNAKE SHIELD MINE DIVE GATE',
  'PAIRED DASH RUSH COLUMN SHIELD SWEEP MINE SNAKE RING V GATE',
  'COLUMN MINE SWEEP PAIRED DASH RING SHIELD V SNAKE DIVE GATE',
  'RUSH SHIELD COLUMN DASH PAIRED MINE SWEEP RING SNAKE V GATE',
  'RING CLOAK SWEEP PAIRED MINE COLUMN ORBIT SHIELD DASH V GATE',
  'COLUMN ORBIT RUSH SWEEP CLOAK MIRROR MINE SNAKE SHIELD DIVE GATE',
  'CLOAK MINE PAIRED ORBIT COLUMN SWEEP DASH RING SHIELD V GATE',
  'ORBIT COLUMN MINE SWEEP CLOAK PAIRED RUSH SHIELD SNAKE V GATE',
  'V MIRROR SIEGE COLUMN DASH RING PAIRED MEDIC SWEEP SHIELD GATE',
  'MINE SIEGE SWEEP MIRROR PRISM COLUMN DASH PAIRED RING V GATE',
  'SIEGE MIRROR COLUMN MINE PAIRED SWEEP MEDIC DASH SHIELD V GATE',
  'PRISM SIEGE DASH COLUMN RING MIRROR MINE SWEEP MEDIC V GATE',
  'SNIPER CLOAK SIEGE COLUMN ORBIT MINE PAIRED DASH PRISM SHIELD GATE',
  'DRILL PRISM MIRROR SIEGE SNAKE SNIPER DASH ORBIT COLUMN V GATE',
  'MINE PRISM SIEGE CLOAK MIRROR SNIPER COLUMN MEDIC DASH RING GATE',
  'ORBIT SIEGE SNIPER MINE PRISM PAIRED DRILL MIRROR DASH V GATE',
  'WALL MINE SNIPER DASH CLOAK SIEGE COLUMN MIRROR CARRIER SHIELD GATE',
  'CARRIER DRILL SIEGE MIRROR PRISM MINE DASH WALL SNIPER V GATE',
  'PULSAR ORBIT SIEGE SNIPER PRISM CLOAK MINE MIRROR CARRIER V GATE',
  'WALL CARRIER PRISM SIEGE DRILL PULSAR SNIPER MIRROR CLOAK V GATE',
].map(x => x.split(' '));
const NV_STAGE_FINALES = [
  'RUSH MIRROR SNAKE COLUMN PAIRED DIVE V GATE', 'MINE DASH COLUMN PAIRED SWEEP SHIELD RUSH GATE',
  'SNAKE V RING MIRROR SWEEP DIVE COLUMN GATE', 'MINE PAIRED SHIELD COLUMN RING DIVE RUSH GATE',
  'DASH V SWEEP COLUMN SNAKE MIRROR RING GATE', 'PAIRED RUSH DASH SHIELD COLUMN SWEEP SNAKE GATE',
  'WALL MINE SWEEP PAIRED DASH SHIELD RING GATE', 'SHIELD DASH COLUMN RUSH MINE SNAKE V GATE',
  'CLOAK ORBIT MIRROR DASH MINE SHIELD SWEEP GATE', 'ORBIT SNAKE CLOAK COLUMN MIRROR DASH SHIELD GATE',
  'CLOAK DASH ORBIT MINE PAIRED SHIELD SNAKE GATE', 'ORBIT MINE CLOAK SWEEP SNAKE DASH V GATE',
  'SIEGE DASH MEDIC MIRROR RING COLUMN SWEEP GATE', 'PRISM SIEGE DASH MINE MIRROR COLUMN RING GATE',
  'MEDIC SIEGE MIRROR DASH MINE SWEEP SHIELD GATE', 'PRISM DASH SIEGE MIRROR MEDIC COLUMN V GATE',
  'SNIPER PRISM CLOAK MIRROR SIEGE DASH WALL GATE', 'DRILL SNAKE PRISM MIRROR SNIPER DASH SIEGE GATE',
  'PRISM CLOAK MEDIC SNIPER MIRROR SIEGE DASH GATE', 'SIEGE ORBIT SNIPER DRILL MIRROR DASH PRISM GATE',
  'WALL CARRIER SIEGE SNIPER CLOAK MIRROR DASH GATE', 'CARRIER DRILL PRISM WALL SIEGE MIRROR SNIPER GATE',
  'PULSAR PRISM ORBIT SIEGE SNIPER CARRIER MIRROR GATE', 'WALL DRILL CARRIER PULSAR SIEGE CLOAK VORAX GATE',
].map(x => x.split(' '));

function nvDesignWave(code, index, level, pool) {
  const dl = nvDL(level), pass = Math.floor(index / NV_STAGE_ACTS[level - 1].length);
  const heat = 1 + dl * 0.20 + pass * 0.05;
  const pick = (n, preferred) => {
    for (const k of preferred || []) if (pool.includes(k)) return k;
    return pool[(n + level + pass) % pool.length];
  };
  const count = (base, cap) => clamp(Math.round(base * heat * 0.88), 1, cap || 9);
  const spawnAt = (kind, x, y, opt) => spawnEnemy(kind, clamp(x, 24, L_W - 24), y, opt || {});
  const line = (kind, n, x, gap, opt) => { for (let j = 0; j < n; j++) spawnAt(kind, x, -35 - j * gap, opt); };
  const a = pick(index * 2, ['drone','stinger','runner','swooper','dasher']);
  const b = pick(index * 3 + 1, ['turret','bomber','shielder','crawler','gunship']);
  const c = pick(index * 5 + 2, ['kamikaze','mine','lancer','serpent','drillbot','prism']);
  const n = count(3 + (index % 3));
  switch (code) {
    case 'V': formV(a, count(4, 8)); break;
    case 'RUSH': nvForm(pick(index, ['kamikaze','dasher','runner','swooper']), count(4, 8)); break;
    case 'PAIRED': line(a, count(3, 6), L_W * 0.27, 44); line(b, count(3, 6), L_W * 0.73, 44); break;
    case 'SWEEP': nvForm(pick(index, ['swooper','runner','dasher']), count(4, 7)); break;
    case 'RING': nvForm(pick(index, ['orbiter','bladespin','bouncer','pulsar']), count(2, 5)); break;
    case 'COLUMN': line(a, count(4, 8), L_W * (index % 2 ? 0.34 : 0.66), 43); line(b, count(3, 6), L_W * (index % 2 ? 0.66 : 0.34), 52); break;
    case 'MINE': nvForm(pick(index, ['mine','layer','drillbot','bouncer']), count(3, 7)); line(a, 2 + (level > 10 ? 1 : 0), L_W / 2, 70); break;
    case 'SHIELD': nvForm(pick(index, ['shielder','phalanx','tanker','carrier']), count(2, 5)); nvForm(a, count(3, 6)); break;
    case 'DIVE': nvForm(pick(index, ['kamikaze','dasher','swooper','runner']), count(4, 8)); break;
    case 'GATE': {
      const heavy = pick(index + 2, ['carrier','gunship','pulsar','tanker','phalanx','turret']);
      spawnAt(heavy, L_W * 0.5, -85, { ty: 170, hpMul: 1 + dl * 0.25 });
      line(a, count(2, 5), L_W * 0.25, 48); line(c, count(2, 5), L_W * 0.75, 48); break;
    }
    case 'SNAKE': nvForm(pick(index, ['serpent','weaver','splitter','runner']), count(4, 7)); break;
    case 'MIRROR': line(a, count(3, 5), L_W * 0.22, 48); line(a, count(3, 5), L_W * 0.78, 48); nvForm(b, count(2, 4)); break;
    case 'DASH': nvForm(pick(index, ['dasher','kamikaze','lancer','runner']), count(3, 6)); line(b, 2, L_W * 0.5, 58, { ty: 150 }); break;
    case 'CLOAK': nvForm(pick(index, ['cloaker','phantom','shielder','stinger']), count(2, 5)); nvForm(a, count(3, 6)); break;
    case 'ORBIT': nvForm(pick(index, ['orbiter','pulsar','bladespin','bouncer']), count(2, 4)); line(a, 3, L_W * 0.5, 55); break;
    case 'SIEGE': nvForm(pick(index, ['gunship','tanker','carrier','turret','phalanx']), count(2, 4)); line(c, 2 + (level > 14 ? 1 : 0), L_W * 0.5, 70); break;
    case 'PRISM': nvForm(pick(index, ['prism','pulsar','lancer','missileer']), count(2, 4)); nvForm(a, count(3, 6)); break;
    case 'MEDIC': nvForm(pick(index, ['medic','shielder','bomber']), 1); nvForm(b, count(2, 4)); nvForm(a, count(3, 5)); break;
    case 'SNIPER': nvForm(pick(index, ['sniper','lancer','missileer','turret']), count(2, 4)); nvForm(pick(index + 1, ['kamikaze','dasher','swooper']), count(3, 6)); break;
    case 'DRILL': nvForm(pick(index, ['drillbot','layer','mine','bouncer']), count(3, 5)); line(a, 3, L_W * (index % 2 ? 0.3 : 0.7), 62); break;
    case 'WALL': {
      const wall = pick(index, ['crawler','turret','layer','tanker']);
      line(wall, count(3, 5), 24, 66); line(wall, count(3, 5), L_W - 24, 66); nvForm(a, count(2, 4)); break;
    }
    case 'CARRIER': nvForm('carrier', 1); nvForm(pick(index, ['gunship','tanker','phalanx']), count(2, 4)); nvForm(a, count(3, 5)); break;
    case 'PULSAR': nvForm(pick(index, ['pulsar','orbiter','prism','bladespin']), count(2, 4)); nvForm(pick(index + 1, ['kamikaze','dasher','swooper']), count(4, 7)); break;
    case 'VORAX': nvForm(pick(index, ['carrier','gunship','pulsar','phalanx']), count(2, 3)); nvForm(pick(index + 1, ['drillbot','dasher','kamikaze']), count(3, 6)); break;
    default: nvForm(a, n);
  }
}

buildPlan = function (level) {
  level = clamp(level | 0 || 1, 1, MAX_LEVEL);
  const L0 = level, dl = nvDL(L0), plan = [], act = NV_STAGE_ACTS[L0 - 1], finale = NV_STAGE_FINALES[L0 - 1];
  let t = 2.0;
  const waves = 10 + Math.round(L0 * 0.4);
  const cadence = 5.2 - dl * 0.3;
  const W = (dt, fn, skip) => { t += dt; plan.push({ t, fn, skip: !!skip }); };
  W(0, () => formV('drone', L0 < 5 ? 4 : 5));
  const miniCount = 1 + (L0 >= 16 ? 1 : 0);
  const miniAt = [0.38, 0.78].slice(0, miniCount).map(x => Math.round((waves - 1) * x));
  for (let i = 0; i < waves; i++) {
    const motif = i < act.length ? act[i] : finale[(i - act.length) % finale.length];
    const beat = i % 4;
    /* Des respirations courtes après les vagues lourdes créent une vraie ponctuation d'arcade. */
    const rest = motif === 'GATE' || motif === 'CARRIER' || motif === 'VORAX' ? 1.25 : (beat === 3 ? 0.85 : 0);
    W(cadence + rest, () => nvDesignWave(motif, i, L0, NV_POOL[L0 - 1]));
    const m = miniAt.indexOf(i);
    if (m >= 0) { const kind = m === 1 ? nvMini2(L0) : NV_MINI1[L0 - 1]; W(2.3, () => nvSpawnMini(kind), true); }
  }
  /* Le boss arrive après une courte fenêtre de lecture du dernier motif. */
  W(1.25, () => {}, true);
  /* Courbe de menace lissée : le poids des nouvelles formations ne crée pas de pic injuste. */
  {
    const real = spawnEnemy, keep = G.enemies.length; let hp = 0, fire = 0;
    G.nvHpNorm = 1; G.nvFireNorm = 1;
    spawnEnemy = function (k, x, y, o) { const e = real(k, x, y, o); hp += e.hp; if (e.fire) fire += (e.fire.n || 1) / Math.max(0.25, e.fire.cd || 2); return e; };
    try { for (const p of plan) if (!p.skip) p.fn(); } catch (err) { console.warn('plan de secteur', err); }
    finally { spawnEnemy = real; G.enemies.length = keep; }
    /* Exigence cible du secteur : une seule courbe, régulière et toujours
       croissante (PV ennemis à abattre par seconde, tirs ennemis par minute).
       Avant, la correction était bridée à ±25 % : dès le secteur 3 elle
       saturait et chaque secteur gardait le poids brut de ses formations
       (secteur 12 plus dur que le 13, 20 plus dur que le 21…). */
    const T = plan.length ? plan[plan.length - 1].t : 60, x = (L0 - 1) / (MAX_LEVEL - 2);
    const hpT = (2.2 + 24 * Math.pow(x, 1.3)) * T;
    const fT = (5 + 40 * Math.pow(x, 1.2)) / 60 * T;
    G.nvDry = { hp, fire, T };
    G.nvHpNorm = clamp(hpT / Math.max(1, hp), 0.3, 2.5);
    G.nvFireNorm = fire > 0 ? clamp(fire / fT, 0.4, 3) : 1;
  }
  return plan;
};


/* ---- 99_campaign2.js — B : vingt-quatre boss, vingt-quatre silhouettes ---------------------------
   Chaque rencontre a désormais sa propre carcasse (plus de teinte réutilisée), un boss final en
   grand robot articulé (VORAX), et des PV / cadences strictement croissants avec le niveau.         */

/* ---- carcasses 7 à 27 ---------------------------------------------------------------------------- */
{
  const _bossParts = bossParts;
  bossParts = function (kind, era) {
    if (kind < 7) return _bossParts(kind, era);
    const out = [];
    const add = (pts, mat, minEra, det) => out.push({ pts, mat, minEra: minEra || 0, det: det || null });
    const rect = (x, y, w, h) => [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]];
    const rrect = (x, y, w, h, c) => {
      const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2;
      return [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]];
    };
    const disc = (cx, cy, r, ry) => ellipsePiece(r, ry === undefined ? RY(r) : ry, cx, cy, 18);
    const tri = (x, y, w, h) => [[x - w / 2, y + h / 2], [x, y - h / 2], [x + w / 2, y + h / 2]];
    const blade = (x0, y0, x1, y1, w0, w1) => bladePiece(x0, y0, x1, y1, w0, w1);
    /* rectangle tourné, proportions d'écran respectées */
    const rotR = (cx, cy, w, h, ang) => {
      const c = Math.cos(ang), s = Math.sin(ang);
      return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([dx, dy]) => {
        const X = dx * AR, Y = dy; return [cx + (X * c - Y * s) / AR, cy + (X * s + Y * c)]; });
    };
    /* anneau elliptique (portion d'arc) */
    const ringE = (cx, cy, r0, r1, a0, a1, n) => {
      n = n || 16; const p = [];
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 / AR]); }
      for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 / AR]); }
      return p;
    };
    switch (kind) {
      case 7: {            /* GARDIEN DU SILO — le bunker : dalle de béton, trappe, tubes de missiles */
        add(rrect(0, 0.2, 1.84, 1.0, 0.1), MAT.HULL);
        add(rrect(0, 0.22, 1.66, 0.8, 0.06), MAT.WING, 0, 'panel');
        for (let i = -3; i <= 3; i++) { add(rrect(i * 0.24, -0.5, 0.13, 0.34, 0.03), MAT.DARK); add(rect(i * 0.24, -0.7, 0.1, 0.06), MAT.ACCENT, 1); }
        add(disc(0, 0.12, 0.62), MAT.HULL); add(disc(0, 0.12, 0.5), MAT.DARK);
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(tri(Math.cos(a) * 0.36, 0.12 + Math.sin(a) * RY(0.36), 0.2, 0.2).map(p => p), MAT.WING, 0); }
        add(disc(0, 0.12, 0.26), MAT.GLASS, 1); add(disc(0, 0.12, 0.13), MAT.GLOW);
        for (const s of [-1, 1]) { add(rrect(s * 0.86, 0.12, 0.2, 0.76, 0.04), MAT.DARK, 0, 'vent'); add(rect(s * 0.86, -0.2, 0.12, 0.1), MAT.TRIM, 1); add(rect(s * 0.86, 0.5, 0.2, 0.08), MAT.MARK, 2); }
        add(rect(0, 0.72, 1.4, 0.07), MAT.TRIM, 0, 'rivet'); add(rect(0, 0.62, 0.5, 0.05), MAT.ACCENT, 1);
        break; }
      case 8: {            /* BASTION-4 — le donjon à quatre tours */
        add(rrect(0, 0, 1.2, 1.1, 0.08), MAT.HULL);
        add(rrect(0, 0, 0.94, 0.86, 0.06), MAT.WING, 0, 'panel');
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          add(disc(sx * 0.82, sy * 0.56, 0.3), MAT.HULL); add(disc(sx * 0.82, sy * 0.56, 0.22), MAT.WING);
          add(disc(sx * 0.82, sy * 0.56, 0.12), MAT.DARK); add(disc(sx * 0.82, sy * 0.56, 0.06), MAT.GLOW);
          add(rect(sx * 0.82, sy * 0.56 - sy * 0.32, 0.4, 0.06), MAT.TRIM, 1);
        }
        for (let i = -3; i <= 3; i++) add(rect(i * 0.16, -0.58, 0.09, 0.1), MAT.TRIM);
        add(rrect(0, 0.3, 0.36, 0.5, 0.04), MAT.DARK); add(rect(0, 0.3, 0.3, 0.04), MAT.ACCENT, 1);
        add(disc(0, -0.14, 0.2), MAT.GLASS, 1); add(disc(0, -0.14, 0.1), MAT.GLOW);
        add(rect(0, 0.04, 0.9, 0.04), MAT.TRIM, 1, 'rivet');
        break; }
      case 9: {            /* SENTINELLE-2 — le long gardien à œil unique */
        add([[0, -1], [0.54, -0.6], [0.5, 0.56], [0, 0.98], [-0.5, 0.56], [-0.54, -0.6]], MAT.HULL);
        add([[0, -0.84], [0.4, -0.52], [0.36, 0.5], [0, 0.82], [-0.36, 0.5], [-0.4, -0.52]], MAT.WING, 0, 'panel');
        for (const s of [-1, 1]) { add([[s * 0.5, -0.5], [s * 1.0, -0.96], [s * 0.96, -0.5], [s * 0.6, 0.1]], MAT.WING); add(blade(s * 0.6, -0.1, s * 0.98, 0.5, 0.06, 0.02), MAT.TRIM, 1); }
        add(disc(0, -0.1, 0.34), MAT.DARK); add(disc(0, -0.1, 0.26), MAT.TRIM, 1); add(disc(0, -0.1, 0.2), MAT.GLASS, 1); add(disc(0, -0.1, 0.1), MAT.GLOW);
        add(rect(0, -0.78, 0.07, 0.3), MAT.MARK, 2);
        for (let i = 0; i < 3; i++) add(rect(0, 0.3 + i * 0.16, 0.34 - i * 0.06, 0.05), MAT.ACCENT, 1);
        add(rrect(-0.28, 0.9, 0.16, 0.14, 0.03), MAT.ENGINE); add(rrect(0.28, 0.9, 0.16, 0.14, 0.03), MAT.ENGINE);
        break; }
      case 10: {           /* CONTREMAÎTRE — mécanique de chantier, casque jaune, deux marteaux */
        add(rrect(0, 0.08, 1.4, 0.8, 0.12), MAT.HULL); add(rrect(0, 0.08, 1.14, 0.6, 0.08), MAT.WING, 0, 'panel');
        add(disc(0, -0.3, 0.36), MAT.ACCENT); add(rect(0, -0.12, 0.8, 0.08), MAT.ACCENT);
        add(rrect(0, -0.26, 0.42, 0.2, 0.05), MAT.GLASS, 1); add(rect(0, -0.26, 0.3, 0.05), MAT.GLOW);
        for (const s of [-1, 1]) {
          add(rrect(s * 0.98, 0.0, 0.22, 0.9, 0.05), MAT.DARK); add(rect(s * 0.98, -0.1, 0.1, 0.6), MAT.TRIM, 1);
          add(rrect(s * 0.98, 0.58, 0.42, 0.32, 0.05), MAT.TRIM); add(rect(s * 0.98, 0.58, 0.36, 0.06), MAT.ACCENT, 1);
          add(disc(s * 0.82, -0.36, 0.14), MAT.DARK); add(disc(s * 0.82, -0.36, 0.06), MAT.MARK, 1);
        }
        add(rect(0, 0.46, 1.1, 0.12), MAT.TRIM, 0, 'rivet'); add(rrect(0, 0.64, 0.8, 0.16, 0.04), MAT.DARK, 0, 'vent');
        for (const s of [-0.34, 0.34]) add(rrect(s, 0.8, 0.2, 0.16, 0.03), MAT.ENGINE);
        break; }
      case 11: {           /* LOCOMOTIVE-9 — la machine à vapeur, vue de dessus, cabine en haut */
        add(rrect(0, -0.02, 0.76, 1.9, 0.14), MAT.HULL);
        add(rrect(0, -0.1, 0.56, 1.5, 0.1), MAT.WING, 0, 'panel');
        add(rrect(0, -0.7, 0.92, 0.5, 0.06), MAT.DARK); add(rrect(0, -0.7, 0.8, 0.38, 0.04), MAT.TRIM, 1);
        add(rect(0, -0.78, 0.5, 0.1), MAT.GLASS, 1);
        for (const y of [-0.3, -0.04, 0.22, 0.48]) for (const s of [-1, 1]) { add(rrect(s * 0.46, y, 0.14, 0.2, 0.03), MAT.DARK); add(rect(s * 0.46, y, 0.06, 0.12), MAT.TRIM, 1); }
        add(rect(-0.46, 0.1, 0.05, 1.0), MAT.TRIM, 1); add(rect(0.46, 0.1, 0.05, 1.0), MAT.TRIM, 1);
        add(disc(0, 0.52, 0.16), MAT.DARK); add(disc(0, 0.52, 0.09), MAT.TRIM, 1);
        add(disc(0, 0.2, 0.12), MAT.TRIM); add(rrect(0, 0.84, 0.5, 0.2, 0.04), MAT.ENGINE);
        add(tri(0, 0.98, 0.9, 0.2).map(p => [p[0], 2 * 0.98 - p[1] - 0.0]), MAT.TRIM);
        add(disc(0, 0.9, 0.1), MAT.GLOW);
        break; }
      case 12: {           /* RÉGISSEUR — le proscenium, rideaux et projecteurs */
        add(rrect(0, 0.1, 1.7, 1.5, 0.08), MAT.HULL);
        add(rrect(0, 0.14, 1.4, 1.1, 0.04), MAT.DARK);
        add([[-0.7, -0.4], [-0.3, -0.4], [-0.5, 0.64], [-0.7, 0.64]], MAT.MARK, 0, 'panel'); add([[0.7, -0.4], [0.3, -0.4], [0.5, 0.64], [0.7, 0.64]], MAT.MARK, 0, 'panel');
        add(rrect(0, 0.78, 1.6, 0.14, 0.03), MAT.TRIM, 0, 'rivet');
        for (const [x, y, r] of [[-0.62, -0.78, 0.17], [0, -0.86, 0.2], [0.62, -0.78, 0.17]]) { add(disc(x, y, r), MAT.DARK); add(disc(x, y, r * 0.7), MAT.TRIM, 1); add(disc(x, y, r * 0.42), MAT.GLOW); }
        add(disc(0, 0.14, 0.34), MAT.WING); add(disc(0, 0.14, 0.26), MAT.GLASS, 1);
        add(blade(-0.12, 0.1, 0.12, 0.1, 0.04, 0.04), MAT.DARK); add(disc(-0.1, 0.1, 0.05), MAT.GLOW); add(disc(0.1, 0.1, 0.05), MAT.GLOW);
        add(rect(0, 0.3, 0.2, 0.04), MAT.ACCENT, 1);
        break; }
      case 13: {           /* MATRIARCHE — la reine, abdomen couvert d'œufs */
        add(disc(0, 0.5, 0.58, 0.48), MAT.HULL); add(disc(0, 0.5, 0.46, 0.38), MAT.WING, 0, 'panel');
        for (const [x, y] of [[-0.22, 0.4], [0.2, 0.34], [0, 0.58], [-0.3, 0.64], [0.3, 0.6], [0, 0.34]]) { add(disc(x, y, 0.1), MAT.DARK); add(disc(x, y, 0.06), MAT.GLOW, 1); }
        add(disc(0, -0.08, 0.36, 0.3), MAT.HULL); add(disc(0, -0.08, 0.26, 0.2), MAT.WING);
        for (const s of [-1, 1]) {
          add([[s * 0.3, -0.2], [s * 1.0, -0.96], [s * 0.96, -0.4], [s * 0.6, 0.1]], MAT.WING); add(blade(s * 0.4, -0.2, s * 0.9, -0.82, 0.05, 0.02), MAT.TRIM, 1);
          add(blade(s * 0.4, 0.1, s * 1.0, 0.5, 0.07, 0.03), MAT.HULL); add(blade(s * 0.4, 0.3, s * 0.92, 0.9, 0.06, 0.02), MAT.HULL);
          add(tri(s * 0.2, -0.62, 0.16, 0.36), MAT.TRIM);
          add(disc(s * 0.14, -0.4, 0.09), MAT.DARK); add(disc(s * 0.14, -0.4, 0.045), MAT.GLOW);
        }
        add(disc(0, -0.5, 0.2, 0.17), MAT.HULL); add(rect(0, -0.7, 0.06, 0.2), MAT.MARK, 2);
        break; }
      case 14: {           /* ROI DES DOCKS — le porte-conteneurs à portique */
        add([[-1, 0.5], [-0.84, 0.02], [0.84, 0.02], [1, 0.5], [0.74, 0.92], [-0.74, 0.92]], MAT.HULL);
        add([[-0.8, 0.46], [-0.7, 0.1], [0.7, 0.1], [0.8, 0.46], [0.6, 0.8], [-0.6, 0.8]], MAT.WING, 0, 'panel');
        const cm = [MAT.TRIM, MAT.ACCENT, MAT.WING, MAT.MARK];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) add(rrect(-0.56 + c * 0.28, 0.28 + r * 0.26, 0.24, 0.22, 0.02), cm[(r * 2 + c) % 4], c % 2 ? 0 : 0, 'panel');
        add(rrect(0, -0.56, 1.64, 0.1, 0.02), MAT.TRIM); add(rect(-0.78, -0.2, 0.1, 0.8), MAT.DARK); add(rect(0.78, -0.2, 0.1, 0.8), MAT.DARK);
        add(rect(-0.4, -0.56, 0.08, 0.5), MAT.DARK); add(rect(0.4, -0.56, 0.08, 0.5), MAT.DARK);
        add(rrect(0, -0.9, 0.5, 0.2, 0.04), MAT.HULL); add(rect(0, -0.9, 0.4, 0.07), MAT.GLASS, 1);
        add(rect(0, -0.36, 0.05, 0.3), MAT.TRIM, 1); add(disc(0, -0.2, 0.07), MAT.GLOW);
        add(rrect(-0.3, 1.0, 0.2, 0.12, 0.03), MAT.ENGINE); add(rrect(0.3, 1.0, 0.2, 0.12, 0.03), MAT.ENGINE);
        break; }
      case 15: {           /* NÉON-PRÊTRE — robe, capuche vide, auréole */
        add([[-0.34, -0.3], [0.34, -0.3], [0.96, 0.96], [-0.96, 0.96]], MAT.HULL);
        add([[-0.22, -0.2], [0.22, -0.2], [0.6, 0.9], [-0.6, 0.9]], MAT.WING, 0, 'panel');
        add(rect(0, 0.3, 0.1, 1.2), MAT.ACCENT, 1); add(rect(-0.2, 0.34, 0.06, 1.0), MAT.MARK, 2); add(rect(0.2, 0.34, 0.06, 1.0), MAT.MARK, 2);
        add(disc(0, -0.52, 0.34), MAT.HULL); add(disc(0, -0.5, 0.25), MAT.DARK);
        add(rect(-0.1, -0.5, 0.1, 0.05), MAT.GLOW); add(rect(0.1, -0.5, 0.1, 0.05), MAT.GLOW);
        add(ringE(0, -0.6, 0.5, 0.58, 0, TAU, 20), MAT.GLOW, 1);
        for (const s of [-1, 1]) { add(blade(s * 0.4, 0.0, s * 0.9, 0.5, 0.08, 0.1), MAT.WING); add(disc(s * 0.92, 0.5, 0.1), MAT.DARK); add(disc(s * 0.92, 0.5, 0.05), MAT.GLOW); }
        add(rect(0, 0.0, 0.5, 0.05), MAT.TRIM); add(tri(0, 0.0, 0.2, 0.2), MAT.MARK, 1);
        add(rect(0, 0.96, 1.8, 0.08), MAT.GLOW, 2);
        break; }
      case 16: {           /* CROUPIER — table de jeu, roulette, éventail de cartes */
        add(disc(0, 0.28, 1.0, 0.7), MAT.HULL); add(disc(0, 0.28, 0.88, 0.62), MAT.WING, 0, 'panel');
        add(disc(0, 0.28, 0.6, 0.42), MAT.DARK); add(ringE(0, 0.28, 0.5, 0.58, 0, TAU, 20), MAT.TRIM, 1);
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(rotR(0.38 * Math.cos(a) , 0.28 + 0.38 * Math.sin(a) / AR, 0.08, 0.1, a), i % 2 ? MAT.ACCENT : MAT.MARK, 1); }
        add(disc(0, 0.28, 0.16), MAT.TRIM); add(disc(0, 0.28, 0.08), MAT.GLOW);
        for (let i = -2; i <= 2; i++) { add(rotR(i * 0.3, -0.62 + Math.abs(i) * 0.06, 0.24, 0.5, i * 0.28), MAT.TRIM); add(rotR(i * 0.3, -0.62 + Math.abs(i) * 0.06, 0.18, 0.4, i * 0.28), i % 2 ? MAT.ACCENT : MAT.GLASS, 1); }
        for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { add(rrect(s * 0.86, 0.6 - j * 0.08, 0.2, 0.07, 0.02), j % 2 ? MAT.ACCENT : MAT.MARK); }
        break; }
      case 17: {           /* FLIPPER — le flipper : plateau, bumpers, deux battes */
        add(rrect(0, 0, 1.12, 1.96, 0.3), MAT.HULL); add(rrect(0, 0, 0.92, 1.76, 0.24), MAT.DARK);
        add(rrect(0, -0.5, 0.74, 0.66, 0.2), MAT.GLASS, 1);
        for (const [x, y] of [[-0.24, -0.58], [0.26, -0.5], [0, -0.28]]) { add(disc(x, y, 0.15), MAT.TRIM); add(disc(x, y, 0.1), MAT.ACCENT); add(disc(x, y, 0.05), MAT.GLOW); }
        add([[-0.44, 0.1], [-0.3, 0.2], [-0.3, 0.52], [-0.44, 0.44]], MAT.MARK); add([[0.44, 0.1], [0.3, 0.2], [0.3, 0.52], [0.44, 0.44]], MAT.MARK);
        add(blade(-0.36, 0.7, -0.08, 0.84, 0.05, 0.03), MAT.TRIM); add(blade(0.36, 0.7, 0.08, 0.84, 0.05, 0.03), MAT.TRIM);
        add(disc(-0.36, 0.7, 0.07), MAT.ACCENT); add(disc(0.36, 0.7, 0.07), MAT.ACCENT);
        add(rrect(0.78, 0.2, 0.1, 1.2, 0.03), MAT.DARK); add(rect(0.78, 0.75, 0.14, 0.12), MAT.TRIM); add(disc(0.0, 0.18, 0.06), MAT.GLOW);
        add(rect(0, 0.97, 0.24, 0.05), MAT.ENGINE);
        break; }
      case 18: {           /* BANQUIER — la porte de chambre forte et son haut-de-forme */
        add(disc(0, 0.08, 0.9, 0.9 / AR * 1.0), MAT.HULL); add(disc(0, 0.08, 0.78), MAT.WING, 0, 'panel');
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(disc(Math.cos(a) * 0.68, 0.08 + Math.sin(a) * RY(0.68), 0.05), MAT.TRIM, 1); }
        add(disc(0, 0.08, 0.5), MAT.DARK); add(disc(0, 0.08, 0.42), MAT.TRIM, 1);
        for (let i = 0; i < 4; i++) add(rotR(0, 0.08, 0.84, 0.07, i * Math.PI / 4), MAT.WING, 0);
        add(disc(0, 0.08, 0.14), MAT.TRIM); add(disc(0, 0.08, 0.07), MAT.GLOW);
        add(rrect(0, -0.96, 0.6, 0.3, 0.03), MAT.DARK); add(rrect(0, -0.8, 0.9, 0.08, 0.02), MAT.DARK); add(rect(0, -0.88, 0.6, 0.05), MAT.ACCENT, 1);
        for (const s of [-1, 1]) { add(rrect(s * 0.98, 0.1, 0.1, 0.5, 0.02), MAT.TRIM); for (let j = 0; j < 3; j++) add(disc(s * 0.62, 0.9 - j * 0.0, 0.0001 + 0.1), MAT.ACCENT, 1); }
        add(rrect(0, 0.98, 0.5, 0.1, 0.03), MAT.ENGINE);
        break; }
      case 19: {           /* ARCHIVISTE — la cassette qui range tout */
        add(rrect(0, 0, 1.76, 1.3, 0.08), MAT.HULL); add(rrect(0, 0, 1.56, 1.1, 0.05), MAT.WING, 0, 'panel');
        add(rrect(0, -0.46, 1.3, 0.4, 0.04), MAT.GLASS, 1); add(rect(0, -0.46, 1.2, 0.05), MAT.MARK, 1); add(rect(0, -0.58, 1.1, 0.03), MAT.ACCENT, 1);
        add(rrect(0, 0.18, 1.3, 0.56, 0.1), MAT.DARK);
        for (const s of [-1, 1]) { add(disc(s * 0.42, 0.18, 0.24), MAT.TRIM); add(disc(s * 0.42, 0.18, 0.17), MAT.DARK); add(disc(s * 0.42, 0.18, 0.08), MAT.GLOW);
          for (let i = 0; i < 6; i++) add(rotR(s * 0.42, 0.18, 0.05, 0.3, i / 6 * Math.PI), MAT.TRIM, 1); }
        add(rrect(0, 0.46, 0.5, 0.14, 0.03), MAT.HULL, 0, 'vent');
        add(blade(-0.9, 0.7, -0.3, 0.98, 0.05, 0.05), MAT.DARK); add(blade(0.9, 0.7, 0.3, 0.98, 0.05, 0.05), MAT.DARK);
        for (const [x, y] of [[-0.82, -0.56], [0.82, -0.56], [-0.82, 0.56], [0.82, 0.56]]) add(disc(x, y, 0.04), MAT.TRIM, 1);
        add(rect(0, 0.82, 0.6, 0.06), MAT.ACCENT, 1);
        break; }
      case 20: {           /* COMPILATEUR — la puce, ses broches et son cœur de calcul */
        add(rrect(0, 0, 1.4, 1.4, 0.1), MAT.HULL); add(rrect(0, 0, 1.2, 1.2, 0.06), MAT.WING, 0, 'panel');
        for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { add(rect(-0.64 + i * 0.16, s * 0.82, 0.08, 0.14), MAT.TRIM); add(rect(s * 0.78 * 1.12, -0.64 + i * 0.16, 0.14 / AR * 1.2, 0.08), MAT.TRIM); }
        add(rrect(0, 0, 0.84, 0.84, 0.06), MAT.DARK); add(rrect(0, 0, 0.7, 0.7, 0.04), MAT.TRIM, 1);
        for (let i = -3; i <= 3; i++) { add(rect(i * 0.1, 0, 0.03, 0.62), MAT.ACCENT, 1); }
        add(rrect(0, 0, 0.3, 0.3, 0.04), MAT.DARK); add(disc(0, 0, 0.1), MAT.GLOW); add(rect(0, 0, 0.5, 0.05), MAT.MARK, 1);
        add([[-0.7, -0.7], [-0.4, -0.7], [-0.7, -0.4]], MAT.ACCENT);
        break; }
      case 21: {           /* TESSELLATEUR — un cristal en facettes triangulées */
        const R = 0.92, C = [];
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; C.push([Math.cos(a) * R, Math.sin(a) * R / AR * 1.35]); }
        const mats = [MAT.HULL, MAT.WING, MAT.TRIM, MAT.HULL, MAT.WING, MAT.TRIM];
        for (let i = 0; i < 6; i++) add([[0, 0], C[i], C[(i + 1) % 6]], mats[i], 0, i % 2 ? 'panel' : null);
        for (let i = 0; i < 6; i++) { const a = C[i], b = C[(i + 1) % 6]; add([[0, 0], [a[0] * 0.55, a[1] * 0.55], [b[0] * 0.55, b[1] * 0.55]], mats[(i + 2) % 6], 1); }
        for (let i = 0; i < 6; i++) { const a = C[i]; add(tri(a[0] * 1.02, a[1] * 1.02, 0.18, 0.2), MAT.ACCENT, 1); }
        add(disc(0, 0, 0.2), MAT.DARK); add([[0, -0.16], [0.14, 0.08], [-0.14, 0.08]], MAT.GLOW);
        break; }
      case 22: {           /* HÉRAUT — l'ange de bronze, ailes déployées, trompette */
        for (const s of [-1, 1]) {
          add([[s * 0.2, -0.3], [s * 1.0, -0.98], [s * 1.0, -0.4], [s * 0.7, 0.2], [s * 0.24, 0.1]], MAT.WING);
          for (let i = 0; i < 4; i++) add(blade(s * 0.3, -0.2 + i * 0.05, s * (0.96 - i * 0.04), -0.78 + i * 0.28, 0.04, 0.02), MAT.TRIM, 1);
        }
        add([[0, -0.6], [0.34, -0.2], [0.26, 0.7], [0, 0.96], [-0.26, 0.7], [-0.34, -0.2]], MAT.HULL);
        add([[0, -0.4], [0.2, -0.12], [0.14, 0.6], [0, 0.76], [-0.14, 0.6], [-0.2, -0.12]], MAT.WING, 0, 'panel');
        add(disc(0, -0.58, 0.2), MAT.HULL); add(disc(0, -0.58, 0.12), MAT.GLASS, 1);
        add(ringE(0, -0.8, 0.26, 0.31, 0, TAU, 18), MAT.GLOW, 1);
        add(blade(0.12, 0.1, -0.64, 0.5, 0.04, 0.05), MAT.TRIM); add([[-0.58, 0.34], [-0.9, 0.62], [-0.66, 0.74], [-0.44, 0.6]], MAT.TRIM); add(disc(-0.74, 0.58, 0.06), MAT.GLOW);
        add(disc(0, 0.1, 0.07), MAT.ACCENT);
        break; }
      case 23: {           /* RAYTRACEUR — l'objectif : iris à huit lames et trois barillets */
        const oc = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + TAU / 16; oc.push([Math.cos(a) * 0.96, Math.sin(a) * 0.96 / AR * 1.35]); }
        add(oc, MAT.HULL); add(oc.map(p => [p[0] * 0.86, p[1] * 0.86]), MAT.WING, 0, 'panel');
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add([[0, 0], [Math.cos(a) * 0.76, Math.sin(a) * 0.76 / AR * 1.35], [Math.cos(a + 0.62) * 0.76, Math.sin(a + 0.62) * 0.76 / AR * 1.35]], i % 2 ? MAT.TRIM : MAT.DARK, 1); }
        add(disc(0, 0, 0.36), MAT.DARK); add(disc(0, 0, 0.28), MAT.GLASS, 1); add(disc(0, 0, 0.16), MAT.GLOW); add(disc(0, 0, 0.06), MAT.MARK);
        for (const s of [-1, 0, 1]) { add(rrect(s * 0.5, 0.98, 0.26, 0.2, 0.04), MAT.DARK); add(disc(s * 0.5, 1.0, 0.07), MAT.GLOW, 1); }
        add(ringE(0, 0, 0.9, 0.95, 0, TAU, 24), MAT.ACCENT, 1);
        break; }
      /* ---------- VORAX, le robot : torse + tête (24), bras (25), bassin (26) ---------- */
      case 24: {
        add([[-0.62, -0.42], [0.62, -0.42], [0.82, 0.1], [0.52, 0.72], [-0.52, 0.72], [-0.82, 0.1]], MAT.HULL);
        add([[-0.52, -0.34], [0.52, -0.34], [0.68, 0.08], [0.44, 0.62], [-0.44, 0.62], [-0.68, 0.08]], MAT.WING, 0, 'panel');
        for (const s of [-1, 1]) {
          add(rrect(s * 0.86, -0.36, 0.34, 0.46, 0.08), MAT.HULL); add(rrect(s * 0.86, -0.36, 0.26, 0.34, 0.06), MAT.WING, 0, 'panel');
          add(rect(s * 0.86, -0.58, 0.34, 0.06), MAT.TRIM, 1); add(disc(s * 0.86, -0.36, 0.07), MAT.DARK); add(disc(s * 0.86, -0.36, 0.035), MAT.MARK, 1);
          add(tri(s * 0.96, -0.62, 0.1, 0.2), MAT.ACCENT, 1);
          add(rrect(s * 0.62, 0.58, 0.14, 0.34, 0.03), MAT.DARK, 0, 'vent');
        }
        add(rrect(0, 0.12, 0.6, 0.7, 0.06), MAT.DARK);
        for (let i = 0; i < 4; i++) { add(rrect(0, -0.1 + i * 0.16, 0.54, 0.07, 0.02), MAT.TRIM); add(rect(0, -0.1 + i * 0.16, 0.04, 0.08), MAT.ACCENT, 1); }
        add(rect(0, 0.12, 0.05, 0.64), MAT.WING);
        add(rect(0, 0.84, 0.3, 0.16), MAT.DARK); add(rect(-0.2, 0.84, 0.06, 0.2), MAT.TRIM); add(rect(0.2, 0.84, 0.06, 0.2), MAT.TRIM);
        add(rect(0, -0.5, 0.22, 0.12), MAT.DARK);
        add([[-0.3, -0.98], [0.3, -0.98], [0.4, -0.8], [0.32, -0.56], [0.16, -0.5], [-0.16, -0.5], [-0.32, -0.56], [-0.4, -0.8]], MAT.HULL);
        add([[-0.2, -0.9], [0.2, -0.9], [0.28, -0.78], [0.22, -0.62], [-0.22, -0.62], [-0.28, -0.78]], MAT.WING, 0, 'panel');
        add(rrect(0, -0.78, 0.54, 0.12, 0.03), MAT.DARK);
        add(rect(-0.14, -0.78, 0.14, 0.06), MAT.GLOW); add(rect(0.14, -0.78, 0.14, 0.06), MAT.GLOW);
        for (let i = -2; i <= 2; i++) add(rect(i * 0.07, -0.6, 0.04, 0.07), MAT.TRIM, 1);
        for (const s of [-1, 1]) { add(blade(s * 0.3, -0.9, s * 0.62, -1.0, 0.03, 0.01), MAT.TRIM, 1); add(rect(s * 0.4, -0.7, 0.04, 0.2), MAT.DARK, 1); }
        add(rect(0, -0.98, 0.06, 0.1), MAT.MARK, 1);
        break; }
      case 25: {           /* le bras : épaule en haut, poing en bas */
        add(rrect(0, -0.58, 0.46, 0.66, 0.06), MAT.HULL); add(rrect(0, -0.58, 0.3, 0.5, 0.04), MAT.WING, 0, 'panel');
        add(rect(0, -0.12, 0.1, 0.34), MAT.TRIM, 1);
        add(disc(0, -0.92, 0.2), MAT.DARK); add(disc(0, -0.92, 0.11), MAT.TRIM, 1);
        add(disc(0, -0.04, 0.2), MAT.WING); add(disc(0, -0.04, 0.12), MAT.DARK); add(disc(0, -0.04, 0.05), MAT.GLOW, 1);
        add(rrect(0, 0.46, 0.5, 0.7, 0.06), MAT.HULL); add(rrect(0, 0.46, 0.34, 0.54, 0.04), MAT.WING, 0, 'panel');
        add(rrect(0, 0.3, 0.24, 0.1, 0.02), MAT.DARK, 0, 'vent');
        add(disc(0, 0.62, 0.11), MAT.DARK); add(disc(0, 0.62, 0.06), MAT.GLOW);
        for (const s of [-1, 0, 1]) add([[s * 0.17 - 0.06, 0.8], [s * 0.17 + 0.06, 0.8], [s * 0.12, 1.0]], MAT.TRIM);
        add(rect(0, 0.8, 0.44, 0.06), MAT.DARK);
        break; }
      case 26: {           /* le bassin et ses deux tuyères */
        add(rrect(0, -0.42, 1.3, 0.6, 0.12), MAT.HULL); add(rrect(0, -0.42, 1.0, 0.4, 0.08), MAT.WING, 0, 'panel');
        add(rrect(0, -0.28, 0.4, 0.28, 0.04), MAT.DARK, 0, 'vent'); add(disc(0, -0.42, 0.08), MAT.GLOW, 1);
        for (const s of [-1, 1]) {
          add(rrect(s * 0.48, 0.12, 0.42, 0.68, 0.08), MAT.HULL); add(rrect(s * 0.48, 0.12, 0.3, 0.52, 0.06), MAT.WING, 0, 'panel');
          add(rrect(s * 0.48, 0.58, 0.34, 0.24, 0.04), MAT.ENGINE); add(rect(s * 0.48, 0.7, 0.26, 0.05), MAT.TRIM, 1);
        }
        add(rect(0, 0.0, 0.2, 0.3), MAT.DARK); add(rect(0, -0.12, 1.2, 0.05), MAT.TRIM, 1, 'rivet');
        break; }
    }
    return out;
  };
}

/* ---- la table : un corps par boss, PV monotones ------------------------------------------------ */
{
  const BODY_OF = { 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 14, 12: 15, 13: 16, 14: 17, 15: 18, 17: 19, 18: 20, 19: 21, 21: 22, 22: 23, 23: 24 };
  for (const idx in BODY_OF) BOSSES[idx].body = BODY_OF[idx];
  /* échelles et rayons : la silhouette détermine la zone de touche */
  Object.assign(BOSSES[4], { scale: 1, r: 100 }); Object.assign(BOSSES[5], { scale: 1, r: 112 }); Object.assign(BOSSES[6], { scale: 1, r: 118 });
  Object.assign(BOSSES[7], { scale: 1, r: 108 }); Object.assign(BOSSES[8], { scale: 1, r: 118 }); Object.assign(BOSSES[9], { scale: 1, r: 124 });
  Object.assign(BOSSES[10], { scale: 1, r: 110 }); Object.assign(BOSSES[11], { scale: 1, r: 130 }); Object.assign(BOSSES[12], { scale: 1, r: 124 });
  Object.assign(BOSSES[13], { scale: 1, r: 116 }); Object.assign(BOSSES[14], { scale: 1, r: 112 }); Object.assign(BOSSES[15], { scale: 1, r: 124 });
  Object.assign(BOSSES[17], { scale: 1, r: 118 }); Object.assign(BOSSES[18], { scale: 1, r: 124 }); Object.assign(BOSSES[19], { scale: 1, r: 134 });
  Object.assign(BOSSES[21], { scale: 1, r: 124 }); Object.assign(BOSSES[22], { scale: 1, r: 134 });
  BOSSES[23].move = 'robot'; BOSSES[23].r = 150; BOSSES[23].parts = 4; BOSSES[23].final = true;
  BOSSES[23].name = 'VORAX';
  BOSSES[4].hue = 120; BOSSES[5].hue = 40; BOSSES[6].hue = 200; BOSSES[7].hue = 48; BOSSES[8].hue = 18; BOSSES[9].hue = 265;
  BOSSES[10].hue = 330; BOSSES[11].hue = 190; BOSSES[12].hue = 300; BOSSES[13].hue = 140; BOSSES[14].hue = 8; BOSSES[15].hue = 52;
  BOSSES[17].hue = 210; BOSSES[18].hue = 175; BOSSES[19].hue = 235; BOSSES[21].hue = 28; BOSSES[22].hue = 168; BOSSES[23].hue = 355;
  BOSSES[0].hue = 95; BOSSES[1].hue = 215; BOSSES[2].hue = 160; BOSSES[3].hue = 285;
  /* PV : une fonction du niveau global ; les boss à plusieurs têtes reçoivent la même enveloppe */
  const apply = () => { for (let L = 1; L <= MAX_LEVEL; L++) BOSSES[BOSS_OF_LEVEL[L - 1]].hp = nvBossHp(L); };
  apply();
  /* parties : pods / têtes en orbite — réglages pour les nouvelles carcasses */
  BOSSES[7].parts = 2; BOSSES[10].parts = 3; BOSSES[14].parts = 2; BOSSES[19].parts = 3;
  BOSSES[7].partSpr = 'bPod'; BOSSES[10].partSpr = 'bHead'; BOSSES[14].partSpr = 'bPod'; BOSSES[19].partSpr = 'bPod';
  /* cadence : plus rapide à mesure que le niveau monte (l'ancienne table n'était pas ordonnée) */
  const _updateBoss = updateBoss;
  updateBoss = function (dt) {
    const b = G.boss; if (!b) return _updateBoss(dt);
    if (b.def.final && !b.enter) nvRobotPre(b, dt);
    const before = b.atkT, ph0 = b.ph;
    _updateBoss(dt);
    if (b.atkT > before + 1e-6 && !b.enter && b.ph === ph0) b.atkT *= nvBossCd(G.level);
  };
}

/* ---- VORAX : attaques du robot --------------------------------------------------------------- */
const NV_ROBOT = { shX: 132, shY: -66, armLen: 190, armH: 200, armSc: 0.9, torsoSc: 0.8, torsoDY: -120, pelvDY: 138, pelvSc: 0.62 };
function nvArmSpread(b, side) {          /* écartement du bras (rad) : tombé s'il est détruit */
  const p = b.parts[side < 0 ? 0 : 1];
  if (!p || p.dead) return 0.05;
  return 0.16 + (Math.sin(b.t * 0.95 + (side < 0 ? 0 : 1.7)) + 1) * 0.13 + Math.max(0, b.punch || 0) * 0.4;
}
const nvArmTheta = (b, side) => -side * nvArmSpread(b, side);     /* rotation canvas autour de l'épaule */
function nvArmHand(b, side) {
  const th = nvArmTheta(b, side), N = NV_ROBOT;
  return { x: b.x + side * N.shX - Math.sin(th) * N.armLen, y: b.y + N.shY + Math.cos(th) * N.armLen };
}
function nvRobotPre(b, dt) {
  /* positions des parties : 0 = bras G, 1 = bras D, 2 = canon d'épaule G, 3 = canon d'épaule D */
  if (b.punch > 0) b.punch -= dt * 1.6;
  const spots = [];
  for (const side of [-1, 1]) { const h = nvArmHand(b, side); spots.push([h.x - b.x, h.y - b.y]); }
  spots.push([-NV_ROBOT.shX, -112], [NV_ROBOT.shX, -112]);
  b.parts.forEach((p, i) => {
    if (!spots[i]) return;
    const dx = spots[i][0], dy = spots[i][1] / 0.7;
    p.or = Math.hypot(dx, dy); p.oa = Math.atan2(dy, dx) - (p.dead ? 0 : dt * 0.5);
  });
}
{
  const hands = b => b.parts.slice(0, 2).filter(p => !p.dead);
  const pods = b => b.parts.slice(2).filter(p => !p.dead);
  BOSS_ATK[23] = [
    { cd: 2.0, fn(b) { const h = hands(b), s = eScale(); b.punch = 0.6;
        if (h.length) for (const p of h) aimedShot(p.x, p.y + 20, 3, 0.5, 1.1, s); else aimedShot(b.x, b.y + 20, 5, 0.9, 1.1, s); } },
    { cd: 2.6, fn(b) { const q = pods(b); if (q.length) for (const p of q) { for (let k = 0; k < 2; k++) eb(p.x, p.y, Math.PI / 2 + (k ? 0.6 : -0.6) * (p.x < b.x ? -1 : 1), 112 * eScale().bs, 'missile', { steer: 1.7, r: 8 }); Audio2.sfx('cannon'); } else bossMissiles(b, 4); } },
    { cd: 2.2, fn(b) { if ((b.openT || 0) > 0.5) bossSpiral(b, 4, 1.1); else { for (const p of hands(b)) { for (let k = 0; k < 10; k++) eb(p.x, p.y, k / 10 * TAU + b.t, 104 * eScale().bs, 'ball', { r: 10 }); } Audio2.sfx('ehit'); b.punch = 0.9; } } },
    { cd: 3.2, fn(b) { bossBeamSweep(b, (b.openT || 0) > 0.5 ? 3 : 2, 70, 2.8); } },
    { cd: 2.3, fn(b) { bossGrid(b, 80); b.punch = 0.5; } },
    { cd: 2.6, fn(b) { const s = eScale(); for (let i = 0; i < 3; i++) setTimeout(() => { if (G.boss === b && !b.dead) { aimedShot(b.x, b.y + 30, 5, 0.9, 1.15, s); } }, i * 170); } },
    { cd: 3.0, fn(b) { bossLaunch(b, 'kamikaze', 2); bossRain(b, 10, 1.1); } },
  ];
}

/* ---- dessin des corps nouveaux : sprite + animation propre à chaque boss -------------------- */
{
  const _drawBoss = drawBoss;
  drawBoss = function () {
    const b = G.boss; if (!b) return;
    const body = (b.def.body === undefined ? b.def.color : b.def.body);
    if (body < 7) return _drawBoss();
    useBuf(R.bufNear);
    const g = PAINT.g, K = PAINT.K, e = R.era, x = b.x, y = b.y, t = b.t;
    const gb = TH.livery.gb;
    const energy = e === 0 ? gb[3] : TH.eBossLite, bossCol = e === 0 ? gb[2] : TH.eBoss, hullMid = e === 0 ? gb[1] : TH.bg3, lite = e === 0 ? gb[3] : TH.eLite;
    const bo = { kind: 'boss', hue: b.def.hue, sat: 0.6, light: e === 0 ? 0.5 : 0.44, flash: b.flash > 0 ? (e === 0 ? 0.85 : e === 1 ? 0.34 : 0.18) : 0 };
    const P2 = G.player, add = (fn) => { if (e >= 1) { g.globalCompositeOperation = 'lighter'; fn(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; } };
    const pu = 0.8 + 0.2 * Math.sin(t * 5);
    const lerpA = (a, bb, k) => a + (bb - a) * k;
    /* têtes / pods en orbite */
    const drawParts = (spr, sc) => {
      for (const p of b.parts) {
        g.strokeStyle = p.dead ? hullMid : energy; g.lineWidth = Math.max(1, 2 * K);
        g.beginPath(); g.moveTo(x * K, y * K); g.lineTo(p.x * K, p.y * K); g.stroke();
        if (!p.dead) drawSpriteTo(g, K, spr, p.x, p.y, { ...bo, rot: Math.atan2(p.y - y, p.x - x) - Math.PI / 2, scale: sc, flash: p.flash > 0 ? (e === 0 ? 0.9 : e === 1 ? 0.42 : 0.24) : 0, frame: Math.floor(p.t * 8) & 3 });
        else { circle(p.x, p.y, 8, hullMid); circle(p.x, p.y, 4, energy); }
      }
    };
    if (body === 24) { nvDrawRobot(b, bo, g, K, e, energy, bossCol, hullMid, lite); return; }
    if (b.parts.length && b.def.partSpr) drawParts(b.def.partSpr, b.def.partSpr === 'bHead' ? 0.8 : 0.9);
    drawBossSprite(x, y, body, bo);
    switch (body) {
      case 7: add(() => { g.globalAlpha = 0.5 * pu; circle(x, y + 15, 26 + Math.sin(t * 3) * 4, bossCol); }); circle(x, y + 15, 7 * pu + 3, energy);
        { const ph = (t * 2) % 1; g.globalAlpha = 1 - ph; ring(x, y + 15, 14 + ph * 40, 2, energy); g.globalAlpha = 1; } break;
      case 8: for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (Math.sin(t * 4 + sx + sy * 2) > 0) circle(x + sx * 139, y + sy * 70, 4, energy); break;
      case 9: { const a = P2 && P2.alive ? Math.atan2(P2.y - (y - 12), P2.x - x) : Math.PI / 2; circle(x + Math.cos(a) * 9, y - 12 + Math.sin(a) * 6, 7, e === 0 ? gb[0] : '#101828'); circle(x + Math.cos(a) * 9 + 1, y - 13 + Math.sin(a) * 6, 2.5, '#fff');
        add(() => { g.globalAlpha = 0.28; circle(x, y - 12, 30 * pu, bossCol); }); break; }
      case 10: for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i * 0.33) % 1; g.globalAlpha = (1 - ph) * 0.4; circle(x + s * 70 + ph * s * 6, y - 40 - ph * 40, 4 + ph * 10, hullMid); g.globalAlpha = 1; } break;
      case 11: for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i * 0.25) % 1; g.globalAlpha = (1 - ph) * 0.45; circle(x + (i % 2 ? 6 : -6) * ph, y - 52 - ph * 60, 6 + ph * 16, e === 0 ? gb[2] : '#cfd8e6'); g.globalAlpha = 1; }
        for (const s of [-1, 1]) { const off = Math.sin(t * 8) * 6; fr(x + s * 78 - 2, y + 12 + off, 4, 24, hullMid); } break;
      case 12: add(() => { for (const [lx, ph] of [[-0.62, 0], [0, 1.4], [0.62, 2.8]]) { const sw = Math.sin(t * 1.2 + ph) * 44; g.globalAlpha = 0.14; g.fillStyle = TH.eBossLite; g.beginPath(); g.moveTo((x + lx * 170) * K, (y - 90) * K); g.lineTo((x + lx * 170 + sw - 26) * K, (y + 140) * K); g.lineTo((x + lx * 170 + sw + 26) * K, (y + 140) * K); g.closePath(); g.fill(); } }); break;
      case 13: for (const [ex, ey] of [[-0.22, 0.4], [0.2, 0.34], [0, 0.58]]) circle(x + ex * 170, y + ey * 125, 3 + 2 * Math.sin(t * 4 + ex * 9), energy);
        add(() => { g.globalAlpha = 0.22 * pu; circle(x, y + 55, 70, bossCol); }); break;
      case 14: { const sw = Math.sin(t * 1.3) * 22, hx = x + sw, hy = y - 8 + Math.cos(t * 1.3) * 3;
        g.strokeStyle = hullMid; g.lineWidth = Math.max(1, 1.5 * K); g.beginPath(); g.moveTo(x * K, (y - 72) * K); g.lineTo(hx * K, (hy + 30) * K); g.stroke();
        fr(hx - 7, hy + 30, 14, 10, e === 0 ? gb[3] : TH.gold); circle(hx, hy + 41, 3, energy); break; }
      case 15: for (let i = 0; i < 6; i++) { const a = t * 1.6 + i / 6 * TAU; circle(x + Math.cos(a) * 85, y - 75 + Math.sin(a) * 85 / AR * 0.6, 4, i % 2 ? energy : bossCol); }
        add(() => { g.globalAlpha = 0.3; circle(x, y - 72, 52 * pu, bossCol); }); break;
      case 16: { const a = -t * 2.4; circle(x + Math.cos(a) * 60, y + 35 + Math.sin(a) * 60 / AR * 1.2 * 0.7, 5, e === 0 ? gb[3] : '#fff'); } break;
      case 17: { const bx = x + Math.sin(t * 2.7) * 38, by = y - 14 + Math.sin(t * 4.1) * 54; circle(bx, by, 6, e === 0 ? gb[3] : '#fff'); add(() => { g.globalAlpha = 0.4; circle(bx, by, 14, energy); }); } break;
      case 18: { const a = t * 0.7; g.strokeStyle = e === 0 ? gb[3] : TH.gold; g.lineWidth = Math.max(1, 3 * K);
        for (let i = 0; i < 4; i++) { const aa = a + i * Math.PI / 2; g.beginPath(); g.moveTo((x + Math.cos(aa) * 12) * K, (y + 10 + Math.sin(aa) * 12) * K); g.lineTo((x + Math.cos(aa) * 52) * K, (y + 10 + Math.sin(aa) * 52) * K); g.stroke(); circle(x + Math.cos(aa) * 56, y + 10 + Math.sin(aa) * 56, 5, e === 0 ? gb[3] : TH.gold); }
        if (Math.sin(t * 6) > 0.7) circle(x + 80, y - 40, 3, '#fff'); } break;
      case 19: for (const s of [-1, 1]) { const a = t * 3 * s; g.strokeStyle = energy; g.lineWidth = Math.max(1, 2 * K);
        for (let i = 0; i < 3; i++) { const aa = a + i * TAU / 3; g.beginPath(); g.moveTo((x + s * 72) * K, (y + 22) * K); g.lineTo((x + s * 72 + Math.cos(aa) * 22) * K, (y + 22 + Math.sin(aa) * 22) * K); g.stroke(); } } break;
      case 20: for (let i = 0; i < 9; i++) if (((i * 7 + Math.floor(t * 8)) % 3) === 0) fr(x - 54 + i * 12, y - 6 + ((i * 5 + Math.floor(t * 6)) % 7) * 6 - 18, 9, 3, energy);
        add(() => { g.globalAlpha = 0.3 * pu; circle(x, y, 40, bossCol); }); break;
      case 21: add(() => { const k = Math.floor(t * 2) % 6; g.globalAlpha = 0.3 + 0.2 * Math.sin(t * 8); g.fillStyle = TH.eBossLite; const a0 = k / 6 * TAU - Math.PI / 2, a1 = (k + 1) / 6 * TAU - Math.PI / 2;
        g.beginPath(); g.moveTo(x * K, y * K); g.lineTo((x + Math.cos(a0) * 150) * K, (y + Math.sin(a0) * 150 * 0.9) * K); g.lineTo((x + Math.cos(a1) * 150) * K, (y + Math.sin(a1) * 150 * 0.9) * K); g.closePath(); g.fill(); }); break;
      case 22: for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1; g.globalAlpha = (1 - ph); ring(x, y - 100, 40 + ph * 36, 2, energy); g.globalAlpha = 1; }
        if (b.atkT < 0.25) add(() => { g.globalAlpha = 0.5; circle(x - 120, y + 72, 18, TH.eBossLite); }); break;
      case 23: { const a = t * 0.9; g.strokeStyle = energy; g.lineWidth = Math.max(1, 2 * K);
        for (let i = 0; i < 8; i++) { const aa = a + i / 8 * TAU; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(x * K, y * K); g.lineTo((x + Math.cos(aa) * 160) * K, (y + Math.sin(aa) * 130) * K); g.stroke(); } g.globalAlpha = 1;
        add(() => { g.globalAlpha = 0.5 * pu; circle(x, y, 28, bossCol); }); } break;
    }
  };
}

/* ---- VORAX en robot : torse articulé, bras à pistons, cœur à nu quand les bras tombent ------- */
function nvDrawRobot(b, bo, g, K, e, energy, bossCol, hullMid, lite) {
  const x = b.x, y = b.y, t = b.t, N = NV_ROBOT;
  const open = b.openT || 0, pu = 0.8 + 0.2 * Math.sin(t * 6), fin = b.ph === 2;
  /* aura de phase finale */
  if (e >= 1 && fin) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 + 0.1 * Math.sin(t * 7); circle(x, y, 190, bossCol); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  /* tuyères du bassin */
  if (e >= 1) { g.globalCompositeOperation = 'lighter'; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const ph = (t * 3 + i * 0.25) % 1; g.globalAlpha = (1 - ph) * 0.5; circle(x + s * 30, y + N.pelvDY + 58 + ph * 56, 14 * (1 - ph * 0.5), energy); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  /* bassin */
  drawBossSprite(x, y + N.pelvDY, 26, { ...bo, scale: N.pelvSc });
  /* bras (derrière le torse) */
  for (const side of [-1, 1]) {
    const part = b.parts[side < 0 ? 0 : 1], dead = part && part.dead;
    const px = x + side * N.shX, py = y + N.shY;
    g.save(); g.translate(px * K, py * K); g.rotate(nvArmTheta(b, side));
    drawBossSprite(0, N.armH * 0.5, 25, { ...bo, scale: N.armSc, flash: part && part.flash > 0 ? (R.era === 0 ? 0.9 : R.era === 1 ? 0.42 : 0.24) : 0, light: dead ? 0.3 : bo.light });
    g.restore();
    if (dead && chance(0.08)) spawnPart({ x: px + side * 14, y: py + 120, vx: rnd(30, -30), vy: rnd(-10, -50), life: 0.6, col: TH.eBossLite, size: 3, glow: true });
    if (!dead && part) circle(part.x, part.y, 5 + 2 * pu, energy);
  }
  /* torse + tête */
  drawBossSprite(x, y + N.torsoDY, 24, { ...bo, scale: N.torsoSc });
  /* poitrine : plaques qui glissent, cœur qui bat */
  const cx = x, cy = y + N.torsoDY + 0.12 * 125 * N.torsoSc;
  const cavW = 0.27 * 170 * N.torsoSc, cavH = 0.33 * 125 * N.torsoSc;
  if (open > 0.02) {
    const ph = 0.7 + 0.3 * Math.sin(t * 9);
    circle(cx, cy, 20 * ph + open * 6, e === 0 ? TH.livery.gb[3] : '#ffe6c8'); ring(cx, cy, 32 * ph, 2, bossCol);
    if (e >= 1) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * open; circle(cx, cy, 70 * ph, bossCol); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  const slide = open * (cavW + 6);
  g.save(); g.beginPath(); g.rect((cx - cavW - 2) * K, (cy - cavH - 2) * K, (cavW * 2 + 4) * K, (cavH * 2 + 4) * K); g.clip();
  fr(cx - cavW - slide, cy - cavH, cavW, cavH * 2, e === 0 ? TH.livery.gb[1] : TH.bg3);
  fr(cx + slide, cy - cavH, cavW, cavH * 2, e === 0 ? TH.livery.gb[1] : TH.bg3);
  fr(cx - cavW - slide, cy - 1, cavW * 2 + slide * 2, 2, e === 0 ? TH.livery.gb[0] : TH.eDark);
  g.restore();
  if (open < 0.3) { g.globalAlpha = 0.5; circle(cx, cy, 5 + pu * 3, bossCol); g.globalAlpha = 1; }
  /* yeux : traînées lumineuses qui suivent le joueur */
  const hy = y + N.torsoDY - 0.78 * 125 * N.torsoSc;
  const ex = 0.14 * 170 * N.torsoSc;
  for (const s of [-1, 1]) {
    circle(x + s * ex, hy, 3 + pu * 1.4, e === 0 ? TH.livery.gb[3] : '#ff3b3b');
    if (e >= 2) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; circle(x + s * ex, hy, 11 * pu, '#ff2020'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  /* canons d'épaule : suivent le joueur */
  const P2 = G.player;
  for (let k = 0; k < 2; k++) {
    const p = b.parts[2 + k]; if (!p) continue;
    if (p.dead) { circle(p.x, p.y, 8, hullMid); circle(p.x, p.y, 4, energy); continue; }
    const ang = P2 && P2.alive ? Math.atan2(P2.y - p.y, P2.x - p.x) : Math.PI / 2;
    drawSpriteTo(g, K, 'bTurret', p.x, p.y, { ...bo, rot: ang - Math.PI / 2, scale: 0.68, flash: p.flash > 0 ? (e === 0 ? 0.9 : e === 1 ? 0.42 : 0.24) : 0 });
  }
}
{
  /* les parties du robot : taille de touche propre et PV */
  const _spawnBoss = spawnBoss;
  spawnBoss = function () {
    const b = _spawnBoss();
    if (b.def.final) { b.punch = 0; b.parts.forEach((p, i) => { p.hp = Math.round(b.maxHp * (i < 2 ? 0.17 : 0.1)); p.maxHp = p.hp; p.r = i < 2 ? 54 : 34; p.or = 160; p.x = b.x; p.y = b.y; }); }
    return b;
  };
}

{
  const _bossMoveExt = bossMoveExt;
  bossMoveExt = function (b, dt) {
    if (b.def.move === 'robot') { b.x = L_W / 2 + Math.sin(b.t * 0.45 + b.seed) * 42; b.y = 262 + Math.sin(b.t * 0.8) * 16; return true; }
    return _bossMoveExt(b, dt);
  };
}


/* ---- 99_campaign2.js — C : la base de VORAX (secteurs 21-24), décors et arrière-plans variés ------ */

/* ---- textes : les quatre derniers secteurs se passent dans la base ennemie ------------------------ */
{
  const set = (id, a) => { NX[id] = a; };
  set('li.21', ['PÉRIMÈTRE DE LA BASE VORAX', 'VORAX BASE · PERIMETER', 'PERÍMETRO DE LA BASE VORAX', 'PERÍMETRO DA BASE VORAX', 'ヴォラックス基地・外周']);
  set('li.22', ['HANGARS D’ASSAUT', 'ASSAULT HANGARS', 'HANGARES DE ASALTO', 'HANGARES DE ASSALTO', '強襲ハンガー']);
  set('li.23', ['SALLE DU RÉACTEUR', 'REACTOR CHAMBER', 'SALA DEL REACTOR', 'SALA DO REATOR', '炉心室']);
  set('li.24', ["BASE DE VORAX · LE GRAND SAS", "VORAX BASE · THE GREAT AIRLOCK", "BASE DE VORAX · LA GRAN ESCLUSA", "BASE DE VORAX · A GRANDE ESCOTILHA", "ヴォラックス基地・大エアロック"]);
  set('ob.21', ['Percer le périmètre de la base de VORAX.', 'Break through the perimeter of VORAX’s base.', 'Romper el perímetro de la base de VORAX.', 'Romper o perímetro da base de VORAX.', 'ヴォラックス基地の外周を突破せよ。']);
  set('ob.22', ['Détruire le Raytraceur et traverser les hangars d’assaut.', 'Destroy the Raytracer and cross the assault hangars.', 'Destruir al Raytracer y cruzar los hangares de asalto.', 'Destruir o Raytracer e atravessar os hangares de assalto.', 'レイトレーサーを倒し、強襲ハンガーを抜けろ。']);
  set('ob.23', ['Franchir OMEGA-VECTOR, gardien du réacteur.', 'Get past OMEGA-VECTOR, guardian of the reactor.', 'Superar a OMEGA-VECTOR, guardián del reactor.', 'Passar OMEGA-VECTOR, guardião do reator.', '炉心の番人、オメガ・ベクターを突破せよ。']);
  set('ob.24', ["Forcer les sas de la base et abattre VORAX.", "Break through the base airlocks and bring down VORAX.", "Forzar las esclusas de la base y derribar a VORAX.", "Forçar as escotilhas da base e abater VORAX.", "基地のエアロックを突破し、ヴォラックスを倒せ。"]);
  set('ho.21', ['TOURELLES · RAMPANTS · FURTIFS', 'TURRETS · CRAWLERS · STEALTHS', 'TORRETAS · REPTADORES · SIGILOSOS', 'TORRES · RASTEJANTES · FURTIVOS', 'タレット・クローラー・ステルス']);
  set('ho.22', ['CANONNIÈRES · FOREUSES · PRISMES', 'GUNSHIPS · DRILLERS · PRISMS', 'CAÑONERAS · TALADROS · PRISMAS', 'CANHONEIRAS · BROCAS · PRISMAS', 'ガンシップ・ドリル・プリズム']);
  set('ho.23', ['PULSARS · ORBITEURS · MÉDECINS', 'PULSARS · ORBITERS · MEDICS', 'PÚLSARES · ORBITADORES · MÉDICOS', 'PÚLSARES · ORBITADORES · MÉDICOS', 'パルサー・オービター・メディック']);
  set('ho.24', ['VORAX · TOUTE LA GARNISON', 'VORAX · THE WHOLE GARRISON', 'VORAX · TODA LA GUARNICIÓN', 'VORAX · TODA A GUARNIÇÃO', 'ヴォラックス・全守備隊']);
  set('br.21', ['SECTEUR 21 — PÉRIMÈTRE DE LA BASE', 'SECTOR 21 — BASE PERIMETER', 'SECTOR 21 — PERÍMETRO DE LA BASE', 'SETOR 21 — PERÍMETRO DA BASE', 'セクター21 — 基地の外周']);
  set('br.21.1', ['Sixième génération : le vecteur pur. Et au bout, la base de VORAX.', 'Sixth generation: pure vector. And at the end of it, VORAX’s base.', 'Sexta generación: vector puro. Y al final, la base de VORAX.', 'Sexta geração: vetor puro. E no fim, a base de VORAX.', '第六世代、純粋なベクター。その先にヴォラックスの基地がある。']);
  set('br.21.2', ['Murs, tourelles, projecteurs. Tout ce que tu as battu monte la garde ici.', 'Walls, turrets, searchlights. Everything you have beaten stands guard here.', 'Muros, torretas, focos. Todo lo que has vencido hace guardia aquí.', 'Muros, torres, holofotes. Tudo o que venceste faz guarda aqui.', '壁、タレット、探照灯。倒してきた全てが、ここで見張っている。']);
  set('br.21.3', ['Le HÉRAUT garde la porte. Il disparaît avant que tu le touches, puis revient.', 'The HERALD guards the gate. It vanishes before you touch it, then returns.', 'El HERALDO guarda la puerta. Desaparece antes de que lo toques y vuelve.', 'O ARAUTO guarda o portão. Desaparece antes de o tocares e regressa.', '伝令が門を守る。触れる前に消え、また現れる。']);
  set('br.21.4', ['Reste près du mur : les projecteurs ne balaient jamais les coins.', 'Stay near the wall: the searchlights never sweep the corners.', 'Quédate junto al muro: los focos nunca barren las esquinas.', 'Fica junto ao muro: os holofotes nunca varrem os cantos.', '壁際にいろ。探照灯は隅までは照らさない。']);
  set('br.21.q', ['« Objectif : percer le périmètre de la base de VORAX. »', '“Objective: break through the perimeter of VORAX’s base.”', '«Objetivo: romper el perímetro de la base de VORAX.»', '«Objetivo: romper o perímetro da base de VORAX.»', '「目標：ヴォラックス基地の外周突破。」']);
  set('br.22', ['SECTEUR 22 — HANGARS D’ASSAUT', 'SECTOR 22 — ASSAULT HANGARS', 'SECTOR 22 — HANGARES DE ASALTO', 'SETOR 22 — HANGARES DE ASSALTO', 'セクター22 — 強襲ハンガー']);
  set('br.22.1', ['C’est ici que VORAX assemble ses escadrons : canonnières, foreuses, prismes.', 'This is where VORAX assembles its squadrons: gunships, drillers, prisms.', 'Aquí VORAX ensambla sus escuadrones: cañoneras, taladros, prismas.', 'É aqui que VORAX monta os seus esquadrões: canhoneiras, brocas, prismas.', 'ここでヴォラックスは部隊を組み立てる。ガンシップ、ドリル、プリズム。']);
  set('br.22.2', ['Les portes des hangars s’ouvrent au fil du vol. Ne reste pas sous une porte.', 'The hangar doors open as you fly. Do not stay under a door.', 'Las puertas de los hangares se abren mientras vuelas. No te quedes bajo una.', 'As portas dos hangares abrem-se enquanto voas. Não fiques debaixo de uma.', '飛行中にハンガーの扉が開く。扉の下にとどまるな。']);
  set('br.22.3', ['Le RAYTRACEUR vise depuis le plafond : chaque rayon trouve sa cible.', 'The RAYTRACER aims from the ceiling: every ray finds its target.', 'El RAYTRACER apunta desde el techo: cada rayo encuentra su objetivo.', 'O RAYTRACER aponta do teto: cada raio encontra o alvo.', 'レイトレーサーが天井から狙う。全ての光線は的を外さない。']);
  set('br.22.4', ['Abats les médecins en premier : ils soignent tout ce qui les entoure.', 'Shoot the medics first: they heal everything around them.', 'Derriba primero a los médicos: curan todo lo que los rodea.', 'Abate primeiro os médicos: curam tudo à sua volta.', 'メディックを先に落とせ。周囲を全て回復する。']);
  set('br.22.q', ['« Objectif : détruire le Raytraceur et traverser les hangars d’assaut. »', '“Objective: destroy the Raytracer and cross the assault hangars.”', '«Objetivo: destruir al Raytracer y cruzar los hangares de asalto.»', '«Objetivo: destruir o Raytracer e atravessar os hangares de assalto.»', '「目標：レイトレーサー撃破、強襲ハンガー突破。」']);
  set('br.23', ['SECTEUR 23 — SALLE DU RÉACTEUR', 'SECTOR 23 — REACTOR CHAMBER', 'SECTOR 23 — SALA DEL REACTOR', 'SETOR 23 — SALA DO REATOR', 'セクター23 — 炉心室']);
  set('br.23.1', ['Le cœur de la base. Tout ce qui s’y allume, VORAX le dévore.', 'The heart of the base. Everything that lights up here, VORAX devours.', 'El corazón de la base. Todo lo que se enciende aquí, VORAX lo devora.', 'O coração da base. Tudo o que aqui se acende, VORAX devora.', '基地の心臓部。ここで灯るものは全て、ヴォラックスが喰らう。']);
  set('br.23.2', ['OMEGA-VECTOR garde le réacteur. Il n’a pas de forme fixe et se téléporte.', 'OMEGA-VECTOR guards the reactor. It has no fixed shape and teleports.', 'OMEGA-VECTOR guarda el reactor. No tiene forma fija y se teletransporta.', 'OMEGA-VECTOR guarda o reator. Não tem forma fixa e teletransporta-se.', 'オメガ・ベクターが炉を守る。決まった形はなく、瞬間移動する。']);
  set('br.23.3', ['Les pulsars lâchent des anneaux avec une brèche : passe par la brèche.', 'Pulsars release rings with a gap: go through the gap.', 'Los púlsares sueltan anillos con una brecha: pasa por la brecha.', 'Os púlsares largam anéis com uma brecha: passa pela brecha.', 'パルサーは隙間のあるリングを放つ。隙間を通り抜けろ。']);
  set('br.23.4', ['Après lui, il n’y a plus que le centre de commandement. Et VORAX.', 'After it, there is only the command center. And VORAX.', 'Después de él solo queda el centro de mando. Y VORAX.', 'Depois dele só resta o centro de comando. E VORAX.', 'その先は司令センターだけ。そしてヴォラックス。']);
  set('br.23.q', ['« Objectif : franchir OMEGA-VECTOR, gardien du réacteur. »', '“Objective: get past OMEGA-VECTOR, guardian of the reactor.”', '«Objetivo: superar a OMEGA-VECTOR, guardián del reactor.»', '«Objetivo: passar OMEGA-VECTOR, guardião do reator.»', '「目標：炉心の番人オメガ・ベクターを突破。」']);
  set('br.24', ["SECTEUR 24 — LE GRAND SAS", "SECTOR 24 — THE GREAT AIRLOCK", "SECTOR 24 — LA GRAN ESCLUSA", "SETOR 24 — A GRANDE ESCOTILHA", "セクター24 — 大エアロック"]);
  set('br.24.1', ["La flotte de défense t’attend devant la base. Traverse-la.", "The defence fleet is waiting in front of the base. Get through it.", "La flota de defensa te espera ante la base. Atraviésala.", "A frota de defesa espera-te diante da base. Atravessa-a.", "基地の前で防衛艦隊が待ち構えている。突破して。"]);
  set('br.24.2', ["Puis deux sas : le premier, tu le fais sauter au canon. Le second, c’est VORAX qui l’ouvrira.", "Then two airlocks: blow the first one open with your guns. VORAX will open the second himself.", "Luego dos esclusas: revienta la primera a cañonazos. La segunda la abrirá el propio VORAX.", "Depois, duas escotilhas: rebenta a primeira a tiro. A segunda, será o próprio VORAX a abri-la.", "その先にエアロックが二つ。一つ目は砲撃で破壊して。二つ目はヴォラックス自身が開けるわ。"]);
  set('br.24.3', ["Ses yeux chargent en rouge avant de tirer. Reste entre les deux rayons et vise la tête.", "His eyes charge red before he fires. Stay between the two beams and aim for the head.", "Sus ojos se cargan en rojo antes de disparar. Quédate entre los dos rayos y apunta a la cabeza.", "Os olhos dele carregam a vermelho antes de disparar. Fica entre os dois raios e aponta à cabeça.", "撃つ前に彼の目が赤く光る。二本の光線の間にいて、頭を狙って。"]);
  set('br.24.4', ['Je t’ai recopié dix mille fois pour ce moment. Finis la partie, pilote.', 'I copied you ten thousand times for this moment. Finish the game, pilot.', 'Te copié diez mil veces para este momento. Acaba la partida, piloto.', 'Copiei-te dez mil vezes para este momento. Acaba o jogo, piloto.', 'この瞬間のために、君を一万回コピーした。決着をつけて、パイロット。']);
  set('br.24.q', ["« Objectif : forcer les sas de la base et abattre VORAX. »", "“Objective: break through the base airlocks and bring down VORAX.”", "«Objetivo: forzar las esclusas de la base y derribar a VORAX.»", "«Objetivo: forçar as escotilhas da base e abater VORAX.»", "「目標：基地のエアロックを突破し、ヴォラックスを倒せ。」"]);
  const info = (n) => ({ lieu: tx('li.' + n), obj: tx('ob.' + n) });
  for (let n = 21; n <= 24; n++) SECTINFO[n - 1] = info(n);
  for (let n = 21; n <= 24; n++) SECTHOST[n - 1] = tx('ho.' + n);
  SECTHOST24[20] = SECTHOST[20]; SECTHOST24[21] = SECTHOST[21]; SECTHOST24[22] = SECTHOST[22]; SECTHOST24[23] = SECTHOST[23];
  narrativeInstall();
}

/* ---- outils de dessin pour les arrière-plans ------------------------------------------------- */
let NG = null, NK = 1;
const npx = v => Math.round(v * NK) / NK;
/* Rectangles, traits et centres de décor verrouillés sur la grille du buffer.
   Les coordonnées fractionnaires d'avant créaient des bords flous en 16 bits. */
const nf = (x, y, w, h, c) => { const x0 = Math.round(x * NK), y0 = Math.round(y * NK), x1 = Math.round((x + w) * NK), y1 = Math.round((y + h) * NK); NG.fillStyle = c; NG.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)); };
const nc = (x, y, r, c) => { NG.fillStyle = c; NG.beginPath(); NG.arc(npx(x) * NK, npx(y) * NK, Math.max(0.5, Math.round(r * NK)), 0, 6.2832); NG.fill(); };
const nl = (x1, y1, x2, y2, w, c) => { NG.strokeStyle = c; NG.lineWidth = Math.max(1, Math.round(w * NK)); NG.beginPath(); NG.moveTo(npx(x1) * NK, npx(y1) * NK); NG.lineTo(npx(x2) * NK, npx(y2) * NK); NG.stroke(); };
const nr = (x, y, r, w, c) => { NG.strokeStyle = c; NG.lineWidth = Math.max(1, Math.round(w * NK)); NG.beginPath(); NG.arc(npx(x) * NK, npx(y) * NK, Math.max(0.5, Math.round(r * NK)), 0, 6.2832); NG.stroke(); };
const nrand = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const nglow = (x, y, r, c0) => {
  const hw = typeof visualHardware === 'function' ? visualHardware() : null;
  if (hw && ['snes','megadrive','neogeo'].includes(hw.id)) {
    const m = String(c0).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (m) {
      const cx = npx(x) * NK, cy = npx(y) * NK, rr = Math.max(1, Math.round(r * NK));
      const alpha = m[4] === undefined ? 1 : Number(m[4]);
      /* Halo en six bandes franches : éclat en pixels au lieu du flou moderne. */
      for (let i = 6; i >= 1; i--) {
        const rad = Math.max(1, Math.round(rr * i / 6));
        NG.fillStyle = `rgba(${m[1]},${m[2]},${m[3]},${(alpha * (0.018 + (1 - i / 7) * 0.075)).toFixed(3)})`;
        NG.beginPath(); NG.arc(cx, cy, rad, 0, 6.2832); NG.fill();
      }
      return;
    }
  }
  const gr = NG.createRadialGradient(x * NK, y * NK, 0, x * NK, y * NK, r * NK); gr.addColorStop(0, c0); gr.addColorStop(1, 'rgba(0,0,0,0)'); NG.fillStyle = gr; NG.fillRect((x - r) * NK, (y - r) * NK, r * 2 * NK, r * 2 * NK);
};
const nhsl = (h, s, l, a) => `hsla(${Math.round(h)},${s}%,${l}%,${a})`;
/* tuiles qui descendent : mouvement positif sur l'axe Y, verrouillé à un pixel d'art */
const ntiles = (P, sy, cols, fn, x0) => {
  const pxTravel = Math.round(Math.max(0, sy) * NK) / NK;
  const rowTravel = Math.floor(pxTravel / P), off = pxTravel - rowTravel * P;
  for (let r = 0; r < Math.ceil(L_H / P) + 2; r++) {
    const screenY = npx((r - 1) * P + off);
    /* L'index avance vers le bas. Un motif conserve son identifiant pendant
       sa descente et les nouvelles rangées entrent par le haut. */
    const worldRow = r - 1 - rowTravel;
    for (let c = 0; c < cols; c++) fn(c, r, (x0 || 0) + c * P, screenY, worldRow * 31 + c * 7);
  }
};

/* Fonds pixel art par génération — images intégrées et chargées à la demande. */
const NV_PIXEL_BACKDROPS = {
  9: { h:640, src:'assets/media/media-123.webp' },
  10: { h:480, src:'assets/media/media-124.webp' },
  11: { h:853, src:'assets/media/media-125.webp' },
  12: { h:853, src:'assets/media/media-126.webp' },
  13: { h:853, src:'assets/media/media-127.webp' },
  14: { h:853, src:'assets/media/media-128.webp' },
  15: { h:853, src:'assets/media/media-129.webp' },
  16: { h:853, src:'assets/media/media-130.webp' },
};
let NV_PIXEL_BG_ACTIVE = 0;
function nvDrawConsoleBackdrop(layer, level) {
  const g = layer.g, k = layer.K, a = NV_PIXEL_BACKDROPS[level];
  if (NV_PIXEL_BG_ACTIVE !== level) {
    const prev = NV_PIXEL_BACKDROPS[NV_PIXEL_BG_ACTIVE]; if (prev) { if (prev.im) prev.im.src = ''; prev.im = null; prev.tile = null; prev.loading = false; }
    NV_PIXEL_BG_ACTIVE = level;
  }
  if (a && !a.tile && !a.loading) {
    a.loading = true; const im = new Image(); a.im = im; im.decoding = 'async';
    im.onload = () => { if (NV_PIXEL_BG_ACTIVE !== level) return; const c = document.createElement('canvas'); c.width = 480; c.height = a.h * 2; const q = c.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(im, 0, 0, 480, a.h); q.save(); q.translate(0, a.h * 2); q.scale(1, -1); q.drawImage(im, 0, 0, 480, a.h); q.restore(); a.tile = c; a.loading = false; };
    im.onerror = () => { a.loading = false; }; im.src = a.src;
  }
  g.save(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = false;
  if (!a || !a.tile) { g.fillStyle = level === 10 ? '#0b3447' : (level >= 13 ? '#090916' : '#080f26'); g.fillRect(0, 0, layer.c.width, layer.c.height); }
  else { const th = a.h * 2, step = Math.max(1, Math.round(th * k)), off = ((Math.round(SCROLL.y * 0.72 * k) % step) + step) % step; for (let y = off - step; y < layer.c.height + step; y += step) g.drawImage(a.tile, 0, y, layer.c.width, step); }
  g.restore();
}

const NV_SCENE = {
  9: (t, sy) => {            /* axe néon : îlots d'une mégapole vus du ciel */
    ntiles(120, sy, 5, (c, r, x, y, id) => { const h = nrand(id) * 360; nf(x - 20, y, 96, 96, 'rgba(8,6,26,.62)'); NG.strokeStyle = nhsl(300 + nrand(id + 1) * 80, 90, 60, 0.4); NG.lineWidth = NK * 1.5; NG.strokeRect((x - 20) * NK, y * NK, 96 * NK, 96 * NK);
      if (nrand(id + 2) > 0.5) nf(x, y + 14, 56, 5, nhsl(h, 90, 60, 0.18 + 0.1 * Math.sin(t * 2 + id))); });
    for (let i = 0; i < 4; i++) { const yy = ((t * 70 * (1 + i * 0.3) + i * 211) % 960) - 50; nf(((i * 97) % 5) * 120 - 40, yy, 3, 8, 'rgba(255,230,150,.7)'); }
  },
  10: (t, sy) => {           /* port franc : eau noire, jetées, vaguelettes */
    const gr = NG.createLinearGradient(0, 0, 0, L_H * NK); gr.addColorStop(0, 'rgba(6,24,56,.55)'); gr.addColorStop(1, 'rgba(4,12,34,.7)'); NG.fillStyle = gr; NG.fillRect(0, 0, L_W * NK, L_H * NK);
    for (let i = 0; i < 38; i++) { const y = (nrand(i * 3) * 900 + sy * 1.2 + Math.sin(t + i) * 4) % 900; nf(nrand(i) * 460, y, 18 + nrand(i + 5) * 40, 1.5, 'rgba(150,215,255,.2)'); }
    ntiles(130, sy * 1.1, 1, (c, r, x, y, id) => { nf(0, y, 52, 14, 'rgba(30,38,56,.85)'); nf(L_W - 70, y + 40, 70, 14, 'rgba(30,38,56,.85)'); nc(46, y + 7, 3, 'rgba(255,180,90,.8)'); nc(L_W - 64, y + 47, 3, 'rgba(255,180,90,.8)'); });
    nf(0, 0, 14, L_H, 'rgba(28,34,52,.9)'); nf(L_W - 14, 0, 14, L_H, 'rgba(28,34,52,.9)');
  },
  11: (t, sy) => {           /* quartier des enseignes : toits et panneaux lumineux */
    ntiles(110, sy * 1.1, 5, (c, r, x, y, id) => { if (nrand(id) < 0.25) return; const hh = nrand(id + 3) * 360, w = 50 + nrand(id + 4) * 40;
      nf(x - 10, y + 6, w + 14, 90, 'rgba(10,8,22,.6)'); const fl = 0.28 + 0.2 * Math.sin(t * (1.4 + nrand(id + 6) * 2) + id);
      nf(x, y + 14, w, 22, nhsl(hh, 95, 58, fl)); nf(x + 6, y + 50, w - 12, 8, nhsl(hh + 140, 95, 58, fl * 0.8)); });
  },
  12: (t, sy) => {           /* antenne de diffusion : mât et panneaux, sans balayage radar */
    nf(220, 0, 40, L_H, 'rgba(18,14,32,.78)'); nf(236, 0, 8, L_H, 'rgba(75,44,82,.7)');
    for (let i = 0; i < 8; i++) {
      const y = ((i * 132 + sy * 0.82) % (L_H + 180)) - 90;
      nf(96, y, 288, 12, 'rgba(38,23,48,.88)'); nf(116, y + 3, 248, 3, 'rgba(255,90,200,.32)');
      nf(130, y + 15, 18, 4, 'rgba(120,190,255,.62)'); nf(332, y + 15, 18, 4, 'rgba(120,190,255,.62)');
    }
    for (let i = 0; i < 6; i++) { const y = ((i * 151 + sy * 1.1) % L_H); nf(24, y, 78, 3, 'rgba(255,90,200,.20)'); nf(L_W - 102, y + 22, 78, 3, 'rgba(120,190,255,.20)'); }
    nglow(L_W / 2, 126, 96, 'rgba(255,90,200,.25)');
  },

  13: (t, sy) => {           /* salle d'arcade : moquette à losanges */
    ntiles(56, sy * 1.0, 10, (c, r, x, y, id) => { const k = (c + r) % 2; NG.fillStyle = k ? 'rgba(120,20,140,.20)' : 'rgba(20,80,160,.20)';
      NG.beginPath(); NG.moveTo((x + 28) * NK, y * NK); NG.lineTo((x + 56) * NK, (y + 28) * NK); NG.lineTo((x + 28) * NK, (y + 56) * NK); NG.lineTo(x * NK, (y + 28) * NK); NG.closePath(); NG.fill();
      if (nrand(id) > 0.75) nc(x + 28, y + 28, 2, 'rgba(255,230,120,.7)'); });
  },
  14: (t, sy) => {           /* réserve : rangées d'étagères vues du dessus */
    ntiles(98, sy * 1.0, 1, (c, r, x, y, id) => {
      for (const sx of [30, 270]) { nf(sx, y, 180, 24, 'rgba(24,18,40,.8)'); nf(sx, y, 180, 3, 'rgba(255,200,90,.22)');
        for (let i = 0; i < 6; i++) { const w = 18 + nrand(id + i + sx) * 10; nf(sx + 4 + i * 29, y + 5, w, 14, nhsl(nrand(id + i * 2 + sx) * 360, 60, 46, 0.55)); } }
    });
  },
  15: (t, sy) => {           /* salle des coffres : casiers et dalles d'or, sans cercle radar */
    nf(36, 78, L_W - 72, L_H - 156, 'rgba(24,20,34,.46)');
    for (let side = 0; side < 2; side++) {
      const sx = side ? 278 : 30;
      nf(sx, 0, 172, L_H, 'rgba(38,30,43,.72)');
      nf(sx, 0, 4, L_H, 'rgba(255,200,90,.30)'); nf(sx + 168, 0, 4, L_H, 'rgba(255,200,90,.30)');
      for (let i = 0; i < 8; i++) {
        const y = ((i * 118 + sy * 0.72) % (L_H + 140)) - 70;
        nf(sx + 10, y, 152, 8, 'rgba(88,65,34,.88)');
        for (let j = 0; j < 5; j++) { const xx = sx + 14 + j * 29; nf(xx, y + 14, 20, 30, nhsl((j * 37 + i * 19) % 360, 58, 50, .62)); nf(xx, y + 12, 20, 3, 'rgba(255,205,90,.55)'); }
      }
    }
    for (let i = 0; i < 8; i++) { const y = ((i * 123 + sy * 1.25) % L_H); nf(212, y, 56, 5, 'rgba(255,220,135,.16)'); }
  },

  16: (t, sy) => {           /* scène du high score : sol de danse et projecteurs */
    ntiles(48, sy, 11, (c, r, x, y, id) => { const h = (c * 35 + r * 22 + t * 90) % 360; nf(x + 1, y + 1, 46, 46, nhsl(h, 90, 50, 0.13 + 0.07 * Math.sin(t * 3 + c + r))); });
    for (let i = 0; i < 3; i++) { nglow(L_W / 2 + Math.sin(t * 0.8 + i * 2.1) * 180, 380 + Math.cos(t * 0.6 + i * 1.7) * 220, 130, nhsl(i * 120 + 20, 90, 60, 0.28)); }
  },
  18: (t, sy) => {           /* ceinture de débris : roches à la dérive */
    for (let i = 0; i < 9; i++) { const x = nrand(i) * 480, y = ((i * 170 + sy * 1.5) % 1100) - 120, r = 22 + nrand(i + 9) * 40, ph = nrand(i + 3) * 6;
      NG.fillStyle = 'rgba(28,30,42,.78)'; NG.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832 + t * 0.1 * (i % 2 ? 1 : -1), rr = r * (0.7 + 0.3 * nrand(i * 9 + k)); NG.lineTo((x + Math.cos(a) * rr) * NK, (y + Math.sin(a) * rr) * NK); }
      NG.closePath(); NG.fill(); nc(x - r * 0.25, y - r * 0.25, r * 0.22, 'rgba(120,130,160,.35)'); }
  },
  19: (t, sy) => {           /* chantier polygonal : grille filaire en perspective */
    for (let i = -8; i <= 8; i++) nl(L_W / 2 + i * 22, -60, L_W / 2 + i * 90, L_H, 1, 'rgba(120,255,200,.14)');
    for (let j = 0; j < 14; j++) { const k = ((j + (sy / 80) % 1) / 14), y = -60 + k * k * (L_H + 60) + 60; nl(0, y, L_W, y, 1, 'rgba(120,255,200,' + (0.05 + k * 0.16) + ')'); }
    for (let i = 0; i < 3; i++) { const x = nrand(i + 20) * 380 + 50, y = ((i * 330 + sy * 1.6) % 1000) - 100, a = t * 0.5 + i, s = 40 + i * 12;
      const pts = []; for (const [dx, dy, dz] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) { const X = dx * Math.cos(a) - dz * Math.sin(a), Z = dx * Math.sin(a) + dz * Math.cos(a); pts.push([x + X * s, y + dy * s + Z * s * 0.4]); }
      for (const [p, q] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) nl(pts[p][0], pts[p][1], pts[q][0], pts[q][1], 1.2, 'rgba(160,255,220,.4)'); }
  },
  20: (t, sy) => {           /* salle de gravure : rails et panneaux de données, sans pistes circulaires */
    NG.fillStyle = '#080b15'; NG.fillRect(0, 0, L_W * NK, L_H * NK);
    nf(34, 54, L_W - 68, L_H - 108, 'rgba(23,30,50,.48)');
    for (let i = 0; i < 7; i++) {
      const y = ((i * 134 + sy * (0.65 + i * .07)) % (L_H + 150)) - 75;
      nf(42, y, L_W - 84, 8, 'rgba(40,55,82,.68)'); nf(48, y + 2, L_W - 96, 2, 'rgba(150,190,255,.42)');
      for (let j = 0; j < 9; j++) { const x = 58 + j * 44; nf(x, y + 14, 28, 34, j % 3 ? 'rgba(48,86,122,.42)' : 'rgba(145,62,100,.48)'); }
    }
    for (let i = 0; i < 5; i++) { const x = 66 + i * 86; nf(x, 32, 4, L_H - 64, 'rgba(130,175,220,.17)'); nf(x + 13, 32, 2, L_H - 64, 'rgba(255,120,160,.12)'); }
    for (let i = 0; i < 14; i++) { const y = ((i * 61 + sy * 1.4) % L_H); nf(54, y, 3, 12, 'rgba(255,230,160,.72)'); }
  },

};
/* base de VORAX : intérieur / extérieur, quatre salles */
const NVB = { d: '#0b0f17', s: '#18202c', s2: '#243247', s3: '#3b4f6e', hz: '#e8b422', al: '#ff4a3a', cy: '#58e0ff', or: '#ff9a3c' };
const NV_BASE = {
  21: (t, sy) => {           /* périmètre : sol de nuit, clôtures, projecteurs */
    const gr = NG.createLinearGradient(0, 0, 0, L_H * NK); gr.addColorStop(0, '#0a1016'); gr.addColorStop(1, '#101a20'); NG.fillStyle = gr; NG.fillRect(0, 0, L_W * NK, L_H * NK);
    ntiles(96, sy, 6, (c, r, x, y, id) => { if (nrand(id) > 0.6) nf(x + 6, y + 6, 84, 84, 'rgba(40,60,52,.26)'); nf(x, y, 96, 1, 'rgba(90,120,110,.09)'); nf(x, y, 1, 96, 'rgba(90,120,110,.09)'); });
    ntiles(260, sy * 1.2, 1, (c, r, x, y, id) => { nf(0, y, L_W, 2, 'rgba(120,140,160,.22)'); for (let i = 0; i < 12; i++) nf(i * 42 + 6, y - 8, 3, 18, 'rgba(120,140,160,.35)'); nf(0, y + 4, L_W, 6, 'rgba(232,180,34,.08)'); });
    for (let i = 0; i < 3; i++) { const bx = 80 + i * 160, sw = Math.sin(t * 0.7 + i * 2) * 120; NG.fillStyle = 'rgba(210,235,255,.07)'; NG.beginPath(); NG.moveTo(bx * NK, -20 * NK); NG.lineTo((bx + sw - 60) * NK, L_H * 0.8 * NK); NG.lineTo((bx + sw + 60) * NK, L_H * 0.8 * NK); NG.closePath(); NG.fill(); }
  },
  22: (t, sy) => {           /* hangars : dalles d'acier, voies jaunes, aires d'envol */
    NG.fillStyle = '#0c1118'; NG.fillRect(0, 0, L_W * NK, L_H * NK);
    ntiles(110, sy, 5, (c, r, x, y, id) => { nf(x + 1, y + 1, 108, 108, nrand(id) > 0.5 ? 'rgba(36,50,71,.5)' : 'rgba(24,32,44,.5)'); });
    nf(60, 0, 5, L_H, 'rgba(232,180,34,.35)'); nf(L_W - 65, 0, 5, L_H, 'rgba(232,180,34,.35)');
    ntiles(300, sy * 1.15, 1, (c, r, x, y, id) => { nf(L_W / 2 - 72, y + 98, 144, 4, 'rgba(232,180,34,.32)'); nf(L_W / 2 - 72, y + 98, 4, 46, 'rgba(232,180,34,.32)'); nf(L_W / 2 + 68, y + 98, 4, 46, 'rgba(232,180,34,.32)'); nf(L_W / 2 - 52, y + 108, 104, 3, 'rgba(88,224,255,.25)'); nf(L_W / 2 - 14, y + 108, 6, 24, 'rgba(232,180,34,.45)'); nf(L_W / 2 + 8, y + 108, 6, 24, 'rgba(232,180,34,.45)'); nf(L_W / 2 - 14, y + 117, 28, 5, 'rgba(232,180,34,.45)'); });
    for (let i = 0; i < 8; i++) { const yy = (i * 110 + sy * 1.6) % 900; nc(14, yy, 3, Math.sin(t * 4 + i) > 0 ? 'rgba(255,74,58,.8)' : 'rgba(80,20,20,.6)'); nc(L_W - 14, yy, 3, Math.sin(t * 4 + i) > 0 ? 'rgba(255,74,58,.8)' : 'rgba(80,20,20,.6)'); }
  },
  23: (t, sy) => {           /* réacteur : un cœur de plasma sous la grille */
    NG.fillStyle = '#0a0a14'; NG.fillRect(0, 0, L_W * NK, L_H * NK);
    const cx = L_W / 2, cy = 420, pu = 0.8 + 0.2 * Math.sin(t * 2);
    nf(cx - 150, cy - 108, 300, 216, 'rgba(70,34,24,.72)');
    nf(cx - 126, cy - 82, 252, 164, 'rgba(255,135,50,.24)');
    nf(cx - 88, cy - 45, 176, 90, 'rgba(255,220,150,.30)');
    for (let i = 0; i < 11; i++) { const x = cx - 154 + i * 30; nf(x, 0, 5, cy - 120, 'rgba(255,150,70,.18)'); nf(x, cy + 120, 5, L_H - cy - 120, 'rgba(255,150,70,.18)'); }
    for (let i = 0; i < 12; i++) { const y = ((i * 72 + sy * 1.1) % L_H); nf(0, y, L_W, 2, 'rgba(255,180,90,.10)'); }
    for (let i = 0; i < 5; i++) nf(cx - 70 + i * 32, cy - 24 + (i % 2) * 48, 18, 28, `rgba(255,${Math.round(95 + i * 28)},65,${(0.34 * pu).toFixed(2)})`);
  },
  24: (t, sy) => {           /* centre de commandement : écrans, carte holographique, alerte rouge */
    NG.fillStyle = '#080a12'; NG.fillRect(0, 0, L_W * NK, L_H * NK);
    ntiles(80, sy, 7, (c, r, x, y, id) => { nf(x, y, 79, 1, 'rgba(88,224,255,.08)'); nf(x, y, 1, 79, 'rgba(88,224,255,.08)'); if (nrand(id) > 0.82) nf(x + 8, y + 8, 40, 26, nhsl(190 + nrand(id + 2) * 40, 90, 55, 0.1 + 0.08 * Math.sin(t * 3 + id))); });
    const cx = L_W / 2, cy = 470;
    /* Carte de commandement en panneaux rectangulaires, sans cible circulaire. */
    nf(cx - 120, cy - 88, 240, 176, 'rgba(12,28,42,.72)');
    for (let i = 0; i < 6; i++) nf(cx - 110 + i * 38, cy - 78, 2, 156, 'rgba(88,224,255,.12)');
    for (let i = 0; i < 5; i++) nf(cx - 112, cy - 72 + i * 30, 224, 2, 'rgba(88,224,255,.12)');
    const mapY = cy - 70 + ((sy * 0.4) % 140); nf(cx - 108, mapY, 216, 4, 'rgba(88,224,255,.45)');
    const al = 0.07 + 0.07 * Math.max(0, Math.sin(t * 3)); nf(0, 0, 10, L_H, 'rgba(255,74,58,' + (al * 4) + ')'); nf(L_W - 10, 0, 10, L_H, 'rgba(255,74,58,' + (al * 4) + ')');
    nglow(cx, 120, 220, 'rgba(255,74,58,' + al + ')');
  },
};
{
  /* le ciel peint ne convient qu'aux orbites : les autres secteurs ont leur propre fond */
  const _drawAnimeSky = drawAnimeSky;
  drawAnimeSky = function (layer) {
    const L = G.level | 0;
    if (L >= 19 && L <= 24) {
      if (L >= 21) { const g = layer.g; NG = g; NK = layer.K; NV_BASE[L](G.t || 0, Math.max(0, SCROLL.y) * 0.07); }
      return;
    }
    _drawAnimeSky(layer);
  };
  const _drawStars = drawStars;
  drawStars = function (layer, idx, dt, speedMul) {
    const L = G.level | 0;
    if ((L >= 21 && idx !== 2) || (L >= 9 && L <= 16)) return; /* fonds peints nets : pas d'étoiles superposées */
    _drawStars(layer, idx, dt, speedMul);
  };
  const _drawNebulae = drawNebulae;
  drawNebulae = function (layer, dt) {
    const L = G.level | 0;
    if (L >= 21) return;
    if (L >= 9 && L <= 16) { nvDrawConsoleBackdrop(layer, L); return; }
    _drawNebulae(layer, dt);
    const sc = NV_SCENE[L]; if (!sc) return;
    NG = layer.g; NK = layer.K; PAINT = { g: layer.g, K: layer.K };
    sc(G.t || 0, Math.max(0, SCROLL.y) * 0.05);
    NG.globalAlpha = 1; NG.globalCompositeOperation = 'source-over';
  };
  const _decorDrawSpace = decorDrawSpace;
  decorDrawSpace = function (layer, which) {
    const L = G.level | 0;
    if (L >= 9 && L <= 16) return; /* la composition des scènes peintes reste dégagée */
    _decorDrawSpace(layer, which);
  };
}

/* ---- mobilier de décor propre à chaque secteur ET à chaque niveau ------------------------------ */
{
  const B = () => TH.bg, B2 = () => TH.bg2, B3 = () => TH.bg3, W = () => TH.white;
  const plate = (x, y, w, h) => bevel(x, y, w, h, TH.bg2, TH.bg3, TH.bg);
  const ell = (cx, cy, rx, ry, col) => { const g = PAINT.g, k = PAINT.K; g.fillStyle = col; g.beginPath(); g.ellipse(cx * k, cy * k, rx * k, ry * k, 0, 0, 6.2832); g.fill(); };
  const sol = (x, y, w, h, h0, a, l) => `hsla(${h0},90%,${l || 60}%,${a})`;
  const N = (o) => { o.nvNew = true; if (o.wt === undefined) o.wt = 3.2; return o; };
  const add = [];
  /* ===== secteur 1 — silo (4 teintes) ===== */
  add.push(N({ id: 'v_rampe', sec: 0, stage: 0, dim: () => [150, 112], statique(x, y, w, h) {
      plate(x, y, w, h); hazard(x + 4, y + 4, w - 8, 8, TH.bg2, TH.bg3); hazard(x + 4, y + h - 12, w - 8, 8, TH.bg2, TH.bg3);
      for (let i = 0; i < 3; i++) poly([x + 24 + i * 34, y + 40, x + 44 + i * 34, y + 40, x + 54 + i * 34, y + 56, x + 44 + i * 34, y + 72, x + 24 + i * 34, y + 72, x + 34 + i * 34, y + 56], TH.white);
    }, anim(x, y, w, h, t) { lamp(x + 8, y + 18, TH.white, t, 3); lamp(x + w - 11, y + 18, TH.white, t, 3); } }));
  add.push(N({ id: 'v_faisceau', sec: 0, stage: 1, dim: () => [96, 210], statique(x, y, w, h) {
      plate(x, y, w, h); for (let i = 0; i < 3; i++) { const px = x + 8 + i * 28; fr(px, y + 4, 18, h - 8, TH.bg3); fr(px, y + 4, 4, h - 8, TH.white); fr(px + 14, y + 4, 4, h - 8, TH.bg); for (let j = 14; j < h - 10; j += 34) fr(px - 3, y + j, 24, 5, TH.bg); }
    }, anim(x, y, w, h, t) { const o = (t * 40) % 34; for (let i = 0; i < 3; i++) fr(x + 13 + i * 28, y + 8 + ((o + i * 11) % (h - 20)), 8, 4, TH.white); } }));
  add.push(N({ id: 'v_treuil', sec: 0, stage: 2, dim: () => [130, 126], statique(x, y, w, h) {
      plate(x, y, w, h); circle(x + w / 2, y + h / 2, 42, TH.bg); circle(x + w / 2, y + h / 2, 36, TH.bg3); ring(x + w / 2, y + h / 2, 30, 2, TH.bg); circle(x + w / 2, y + h / 2, 7, TH.bg); rivets(x, y, w, h, 14, TH.bg3);
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + h / 2; for (let i = 0; i < 4; i++) { const a = t * 1.2 + i * 1.5708; line(cx, cy, cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, 4, TH.white); } circle(cx, cy, 6, TH.bg); } }));
  add.push(N({ id: 'v_turbine', sec: 0, stage: 3, dim: () => [136, 136], statique(x, y, w, h) {
      plate(x, y, w, h); circle(x + w / 2, y + h / 2, 56, TH.bg); ring(x + w / 2, y + h / 2, 56, 3, TH.bg3); vent(x + 6, y + 6, 24, 12, TH.bg, TH.bg3);
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + h / 2; for (let i = 0; i < 6; i++) { const a = t * 6 + i * 1.0472; line(cx, cy, cx + Math.cos(a) * 50, cy + Math.sin(a) * 50, 8, i % 2 ? TH.bg3 : TH.white); } circle(cx, cy, 9, TH.bg2); } }));
  /* ===== secteur 2 — la ville (8 bits étendu) ===== */
  add.push(N({ id: 'v_carrefour', sec: 1, stage: 0, dim: () => [210, 210], statique(x, y, w, h) {
      fr(x, y, w, h, TH.bg); fr(x + 70, y, 70, h, TH.bg2); fr(x, y + 70, w, 70, TH.bg2); fr(x + 70, y + 70, 70, 70, TH.bg2);
      for (let i = 0; i < 7; i++) { fr(x + 74 + i * 9, y + 10, 5, 20, TH.white); fr(x + 74 + i * 9, y + h - 30, 5, 20, TH.white); fr(x + 10, y + 74 + i * 9, 20, 5, TH.white); fr(x + w - 30, y + 74 + i * 9, 20, 5, TH.white); }
      for (let j = 40; j < 70; j += 20) { fr(x + 104, y + j, 2, 10, TH.gold); fr(x + 104, y + h - j - 10, 2, 10, TH.gold); }
    }, anim(x, y, w, h, t) { const p = (t * 90) % (h + 40); fr(x + 90, y + h - p, 4, 4, TH.gold); fr(x + 116, y + h - p, 4, 4, TH.gold); const q = (t * 60) % (w + 40); fr(x + q - 20, y + 90, 4, 4, TH.danger); fr(x + q - 20, y + 116, 4, 4, TH.danger); } }));
  add.push(N({ id: 'v_wagon', sec: 1, stage: 1, dim: () => [72, 230], statique(x, y, w, h) {
      fr(x + 12, y, 3, h, TH.bg3); fr(x + w - 15, y, 3, h, TH.bg3); for (let j = 4; j < h; j += 11) fr(x + 4, y + j, w - 8, 3, TH.bg);
      bevel(x + 8, y + 12, w - 16, h - 24, TH.bg3, TH.acc, TH.bg2); for (let j = 22; j < h - 30; j += 24) { fr(x + 16, y + j, w - 32, 4, TH.bg2); fr(x + 16, y + j + 8, w - 32, 2, TH.bg); } hazard(x + 12, y + h - 26, w - 24, 8, TH.bg3, TH.gold);
    }, anim(x, y, w, h, t) { lamp(x + w / 2 - 1, y + 16, TH.danger, t, 4); } }));
  add.push(N({ id: 'v_toit', sec: 1, stage: 2, dim: () => [156, 132], statique(x, y, w, h) {
      plate(x, y, w, h); for (const [ax, ay] of [[34, 40], [w - 38, 44]]) { circle(x + ax, y + ay, 24, TH.bg); ring(x + ax, y + ay, 24, 2, TH.bg3); }
      dish(x + w / 2, y + h - 30, 14, TH.bg3, TH.bg, TH.white); hazard(x + 8, y + h - 12, w - 16, 6, TH.bg2, TH.gold);
    }, anim(x, y, w, h, t) { for (const [ax, ay] of [[34, 40], [w - 38, 44]]) for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.0944; line(x + ax, y + ay, x + ax + Math.cos(a) * 20, y + ay + Math.sin(a) * 20, 5, TH.bg3); } } }));
  add.push(N({ id: 'v_transfo', sec: 1, stage: 3, dim: () => [136, 126], statique(x, y, w, h) {
      plate(x, y, w, h); for (let i = 0; i < 4; i++) { circle(x + 20 + i * 32, y + 28, 9, TH.bg); circle(x + 20 + i * 32, y + 28, 5, TH.acc); fr(x + 17 + i * 32, y + 38, 6, 30, TH.bg3); }
      fr(x + 12, y + h - 38, w - 24, 22, TH.bg); vent(x + 18, y + h - 34, w - 36, 14, TH.bg2, TH.bg3);
    }, anim(x, y, w, h, t) { if (Math.sin(t * 17) > -0.2) { const p = [x + 20, y + 20]; let px = p[0], py = p[1]; for (let i = 1; i <= 5; i++) { const nx = x + 20 + i * 19, ny = y + 20 + Math.sin(t * 40 + i * 5) * 7; line(px, py, nx, ny, 2, TH.acc); px = nx; py = ny; } } } }));
  /* ===== secteur 3 — néons (16 bits) ===== */
  add.push(N({ id: 'v_viaduc', sec: 2, stage: 0, dim: () => [320, 118], statique(x, y, w, h) {
      plate(x, y + 10, w, h - 20); fr(x, y + 10, w, 4, TH.acc); fr(x, y + h - 14, w, 4, TH.neb2);
      for (let i = 0; i < w - 20; i += 38) fr(x + 10 + i, y + h / 2 - 2, 22, 4, TH.white);
      for (let i = 0; i < w; i += 52) { fr(x + i, y + h - 10, 8, 10, TH.bg3); }
    }, anim(x, y, w, h, t) { for (let i = 0; i < 3; i++) { const q = (t * 110 * (1 + i * 0.3) + i * 90) % (w + 30); fr(x + q - 20, y + 28 + i * 12, 7, 3, TH.gold); fr(x + w - q + 20, y + 80 - i * 4, 7, 3, TH.eMain); } } }));
  add.push(N({ id: 'v_grue', sec: 2, stage: 1, dim: () => [210, 176], statique(x, y, w, h) {
      fr(x + 10, y, 8, h, TH.bg3); fr(x + w - 18, y, 8, h, TH.bg3); for (let j = 10; j < h; j += 26) { line(x + 14, y + j, x + w - 14, y + j + 26, 2, TH.bg2); }
      bevel(x, y + 6, w, 14, TH.bg3, TH.acc, TH.bg); fr(x + 6, y + 22, 24, 12, TH.neb2);
    }, anim(x, y, w, h, t) { const hx = x + 40 + (Math.sin(t * 0.7) + 1) * 60; line(hx, y + 20, hx, y + 84, 2, TH.white); fr(hx - 6, y + 84, 12, 9, TH.gold); } }));
  add.push(N({ id: 'v_enseigneV', sec: 2, stage: 2, dim: () => [70, 232], statique(x, y, w, h) {
      bevel(x + 6, y, w - 12, h, TH.bg2, TH.bg3, TH.bg); for (let i = 0; i < 5; i++) { fr(x + 14, y + 14 + i * 42, w - 28, 28, TH.bg); fr(x + 18, y + 18 + i * 42, w - 36, 4, TH.neb1); fr(x + 18, y + 34 + i * 42, w - 36, 4, TH.neb2); fr(x + 18, y + 26 + i * 42, 4, 8, TH.acc); }
    }, anim(x, y, w, h, t, seed) { for (let i = 0; i < 5; i++) if (Math.sin(t * (2 + i * 0.7) + seed + i) > -0.3) fr(x + 22, y + 24 + i * 42, w - 44, 10, i % 2 ? TH.acc : TH.gold); } }));
  add.push(N({ id: 'v_parabole', sec: 2, stage: 3, dim: () => [180, 180], statique(x, y, w, h) {
      circle(x + w / 2, y + h / 2, 60, TH.bg3); circle(x + w / 2, y + h / 2, 46, TH.bg2); ring(x + w / 2, y + h / 2, 60, 4, TH.acc); fr(x + w / 2 - 3, y + h / 2 - 3, 6, 6, TH.white);
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + h / 2, a = t * 1.1; line(cx, cy, cx + Math.cos(a) * 56, cy + Math.sin(a) * 56, 3, TH.gold); circle(cx + Math.cos(a) * 56, cy + Math.sin(a) * 56, 4, TH.white); for (let i = 0; i < 2; i++) ring(cx, cy, 20 + ((t * 30 + i * 30) % 60), 1.5, TH.acc); } }));
  /* ===== secteur 4 — arcade ===== */
  add.push(N({ id: 'v_flipper', sec: 3, stage: 0, dim: () => [112, 176], statique(x, y, w, h) {
      bevel(x, y, w, h, TH.bg2, TH.bg3, TH.bg); fr(x + 8, y + 8, w - 16, h - 16, TH.bg); for (const [bx, by, c] of [[34, 42, TH.neb1], [72, 36, TH.neb2], [52, 70, TH.acc]]) { circle(x + bx, y + by, 10, c); ring(x + bx, y + by, 10, 2, TH.white); }
      poly([x + 14, y + h - 44, x + 46, y + h - 22, x + 40, y + h - 16, x + 14, y + h - 30], TH.gold); poly([x + w - 14, y + h - 44, x + w - 46, y + h - 22, x + w - 40, y + h - 16, x + w - 14, y + h - 30], TH.gold);
    }, anim(x, y, w, h, t) { for (const [bx, by] of [[34, 42], [72, 36], [52, 70]]) if (Math.sin(t * 6 + bx) > 0.4) circle(x + bx, y + by, 5, TH.white); circle(x + 56 + Math.sin(t * 2) * 30, y + 60 + (t * 70) % 80, 3, TH.white); } }));
  add.push(N({ id: 'v_pince', sec: 3, stage: 1, dim: () => [106, 126], statique(x, y, w, h) {
      bevel(x, y, w, h, TH.bg2, TH.bg3, TH.bg); fr(x + 8, y + 8, w - 16, h - 36, TH.bg); for (let i = 0; i < 7; i++) circle(x + 18 + (i % 4) * 22, y + h - 40 - Math.floor(i / 4) * 12, 8, [TH.neb1, TH.neb2, TH.gold, TH.acc][i % 4]); fr(x + 12, y + h - 22, w - 24, 12, TH.bg3); circle(x + 28, y + h - 16, 3, TH.danger);
    }, anim(x, y, w, h, t) { const cx = x + 16 + (Math.sin(t * 0.9) + 1) * 36; line(cx, y + 8, cx, y + 30 + (Math.sin(t * 1.8) + 1) * 14, 2, TH.white); fr(cx - 6, y + 40 + (Math.sin(t * 1.8) + 1) * 14, 12, 4, TH.white); } }));
  add.push(N({ id: 'v_caisse', sec: 3, stage: 2, dim: () => [156, 106], statique(x, y, w, h) {
      plate(x, y, w, h); fr(x + 8, y + 8, w - 16, 28, TH.bg); for (let i = 0; i < 6; i++) { for (let j = 0; j < 3 + (i % 3); j++) fr(x + 12 + i * 22, y + h - 14 - j * 6, 16, 4, j % 2 ? TH.gold : TH.white); }
    }, anim(x, y, w, h, t) { for (let i = 0; i < 4; i++) if (Math.sin(t * 4 + i * 2) > 0.7) fr(x + 16 + i * 34, y + h - 26, 3, 3, TH.white); lightStrip(x + 10, y + 12, w - 20, 4, TH.acc, t, 4); } }));
  add.push(N({ id: 'v_scene', sec: 3, stage: 3, dim: () => [270, 126], statique(x, y, w, h) {
      bevel(x, y, w, 16, TH.bg3, TH.acc, TH.bg); for (let i = 0; i < 6; i++) { circle(x + 24 + i * 44, y + 26, 8, TH.bg); circle(x + 24 + i * 44, y + 26, 4, TH.white); } fr(x + 10, y + h - 20, w - 20, 14, TH.bg2);
    }, anim(x, y, w, h, t) { for (let i = 0; i < 6; i++) { const a = Math.sin(t * 1.3 + i) * 0.5; const bx = x + 24 + i * 44, ex = bx + Math.tan(a) * 90; const g = PAINT.g, k = PAINT.K; g.fillStyle = i % 2 ? 'rgba(255,90,200,.22)' : 'rgba(90,200,255,.22)'; g.beginPath(); g.moveTo((bx - 5) * k, (y + 28) * k); g.lineTo((bx + 5) * k, (y + 28) * k); g.lineTo((ex + 28) * k, (y + h) * k); g.lineTo((ex - 28) * k, (y + h) * k); g.closePath(); g.fill(); } } }));
  /* ===== secteur 5 — ruines du CD ===== */
  add.push(N({ id: 'v_cd', sec: 4, stage: 0, dim: () => [156, 156], statique(x, y, w, h) {
      circle(x + w / 2, y + h / 2, 74, TH.bg3); for (let i = 0; i < 5; i++) ring(x + w / 2, y + h / 2, 22 + i * 10, 1.2, TH.bg2); circle(x + w / 2, y + h / 2, 18, TH.bg); circle(x + w / 2, y + h / 2, 7, TH.bg2); ring(x + w / 2, y + h / 2, 74, 2, TH.white);
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + h / 2, a = t * 1.5; for (let i = 0; i < 2; i++) line(cx + Math.cos(a + i * 3.14) * 24, cy + Math.sin(a + i * 3.14) * 24, cx + Math.cos(a + i * 3.14) * 70, cy + Math.sin(a + i * 3.14) * 70, 5, TH.neb1); } }));
  add.push(N({ id: 'v_satellite', sec: 4, stage: 1, dim: () => [200, 126], statique(x, y, w, h) {
      for (const sx of [4, w - 78]) { bevel(x + sx, y + 36, 74, 54, TH.bg3, TH.acc, TH.bg2); for (let i = 1; i < 4; i++) fr(x + sx + i * 18, y + 36, 1.5, 54, TH.bg); fr(x + sx, y + 62, 74, 1.5, TH.bg); }
      bevel(x + w / 2 - 22, y + 30, 44, 66, TH.bg2, TH.white, TH.bg); dish(x + w / 2, y + 112, 10, TH.bg3, TH.bg, TH.white);
    }, anim(x, y, w, h, t) { lamp(x + w / 2 - 1, y + 38, TH.danger, t, 3); } }));
  add.push(N({ id: 'v_maillage', sec: 4, stage: 2, dim: () => [176, 176], statique(x, y, w, h) {
      const cx = x + w / 2, cy = y + h / 2; for (let i = 1; i <= 3; i++) { ring(cx, cy, 20 * i + 8, 1.5, TH.bg3); } for (let i = 0; i < 8; i++) { const a = i * 0.7854; line(cx, cy, cx + Math.cos(a) * 80, cy + Math.sin(a) * 80, 1.5, TH.bg3); }
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + h / 2; for (let i = 0; i < 8; i++) { const a = i * 0.7854 + t * 0.4, r = 28 + (i % 3) * 20; circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, TH.white); } } }));
  add.push(N({ id: 'v_laser', sec: 4, stage: 3, dim: () => [250, 70], statique(x, y, w, h) {
      bevel(x, y, w, 14, TH.bg3, TH.acc, TH.bg); for (let i = 0; i < 5; i++) { circle(x + 24 + i * 50, y + 18, 7, TH.bg); circle(x + 24 + i * 50, y + 18, 3, TH.neb2); }
    }, anim(x, y, w, h, t) { for (let i = 0; i < 5; i++) if (Math.sin(t * 3 + i * 1.7) > 0.2) fr(x + 22 + i * 50, y + 24, 4, h - 24, i % 2 ? TH.neb1 : TH.neb2); } }));
  /* ===== secteurs 21-24 — la base de VORAX (palette fixe) ===== */
  const bx = (x, y, w, h, c0, c1, c2) => bevel(x, y, w, h, c0 || NVB.s2, c1 || NVB.s3, c2 || NVB.d);
  add.push(N({ id: 'b_mur', sec: 5, stage: 0, dim: () => [270, 74], statique(x, y, w, h) {
      bx(x, y + 16, w, h - 16); for (let i = 0; i < w; i += 54) fr(x + i, y + 16, 2, h - 16, NVB.d); hazard(x + 8, y + h - 16, w - 16, 8, NVB.s, NVB.hz);
      for (let i = 0; i < w - 6; i += 13) { line(x + i, y + 14, x + i + 6, y + 2, 1.4, NVB.s3); line(x + i + 6, y + 2, x + i + 13, y + 14, 1.4, NVB.s3); }
    }, anim(x, y, w, h, t) { for (let i = 0; i < 5; i++) { const on = Math.sin(t * 2 + i * 1.3) > 0; fr(x + 20 + i * 52, y + 22, 4, 4, on ? NVB.al : '#401410'); } } }));
  add.push(N({ id: 'b_mirador', sec: 5, stage: 0, dim: () => [100, 134], statique(x, y, w, h) {
      bx(x, y, w, h); fr(x + 14, y + 14, w - 28, h - 28, NVB.d); ring(x + w / 2, y + 48, 26, 3, NVB.s3); rivets(x, y, w, h, 14, NVB.s3); hazard(x + 8, y + h - 14, w - 16, 7, NVB.s, NVB.hz);
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + 48, a = t * 1.1, g = PAINT.g, k = PAINT.K; g.fillStyle = 'rgba(210,235,255,.16)'; g.beginPath(); g.moveTo(cx * k, cy * k); g.lineTo((cx + Math.cos(a - 0.2) * 190) * k, (cy + Math.sin(a - 0.2) * 190) * k); g.lineTo((cx + Math.cos(a + 0.2) * 190) * k, (cy + Math.sin(a + 0.2) * 190) * k); g.closePath(); g.fill(); circle(cx, cy, 8, '#e8f6ff'); } }));
  add.push(N({ id: 'b_portehangar', sec: 5, stage: 1, dim: () => [236, 154], statique(x, y, w, h) {
      bx(x, y, w, h); fr(x + 10, y + 10, w - 20, h - 20, NVB.d); hazard(x + 10, y + h - 10, w - 20, 8, NVB.s, NVB.hz);
    }, anim(x, y, w, h, t) { const gap = (Math.sin(t * 0.5) + 1) / 2 * 36; fr(x + 12, y + 12, (w - 24) / 2 - gap, h - 34, NVB.s3); fr(x + w / 2 + gap, y + 12, (w - 24) / 2 - gap, h - 34, NVB.s3); fr(x + w / 2 - gap - 2, y + 12, 2, h - 34, NVB.hz); fr(x + w / 2 + gap, y + 12, 2, h - 34, NVB.hz); if (gap > 8) fr(x + w / 2 - gap, y + 12, gap * 2, h - 34, 'rgba(255,154,60,.35)'); } }));
  add.push(N({ id: 'b_rail', sec: 5, stage: 1, dim: () => [330, 44], statique(x, y, w, h) {
      bx(x, y + 6, w, 12, NVB.s3, '#6a82a8', NVB.d); for (let i = 0; i < w; i += 22) fr(x + i, y + 6, 2, 12, NVB.d); fr(x, y + 22, w, 2, NVB.s2);
    }, anim(x, y, w, h, t) { const tx = x + ((t * 60) % (w + 40)) - 20; bx(tx, y, 24, 24, NVB.s2); line(tx + 12, y + 24, tx + 12, y + 38, 2, NVB.s3); fr(tx + 7, y + 38, 10, 6, NVB.hz); } }));
  add.push(N({ id: 'b_cuve', sec: 5, stage: 2, dim: () => [160, 160], statique(x, y, w, h) {
      const cx = x + w / 2, cy = y + h / 2; circle(cx, cy, 74, NVB.d); ring(cx, cy, 74, 6, NVB.s3); circle(cx, cy, 58, '#2a1208'); ring(cx, cy, 58, 3, NVB.s2); for (let i = 0; i < 8; i++) { const a = i * 0.7854; circle(cx + Math.cos(a) * 68, cy + Math.sin(a) * 68, 3, NVB.hz); }
    }, anim(x, y, w, h, t) { const cx = x + w / 2, cy = y + h / 2, pu = 0.7 + 0.3 * Math.sin(t * 3); circle(cx, cy, 46 * pu, 'rgba(255,120,40,.55)'); circle(cx, cy, 26 * pu, 'rgba(255,220,150,.8)'); for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.0944; circle(cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, 3, '#ffd9a0'); } } }));
  add.push(N({ id: 'b_conduit', sec: 5, stage: 2, dim: () => [64, 270], statique(x, y, w, h) {
      bx(x + 8, y, w - 16, h, NVB.s2, NVB.s3, NVB.d); fr(x + 24, y + 4, 16, h - 8, '#2a1208'); for (let j = 16; j < h; j += 48) { fr(x + 4, y + j, w - 8, 8, NVB.s); fr(x + 4, y + j, w - 8, 2, NVB.s3); }
    }, anim(x, y, w, h, t) { for (let i = 0; i < 5; i++) { const p = (t * 90 + i * 54) % (h - 8); fr(x + 26, y + h - 10 - p, 12, 14, 'rgba(255,170,80,.85)'); } } }));
  add.push(N({ id: 'b_ecrans', sec: 5, stage: 3, dim: () => [230, 96], statique(x, y, w, h) {
      bx(x, y, w, h); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { fr(x + 8 + i * 44, y + 8 + j * 40, 38, 34, NVB.d); }
    }, anim(x, y, w, h, t, seed) { for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const k = i * 3 + j + seed; const c = Math.sin(t * (1 + (k % 3) * 0.7) + k) > 0 ? 'rgba(88,224,255,.65)' : (k % 4 === 0 ? 'rgba(255,74,58,.6)' : 'rgba(40,110,130,.5)'); fr(x + 10 + i * 44, y + 10 + j * 40, 34, 30, c); fr(x + 14 + i * 44, y + 16 + j * 40 + ((t * 10 + k * 5) % 22), 26, 2, 'rgba(255,255,255,.4)'); } } }));
  add.push(N({ id: 'b_console', sec: 5, stage: 3, dim: () => [270, 76], statique(x, y, w, h) {
      bx(x, y + 14, w, h - 14); poly([x + 10, y + 14, x + w - 10, y + 14, x + w - 24, y, x + 24, y], NVB.s3); for (let i = 0; i < 9; i++) fr(x + 12 + i * 28, y + 30, 20, 8, NVB.d);
    }, anim(x, y, w, h, t) { for (let i = 0; i < 9; i++) fr(x + 14 + i * 28, y + 32, 6, 4, Math.sin(t * 3 + i * 2.1) > 0 ? NVB.cy : (i % 3 ? NVB.hz : NVB.al)); } }));
  /* ===== premiers plans (fore) variés ===== */
  const foreCh = (id, sec, h, st, an) => N({ id, sec, fore: true, wt: 2, dim: () => [L_W + 60, h], statique: st, anim: an });
  add.push(foreCh('f_vapeur', 1, 70, (x, y, w, h) => { for (let i = 0; i < 6; i++) ell(x + 40 + i * 80, y + h / 2 + Math.sin(i) * 12, 46, 14 + (i % 3) * 5, 'rgba(255,255,255,.10)'); }, null));
  add.push(foreCh('f_cables', 2, 120, (x, y, w, h) => { for (let i = 0; i < 4; i++) { const sx = x + 30 + i * 150; line(sx, y, sx + 90, y + h, 2.4, 'rgba(8,6,20,.85)'); line(sx + 14, y, sx + 110, y + h, 1.4, 'rgba(255,90,200,.5)'); } }, null));
  add.push(foreCh('f_banderoles', 3, 56, (x, y, w, h) => { line(x, y + 8, x + w, y + 20, 1.6, 'rgba(10,8,20,.9)'); for (let i = 0; i < 12; i++) poly([x + i * 44 + 8, y + 10 + i * 0.9, x + i * 44 + 30, y + 11 + i * 0.9, x + i * 44 + 19, y + 36], ['rgba(255,70,170,.8)', 'rgba(255,210,70,.8)', 'rgba(90,200,255,.8)'][i % 3]); }, null));
  add.push(foreCh('f_plaques', 4, 80, (x, y, w, h) => { for (let i = 0; i < 4; i++) poly([x + 60 + i * 130, y + 10, x + 130 + i * 130, y + 24, x + 110 + i * 130, y + 66, x + 50 + i * 130, y + 50], 'rgba(120,130,170,.28)'); }, null));
  add.push(foreCh('f_passerelle', 5, 52, (x, y, w, h) => { fr(x, y + 6, w, 4, 'rgba(4,6,12,.9)'); fr(x, y + h - 10, w, 4, 'rgba(4,6,12,.9)'); for (let i = 0; i < w; i += 18) fr(x + i, y + 10, 3, h - 20, 'rgba(4,6,12,.78)'); }, (x, y, w, h, t) => { for (let i = 0; i < 5; i++) fr(x + 20 + i * 100, y + 2, 5, 3, Math.sin(t * 3 + i) > 0 ? '#ff4a3a' : '#401410'); }));
  add.push(foreCh('f_sirene', 5, 80, (x, y, w, h) => { }, (x, y, w, h, t) => { const gx = x + 120 + (Math.floor(t / 4) % 3) * 130; nglowPaint(gx, y + 40, 70, Math.max(0, Math.sin(t * 5)) * 0.4); }));
  function nglowPaint(cx, cy, r, a) { if (a <= 0.01) return; const g = PAINT.g, k = PAINT.K, gr = g.createRadialGradient(cx * k, cy * k, 0, cx * k, cy * k, r * k); gr.addColorStop(0, 'rgba(255,74,58,' + a + ')'); gr.addColorStop(1, 'rgba(255,74,58,0)'); g.fillStyle = gr; g.fillRect((cx - r) * k, (cy - r) * k, r * 2 * k, r * 2 * k); }
  /* l'ancien mobilier du secteur 5 (dalle, porte, obélisque) cède la place à la base */
  for (const c of CHUNKS) if (c.sec === 5 && !c.nvNew) c.sec = 99;
  CHUNKS.push(...add);
  /* les gabarits génériques s'effacent derrière le mobilier du niveau ; dans la base ils disparaissent */
  const _decorSpawn = decorSpawn;
  decorSpawn = function (list, y, era, layer) {
    const sv = [];
    for (const c of CHUNKS) {
      if (c.nvNew || c.sec !== undefined) continue;
      sv.push([c, c.wt, c.sec]);
      if (R.sec === 5 && c.id !== 'poutrelle') c.sec = 99; else c.wt = (c.wt || 1) * 0.55;
    }
    try { _decorSpawn(list, y, era, layer); } finally { for (const [c, wt, sec] of sv) { c.wt = wt; c.sec = sec; } }
  };
}

/* ---- sols de la station (niveaux 1 à 8) : chaque niveau a son revêtement ------------------------ */
{
  const pat = (lv, x, y, S, h, tone, row, cx) => {
    const e0 = R.era === 0, hi = e0 ? TH.bg3 : TH.bg3, ac = e0 ? TH.bg3 : TH.gold;
    switch (lv) {
      case 1: if (h % 6 === 0) { poly([x + 18, y + 14, x + S - 18, y + 14, x + S / 2, y + 34], hi); poly([x + 18, y + 30, x + S - 18, y + 30, x + S / 2, y + 50], TH.bg); } else if (h % 6 === 3) { fr(x + 8, y + S / 2 - 1, S - 16, 2.4, hi); fr(x + S / 2 - 1, y + 8, 2.4, S - 16, hi); circle(x + S / 2, y + S / 2, 5, TH.bg); } break;
      case 2: if (h % 3 === 0) { for (let k = 0; k < 6; k++) fr(x + 8 + k * 9, y + 8, 3, S - 16, TH.bg); fr(x + 6, y + 6, S - 12, 2, hi); fr(x + 6, y + S - 8, S - 12, 2, hi); } break;
      case 3: if (cx % 3 === 0) { fr(x + S / 2 - 3, y, 6, S, ac); fr(x + S / 2 - 3, y, 6, 2, TH.bg); } if (h % 9 === 4) hazard(x + 6, y + S - 16, S - 12, 8, TH.bg2, ac); break;
      case 4: if (h % 2 === 0) { fr(x + 8, y + S / 2, S - 16, 2.4, hi); fr(x + S / 2, y + 8, 2.4, S / 2 - 6, hi); fr(x + S / 2 - 3, y + S / 2 - 3, 8, 8, TH.bg); fr(x + S / 2 - 2, y + S / 2 - 2, 6, 6, hi); } break;
      case 5: if (cx % 2 === 0) { fr(x, y, S, S, TH.bg); for (let k = 0; k < 3; k++) fr(x + S / 2 - 1.5, y + 6 + k * 22, 3, 12, e0 ? TH.white : TH.gold); fr(x, y, 2, S, hi); fr(x + S - 2, y, 2, S, hi); } break;
      case 6: if (cx % 3 === 1) { for (let k = 0; k < 5; k++) fr(x + 8, y + 4 + k * 13, S - 16, 5, TH.bg); fr(x + 14, y, 3, S, hi); fr(x + S - 17, y, 3, S, hi); } break;
      case 7: if ((row + cx) % 2 === 0) { fr(x + 6, y + 6, S - 12, S - 12, TH.bg); fr(x + 6, y + 6, S - 12, 2, hi); } else if (h % 4 === 1) { circle(x + S / 2, y + S / 2, 11, TH.bg); circle(x + S / 2, y + S / 2, 6, hi); } break;
      case 8: if (h % 4 === 0) { circle(x + S / 2, y + S / 2, 24, TH.bg); ring(x + S / 2, y + S / 2, 24, 3, ac); circle(x + S / 2, y + S / 2, 8, hi); for (let k = 0; k < 4; k++) fr(x + S / 2 - 1 + [-20, 20, 0, 0][k], y + S / 2 - 1 + [0, 0, -20, 20][k], 3, 3, TH.white); } else if (h % 7 === 2) { fr(x, y + S / 2 - 3, S, 6, TH.bg); fr(x, y + S / 2 - 3, S, 2, ac); } break;
    }
  };
  decorDrawFloor = function (layer) {
    useBuf(layer);
    const slate = 64, s = Math.max(0, SCROLL.y) * (R.era === 0 ? 0.30 : FLOOR_SPD), lv = G.level | 0;
    const start = Math.floor(-s / slate) - 1, off = start * slate + s;
    for (let i = 0; off + i * slate < L_H + slate; i++) {
      const y = off + i * slate, row = start + i;
      for (let x = -slate; x < L_W + slate; x += slate) {
        const cx = Math.round(x / slate), h = (row * 73856093 ^ cx * 19349663) % 97, tone = h % 3;
        fr(x, y, slate, slate, tone === 0 ? TH.bg2 : (tone === 1 ? TH.bg : TH.bg2));
        if (h % 5 === 0) frDith(x + 4, y + 4, slate - 8, slate - 8, TH.bg3, 0.18);
        fr(x, y, slate, 1.6, TH.bg); fr(x, y, 1.6, slate, TH.bg);
        if (lv === 1 || lv === 0) {
          if (lv === 1) pat(1, x, y, slate, h, tone, row, cx);
          if (R.era >= 1 && h % 7 === 2) hazard(x + 10, y + slate * 0.4, slate - 20, 7, TH.bg2, TH.gold);
          if (h % 11 === 3) vent(x + slate * 0.3, y + slate * 0.3, slate * 0.36, slate * 0.3, TH.bg, TH.bg3);
        } else { pat(lv, x, y, slate, h, tone, row, cx); if (h % 13 === 3) vent(x + slate * 0.3, y + slate * 0.3, slate * 0.3, slate * 0.26, TH.bg, TH.bg3); }
        if (R.era === 0) {
          const u = 4;
          if (lv <= 1 || lv === 6 || lv === 7) {
            if (tone === 1) { fr(x + u * 2, y + u * 2, slate - u * 4, u, TH.bg3); fr(x + u * 2, y + u * 2, u, slate - u * 4, TH.bg3); fr(x + u * 2, y + slate - u * 3, slate - u * 4, u, TH.bg); }
            if (h % 4 === 0 && lv <= 1) for (let k = 0; k < 4; k++) fr(x + u * 4, y + u * 3 + k * u * 1.7, u * 6, u, TH.bg3);
          }
          if (h % 6 === 1) { fr(x + u, y + u, u, u, TH.bg3); fr(x + slate - u * 2, y + u, u, u, TH.bg3); fr(x + u, y + slate - u * 2, u, u, TH.bg3); fr(x + slate - u * 2, y + slate - u * 2, u, u, TH.bg3); }
        }
      }
    }
    if (R.era === 0) depthHaze(layer);
    decorBlit(DEC.floor, layer);
  };
}

try { document.title = document.title.replace(/ · v7.*$/, '') + ' · v7 base VORAX'; } catch (e) {}


/* ---- cheat « saut » : un clic sur un secteur lance la mission tout de suite --------------------- */
{
  let direct = false;
  const _beginBrief = beginBrief;
  beginBrief = function (level) {
    if (!direct) return _beginBrief(level);
    direct = false;
    level = clamp(Math.round(level) || 1, 1, MAX_LEVEL);
    const e = eraOfLevel(level);
    if (R.sec !== e) { R.sec = e; computeTheme(e, S.sel.livery); setEra(ERAS[e].sty, true); }
    hideScreens();
    startLevel(level);
    FX.addFlash(0.22, TH.pGlow);
  };
  document.addEventListener('click', ev => {
    const lvb = ev.target && ev.target.closest ? ev.target.closest('[data-cheat-lv]') : null;
    if (!lvb || G.state !== 'cheats' || !cheatFound('jump')) return;
    ev.stopPropagation(); ev.preventDefault();
    S.cheats.startLevel = clamp(+lvb.dataset.cheatLv | 0, 1, MAX_LEVEL);
    Audio2.init(); Audio2.unlock(); Audio2.sfx('ui');
    saveGame(); hideScreens();
    direct = true; G.state = 'play'; newRun();
    direct = false;
  }, true);
}

/* ---- onglet masqué / téléphone en veille : le jeu se met en pause et TOUT le son se tait --------- */
{
  let wasCtx = false;
  const hush = () => {
    try { if (G.state === 'play' || G.state === 'intro') pauseGame(); } catch (e) {}
    try { for (const k in MX.els) { const a = MX.els[k]; if (a && !a.paused) a.pause(); } } catch (e) {}
    try { document.querySelectorAll('audio,video').forEach(a => { if (!a.paused) a.pause(); }); } catch (e) {}
    try { if (Audio2 && Audio2.ctx && Audio2.ctx.state === 'running') { wasCtx = true; Audio2.ctx.suspend(); } } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  };
  const wake = () => {
    try { if (wasCtx && Audio2.ctx && Audio2.ctx.state === 'suspended') Audio2.ctx.resume(); wasCtx = false; } catch (e) {}
    try { if (MX.cur && MX.cur.paused && !MX.cur.ended) MX.cur.play().catch(() => {}); } catch (e) {}
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) hush(); else wake(); });
  addEventListener('pagehide', hush);
  addEventListener('pageshow', () => { if (!document.hidden) wake(); });
  document.addEventListener('freeze', hush);
}

window.NVX = { NV_MINI1, nvMini2, nvFireMul, nvBossHp, NV_ROBOT, NV_SCENE, NV_BASE, NV_POOL, nvDesignWave };
}
