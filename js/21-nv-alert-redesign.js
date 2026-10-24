
/* Annonce d'alerte avant les boss : bandeau central qui s'ouvre, hachures
   de danger qui défilent en sens inverse, titre à aberration chromatique,
   nom tapé lettre à lettre, triangles clignotants et vignette rouge. */
(() => {
  const C = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = t => { t = C(t, 0, 1); return t * t * (3 - 2 * t); };
  const TT = o => o[(typeof LANG === 'string' && o[LANG]) ? LANG : 'fr'];
  const fit = (str, start, min, maxW) => { let s = start; while (s > min && hudW(str, s) > maxW) s -= .1; return Math.max(min, s); };
  function tri(x, y, s, fill, ink) {
    ctx.beginPath(); ctx.moveTo(x, y - s * .55); ctx.lineTo(x + s * .52, y + s * .4); ctx.lineTo(x - s * .52, y + s * .4); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = ink; ctx.fillRect(x - s * .06, y - s * .24, s * .12, s * .36); ctx.fillRect(x - s * .06, y + s * .19, s * .12, s * .1);
  }
  function hazard(x, y, w, hh, t, dir, col, ink) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
    ctx.fillStyle = col; ctx.fillRect(x, y, w, hh); ctx.fillStyle = ink;
    const step = hh * 2.2, off = ((t * 70 * dir) % step + step) % step;
    for (let sx = x - step * 2 + off; sx < x + w + step; sx += step) { ctx.beginPath(); ctx.moveTo(sx, y + hh); ctx.lineTo(sx + step * .5, y + hh); ctx.lineTo(sx + step * .5 + hh, y); ctx.lineTo(sx + hh, y); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  window.nvAlertDraw = function (t, total, o) {
    const e = R.era, gb = e === 0, x0 = PF.x, y0 = PF.y, w = PF.w, h = PF.h;
    const red = gb ? TH.livery.gb[3] : '#ff2b45', amber = gb ? TH.livery.gb[2] : '#ffd166', ink = gb ? TH.bg : '#12040a', white = gb ? TH.livery.gb[3] : '#ffffff';
    const kout = sm((total - t) / .35), k = Math.min(sm(t / .4), kout);
    if (k <= 0) return;
    const pulse = .5 + .5 * Math.sin(t * 13), blink = Math.floor(t * 6) % 2 === 0;
    const cy = y0 + h * (o.y || .38), bandH = Math.max(108, h * .155), sh = Math.max(12, h * .02);
    const bh = bandH * sm(t / .5) * kout, slide = (1 - sm(t / .35)) * w + (1 - kout) * w;
    const HD = TH.ramp >= 255, put = (str, x, y, col, size, opt) => hudText(ctx, str, x, y + (HD ? size * 3.5 : 0), col, size, opt);
    ctx.save();
    if (!gb) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (.16 + .22 * pulse) * k; const vg = ctx.createRadialGradient(x0 + w / 2, y0 + h / 2, h * .22, x0 + w / 2, y0 + h / 2, h * .8); vg.addColorStop(0, 'rgba(255,20,40,0)'); vg.addColorStop(1, 'rgba(255,20,40,.75)'); ctx.fillStyle = vg; ctx.fillRect(x0, y0, w, h); ctx.restore(); }
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    hazard(x0 - slide, cy - bh / 2 - sh, w, sh, t, 1, red, ink);
    hazard(x0 + slide, cy + bh / 2, w, sh, t, -1, red, ink);
    ctx.restore();
    if (bh > 4) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, cy - bh / 2, w, bh); ctx.clip();
      const top = cy - bandH / 2, bot = cy + bandH / 2;
      if (gb) ctx.fillStyle = TH.bg; else { const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'rgba(46,4,14,.93)'); g.addColorStop(.5, 'rgba(8,2,8,.95)'); g.addColorStop(1, 'rgba(46,4,14,.93)'); ctx.fillStyle = g; }
      ctx.fillRect(x0, top, w, bandH);
      if (!gb) {
        ctx.fillStyle = 'rgba(255,60,80,.07)'; for (let yy = top; yy < bot; yy += 3) ctx.fillRect(x0, yy, w, 1);
        const sx = x0 + ((t * .8) % 1.4 - .2) * w, lg = ctx.createLinearGradient(sx - 70, 0, sx + 70, 0);
        lg.addColorStop(0, 'rgba(255,80,100,0)'); lg.addColorStop(.5, 'rgba(255,130,150,.18)'); lg.addColorStop(1, 'rgba(255,80,100,0)'); ctx.fillStyle = lg; ctx.fillRect(sx - 70, top, 140, bandH);
      }
      /* titre */
      const title = o.title, tS = fit(title, e >= 3 ? 4.6 : 4, 2, w * .58), th = tS * 7, ty = top + bandH * .13;
      const gx = t < .8 && Math.random() < .3 ? (Math.random() - .5) * 12 : 0;
      if (!gb) { ctx.globalAlpha = .5; put(title, x0 + w / 2 + gx - 3, ty, '#00e5ff', tS, { align: 'center' }); put(title, x0 + w / 2 + gx + 3, ty, '#ff0040', tS, { align: 'center' }); ctx.globalAlpha = 1; }
      put(title, x0 + w / 2 + gx, ty, blink || t > 1.2 ? white : red, tS, { align: 'center', glow: gb ? null : red });
      const tw = hudW(title, tS), ts = Math.min(th * 1.3, 46);
      if (ts > 10) for (const s of [-1, 1]) tri(x0 + w / 2 + s * (tw / 2 + ts * .85), ty + th * .5, ts, blink ? red : amber, ink);
      /* nom tapé lettre à lettre */
      const name = String(o.name || '').toUpperCase(), rev = C((t - .45) / .7, 0, 1), shown = name.slice(0, Math.ceil(name.length * rev));
      const nS = fit(name, e >= 3 ? 3 : 2.6, 1.4, w * .84), ny = ty + th + bandH * .1;
      if (shown) put(shown + (rev < 1 && blink ? '_' : ''), x0 + w / 2, ny, amber, nS, { align: 'center', glow: gb ? null : amber });
      /* consigne + jauge */
      const sub = o.sub || '', sS = fit(sub, e >= 3 ? 1.7 : 1.4, .9, w * .88);
      ctx.globalAlpha = .55 + .45 * pulse; put(sub, x0 + w / 2, bot - sS * 7 - 13, white, sS, { align: 'center' }); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x0 + w * .1, bot - 6, w * .8, 2); ctx.fillStyle = red; ctx.fillRect(x0 + w * .1, bot - 6, w * .8 * C(t / total, 0, 1), 2);
      ctx.strokeStyle = amber; ctx.lineWidth = 2; const m = 8, L = 16;
      for (const [ax, ay, dx, dy] of [[x0 + m, top + m, 1, 1], [x0 + w - m, top + m, -1, 1], [x0 + m, bot - m, 1, -1], [x0 + w - m, bot - m, -1, -1]]) { ctx.beginPath(); ctx.moveTo(ax + dx * L, ay); ctx.lineTo(ax, ay); ctx.lineTo(ax, ay + dy * L); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
  };
  window.nvAlertText = {
    title: { fr: 'ALERTE', en: 'WARNING', es: 'ALERTA', pt: 'ALERTA', ja: '警告' },
    sub: { fr: 'VAISSEAU AMIRAL EN APPROCHE · RESTE MOBILE', en: 'FLAGSHIP APPROACHING · KEEP MOVING', es: 'BUQUE INSIGNIA EN APROXIMACIÓN · NO TE DETENGAS', pt: 'NAVE-MÃE EM APROXIMAÇÃO · NÃO PARES', ja: '敵旗艦接近中 · 動き続けろ' },
    unknown: { fr: 'SIGNATURE INCONNUE', en: 'UNKNOWN SIGNATURE', es: 'FIRMA DESCONOCIDA', pt: 'ASSINATURA DESCONHECIDA', ja: '未確認シグナル' },
    tr: TT
  };
  const _warn = drawBossWarning;
  drawBossWarning = function () {
    try {
      const up = bossForLevel(G.level), X = window.nvAlertText;
      const name = up.def.final ? TT(X.unknown) : up.def.name + (up.mk ? ' MK-' + (up.mk + 1) : '');
      window.nvAlertDraw(Math.max(0, G.bossWarnT || 0), G.bossWarnTotal || 3.6, { title: TT(X.title), name, sub: TT(X.sub) });
    } catch (err) { return _warn(); }
  };
})();
