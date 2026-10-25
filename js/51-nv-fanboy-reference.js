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
    // One portrait shell, with an 480 × 360 presentation aperture; world dimensions stay engine-owned.
    const margin = 8, touchPad = IS_TOUCH ? 100 : 0;
    const shellScale = Math.max(.05, Math.min((W - 2 * margin) / 600,
      (H - touchPad - 2 * margin) / 840));
    PF.s = shellScale * 480 / L_W;
    PF.w = L_W * PF.s; PF.h = L_H * PF.s;
    PF.x = (W - 600 * shellScale) / 2 + 60 * shellScale;
    PF.y = margin + Math.max(0, (H - touchPad - 2 * margin - 840 * shellScale) / 2) + 90 * shellScale;
    R.vig = null; R.fog = null; gpuResize();
    return result;
  };

  /* Static vector asset and existing in-game hull; no animation loop or timer. */
  const shell = new Image(); shell.src = 'assets/fanboy/nv01-shell.svg';
  const ship = new Image(); ship.src = 'assets/ships-native/r0-falcon.png';
  function panel(x, y, w, h, cut) {
    ctx.beginPath(); ctx.moveTo(x + cut, y); ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut); ctx.lineTo(x + w, y + h - cut);
    ctx.lineTo(x + w - cut, y + h); ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut); ctx.lineTo(x, y + cut); ctx.closePath();
  }
  function button(x, y, label, pressed, color, direction) {
    ctx.save(); ctx.translate(x, y + (pressed ? 4 : 0));
    panel(-23, -23, 46, 46, 11);
    ctx.fillStyle = pressed ? '#111b24' : '#334354'; ctx.fill();
    ctx.strokeStyle = pressed ? color : '#617486'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = color;
    if (direction !== undefined) {
      ctx.rotate(direction); ctx.beginPath(); ctx.moveTo(0, -9);
      ctx.lineTo(8, 5); ctx.lineTo(-8, 5); ctx.closePath(); ctx.fill();
    } else {
      ctx.font = '600 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 1);
    }
    ctx.restore();
  }
  const oldFrame = drawMachineFrame;
  drawMachineFrame = function () {
    if (!active()) return oldFrame.apply(this, arguments);
    if (!framed()) return;
    const scale = PF.w / 480, x = PF.x - 60 * scale, y = PF.y - 90 * scale;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    if (shell.complete && shell.naturalWidth) ctx.drawImage(shell, 0, 0, 600, 840);
    const end = G.plan && G.plan.length ? G.plan[G.plan.length - 1].t + 3 : G.levelDur;
    const progress = Math.max(0, Math.min(1, (G.waveT || 0) / Math.max(1, end)));
    const warning = G.phase === 'bossWarn';
    const danger = warning || G.phase === 'boss' || G.phase === 'harvest' || G.phase === 'clear';
    const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
    const green = [62, 240, 157], orange = [255, 164, 48], red = [255, 52, 73];
    const smooth = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
    const color = danger ? 'rgb(255,52,73)' : progress < .65
      ? mix(green, orange, smooth((progress - .35) / .15))
      : mix(orange, red, smooth((progress - .75) / .15));
    const signal = window.nvAlertSignal(Math.max(0, G.bossWarnT || 0), G.bossWarnTotal || 3.6);
    ctx.globalAlpha = warning ? signal.envelope * (signal.blink ? 1 : .12) : 1;
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 10;
    panel(53, 83, 494, 374, 7); ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    // Fixed power light is independent of warning and progression.
    ctx.fillStyle = '#75efff'; ctx.beginPath(); ctx.arc(545, 53, 4, 0, Math.PI * 2); ctx.fill();
    const p = G.player, input = p && p.controlVisual;
    const live = G.state === 'play' && p && p.alive && !p.out;
    const dx = live && input ? input.x : 0, dy = live && input ? input.y : 0;
    button(140, 580, '', dy < -.1, '#72ddeb', 0);
    button(89, 631, '', dx < -.1, '#72ddeb', -Math.PI / 2);
    button(191, 631, '', dx > .1, '#72ddeb', Math.PI / 2);
    button(140, 682, '', dy > .1, '#72ddeb', Math.PI);
    button(414, 650, 'P', live && input && input.fire, '#72ddeb');
    button(493, 600, 'Ω', live && ((input && input.bomb) || p.nvBombVisual > 0), '#f6ba64');
    ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#92a5b7';
    ctx.fillText('PULSE', 414, 687); ctx.fillText('NOVA', 493, 637);
    if (ship.complete && ship.naturalWidth) {
      ctx.save(); ctx.globalAlpha = .8; ctx.translate(302, 635); ctx.rotate(-.22);
      // Exact hull used by module 34, without generating a substitute ship.
      ctx.drawImage(ship, -37, -52, 74, 104); ctx.restore();
    }
    ctx.restore();
  };

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

  window.NV_FANBOY_REFERENCE = Object.freeze({ revision: 6, inks: Object.freeze(inks), shell: true, glass: true });
})();
