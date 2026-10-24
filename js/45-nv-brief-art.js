
/* BRIEFING DE MISSION — une illustration par secteur (assets/media/briefings).
   Chaque image porte l'illustration à gauche et un panneau vide à droite,
   prévu pour le texte : le jeu affiche déjà le texte traduit à côté, donc
   seule la partie illustrée (CUT px sur 1672) est cadrée, sans déformation. */
(() => {
  const CUT = [948, 930, 950, 952, 954, 1048, 959, 1015, 982, 980, 969, 947, 1082, 994, 1073, 927, 1024, 957, 908, 1029, 1003, 960, 1023, 986];
  const IM = {};
  const get = n => {
    n = Math.max(1, Math.min(24, n|0));
    if (!IM[n]) { const im = new Image(); im.decoding = 'async'; im.src = 'assets/media/briefings/secteur-' + String(n).padStart(2,'0') + '.webp'; IM[n] = im; }
    return IM[n];
  };
  const ready = im => im && im.complete && im.naturalWidth;
  /* préchargement : le secteur courant et le suivant */
  let last = -1;
  const pre = () => { try { const l = G.level || 1; if (l !== last) { last = l; get(l); get(l + 1); } } catch (e) {} };
  setInterval(pre, 1500);
  const prior = drawStoryArt;
  drawStoryArt = function (g, x, y, w, h, kind, t) {
    if (!(DECK && DECK.kind === 'brief')) return prior(g, x, y, w, h, kind, t);
    const pg = STORY[storyI], level = (pg && pg.level) || G.level || 1;
    const im = get(level);
    if (!ready(im)) return prior(g, x, y, w, h, kind, t);
    const k = im.naturalWidth / 1672;
    const sw = Math.min(im.naturalWidth, CUT[level - 1] * k), shH = im.naturalHeight;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#02050d'; g.fillRect(x, y, w, h);
    /* cadrage cover de la zone illustrée + lent zoom, comme les autres pages */
    const zoom = 1.02 + 0.05 * clamp(storyT / 24, 0, 1);
    const sc = Math.max(w / sw, h / shH) * zoom;
    const dw = sw * sc, dh = shH * sc;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.globalAlpha = clamp(storyT / 0.6, 0, 1);
    g.drawImage(im, 0, 0, sw, shH, x + (w - dw) / 2, y + (h - dh) * 0.5, dw, dh);
    g.globalAlpha = 1;
    const vg = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.38, x + w / 2, y + h / 2, Math.max(w, h) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = vg; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(127,230,255,.45)'; g.lineWidth = 1.5; g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    g.strokeStyle = 'rgba(127,230,255,.18)'; g.lineWidth = 1; g.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    g.strokeStyle = '#7fe6ff'; g.lineWidth = 2;
    const c = 14;
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      g.beginPath(); g.moveTo(cx, cy + sy * c); g.lineTo(cx, cy); g.lineTo(cx + sx * c, cy); g.stroke();
    });
    g.restore();
  };
})();
