/* ===================== 52 · COQUE NV-01 : CLUSTER + STICKERS =================
   Habille la coque FanBoy FX (module 51) sans JAMAIS toucher aux dimensions
   d'affichage du pack (écran, cadre, deck) :
   · un cluster instrumental gravé dans la zone d'armure sous l'écran :
     coque, bouclier, bombes, puissance, progression du secteur — des LED
     physiques, lisibles d'un coup d'œil, synchronisées avec le jeu ;
   · trois stickers vinyle Neo-Vanguard (emblème, étiquette cartouche sage,
     danger VORAX) détourés (fond noir retiré), laminés, légèrement inclinés.
   Le tout est désactivable dans Options > Coque.                        */
(() => {
  const V = 'nv01-20261026-1';
  const load = src => { const i = new Image(); i.src = src + '?v=' + V; return i; };
  const STK = {
    emblem: load('assets/fanboy/sticker-emblem.webp'),
    cart: load('assets/fanboy/sticker-cartridge.webp'),
    hazard: load('assets/fanboy/sticker-hazard.webp'),
  };

  /* ---- détourage : le fond noir des planches devient transparent ---- */
  const keyed = new WeakMap();
  function decal(im) {
    if (!im || !im.complete || !im.naturalWidth) return null;
    let c = keyed.get(im); if (c) return c;
    try {
      c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        const l = px[i] > px[i + 1] ? (px[i] > px[i + 2] ? px[i] : px[i + 2]) : (px[i + 1] > px[i + 2] ? px[i + 1] : px[i + 2]);
        if (l < 26) px[i + 3] = 0; else if (l < 78) px[i + 3] = Math.round((l - 26) / 52 * 255);
      }
      g.putImageData(d, 0, 0); keyed.set(im, c);
    } catch (e) { return null; }
    return c;
  }
  function sticker(im, cx, cy, w, rot) {
    const c = decal(im); if (!c) return;
    const h = w * c.height / c.width;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 2;
    ctx.drawImage(c, -w / 2, -h / 2, w, h);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    /* reflet de laminage : un biais clair, discret */
    ctx.globalAlpha = .09; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w * .12, -h / 2); ctx.lineTo(-w * .18, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* --------------------------- gravure & LED --------------------------- */
  function lbl(t, x, y, s, col, align) {
    ctx.font = '700 ' + s + 'px system-ui,sans-serif'; ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(t, x, y);
  }
  function led(x, y, r, on, col) {
    ctx.save();
    if (on) { ctx.shadowColor = col; ctx.shadowBlur = r * 2.4; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(6,10,16,.8)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
  function seg(x, y, w, h, frac, col, n) {
    const gap = 2, sw = (w - gap * (n - 1)) / n, on = Math.round(frac * n);
    for (let i = 0; i < n; i++) {
      const sx = x + i * (sw + gap);
      if (i < on) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 5; ctx.fillStyle = col; ctx.fillRect(sx, y, sw, h); ctx.restore(); }
      else { ctx.fillStyle = 'rgba(6,10,16,.8)'; ctx.fillRect(sx, y, sw, h); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.strokeRect(sx + .5, y + .5, sw - 1, h - 1); }
    }
  }

  /* ------------------------ géométrie de la coque ------------------------
     Lire les variables CSS posées par le pack 51 : jamais de dimensions
     recalculées ici, on se contente d'habiller les zones existantes.     */
  function shellZone() {
    const bs = document.body.style;
    const cw = parseFloat(bs.getPropertyValue('--fx-touch-width')) || 0;
    const cTop = parseFloat(bs.getPropertyValue('--fx-controls-top')) || 0;
    if (!cw || !cTop) return null;
    const x = (view.w - cw) / 2;
    const spacerY = PF.y + PF.h + 26;
    return { x, w: cw, cTop, spacerY, gap: cTop - spacerY };
  }

  function paintShell() {
    /* le pack 51 signale sa coque par la classe fanboy-fx (framed() est privé) */
    if (!document.body.classList.contains('fanboy-fx')) return;
    if (S.opts && S.opts.shellHud === 0) return;
    if (G.state !== 'play' && G.state !== 'intro' && G.state !== 'pause') return;
    const z = shellZone(); if (!z) return;
    const P = G.player, st = G.stats; if (!P || !st) return;
    const t = G.t || 0;

    if (z.gap >= 46) {
      /* ---- zone d'armure sous l'écran : cluster + deux stickers ---- */
      const midY = z.spacerY + z.gap * .44;
      sticker(STK.hazard, z.x + z.w * .135, midY, Math.min(z.w * .215, 96), -0.045);
      sticker(STK.cart, z.x + z.w * .865, midY, Math.min(z.w * .215, 96), 0.04);
      /* panneau central gravé */
      const px0 = z.x + z.w * .27, px1 = z.x + z.w * .73, pw = px1 - px0;
      const py0 = z.spacerY + 5, ph = Math.min(z.gap - 24, 46);
      ctx.save();
      ctx.fillStyle = 'rgba(3,6,11,.62)'; ctx.beginPath(); ctx.roundRect(px0, py0, pw, ph, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(160,200,230,.14)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.roundRect(px0 + 1.5, py0 + 1.5, pw - 3, ph - 3, 7); ctx.stroke();
      const cy1 = py0 + ph * .32, cy2 = py0 + ph * .74, r = Math.max(2.5, Math.min(4, pw * .016));
      /* rang 1 : coque · bouclier · bombes */
      let cx = px0 + 10;
      lbl('COQUE', cx, cy1, 7, '#8fa3b8'); cx += 34;
      const hp = Math.max(0, P.hp | 0), hpMax = Math.max(1, Math.min(6, P.maxHp | 0));
      const hurt = P.hitT > 0 && Math.floor(t * 14) % 2 === 0;
      for (let i = 0; i < hpMax; i++) { led(cx + i * (r * 2 + 4), cy1, r, i < hp, hurt && i === hp - 1 ? '#ff233e' : '#55ff77'); }
      cx += hpMax * (r * 2 + 4) + 10;
      lbl('SH', cx, cy1, 7, '#8fa3b8'); cx += 16;
      const shMax = Math.max(0, Math.min(4, P.shMax | 0));
      for (let i = 0; i < shMax; i++) { led(cx + i * (r * 2 + 4), cy1, r, i < P.shield, '#51cfff'); }
      cx += shMax * (r * 2 + 4) + 10;
      lbl('BOMB', cx, cy1, 7, '#8fa3b8'); cx += 30;
      const bMax = Math.max(0, Math.min(5, P.bombs | 0));
      const bombFlash = (P.nvBombVisual || 0) > 0;
      for (let i = 0; i < bMax; i++) { led(cx + i * (r * 2 + 4), cy1, r, true, bombFlash ? '#ffffff' : '#ff5870'); }
      /* rang 2 : puissance + progression secteur */
      let bx = px0 + 10;
      lbl('PWR', bx, cy2, 7, '#8fa3b8'); bx += 26;
      const bw = (pw - 20) * .42;
      seg(bx, cy2 - 3.5, bw, 7, Math.max(0, Math.min(1, P.power / 5)), '#ffd36c', 5);
      bx += bw + 12;
      const lv = String(G.level || 1).padStart(2, '0');
      lbl('S' + lv, bx, cy2, 7, '#8fa3b8'); bx += 20;
      const end = G.plan && G.plan.length ? G.plan[G.plan.length - 1].t + 3 : (G.levelDur || 50);
      const prog = Math.max(0, Math.min(1, (G.waveT || 0) / Math.max(1, end)));
      const danger = G.phase === 'bossWarn' || ['boss', 'harvest', 'clear'].includes(G.phase);
      seg(bx, cy2 - 3.5, pw - 20 - bw - 42, 7, prog, danger ? '#ff233e' : prog >= .5 ? '#ff9a20' : '#55ff77', 10);
      ctx.restore();
    } 
    /* emblème vinyle sur le deck, sous le vaisseau sérigraphié — le bas du
       deck est recalculé comme le pack (tactile : plein écran ; bureau :
       appareil centré), pour ne jamais sortir de la coque. */
    const cs = getComputedStyle(document.body);
    const sB = parseFloat(cs.getPropertyValue('--fx-safe-bottom')) || 0;
    const sT = parseFloat(cs.getPropertyValue('--fx-safe-top')) || 0;
    const devH = 42 + sT + PF.h + 26 + z.w * 346 / 1024;
    const deckBottom = IS_TOUCH ? view.h - sB : Math.max(0, (view.h - devH) / 2) + devH;
    const chD = Math.min(z.w * 346 / 1024, Math.max(1, deckBottom - z.spacerY));
    const deckTop = deckBottom - chD;
    sticker(STK.emblem, z.x + z.w * (z.gap >= 46 ? .485 : .5), deckTop + chD * .88, Math.min(z.w * (z.gap >= 46 ? .115 : .12), 64), -0.05);
  }

  const oldFrame = drawMachineFrame;
  drawMachineFrame = function () {
    oldFrame.apply(this, arguments);
    try { paintShell(); } catch (e) { /* la coque reste nue, jamais de crash */ }
  };

  /* ---------------- option : coque habillée ou nue ---------------- */
  const _build = buildOptions;
  buildOptions = function () {
    const r = _build.apply(this, arguments);
    try {
      const host = document.getElementById('scr-options');
      if (host && !document.getElementById('nvShellRow')) {
        const row = document.createElement('div');
        row.id = 'nvShellRow'; row.className = 'row';
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;margin:10px 0;border:1px solid rgba(140,190,230,.18);border-radius:10px;background:rgba(10,16,28,.5)';
        const t = document.createElement('span');
        t.textContent = 'Coque NV-01 · cluster & stickers';
        t.style.cssText = 'font:700 12px system-ui,sans-serif;color:#bdeeff;letter-spacing:.06em';
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn small';
        const sync = () => { const on = !(S.opts.shellHud === 0); b.textContent = on ? 'HABILLÉE' : 'NUE'; b.style.opacity = on ? '1' : '.6'; };
        b.onclick = () => { S.opts.shellHud = S.opts.shellHud === 0 ? 1 : 0; try { saveGame(); } catch (e) {} sync(); try { Audio2.sfx('ui'); } catch (e) {} sceneDirty = true; };
        sync();
        row.appendChild(t); row.appendChild(b);
        const wrap = host.querySelector('.opt-grid') || host.querySelector('.cards') || host;
        wrap.appendChild(row);
      }
    } catch (e) { }
    return r;
  };
})();
