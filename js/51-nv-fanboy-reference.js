/* FanBoy KFM-01: original portable shell and positive reflective LCD.
 * Display inks estimated from the supplied video captures (2026-10-25).
 * Internal palette stays unchanged: terrain, sprite shading and collision
 * generation keep their existing indices. Only presentation converts the inks.
 */
(() => {
  'use strict';
  const inks = ['#9ea483', '#7d8267', '#595c4c', '#2f3329']; // source dark -> display light
  const rgb = inks.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
  const sourceLum = GB4.map(c => {
    const p = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    return p[0] * .2126 + p[1] * .7152 + p[2] * .0722;
  });
  const active = () => R.era === 0 && G.eraIdx === 0 && G.state !== 'story' && G.state !== 'title';
  const framed = () => active() && S.opts.gbBezel !== 0;
  // One-time default migration; subsequent player choices remain intact.
  if (S.opts.fanboyReference !== 1) {
    S.opts.gbContrast = 'normal'; S.opts.gbGhost = 'low'; S.opts.gbBezel = 1;
    S.opts.fanboyReference = 1;
    saveGame();
  }

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

  const oldResize = resizeView;
  resizeView = function () {
    const result = oldResize.apply(this, arguments);
    if (!framed()) return result;
    const W = view.w, H = view.h, d = view.dpr;
    const touchPad = IS_TOUCH ? 64 : 0;
    const side = Math.max(22, Math.min(44, W * .085));
    const top = 42, bottom = 58;
    const availableW = Math.max(1, W - result.sideRes * 2 - side * 2);
    const availableH = Math.max(1, H - touchPad - top - bottom);
    const scale = Math.min(availableW / L_W, availableH / L_H);
    const sourceScale = Math.max(.2, R.S || 1);
    const whole = Math.floor(scale * d / sourceScale);
    PF.s = whole >= 1 ? sourceScale * whole / d : scale;
    PF.w = L_W * PF.s; PF.h = L_H * PF.s;
    PF.x = Math.round((W - PF.w) * .5 * d) / d;
    PF.y = Math.round((top + (availableH - PF.h) * .5) * d) / d;
    R.vig = null; R.fog = null; gpuResize();
    return result;
  };

  // Chamfered symmetric shell, horizontal header, right-hand power light.
  // No manufacturer logo, original slogan, trademark suffix or copied wordmark.
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
    // Split diamond insignia, distinct from the original console lettering.
    const ex = PF.x + 7;
    ctx.strokeStyle = '#3e7564'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex + 5, cy - 7); ctx.lineTo(ex - 2, cy);
    ctx.lineTo(ex + 5, cy + 7); ctx.moveTo(ex + 10, cy - 7);
    ctx.lineTo(ex + 17, cy); ctx.lineTo(ex + 10, cy + 7); ctx.stroke();
    ctx.fillStyle = '#6d7d6c';
    for (let i = 0; i < 3; i++) ctx.fillRect(PF.x + PF.w - 16 + i * 5, cy - 6, 2, 12);
    ctx.restore();
  };

  const oldGlass = drawScreenGlass;
  let grid = null, gridKey = '';
  drawScreenGlass = function () {
    if (!active()) return oldGlass.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(PF.x, PF.y, PF.w, PF.h); ctx.clip();
    // A physical output grid avoids resampling the native sprites.
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
    ctx.restore();
  };

  function displayTheme(fn, self, args) {
    if (!active()) return fn.apply(self, args);
    const previous = TH, copy = { ...TH };
    for (const key of Object.keys(copy)) {
      const index = GB4.indexOf(copy[key]); if (index >= 0) copy[key] = inks[index];
    }
    copy.livery = { ...TH.livery, gb: inks };
    TH = copy;
    // Disable the old frame painted over the playfield by module 24.
    const bezel = S.opts.gbBezel; S.opts.gbBezel = 0;
    try { return fn.apply(self, args); }
    finally { TH = previous; S.opts.gbBezel = bezel; }
  }
  const oldHUD = drawHUD;
  drawHUD = function () { return displayTheme(oldHUD, this, arguments); };
  const oldBanner = drawEraBanner;
  drawEraBanner = function () { return displayTheme(oldBanner, this, arguments); };

  // FanBoy has no CRT mask, RGB phosphors or global shader blur.
  const oldPresent = presentFrame;
  presentFrame = function () {
    if (!active()) return oldPresent.apply(this, arguments);
    const keys = ['crt', 'crtMask', 'crtVignette', 'shaderSmooth'];
    const saved = keys.map(k => S.opts[k]);
    Object.assign(S.opts, { crt: 'off', crtMask: 'off', crtVignette: 0, shaderSmooth: false });
    try { return oldPresent.apply(this, arguments); }
    finally { keys.forEach((k, i) => { if (saved[i] === undefined) delete S.opts[k]; else S.opts[k] = saved[i]; }); }
  };
  // Entering/leaving a menu also restores the appropriate viewport margins.
  const oldRender = render;
  let lastFrameState = null;
  render = function () {
    const state = framed();
    if (state !== lastFrameState) { lastFrameState = state; sideRes = resizeView().sideRes; }
    return oldRender.apply(this, arguments);
  };
  window.NV_FANBOY_REFERENCE = Object.freeze({ inks: Object.freeze(inks), revision: 1 });
})();
