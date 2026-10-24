
(() => {
  /* ===== SECTEURS 1-4 (LCD) — décor apaisé =====================================
     Le décor était couvert de damiers et de grilles de points : l'œil ne trouvait
     aucune zone de repos et le vaisseau, les tirs et les ennemis s'y perdaient.
     Ici, avant que les acteurs soient dessinés :
       · le sol lointain est lissé en aplats dans les DEUX tons les plus sombres ;
       · les structures (murs, conduites, plateformes) sont lissées et plafonnées au
         ton moyen : elles gardent leurs formes et leurs arêtes ;
       · le ton le plus clair est réservé au vaisseau, aux ennemis, aux tirs, aux bonus.
     Le tramage subsiste seulement en lisière, là où deux tons se rencontrent.      */
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  let snap = null, cacheKey = '', PAL = null, LUM = null;
  function palette() {
    const gb = (TH.livery && TH.livery.gb) || GB4, key = gb.join();
    if (key !== cacheKey) { cacheKey = key; PAL = gb.map(hex); LUM = PAL.map(p => p[0] * .3 + p[1] * .59 + p[2] * .11); }
  }
  function toneOf(D, i) {
    const L = D[i] * .3 + D[i + 1] * .59 + D[i + 2] * .11;
    let b = 0, bd = 1e9;
    for (let k = 0; k < 4; k++) { const d = Math.abs(L - LUM[k]); if (d < bd) { bd = d; b = k; } }
    return b;
  }
  /* moyenne 3×3 des tons (centre compté double) : un damier devient un aplat,
     une ligne d'un pixel s'adoucit au lieu de clignoter                         */
  function smooth(T, W, H, x, y) {
    let s = T[y * W + x] * 2, n = 2;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx; if (xx < 0 || xx >= W) continue;
        s += T[yy * W + xx]; n++;
      }
    }
    return s / n;
  }
  function pass(buf, mask, mapper) {
    const W = buf.c.width, H = buf.c.height;
    let img; try { img = buf.g.getImageData(0, 0, W, H); } catch (e) { return null; }
    const D = img.data, T = new Uint8Array(W * H);
    for (let i = 0, p = 0; p < W * H; i += 4, p++) T[p] = D[i + 3] ? toneOf(D, i) : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x; if (mask && !mask[p]) continue;
      const i = p * 4; if (!D[i + 3]) continue;
      const c = PAL[mapper(smooth(T, W, H, x, y), x, y)];
      D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2];
    }
    buf.g.putImageData(img, 0, 0);
    return img;
  }
  const on = () => (R.era | 0) === 0 && S.opts.lcdCalm !== false;
  /* moyenne des tons sur un carré 2×2 (image intégrale) : un damier donne
     exactement 0,5 partout, donc un aplat stable qui ne scintille pas      */
  function calm(buf) {
    const W = buf.c.width, H = buf.c.height;
    let img; try { img = buf.g.getImageData(0, 0, W, H); } catch (e) { return; }
    const D = img.data, I = new Float32Array((W + 1) * (H + 1));
    for (let y = 0; y < H; y++) {
      let row = 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        row += D[i + 3] ? toneOf(D, i) : 0;
        I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row;
      }
    }
    const box = (x0, y0, x1, y1) => I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (!D[i + 3]) continue;
      const x0 = x, y0 = y, x1 = Math.min(W, x + 2), y1 = Math.min(H, y + 2);   /* carré 2×2 : arêtes nettes */
      const a = box(x0, y0, x1, y1) / ((x1 - x0) * (y1 - y0));
      const t0 = toneOf(D, i);
      /* les arêtes franches (ton propre du pixel ≥ 2 sur fond sombre) gardent un relief */
      const t = a < 0.3 ? 0 : a < 1.3 ? (t0 >= 2 && a > 0.75 ? 2 : 1) : 2;
      const c = PAL[t]; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2];
    }
    buf.g.putImageData(img, 0, 0);
  }
  const prevTerrain = drawTerrain;
  drawTerrain = function (layer) {
    const r = prevTerrain.apply(this, arguments);
    if (on() && layer === R.bufNear && layer && layer.g) { palette(); calm(layer); }
    return r;
  };
})();
