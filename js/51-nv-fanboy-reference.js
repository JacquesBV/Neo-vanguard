/* FanBoy NV-01 — coque portable et LCD réfléchissant positif, réédition 6.
 * Retrouve les encres LCD estimées d'après les captures fournies (fond sauge
 * clair, structures olive sombre), telles que validées à l'écran : la palette
 * interne du moteur (indices de terrain, ombrages, collisions) n'est pas
 * modifiée, seule la présentation convertit les encres à l'affichage.
 * Ce module pose aussi :
 *   · une coque noire verticale NV-01 et ses commandes réactives ;
 *   · le verre LCD : grille de pixels physique, matte et reflet de lumière
 *     ambiante fixé à la vitre ;
 *   · un cadrage épinglé : aucun rescale / resize en pleine partie ;
 *   · la désactivation des masques CRT / phosphores / flou shader (un LCD
 *     n'a pas de tube).
 */
(() => {
  'use strict';
  const inks = ['#9ea483', '#7d8267', '#595c4c', '#2f3329']; // source sombre -> affichage clair
  const rgb = inks.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
  const sourceLum = GB4.map(c => {
    const p = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    return p[0] * .2126 + p[1] * .7152 + p[2] * .0722;
  });
  const active = () => R.era === 0 && G.eraIdx === 0 && G.state !== 'story' && G.state !== 'title';
  const framed = () => active() && S.opts.gbBezel !== 0;

  /* Migration unique : puce sonore, coque, clignotement et fantôme d'origine. */
  if (S.opts.fanboyGlassV5 !== 1) {
    S.opts.fanboyGlassV5 = 1;
    S.opts.gbFlicker = 1; S.opts.gbBezel = 1;
    S.opts.gbContrast = 'normal'; S.opts.gbGhost = 'low';
    saveGame();
  }

  /* ---------------------------------------------------------- encres LCD */
  const oldPalette = applyGameBoyPalette;
  applyGameBoyPalette = function (buf) {
    oldPalette.apply(this, arguments);
    if (!active() || !buf || !buf.g) return;
    const w = buf.c.width, h = buf.c.height;
    let image;
    try { image = buf.g.getImageData(0, 0, w, h); } catch (err) { return; }
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const lum = d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722;
      let k = 0, delta = Infinity;
      for (let j = 0; j < 4; j++) {
        const distance = Math.abs(lum - sourceLum[j]);
        if (distance < delta) { delta = distance; k = j; }
      }
      const p = rgb[k]; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2];
    }
    buf.g.putImageData(image, 0, 0);
  };

  /* Le vocabulaire graphique a sa polarité propre : contours et cockpits
     sombres, coques claires. Le fond positif ne doit pas inverser les sprites. */
  const artPalette = GB4.slice().reverse();
  function artTheme(fn, self, args) {
    if (!active()) return fn.apply(self, args);
    const previous = TH;
    const copy = { ...TH, livery: { ...TH.livery, gb: artPalette } };
    for (const key of Object.keys(copy)) {
      const index = GB4.indexOf(copy[key]); if (index >= 0) copy[key] = artPalette[index];
    }
    TH = copy;
    try { return fn.apply(self, args); } finally { TH = previous; }
  }
  const oldSprite = drawSpriteTo;
  drawSpriteTo = function () { return artTheme(oldSprite, this, arguments); };
  const oldBossSprite = drawBossSprite;
  drawBossSprite = function () { return artTheme(oldBossSprite, this, arguments); };
  const oldCore = drawPlayerCore;
  drawPlayerCore = function () { return artTheme(oldCore, this, arguments); };

  /* Géométrie du décor conservée, encres et faces éclairées rendues. */
  const oldDecorCanvas = decorCanvas, correctedDecor = new WeakMap();
  decorCanvas = function () {
    const record = oldDecorCanvas.apply(this, arguments);
    if (!active() || !record || !record.c) return record;
    if (correctedDecor.has(record)) return correctedDecor.get(record);
    const c = document.createElement('canvas'); c.width = record.c.width; c.height = record.c.height;
    const g = c.getContext('2d'); g.drawImage(record.c, 0, 0);
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
    const map = [3, 1, 0, 0];
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const l = d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722;
      let k = 0;
      for (let j = 1; j < 4; j++) if (Math.abs(l - sourceLum[j]) < Math.abs(l - sourceLum[k])) k = j;
      const p = GB4[map[k]];
      d[i] = parseInt(p.slice(1, 3), 16); d[i + 1] = parseInt(p.slice(3, 5), 16); d[i + 2] = parseInt(p.slice(5, 7), 16);
    }
    g.putImageData(im, 0, 0);
    const rec = { ...record, c, sh: null }; correctedDecor.set(record, rec); return rec;
  };
  const oldDecorBlit = decorBlit;
  decorBlit = function (list, layer) {
    if (!active()) return oldDecorBlit.apply(this, arguments);
    useBuf(layer);
    const g = PAINT.g, K = PAINT.K;
    g.imageSmoothingEnabled = false;
    for (const item of list) {
      const rec = decorCanvas(item.ci, item.w, item.h, item.seed, K);
      const x = Math.round(item.x * K), y = Math.round(item.y * K);
      if (!rec.sh) {
        rec.sh = document.createElement('canvas'); rec.sh.width = rec.c.width; rec.sh.height = rec.c.height;
        const sg = rec.sh.getContext('2d'); sg.drawImage(rec.c, 0, 0);
        sg.globalCompositeOperation = 'source-in'; sg.fillStyle = GB4[2]; sg.fillRect(0, 0, rec.c.width, rec.c.height);
      }
      g.save(); g.globalAlpha *= .35;
      g.drawImage(rec.sh, x + Math.round(6 * K), y + Math.round(9 * K)); g.restore();
      g.drawImage(rec.c, x, y);
      const ch = CHUNKS[item.ci];
      if (ch.anim) artTheme(ch.anim, ch, [item.x, item.y, item.w, item.h, DEC.t, item.seed]);
    }
  };
  const oldFloor = decorDrawFloor;
  decorDrawFloor = function (layer) {
    if (!active()) return oldFloor.apply(this, arguments);
    useBuf(layer);
    const g = layer.g, K = layer.K;
    const tile = 64, scroll = SCROLL.y * FLOOR_SPD;
    const start = Math.floor(-scroll / tile) - 1;
    const offset = start * tile + scroll;
    g.fillStyle = GB4[0]; g.fillRect(0, 0, layer.c.width, layer.c.height);
    g.fillStyle = GB4[1];
    for (let row = 0; offset + row * tile < L_H + tile; row++) {
      const y = Math.round((offset + row * tile) * K);
      g.fillRect(0, y, layer.c.width, 1);
      for (let x = ((row + start) & 1) * tile; x < L_W; x += tile * 2) {
        g.fillRect(Math.round(x * K), y, 1, Math.round(tile * K));
      }
    }
    decorBlit(DEC.floor, layer);
  };
  const oldTerrain = drawTerrain;
  drawTerrain = function () {
    if (!active()) return oldTerrain.apply(this, arguments);
    /* le lissage à fond sombre du module 32 effacerait les encres rendues */
    const calm = S.opts.lcdCalm; S.opts.lcdCalm = false;
    try { return oldTerrain.apply(this, arguments); } finally { S.opts.lcdCalm = calm; }
  };

  /* ------------------------------------ cadrage : grand, et jamais revu */
  const oldResize = resizeView;
  resizeView = function () {
    const result = oldResize.apply(this, arguments);
    if (!framed()) return result;
    const W = view.w, H = view.h;
    // Fit the complete rendered device; preserve the engine's 4:3 world.
    const margin = 8, touchPad = IS_TOUCH ? 100 : 0;
    const shellScale = Math.max(.05, Math.min((W - 2 * margin) / 880,
      (H - touchPad - 2 * margin) / 1500));
    PF.s = shellScale * 560 / L_W;
    PF.w = L_W * PF.s; PF.h = L_H * PF.s;
    PF.x = (W - 880 * shellScale) / 2 + (244 - 72) * shellScale;
    PF.y = margin + Math.max(0, (H - touchPad - 2 * margin - 1500 * shellScale) / 2) + 228 * shellScale;
    R.vig = null; R.fog = null; gpuResize();
    return result;
  };

  /* Detailed raster shell with an alpha aperture; all motion stays in the
     existing renderer. Cropped key textures retain the reference materials. */
  const shell = new Image(); shell.src = 'assets/fanboy/nv01-shell-render-v2.png';
  const ship = new Image(); ship.src = 'assets/media/ships-shop/falcon.webp';
  const keyStates = new Float32Array(6);
  let keyTime = null;
  function ledPath() {
    ctx.beginPath(); ctx.moveTo(239, 190); ctx.lineTo(806, 190);
    ctx.lineTo(838, 222); ctx.lineTo(838, 657); ctx.lineTo(807, 690);
    ctx.lineTo(237, 690); ctx.lineTo(206, 659); ctx.lineTo(206, 222); ctx.closePath();
  }
  function keyPath(x, y, r) {
    ctx.beginPath(); ctx.moveTo(x - r * .65, y - r); ctx.lineTo(x + r * .65, y - r);
    ctx.lineTo(x + r, y - r * .65); ctx.lineTo(x + r, y + r * .4);
    ctx.lineTo(x + r * .4, y + r); ctx.lineTo(x - r * .4, y + r);
    ctx.lineTo(x - r, y + r * .4); ctx.lineTo(x - r, y - r * .65); ctx.closePath();
  }
  function pressedKey(x, y, r, amount, color, round) {
    if (amount < .01 || !shell.complete || !shell.naturalWidth) return;
    ctx.save();
    if (round) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
    else keyPath(x, y, r);
    ctx.fillStyle = '#02050b'; ctx.fill();
    ctx.save(); ctx.clip();
    const inset = amount * 2.5, drop = amount * 5;
    ctx.drawImage(shell, x - r, y - r, r * 2, r * 2,
      x - r + inset, y - r + inset + drop, r * 2 - inset * 2, r * 2 - inset * 2);
    const glow = ctx.createRadialGradient(x, y, r * .12, x, y, r);
    glow.addColorStop(0, color); glow.addColorStop(1, 'transparent');
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amount * .55;
    ctx.fillStyle = glow; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.globalAlpha = amount; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.shadowColor = color; ctx.shadowBlur = round ? 24 : 13; ctx.stroke();
    ctx.restore();
  }
  const oldFrame = drawMachineFrame;
  drawMachineFrame = function () {
    if (!active()) { keyTime = null; keyStates.fill(0); return oldFrame.apply(this, arguments); }
    if (!framed()) return;
    const scale = PF.w / 560, x = PF.x - 244 * scale, y = PF.y - 228 * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // Quiet studio backdrop keeps the material and emissive detail legible.
    const stage = ctx.createLinearGradient(0, 0, view.w, view.h);
    stage.addColorStop(0, '#071b29'); stage.addColorStop(.45, '#040810'); stage.addColorStop(1, '#211025');
    ctx.fillStyle = stage; ctx.fillRect(0, 0, view.w, view.h);
    ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#020407'; ctx.fillRect(241, 213, 568, 454);
    if (shell.complete && shell.naturalWidth) ctx.drawImage(shell, 0, 0);
    const end = G.plan && G.plan.length ? G.plan[G.plan.length - 1].t + 3 : G.levelDur;
    const progress = Math.max(0, Math.min(1, (G.waveT || 0) / Math.max(1, end)));
    const warning = G.phase === 'bossWarn';
    const danger = warning || G.phase === 'boss' || G.phase === 'harvest' || G.phase === 'clear';
    const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
    const green = [91, 255, 5], orange = [255, 139, 4], red = [255, 20, 39];
    const smooth = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
    const color = danger ? 'rgb(255,20,39)' : progress < .65
      ? mix(green, orange, smooth((progress - .35) / .15))
      : mix(orange, red, smooth((progress - .75) / .15));
    const signal = window.nvAlertSignal(Math.max(0, G.bossWarnT || 0), G.bossWarnTotal || 3.6);
    ctx.globalAlpha = warning ? signal.envelope * (signal.blink ? 1 : .10) : 1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 22;
    ctx.lineWidth = 12; ledPath(); ctx.stroke();
    ctx.shadowBlur = 7; ctx.lineWidth = 4; ctx.strokeStyle = '#e6ffd7'; ctx.stroke();
    ctx.strokeStyle = color; ctx.shadowBlur = 18; ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(191, 124); ctx.lineTo(223, 90);
    ctx.moveTo(815, 90); ctx.lineTo(846, 124);
    ctx.moveTo(117, 1100); ctx.lineTo(117, 1227);
    ctx.moveTo(908, 1100); ctx.lineTo(908, 1227); ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    // The fixed red POWER light is part of the shell texture, outside this layer.
    const p = G.player, input = p && p.controlVisual;
    const live = G.state === 'play' && p && p.alive && !p.out;
    const dx = live && input ? input.x : 0, dy = live && input ? input.y : 0;
    const targets = [dy < -.1, dx < -.1, dx > .1, dy > .1,
      live && input && input.fire, live && ((input && input.bomb) || p.nvBombVisual > 0)];
    // Interpolate on simulation time; pause cannot leave keys held down.
    const now = Number(G.t) || 0, dt = keyTime === null ? 1 / 60 : Math.max(0, Math.min(.05, now - keyTime));
    keyTime = now;
    for (let i = 0; i < keyStates.length; i++) {
      const target = targets[i] ? 1 : 0;
      keyStates[i] = live ? keyStates[i] + (target - keyStates[i]) * Math.min(1, dt * 32) : 0;
    }
    pressedKey(282, 880, 42, keyStates[0], '#00dfff', false);
    pressedKey(211, 950, 42, keyStates[1], '#00dfff', false);
    pressedKey(351, 950, 42, keyStates[2], '#00dfff', false);
    pressedKey(282, 1016, 42, keyStates[3], '#00dfff', false);
    pressedKey(646, 955, 63, keyStates[4], '#00cfff', true);
    pressedKey(798, 900, 64, keyStates[5], '#ff1635', true);
    if (ship.complete && ship.naturalWidth) {
      // Use the game's original full-color Vanguard artwork, without inventing a ship.
      ctx.save(); ctx.translate(419, 1250); ctx.rotate(-.18);
      ctx.drawImage(ship, 0, 170, 720, 410, -220, -110, 440, 250); ctx.restore();
    }
    ctx.restore();
  };

  // Desktop telemetry belongs beside the complete device, not over its armor.
  function sideFrame(fn, self, args) {
    if (!framed() || IS_TOUCH || !sideRes) return fn.apply(self, args);
    const saved = { x: PF.x, y: PF.y, w: PF.w, h: PF.h }, scale = PF.w / 560;
    PF.x -= (244 - 72 + 20) * scale;
    PF.w = 920 * scale;
    PF.h = Math.max(saved.h, view.h - PF.y - 24);
    try { return fn.apply(self, args); } finally { Object.assign(PF, saved); }
  }
  const oldSidePanels = drawSidePanels;
  drawSidePanels = function () { return sideFrame(oldSidePanels, this, arguments); };
  const oldRadioSide = drawRadioSide;
  drawRadioSide = function () { return sideFrame(oldRadioSide, this, arguments); };

  /* Le verre : grille de sortie physique, matte et reflet de lumière ambiante
     d'une pièce éclairée, fixé à la vitre (il ne suit pas le monde). */
  const oldGlass = drawScreenGlass;
  let grid = null, gridKey = '';
  drawScreenGlass = function () {
    if (!active()) return oldGlass.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(PF.x, PF.y, PF.w, PF.h); ctx.clip();
    const step = Math.max(2, Math.round(PF.w * view.dpr / R.bufC.w));
    const key = step + ':' + view.dpr;
    if (key !== gridKey) {
      const tile = document.createElement('canvas'); tile.width = tile.height = step;
      const g = tile.getContext('2d'); g.fillStyle = 'rgba(35,43,29,.055)';
      g.fillRect(0, 0, 1, step); g.fillRect(1, 0, step - 1, 1);
      grid = ctx.createPattern(tile, 'repeat'); gridKey = key;
    }
    if (grid) {
      ctx.save(); ctx.translate(PF.x, PF.y); ctx.scale(1 / view.dpr, 1 / view.dpr);
      ctx.fillStyle = grid; ctx.fillRect(0, 0, PF.w * view.dpr, PF.h * view.dpr); ctx.restore();
    }
    const shade = ctx.createLinearGradient(0, PF.y, 0, PF.y + PF.h);
    shade.addColorStop(0, 'rgba(25,34,18,.12)'); shade.addColorStop(.12, 'rgba(25,34,18,0)');
    shade.addColorStop(.72, 'rgba(25,34,18,.025)'); shade.addColorStop(1, 'rgba(25,34,18,.10)');
    ctx.fillStyle = shade; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    const reflection = ctx.createLinearGradient(PF.x, PF.y + PF.h, PF.x + PF.w, PF.y);
    reflection.addColorStop(0, 'rgba(244,247,223,0)');
    reflection.addColorStop(.52, 'rgba(244,247,223,.015)');
    reflection.addColorStop(.80, 'rgba(244,247,223,.065)');
    reflection.addColorStop(1, 'rgba(250,252,235,.17)');
    ctx.fillStyle = reflection; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    const glint = ctx.createLinearGradient(PF.x + PF.w * .74, 0, PF.x + PF.w, 0);
    glint.addColorStop(0, 'rgba(250,252,235,0)');
    glint.addColorStop(.55, 'rgba(250,252,235,.025)');
    glint.addColorStop(.82, 'rgba(250,252,235,.085)');
    glint.addColorStop(1, 'rgba(250,252,235,.015)');
    ctx.fillStyle = glint; ctx.fillRect(PF.x + PF.w * .74, PF.y, PF.w * .26, PF.h);
    ctx.strokeStyle = 'rgba(241,246,217,.18)'; ctx.lineWidth = 1 / view.dpr;
    ctx.beginPath(); ctx.moveTo(PF.x, PF.y + 1 / view.dpr);
    ctx.lineTo(PF.x + PF.w, PF.y + 1 / view.dpr); ctx.stroke();
    ctx.restore();
  };

  /* HUD et bannière écrits dans les encres LCD ; le cadre peint par le
     module 24 s'efface derrière la coque complète. */
  function displayTheme(fn, self, args) {
    if (!active()) return fn.apply(self, args);
    const previous = TH, copy = { ...TH };
    for (const key of Object.keys(copy)) {
      const index = GB4.indexOf(copy[key]); if (index >= 0) copy[key] = inks[index];
    }
    copy.livery = { ...TH.livery, gb: inks };
    TH = copy;
    const bezel = S.opts.gbBezel; S.opts.gbBezel = 0;
    try { return fn.apply(self, args); }
    finally { TH = previous; S.opts.gbBezel = bezel; }
  }
  const oldHUD = drawHUD;
  drawHUD = function () { return displayTheme(oldHUD, this, arguments); };
  const oldBanner = drawEraBanner;
  drawEraBanner = function () { return displayTheme(oldBanner, this, arguments); };

  /* Le FanBoy n'a ni masque CRT, ni phosphores RGB, ni flou shader global. */
  const oldPresent = presentFrame;
  presentFrame = function () {
    if (!active()) return oldPresent.apply(this, arguments);
    const keys = ['crt', 'crtMask', 'crtVignette', 'shaderSmooth'];
    const saved = keys.map(k => S.opts[k]);
    Object.assign(S.opts, { crt: 'off', crtMask: 'off', crtVignette: 0, shaderSmooth: false });
    try { return oldPresent.apply(this, arguments); }
    finally { keys.forEach((k, i) => { if (saved[i] === undefined) delete S.opts[k]; else S.opts[k] = saved[i]; }); }
  };

  /* Entrer/sortir d'un menu restaure les marges de viewport appropriées. */
  const oldRender = render;
  let lastFrameState = null;
  render = function () {
    const state = framed();
    if (state !== lastFrameState) { lastFrameState = state; sideRes = resizeView().sideRes; }
    return oldRender.apply(this, arguments);
  };

  window.NV_FANBOY_REFERENCE = Object.freeze({ revision: 7, inks: Object.freeze(inks), shell: true, glass: true });
})();
