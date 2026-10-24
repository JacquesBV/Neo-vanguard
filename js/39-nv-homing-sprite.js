
/* ===== MISSILES À TÊTE CHERCHEUSE — sprite par génération =====================
   Planche de 4 images (120×350) : pixel lourd, pixel, 16-bit, lisse.
   LCD · 8-BIT+ · 16-BIT/ARCADE · CD/HD → images 0 · 1 · 2 · 3. Sur l'écran LCD,
   l'image est ramenée aux tons de la palette de l'ère. */
(() => {
  const SHEET = new Image(); SHEET.src = 'assets/media/homing-missile.webp';
  const CW = 120, CH = 350, AY = 0.38, LEN = 30;      /* AY : centre de la coque (point d'impact) ; LEN : longueur en unités de jeu */
  const FRAME_OF_GEN = [0, 1, 2, 2, 3, 3];
  const cache = new Map();
  const parse = (() => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d', { willReadFrequently: true });
    return col => { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = col; g.fillRect(0, 0, 1, 1); return g.getImageData(0, 0, 1, 1).data; }; })();
  function build(f, h, tones) {
    const key = f + ':' + h + (tones ? ':' + tones.join('|') : '');
    let c = cache.get(key); if (c) return c;
    let src = document.createElement('canvas'); src.width = CW; src.height = CH;
    src.getContext('2d').drawImage(SHEET, f * CW, 0, CW, CH, 0, 0, CW, CH);
    while (src.height / 2 >= h) {                       /* réduction par paliers de moitié : pas de crénelage */
      const n = document.createElement('canvas'); n.width = Math.max(1, Math.round(src.width / 2)); n.height = Math.round(src.height / 2);
      const ng = n.getContext('2d'); ng.imageSmoothingQuality = 'high'; ng.drawImage(src, 0, 0, n.width, n.height); src = n;
    }
    const w = Math.max(2, Math.round(h * CW / CH));
    c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
    if (f <= 1) {                                        /* générations pixel : bords francs, pas de demi-transparence */
      const d = g.getImageData(0, 0, w, h), p = d.data, T = tones && tones.map(parse);
      for (let i = 0; i < p.length; i += 4) {
        if (p[i + 3] < 110) { p[i + 3] = 0; continue; }
        p[i + 3] = 255;
        if (T) { const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2], t = T[l < 70 ? 0 : l < 170 ? 1 : 2]; p[i] = t[0]; p[i + 1] = t[1]; p[i + 2] = t[2]; }
      }
      g.putImageData(d, 0, 0);
    }
    cache.set(key, c); if (cache.size > 48) cache.delete(cache.keys().next().value);
    return c;
  }
  window.NVM = {
    draw(g, K, b) {
      if (!SHEET.complete || !SHEET.naturalWidth) return false;
      const gen = typeof G.eraIdx === 'number' ? Math.max(0, Math.min(5, G.eraIdx)) : 0, f = FRAME_OF_GEN[gen];
      const h = Math.max(7, Math.round(LEN * K));
      const c = build(f, h, gen === 0 ? [TH.pDark, TH.pMain, TH.pLite] : null);
      g.save();
      g.translate(Math.round(b.x * K), Math.round(b.y * K)); g.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2);
      if (gen >= 2) {                                    /* lueur du réacteur, qui palpite */
        const ty = c.height * (1 - AY) * 0.72, r = c.width * (0.9 + 0.25 * Math.sin((b.t || 0) * 38 + (b.seed || 0)));
        const gr = g.createRadialGradient(0, ty, 0, 0, ty, r); gr.addColorStop(0, 'rgba(120,220,255,.55)'); gr.addColorStop(1, 'rgba(60,140,255,0)');
        g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-r, ty - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
      }
      const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = gen >= 2;
      g.drawImage(c, -Math.round(c.width / 2), -Math.round(c.height * AY));
      g.imageSmoothingEnabled = sm;
      g.restore();
      return true;
    }
  };
})();
