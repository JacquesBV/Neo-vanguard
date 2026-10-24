
(() => {
  /* ===== VAISSEAUX DU JOUEUR EN JEU — planches d'animation =====================
     Remplace uniquement le dessin du vaisseau PENDANT LA PARTIE par les planches
     assets/ships-anim/<génération>/<coque>-anim.png (vol, inclinaisons, boost,
     impact, explosion). La boutique, les cartes et les aperçus ne passent pas par
     ici et gardent leurs illustrations. Tant qu'une planche n'est pas chargée,
     l'ancien dessin reste affiché.                                             */
  const SHEETS = {"falcon":[["assets/ships-anim/era0-kfm01/vanguard-mk1-anim.png",64,66,31.5,30.0,29,42],["assets/ships-anim/era1-8bit-plus/vanguard-mk1-anim.png",88,90,43.5,41.0,39,58],["assets/ships-anim/era2-16bit-home/vanguard-mk1-anim.png",106,110,52.5,50.0,47,70],["assets/ships-anim/era3-16bit-arcade/vanguard-mk1-anim.png",118,122,59.0,56.0,52,78],["assets/ships-anim/era4-32bit-cd/vanguard-mk1-anim.png",136,140,68.0,64.0,60,90],["assets/ships-anim/era5-hd/vanguard-mk1-anim.png",250,258,125.0,119.0,108,166]],"falconA":[["assets/ships-anim/era0-kfm01/falcon-a-marteau-anim.png",64,66,32.0,30.0,32,42],["assets/ships-anim/era1-8bit-plus/falcon-a-marteau-anim.png",88,90,44.0,41.0,44,58],["assets/ships-anim/era2-16bit-home/falcon-a-marteau-anim.png",106,110,53.0,50.0,52,70],["assets/ships-anim/era3-16bit-arcade/falcon-a-marteau-anim.png",118,122,59.0,56.0,58,78],["assets/ships-anim/era4-32bit-cd/falcon-a-marteau-anim.png",136,140,67.5,64.0,67,90],["assets/ships-anim/era5-hd/falcon-a-marteau-anim.png",250,258,125.0,119.0,122,166]],"falconB":[["assets/ships-anim/era0-kfm01/falcon-b-lame-anim.png",64,66,31.5,30.0,27,42],["assets/ships-anim/era1-8bit-plus/falcon-b-lame-anim.png",88,90,43.5,41.0,37,58],["assets/ships-anim/era2-16bit-home/falcon-b-lame-anim.png",106,110,53.0,50.0,44,70],["assets/ships-anim/era3-16bit-arcade/falcon-b-lame-anim.png",118,122,59.0,56.0,48,78],["assets/ships-anim/era4-32bit-cd/falcon-b-lame-anim.png",136,140,68.0,64.0,56,90],["assets/ships-anim/era5-hd/falcon-b-lame-anim.png",250,258,125.0,119.0,100,166]],"viper":[["assets/ships-anim/era0-kfm01/vipere-anim.png",64,66,31.5,30.0,23,42],["assets/ships-anim/era1-8bit-plus/vipere-anim.png",88,90,44.0,41.0,30,58],["assets/ships-anim/era2-16bit-home/vipere-anim.png",106,110,53.0,50.0,36,70],["assets/ships-anim/era3-16bit-arcade/vipere-anim.png",118,122,58.5,56.0,39,78],["assets/ships-anim/era4-32bit-cd/vipere-anim.png",136,140,67.5,64.0,45,90],["assets/ships-anim/era5-hd/vipere-anim.png",250,258,125.0,119.0,80,166]],"titan":[["assets/ships-anim/era0-kfm01/titan-anim.png",64,66,31.5,30.0,37,42],["assets/ships-anim/era1-8bit-plus/titan-anim.png",88,90,43.5,41.0,51,58],["assets/ships-anim/era2-16bit-home/titan-anim.png",106,110,52.5,50.0,61,70],["assets/ships-anim/era3-16bit-arcade/titan-anim.png",118,122,59.0,56.0,68,78],["assets/ships-anim/era4-32bit-cd/titan-anim.png",136,140,67.5,64.0,79,90],["assets/ships-anim/era5-hd/titan-anim.png",250,258,124.5,119.0,145,166]],"spectre":[["assets/ships-anim/era0-kfm01/spectre-anim.png",64,66,31.5,30.0,37,42],["assets/ships-anim/era1-8bit-plus/spectre-anim.png",88,90,43.5,41.0,51,58],["assets/ships-anim/era2-16bit-home/spectre-anim.png",106,110,53.0,50.0,62,70],["assets/ships-anim/era3-16bit-arcade/spectre-anim.png",118,122,58.5,56.0,69,78],["assets/ships-anim/era4-32bit-cd/spectre-anim.png",136,140,67.5,64.0,79,90],["assets/ships-anim/era5-hd/spectre-anim.png",250,258,124.5,119.0,145,166]],"singularis":[["assets/ships-anim/era0-kfm01/singularis-anim.png",64,66,31.5,30.0,31,42],["assets/ships-anim/era1-8bit-plus/singularis-anim.png",88,90,44.0,41.0,42,58],["assets/ships-anim/era2-16bit-home/singularis-anim.png",106,110,53.0,50.0,50,70],["assets/ships-anim/era3-16bit-arcade/singularis-anim.png",118,122,58.5,56.0,55,78],["assets/ships-anim/era4-32bit-cd/singularis-anim.png",136,140,68.0,64.0,64,90],["assets/ships-anim/era5-hd/singularis-anim.png",250,258,125.0,119.0,116,166]]};
  const ROWS = { idle: 0, bank_l: 1, bank_r: 2, boost: 3, hit: 4, explode: 5 };
  const IMG = {}, PAL = {}, CACHE = new Map();
  /* luminance des 4 verts du pack, pour reprendre la palette LCD de la livrée */
  const PACK_GB = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]].map(c => c[0] * .3 + c[1] * .59 + c[2] * .11);
  const GB_MAP = [0, 2, 3, 3];
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

  function sheetFor(ship) {
    const gen = typeof G.eraIdx === 'number' ? G.eraIdx : (typeof eraOfLevel === 'function' ? eraOfLevel(G.level || 1) : 0);
    const row = SHEETS[ship]; if (!row) return null;
    const d = row[Math.max(0, Math.min(5, gen))]; if (!d) return null;
    const key = d[0];
    let im = IMG[key];
    if (!im) {
      im = IMG[key] = new Image();
      im.onload = () => { im._ok = true; };
      im.onerror = () => { im._bad = true; };
      im.src = key;
    }
    if (!im._ok) return null;
    return { key, im, gen, fw: d[1], fh: d[2], ax: d[3], ay: d[4], sw: d[5], sh: d[6] };
  }
  /* couleurs d'origine d'une planche pixel (pour garder des pixels francs après réduction) */
  function paletteOf(s) {
    if (PAL[s.key] !== undefined) return PAL[s.key];
    const c = document.createElement('canvas'); c.width = s.im.width; c.height = s.im.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(s.im, 0, 0);
    const D = g.getImageData(0, 0, c.width, c.height).data, seen = new Map();
    for (let i = 0; i < D.length; i += 4) {
      if (D[i + 3] < 128) continue;
      const k = (D[i] << 16) | (D[i + 1] << 8) | D[i + 2];
      seen.set(k, (seen.get(k) || 0) + 1);
      if (seen.size > 96) break;
    }
    PAL[s.key] = seen.size > 96 ? null : [...seen.keys()].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]);
    return PAL[s.key];
  }
  /* pixels bruts d'une planche (lus une fois) */
  const RAW = {};
  function rawOf(s) {
    if (RAW[s.key]) return RAW[s.key];
    const c = document.createElement('canvas'); c.width = s.im.width; c.height = s.im.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(s.im, 0, 0);
    return (RAW[s.key] = { W: c.width, D: g.getImageData(0, 0, c.width, c.height).data });
  }
  /* réduction « pixel art » pour les petites générations : un pixel d'arrivée est
     plein dès que 28 % de sa zone l'est, et prend la couleur la plus claire (KFM-01)
     ou la plus fréquente (8-BIT+) : la silhouette reste épaisse et lisible.      */
  function shrinkPixel(s, row, col, W, H, f, brightest) {
    const R0 = rawOf(s), SD = R0.D, SW = R0.W, out = new ImageData(W, H), D = out.data;
    const x0 = col * s.fw, y0 = row * s.fh, step = 1 / f;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx0 = Math.floor(x * step), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * step));
      const sy0 = Math.floor(y * step), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * step));
      let tot = 0, op = 0, best = -1, bi = -1; const freq = brightest ? null : new Map();
      for (let yy = sy0; yy < sy1 && yy < s.fh; yy++) for (let xx = sx0; xx < sx1 && xx < s.fw; xx++) {
        tot++; const i = ((y0 + yy) * SW + x0 + xx) * 4; if (SD[i + 3] < 128) continue; op++;
        if (brightest) { const L = SD[i] * .3 + SD[i + 1] * .59 + SD[i + 2] * .11; if (L > best) { best = L; bi = i; } }
        else { const k = (SD[i] << 16) | (SD[i + 1] << 8) | SD[i + 2], n = (freq.get(k) || 0) + 1; freq.set(k, n); if (n > best) { best = n; bi = i; } }
      }
      if (!tot || op / tot < 0.28) continue;
      const o = (y * W + x) * 4; D[o] = SD[bi]; D[o + 1] = SD[bi + 1]; D[o + 2] = SD[bi + 2]; D[o + 3] = 255;
    }
    return out;
  }
  /* livrée : la coque grise prend la teinte de la livrée équipée ; la bande, la
     verrière et les flammes (couleurs saturées) restent celles du sprite. La
     livrée d'usine ESCADRILLE correspond au sprite : rien n'est modifié.      */
  function liveryTint() {
    const L = TH.livery || (typeof LIVERIES !== 'undefined' ? LIVERIES[0] : null);
    if (!L || L.id === 'squadron' || !L.gb) return null;
    const c = hex(L.gb[2]), mx = Math.max(...c), mn = Math.min(...c);
    return { id: L.id, col: c, grey: mx - mn < 40 };
  }
  function tintPixel(D, i, T, memo) {
    const k = (D[i] << 16) | (D[i + 1] << 8) | D[i + 2];
    let v = memo.get(k);
    if (v === undefined) {
      const r = D[i], g = D[i + 1], b = D[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx === 0 || (mx - mn) / mx > 0.28) v = k;                  /* couleur franche : on garde */
      else {
        const L = (r * .3 + g * .59 + b * .11) / 255, cl = T.col, cL = (cl[0] * .3 + cl[1] * .59 + cl[2] * .11) / 255 || 1;
        const amt = T.grey ? 0.3 : 0.42, m = L / cL;
        const tr = Math.min(255, cl[0] * m), tg = Math.min(255, cl[1] * m), tb = Math.min(255, cl[2] * m);
        v = (Math.round(r + (tr - r) * amt) << 16) | (Math.round(g + (tg - g) * amt) << 8) | Math.round(b + (tb - b) * amt);
      }
      memo.set(k, v);
    }
    D[i] = v >> 16 & 255; D[i + 1] = v >> 8 & 255; D[i + 2] = v & 255;
  }
  /* une frame, réduite à la taille réelle du vaisseau dans le tampon de jeu */
  function frame(s, row, col, targetH) {
    const f = targetH / s.sh;
    const gbKey = s.gen === 0 && TH.livery && TH.livery.gb ? TH.livery.gb.join() : '';
    const T = s.gen >= 1 && row !== ROWS.explode ? liveryTint() : null;
    const key = s.key + '|' + row + '|' + col + '|' + targetH.toFixed(2) + '|' + gbKey + '|' + (T ? T.id : '');
    let c = CACHE.get(key); if (c) return c;
    if (CACHE.size > 600) CACHE.clear();
    const W = Math.max(1, Math.round(s.fw * f)), H = Math.max(1, Math.round(s.fh * f));
    c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    const pixel = s.gen <= 3;
    let id;
    if (s.gen <= 1 && row !== ROWS.explode) id = shrinkPixel(s, row, col, W, H, f, s.gen === 0);
    else {
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(s.im, col * s.fw, row * s.fh, s.fw, s.fh, 0, 0, W, H);
      if (pixel || T) id = g.getImageData(0, 0, W, H);
    }
    if (id) {
      const D = id.data, gb = gbKey ? TH.livery.gb.map(hex) : null, pal = pixel && !gb ? paletteOf(s) : null, memo = new Map();
      for (let i = 0; i < D.length; i += 4) {
        if (pixel) {
          if (D[i + 3] < 110) { D[i + 3] = 0; continue; }
          D[i + 3] = 255;
        } else if (!D[i + 3]) continue;
        if (gb) {
          const L = D[i] * .3 + D[i + 1] * .59 + D[i + 2] * .11;
          let b = 0, bd = 1e9;
          for (let k = 0; k < 4; k++) { const dd = Math.abs(L - PACK_GB[k]); if (dd < bd) { bd = dd; b = k; } }
          b = GB_MAP[b];                    /* fuselage dans les deux tons clairs, comme les autres acteurs LCD */
          D[i] = gb[b][0]; D[i + 1] = gb[b][1]; D[i + 2] = gb[b][2];
          continue;
        }
        if (pal) {
          let b = pal[0], bd = 1e9;
          for (const p of pal) { const dd = (p[0] - D[i]) ** 2 + (p[1] - D[i + 1]) ** 2 + (p[2] - D[i + 2]) ** 2; if (dd < bd) { bd = dd; b = p; } }
          D[i] = b[0]; D[i + 1] = b[1]; D[i + 2] = b[2];
        }
        if (T) tintPixel(D, i, T, memo);
      }
      /* contour sombre d'un pixel : détache la coque du décor (pas sur l'explosion) */
      if (pixel && row !== ROWS.explode) {
        const src = D.slice(), oc = gb ? gb[0] : [7, 16, 27];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4; if (src[i + 3]) continue;
          if ((x > 0 && src[i - 1]) || (x < W - 1 && src[i + 7]) || (y > 0 && src[i - W * 4 + 3]) || (y < H - 1 && src[i + W * 4 + 3])) {
            D[i] = oc[0]; D[i + 1] = oc[1]; D[i + 2] = oc[2]; D[i + 3] = 255;
          }
        }
      }
      g.putImageData(id, 0, 0);
    }
    if (!pixel && row !== ROWS.explode) {
      /* générations lisses : contour doux obtenu en décalant une silhouette sombre */
      const sil = document.createElement('canvas'); sil.width = W; sil.height = H;
      const sg = sil.getContext('2d'); sg.drawImage(c, 0, 0);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#07101b'; sg.fillRect(0, 0, W, H);
      const keep = document.createElement('canvas'); keep.width = W; keep.height = H; keep.getContext('2d').drawImage(c, 0, 0);
      g.clearRect(0, 0, W, H); g.globalAlpha = 0.85;
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) g.drawImage(sil, ox, oy);
      g.globalAlpha = 1; g.drawImage(keep, 0, 0);
    }
    c._f = f; CACHE.set(key, c);
    return c;
  }
  function blit(g, K, s, row, col, x, y, scale, alpha) {
    const box = spriteBox(S.sel.ship);
    const targetH = box.h * (scale || 1) * K;
    const c = frame(s, row, col, targetH), f = c._f;
    const pixel = s.gen <= 3;
    let dx = x * K - s.ax * f, dy = y * K - s.ay * f;
    if (pixel) { dx = Math.round(dx); dy = Math.round(dy); }
    const sm = g.imageSmoothingEnabled, ga = g.globalAlpha;
    g.imageSmoothingEnabled = !pixel;
    if (alpha !== undefined) g.globalAlpha = alpha;
    g.drawImage(c, dx, dy);
    g.imageSmoothingEnabled = sm; g.globalAlpha = ga;
  }
  /* choix de l'animation selon l'état du vaisseau */
  function pose(P) {
    const t = P.anim || 0, b = P.bank || 0;
    if (P.hitT > 0) return [ROWS.hit, P.hitT > 0.2 ? 0 : (Math.floor(P.hitT * 20) % 2)];
    if (b < -0.22) return [ROWS.bank_l, b < -0.6 ? 1 : 0];
    if (b > 0.22) return [ROWS.bank_r, b > 0.6 ? 1 : 0];
    if ((P.vy || 0) < -60) return [ROWS.boost, Math.floor(t * 14) % 2];
    return [ROWS.idle, Math.floor(t * 11) % 4];
  }
  const NVS = window.NVS = {
    cur: null, on: () => !!NVS.cur,
    /* préchargement explicite de la planche de la coque équipée (écran titre,
       annonce de secteur) pour que le vaisseau soit complet dès la 1re frame */
    preload(id, gen) { try { const ship = id || S.sel.ship; const row = SHEETS[ship]; if (!row) return; const d = row[Math.max(0, Math.min(5, gen === undefined ? (G.eraIdx || 0) : gen))]; const key = d[0]; if (!IMG[key]) { const im = new Image(); im.onload = () => { im._ok = true; }; im.onerror = () => { im._bad = true; }; im.src = key; IMG[key] = im; } } catch (e) { } },
    sheetReady() { try { return !!sheetFor(S.sel.ship); } catch (e) { return false; } }
  };

  const prevSprite = drawSpriteTo;
  drawSpriteTo = function (g, K, id, x, y, opt = {}) {
    if (NVS.cur && opt && opt.kind === 'player') {
      const [row, col] = pose(NVS.cur.P);
      blit(g, K, NVS.cur.s, row, col, x, y, opt.scale, opt.alpha);
      return;
    }
    return prevSprite.apply(this, arguments);
  };
  const prevPlayer = drawPlayer;
  drawPlayer = function (pl) {
    const P = pl || G.player;
    const s = P && P.alive && typeof spriteBox === 'function' ? sheetFor(S.sel.ship) : null;
    if (!s) return prevPlayer.apply(this, arguments);
    /* les flammes font partie de la planche : on coupe les réacteurs dessinés à part */
    const id = S.sel.ship, had = Object.prototype.hasOwnProperty.call(EXH, id), ex = EXH[id];
    EXH[id] = [];
    NVS.cur = { P, s };
    try { return prevPlayer.apply(this, arguments); }
    finally { NVS.cur = null; if (had) EXH[id] = ex; else delete EXH[id]; }
  };
  /* explosion du vaisseau : les 8 frames de la planche, à l'endroit de la mort */
  const BOOMS = [];
  const prevDie = playerDie;
  playerDie = function (P) {
    const Q = P || G.player;
    const s = Q ? sheetFor(S.sel.ship) : null;
    if (s) BOOMS.push({ x: Q.x, y: Q.y, t0: G.t || 0, s, scale: IS_TOUCH && G.state === 'play' ? TOUCH_ACTOR_SCALE : 1 });
    return prevDie.apply(this, arguments);
  };
  const prevActors = drawActorsDepthSorted;
  drawActorsDepthSorted = function () {
    const r = prevActors.apply(this, arguments);
    if (BOOMS.length) {
      useBuf(R.bufNear);
      const g = PAINT.g, K = PAINT.K, now = G.t || 0;
      for (let i = BOOMS.length - 1; i >= 0; i--) {
        const b = BOOMS[i], k = Math.floor((now - b.t0) / 0.07);
        if (k >= 8 || k < 0) { BOOMS.splice(i, 1); continue; }
        blit(g, K, b.s, ROWS.explode, k, b.x, b.y, b.scale);
      }
    }
    return r;
  };
})();
