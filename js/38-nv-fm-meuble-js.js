
(() => {
  const list = document.getElementById('nvTapeList'); if (!list) return;
  const catalog = JSON.parse(document.getElementById('nvMusicCatalog').textContent);
  /* géométrie relevée sur meuble-face.webp (1672×941) : x0/x1 = montants du bac,
     Ff/Fb = fond du bac côté façade / côté paroi du fond, VX = point de fuite */
  const W = 1672, H = 941, VX = 836, K = 0.13, T0 = 0.06, T1 = 0.72, FILL = 0.94, AR = 378 / 620, PER_BIN = 6;
  const ROW = [{ Ff: 382, Fb: 236, ty: 436 }, { Ff: 752, Fb: 585, ty: 826 }];
  const BINS = [
    { row: 0, x0: 222, x1: 610 }, { row: 0, x0: 642, x1: 1030 }, { row: 0, x0: 1052, x1: 1450 },
    { row: 1, x0: 198, x1: 603 }, { row: 1, x0: 640, x1: 1032 }, { row: 1, x0: 1058, x1: 1474 }
  ];
  const FAM = { sector: '#3fe6f2', boss: '#ff5ea8', special: '#ffd36c' };
  const sectors = catalog.filter(t => t.kind === 'sector'), bosses = catalog.filter(t => t.kind === 'boss'), specials = catalog.filter(t => t.kind !== 'sector' && t.kind !== 'boss');
  const CONTENT = [
    { label: 'SECTEURS', kind: 'sector', items: sectors.slice(0, 6) },
    { label: 'BOSS', range: '1–6', kind: 'boss', items: bosses.slice(0, 6) },
    { label: 'BOSS', range: '7–12', kind: 'boss', items: bosses.slice(6, 12) },
    { label: 'BOSS', range: '13–18', kind: 'boss', items: bosses.slice(12, 18) },
    { label: 'BOSS', range: '19–24', kind: 'boss', items: bosses.slice(18, 24) },
    { label: 'SPÉCIALE', kind: 'special', items: specials.slice(0, 6) }
  ];
  const pc = (v, d) => (v / d * 100).toFixed(3) + '%';
  function spot(b, i, fill) {
    const r = ROW[b.row], t = T0 + (T1 - T0) * i / (PER_BIN - 1), ix0 = b.x0 + 12, ix1 = b.x1 - 12, cxf = (ix0 + ix1) / 2, s = 1 - K * t;
    const w = (ix1 - ix0) * (fill || FILL) * s, h = w * AR, cx = cxf + (VX - cxf) * K * t, bottom = r.Ff + (r.Fb - r.Ff) * t;
    return { x: pc(cx - w / 2, W), y: pc(bottom - h, H), w: pc(w, W), h: pc(h, H), z: (b.row ? 30 : 10) + (PER_BIN - i), _x: cx, _b: bottom, _w: w };
  }
  const PLACE = {};
  BINS.forEach((b, k) => CONTENT[k].items.forEach((t, i) => { PLACE[t.id] = spot(b, i); }));
  const A = 'assets/music-shop/meuble/';
  const layer = (cls, f) => `<img class="${cls}" src="${A}${f}" alt="" draggable="false" decoding="async">`;
  const own = () => Array.isArray(S.musicTracks) ? S.musicTracks : [];
  const tr = window.nvTr;
  function shelve() {
    const cards = [...list.children].filter(c => c.classList && c.classList.contains('nv-tape-card'));
    if (!cards.length) return;
    if (cards.length < catalog.length) { const all = document.querySelector('#nvMusicFilters [data-music-filter="all"]'); if (all && !all.classList.contains('on')) { all.click(); return; } }
    const m = document.createElement('div'); m.className = 'nv-meuble';
    m.innerHTML = layer('nv-mb-back', 'meuble-face.webp') + layer('nv-mb-front0', 'facades-haut.webp') + layer('nv-mb-front1', 'facades-bas.webp');
    const o = own();
    BINS.forEach((b, k) => {
      const c = CONTENT[k], left = c.items.filter(t => !o.includes(t.id)).length;
      m.insertAdjacentHTML('beforeend', `<span class="nv-bin-tag" style="--x:${pc((b.x0 + b.x1) / 2, W)};--y:${pc(ROW[b.row].ty, H)};--famc:${FAM[c.kind]}">${tr(c.label)}${c.range ? ' ' + c.range : ''}<i>${left ? left + ' ' + tr('EN STOCK') : tr('ÉPUISÉ')}</i></span>`);
      if (!left) {                                   /* bac vidé : le chevalet VENDU prend la place */
        const p = spot(b, 0, 0.5), vh = p._w * 358 / 560;
        m.insertAdjacentHTML('beforeend', `<span class="nv-mb-vendu" style="--x:${pc(p._x - p._w / 2, W)};--y:${pc(p._b - vh, H)};--w:${pc(p._w, W)};--z:${b.row ? 36 : 16};--n:${[...tr('VENDU')].length}"><img src="${A}chevalet-vendu.webp" alt="" draggable="false"><b>${tr('VENDU')}</b></span>`);
      }
    });
    cards.forEach(c => {
      const p = PLACE[c.dataset.musicId], t = catalog.find(x => x.id === c.dataset.musicId);
      if (!p) { c.remove(); return; }
      c.classList.add('nv-slot');
      for (const k of ['x', 'y', 'w', 'h', 'z']) c.style.setProperty('--' + k, p[k]);
      if (t) c.title = `${tr(t.title)} · ${t.price} CR`;
      const h2 = document.querySelector('#scr-music .nv-rack-head h2'); if (h2) h2.style.setProperty('--nv-bacs', JSON.stringify(tr('LES BACS')));
      m.appendChild(c);
    });
    list.appendChild(m);
    list.classList.add('nv-meubles');
  }
  const fit = () => list.style.setProperty('--nv-lh', Math.max(0, list.clientHeight - 12) + 'px');
  if (window.ResizeObserver) new ResizeObserver(fit).observe(list); fit();
  new MutationObserver(shelve).observe(list, { childList: true });
  shelve();
})();
