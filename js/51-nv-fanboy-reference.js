/* FanBoy KFM-01 — coque portable et LCD réfléchissant positif, réédition 5.
 * Retrouve les encres LCD estimées d'après les captures fournies (fond sauge
 * clair, structures olive sombre), telles que validées à l'écran : la palette
 * interne du moteur (indices de terrain, ombrages, collisions) n'est pas
 * modifiée, seule la présentation convertit les encres à l'affichage.
 * Ce module pose aussi :
 *   · la coque d'origine autour de l'écran, agrandie au maximum sur téléphone ;
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
  let pinS = null, viewKey = '';
  resizeView = function () {
    const result = oldResize.apply(this, arguments);
    if (!framed()) { pinS = null; return result; }
    const key = view.w + 'x' + view.h + '@' + view.dpr;
    if (key !== viewKey) { viewKey = key; pinS = null; }   /* rotation vraie : recalcul */
    const W = view.w, H = view.h, d = view.dpr;
    const bandTop = 33, bandBottom = 47;                   /* bandeau + mentonnière coque */
    const outer = IS_TOUCH ? 6 : Math.max(10, Math.min(24, W * .04));
    const shellSide = IS_TOUCH ? Math.max(10, Math.min(20, W * .045)) : 34;
    const touchPad = IS_TOUCH ? 100 : 0;                   /* barre tactile fixe en bas */
    const availableW = Math.max(1, W - result.sideRes * 2 - (outer + shellSide) * 2);
    const availableH = Math.max(1, H - touchPad - outer * 2 - bandTop - bandBottom);
    const scale = Math.min(availableW / L_W, availableH / L_H);
    const sourceScale = Math.max(.2, R.S || 1);
    const whole = Math.floor(scale * d / sourceScale);
    PF.s = (!IS_TOUCH && whole >= 1) ? sourceScale * whole / d : scale;
    if (pinS === null) pinS = PF.s; else PF.s = pinS;      /* aucun rescale en partie */
    PF.w = L_W * PF.s; PF.h = L_H * PF.s;
    PF.x = Math.round((W - PF.w) * .5 * d) / d;
    PF.y = Math.round((outer + bandTop + (availableH - PF.h) * .5) * d) / d;
    R.vig = null; R.fog = null; gpuResize();
    return result;
  };

  /* Coque biseautée symétrique, bandeau horizontal, voyant à droite.
     Aucun logo constructeur, slogan d'origine ou marque déposée. */
  function panel(x, y, w, h, cut) {
    ctx.beginPath(); ctx.moveTo(x + cut, y); ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut); ctx.lineTo(x + w, y + h - cut);
    ctx.lineTo(x + w - cut, y + h); ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut); ctx.lineTo(x, y + cut); ctx.closePath();
  }
  const oldFrame = drawMachineFrame;
  drawMachineFrame = function () {
    if (!active()) return oldFrame.apply(this, arguments);
    if (!framed()) return;
    const side = Math.min(PF.x - 5, 34), x = PF.x - side, y = PF.y - 33;
    const w = PF.w + side * 2, h = PF.h + 80;
    ctx.save();
    const shell = ctx.createLinearGradient(x, y, x + w, y + h);
    shell.addColorStop(0, '#e0e1d8'); shell.addColorStop(.45, '#c8ccc1'); shell.addColorStop(1, '#afb8ac');
    panel(x, y, w, h, 13); ctx.fillStyle = shell; ctx.fill();
    ctx.strokeStyle = '#788577'; ctx.lineWidth = 1.5; ctx.stroke();
    panel(x + 5, y + 5, w - 10, PF.h + 46, 9);
    ctx.fillStyle = '#535a53'; ctx.fill();
    ctx.strokeStyle = '#394039'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#a8b8a1'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '600 8px sans-serif';
    ctx.fillText('KFM-01  /  DOT DISPLAY', PF.x + 2, PF.y - 17, PF.w - 32);
    ctx.fillStyle = '#e84036'; ctx.shadowColor = '#ff3c20'; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(PF.x + PF.w - 7, PF.y - 17, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#31382c'; ctx.lineWidth = 3;
    ctx.strokeRect(PF.x - 1.5, PF.y - 1.5, PF.w + 3, PF.h + 3);
    const cy = PF.y + PF.h + 30;
    const fs = Math.min(22, PF.w * .084);
    ctx.font = `700 ${fs}px sans-serif`; ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillStyle = '#274c45'; ctx.fillText('FANBOY', PF.x + PF.w * .5, cy, PF.w * .70);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    const ex = PF.x + 7;
    ctx.strokeStyle = '#3e7564'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex + 5, cy - 7); ctx.lineTo(ex - 2, cy);
    ctx.lineTo(ex + 5, cy + 7); ctx.moveTo(ex + 10, cy - 7);
    ctx.lineTo(ex + 17, cy); ctx.lineTo(ex + 10, cy + 7); ctx.stroke();
    ctx.fillStyle = '#6d7d6c';
    for (let i = 0; i < 3; i++) ctx.fillRect(PF.x + PF.w - 16 + i * 5, cy - 6, 2, 12);
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

  window.NV_FANBOY_REFERENCE = Object.freeze({ revision: 5, inks: Object.freeze(inks), shell: true, glass: true });
})();
