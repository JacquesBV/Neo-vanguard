
/* ===== CARTE D'AVANCÉE — dernière page de l'introduction (« ORDRE DE MISSION ») ======
   L'illustration de la page devient la carte-circuit des 24 secteurs. Le texte, la
   voix, la durée et les transitions de la page ne changent pas : seule l'image est
   remplacée. Chaque balise porte son numéro ; le circuit s'allume jusqu'au dernier
   secteur franchi, le prochain secteur à jouer pulse.                              */
(() => {
  const SRC = 'assets/media/carte-progression-secteurs.png', LIT = 'assets/media/carte-progression-circuit.webp', SEG = 'assets/media/carte-progression-segments.png';
  const IW = 1024, IH = 1536;
  /* balises relevées sur l'image, de haut en bas. Le parcours MONTE : départ sur la
     grosse balise du bas, secteur 24 (VORAX) sur celle du haut — comme le vaisseau */
  const NODES = [[515, 83], [547, 184], [665, 205], [730, 282], [612, 363], [454, 360], [352, 416], [438, 502], [586, 516], [702, 576], [598, 663], [443, 665], [336, 726], [446, 796], [589, 806], [690, 866], [630, 950], [474, 953], [368, 1013], [442, 1087], [584, 1102], [696, 1162], [579, 1258], [410, 1279], [508, 1442]].reverse();   /* [0] = départ (bas), puis secteurs 1 à 24 */
  const load = s => { const im = new Image(); im.decoding = 'async'; im.src = s; return im; };
  const base = load(SRC), lit = load(LIT), seg = load(SEG);
  /* secteurs franchis : retenus au moment où l'on passe au secteur suivant */
  if (S.nvCleared === undefined) S.nvCleared = Math.max(0, Math.min(24, (S.maxLevel | 0) - 1));
  const cleared = () => Math.max(0, Math.min(24, S.nvCleared | 0));
  { const _n = startNextLevel; startNextLevel = function () { try { if (!anyCheat()) S.nvCleared = Math.max(cleared(), G.level | 0); } catch (e) {} return _n.apply(this, arguments); }; }
  { const _e = beginEpilogue; beginEpilogue = function () { try { if (!anyCheat()) { S.nvCleared = 24; saveGame(); } } catch (e) {} return _e.apply(this, arguments); }; }
  /* circuit allumé jusqu'au secteur franchi (calculé une fois par état) */
  let litCv = null, litFor = -1, segPx = null, litPx = null, blurCv = null;
  function litCanvas(c) {
    if (!lit.complete || !lit.naturalWidth || !seg.complete || !seg.naturalWidth) return null;
    if (litCv && litFor === c) return litCv;
    try {
      if (!segPx) {
        const a = document.createElement('canvas'); a.width = IW; a.height = IH; const ag = a.getContext('2d', { willReadFrequently: true });
        ag.drawImage(seg, 0, 0); segPx = ag.getImageData(0, 0, IW, IH).data;
        ag.clearRect(0, 0, IW, IH); ag.drawImage(lit, 0, 0); litPx = ag.getImageData(0, 0, IW, IH);
      }
      litCv = litCv || document.createElement('canvas'); litCv.width = IW; litCv.height = IH;
      const lg = litCv.getContext('2d'), out = lg.createImageData(IW, IH), o = out.data, s = litPx.data;
      for (let i = 0; i < o.length; i += 4) { const k = segPx[i]; if (k && k >= 25 - c) {   /* tronçons numérotés depuis le haut : on allume par le bas */ o[i] = s[i]; o[i + 1] = s[i + 1]; o[i + 2] = s[i + 2]; o[i + 3] = s[i + 3]; } }
      lg.putImageData(out, 0, 0); litFor = c;
    } catch (e) { return null; }
    return litCv;
  }
  function blurred() {
    if (blurCv) return blurCv;
    blurCv = document.createElement('canvas'); blurCv.width = 256; blurCv.height = 384;
    const g = blurCv.getContext('2d'); try { g.filter = 'blur(6px) brightness(.45) saturate(1.2)'; } catch (e) {}
    g.drawImage(base, 0, 0, 256, 384); return blurCv;
  }
  const _art = drawStoryArt;
  drawStoryArt = function (g, x, y, w, h, kind, t) {
    const pg = STORY[storyI];
    if (!pg || pg.img !== 'pro.9' || !base.complete || !base.naturalWidth) return _art.apply(this, arguments);
    const c = cleared(), next = c < 24 ? c + 1 : 0, T = (typeof t === 'number' ? t : performance.now() / 1000);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalAlpha = clamp(storyT / 0.6, 0, 1);
    /* fond : la même carte, floue et sombre, pour habiller le cadre */
    const bs = Math.max(w / IW, h / IH) * 1.08, bw = IW * bs, bh = IH * bs;
    g.drawImage(blurred(), x + (w - bw) / 2, y + (h - bh) / 2, bw, bh);
    /* la carte entière, sans déformation */
    const pad = Math.max(6, Math.min(w, h) * 0.03);
    const sc = Math.min((w - pad * 2) / IW, (h - pad * 2) / IH), dw = IW * sc, dh = IH * sc, dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14; g.drawImage(base, dx, dy, dw, dh); g.shadowBlur = 0;
    /* le circuit franchi s'allume (respire doucement) */
    const lc = c > 0 ? litCanvas(c) : null;
    if (lc) { const a0 = g.globalAlpha; g.globalAlpha = a0 * (0.88 + 0.12 * Math.sin(T * 2.4)); g.drawImage(lc, dx, dy, dw, dh); g.globalAlpha = a0; }
    /* les balises : numéro, franchi, prochain secteur */
    const R = 29 * sc, fs = Math.max(6, R * 0.95);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    NODES.forEach(([nx, ny], i) => {
      const px = dx + nx * sc, py = dy + ny * sc, big = i === 0 || i === 24, r = (big ? 33 : 24) * sc;
      if (i === 0) {                                   /* le départ */
        g.fillStyle = c > 0 ? '#bff8ff' : 'rgba(191,248,255,.75)';
        g.beginPath(); g.moveTo(px - r * .35, py - r * .5); g.lineTo(px + r * .55, py); g.lineTo(px - r * .35, py + r * .5); g.closePath(); g.fill();
        return;
      }
      if (i <= c) {                                    /* secteur franchi */
        const gr = g.createRadialGradient(px, py, 0, px, py, r * 1.6);
        gr.addColorStop(0, 'rgba(160,250,255,.95)'); gr.addColorStop(.6, 'rgba(60,220,255,.75)'); gr.addColorStop(1, 'rgba(60,220,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(px, py, r * 1.6, 0, TAU); g.fill();
        g.fillStyle = '#04121c';
      } else if (i === next) {                         /* le prochain secteur à jouer */
        const p = 0.5 + 0.5 * Math.sin(T * 5);
        g.strokeStyle = `rgba(255,94,168,${0.55 + 0.45 * p})`; g.lineWidth = Math.max(1.5, 3.5 * sc * 2);
        g.beginPath(); g.arc(px, py, r * (1.25 + 0.2 * p), 0, TAU); g.stroke();
        g.fillStyle = '#ffffff';
      } else g.fillStyle = 'rgba(200,225,255,.55)';    /* pas encore atteint */
      g.font = `900 ${big ? fs * 1.15 : fs}px ui-monospace,"Cascadia Mono",Consolas,monospace`;
      g.fillText(String(i), px, py + fs * 0.04);
    });
    /* légende : où en est le pilote */
    let lf = Math.max(9, Math.min(15, w * 0.026)); const label = (typeof L === 'function' ? L('SECTEURS FRANCHIS') : 'SECTEURS FRANCHIS') + ' ' + c + ' / 24';
    g.font = `800 ${lf}px ui-monospace,Consolas,monospace`;
    while (lf > 9 && g.measureText(label).width + lf * 1.4 > dx - x - 12 && y + h - (dy + dh) < lf * 1.9) { lf -= 1; g.font = `800 ${lf}px ui-monospace,Consolas,monospace`; }
    /* posée à côté de la carte (jamais dessus) : à gauche s'il y a la place, sinon dessous */
    const tw = g.measureText(label).width + lf * 1.4, side = dx - x, below = y + h - (dy + dh);
    let lx = null, ly = null;
    if (side >= tw + 12) { lx = x + (side - tw) / 2; ly = dy + dh - lf * 1.7; }
    else if (below >= lf * 1.9) { lx = x + w / 2 - tw / 2; ly = dy + dh + (below - lf * 1.7) / 2; }
    if (lx !== null) {
      g.fillStyle = 'rgba(4,8,20,.82)'; g.fillRect(lx, ly, tw, lf * 1.7);
      g.strokeStyle = 'rgba(127,230,255,.5)'; g.lineWidth = 1; g.strokeRect(lx + .5, ly + .5, tw - 1, lf * 1.7 - 1);
      g.fillStyle = '#bff8ff'; g.fillText(label, lx + tw / 2, ly + lf * 0.88);
    }
    g.globalAlpha = 1;
    /* même cadre que les autres images de l'introduction */
    g.strokeStyle = 'rgba(127,230,255,.45)'; g.lineWidth = 1.5; g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    g.strokeStyle = 'rgba(127,230,255,.18)'; g.lineWidth = 1; g.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    g.strokeStyle = '#7fe6ff'; g.lineWidth = 2; const k = 14;
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.beginPath(); g.moveTo(cx, cy + sy * k); g.lineTo(cx, cy); g.lineTo(cx + sx * k, cy); g.stroke(); });
    g.restore();
  };
  try { LDATA['SECTEURS FRANCHIS'] = LDATA['SECTEURS FRANCHIS'] || ['SECTORS CLEARED', 'SECTORES SUPERADOS', 'SETORES CONCLUÍDOS', 'クリア済みセクター']; LIDX = null; LCACHE.clear(); } catch (e) {}
})();
