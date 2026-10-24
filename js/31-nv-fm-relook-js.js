
(() => {
  const $ = id => document.getElementById(id);
  const scr = $('scr-music'); if (!scr) return;
  const catalog = JSON.parse($('nvMusicCatalog').textContent);
  const shell = scr.querySelector('.nv-music-shell'), stage = scr.querySelector('.nv-music-stage'), rack = scr.querySelector('.nv-rack');
  const FAM = { sector: '#3fe6f2', boss: '#ff5ea8', special: '#ffd36c' };
  const TONES = {
    sector: ['#3fe6f2', '#56a8ff', '#9c86ff', '#41dfa8', '#ffd166', '#f27cbd'],
    boss: ['#ff5ea8', '#ff7a5c', '#e06cf0', '#b062e0', '#ff4f7e', '#a86bff'],
    special: ['#ffd36c']
  };
  const short = t => t.kind === 'sector' ? String(t.title).split('·')[0].trim() : t.kind === 'boss' ? t.title : 'GAME OVER';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* ---------- structure : comptoir (côté) + magasin (rayons, bacs) ---------- */
  const side = document.createElement('div'); side.className = 'nv-fm-side';
  const main = document.createElement('div'); main.className = 'nv-fm-main';
  stage.before(side); side.appendChild(stage);
  side.after(main); main.appendChild(rack);
  const info = stage.querySelector('.nv-music-info');
  if (info) info.insertAdjacentHTML('beforeend', '<div class="nv-fm-keys"><span><kbd>←</kbd><kbd>→</kbd>parcourir</span><span><kbd>␣</kbd>écouter</span><span><kbd>Z</kbd>en grand</span><span><kbd>Échap</kbd>sortir</span></div>');
  /* ---------- le mur de rayons ---------- */
  const wall = document.createElement('section'); wall.className = 'nv-wall';
  const spine = (t, i) => `<button type="button" class="nv-spine nv-spine-art" data-music-id="${t.id}" style="--c:${(TONES[t.kind] || TONES.special)[i % (TONES[t.kind] || TONES.special).length]};--art:url('assets/music-shop/covers/${t.id}.webp')" title="${esc(t.title)} · ${t.price} CR"><b>NV</b><span>${esc(short(t))}</span></button>`;
  const deco = (n, kind) => Array.from({ length: n }, (_, i) => `<i class="nv-spine deco" style="--c:${TONES[kind][i % TONES[kind].length]}"></i>`).join('');
  const shelf = (label, kind, items, pad) => `<div class="nv-shelf" style="--famc:${FAM[kind]}"><span class="nv-shelf-tag" style="background:${FAM[kind]}">${label}</span><div class="nv-shelf-row">${items.map(spine).join('')}${pad ? deco(pad, kind) : ''}</div></div>`;
  const sec = catalog.filter(t => t.kind === 'sector'), boss = catalog.filter(t => t.kind === 'boss'), sp = catalog.filter(t => t.kind !== 'sector' && t.kind !== 'boss');
  wall.innerHTML = `<div class="nv-wall-head"><h2>LE MUR DES BANDES</h2><div class="nv-wall-legend"><span><i style="background:${FAM.sector}"></i>SECTEURS</span><span><i style="background:${FAM.boss}"></i>BOSS</span><span><i style="background:${FAM.special}"></i>SPÉCIALE</span></div></div>` +
    `<div class="nv-wall-grid">` +
      shelf('SECTEURS', 'sector', sec, 0) + shelf('SPÉCIALE', 'special', sp, 0) +
    `</div>` + shelf('BOSS', 'boss', boss, 0);
  main.insertBefore(wall, rack);
  /* ---------- sélection depuis le mur : on passe par les bacs (logique d'origine) ---------- */
  function pick(id) {
    const t = catalog.find(x => x.id === id); if (!t) return;
    let card = $('nvTapeList').querySelector(`[data-music-id="${id}"]`);
    if (!card) { const f = $('nvMusicFilters').querySelector(`[data-music-filter="${t.kind}"]`) || $('nvMusicFilters').querySelector('[data-music-filter="all"]'); if (f) f.click(); card = $('nvTapeList').querySelector(`[data-music-id="${id}"]`); }
    if (card) { card.click(); card.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
  }
  wall.addEventListener('click', e => { const b = e.target.closest('.nv-spine[data-music-id]'); if (b) pick(b.dataset.musicId); });
  /* ---------- synchronisation à chaque rendu des bacs ---------- */
  function box3d(card, t) {
    const jc = card.querySelector('.nv-jewel-case'); if (!jc || jc.closest('.nv-box3d') || jc.classList.contains('nv-case-img')) return;
    const wrap = document.createElement('div'); wrap.className = 'nv-box3d';
    wrap.innerHTML = '<div class="nv-box"><div class="f-back"></div><div class="f-right"></div><div class="f-bottom"></div><div class="f-top"></div><div class="f-left"><span></span></div><div class="f-front"></div></div>';
    wrap.querySelector('.f-left span').textContent = short(t);
    const tl = TONES[t.kind] || TONES.special, k = catalog.filter(x => x.kind === t.kind).indexOf(t);
    wrap.style.setProperty('--spc', tl[Math.max(0, k) % tl.length]);
    jc.replaceWith(wrap); wrap.querySelector('.f-front').appendChild(jc);
  }
  function sync() {
    const list = $('nvTapeList'), own = Array.isArray(S.musicTracks) ? S.musicTracks : [];
    list.querySelectorAll('.nv-tape-card').forEach(c => { const t = catalog.find(x => x.id === c.dataset.musicId); if (t) box3d(c, t); });
    list.querySelectorAll('.nv-tape-card').forEach(c => { const t = catalog.find(x => x.id === c.dataset.musicId); if (t && c.dataset.fam !== t.kind) c.dataset.fam = t.kind; });
    const sel = list.querySelector('.nv-tape-card.selected'), id = sel ? sel.dataset.musicId : null;
    wall.querySelectorAll('.nv-spine[data-music-id]').forEach(b => { b.classList.toggle('selected', b.dataset.musicId === id); b.classList.toggle('owned', own.includes(b.dataset.musicId)); });
    const sb = id && wall.querySelector(`.nv-spine[data-music-id="${id}"]`);
    if (sb) { const row = sb.parentElement, r = sb.getBoundingClientRect(), rr = row.getBoundingClientRect(); if (r.left < rr.left || r.right > rr.right) row.scrollLeft += (r.left + r.width / 2) - (rr.left + rr.width / 2); }
  }
  new MutationObserver(() => requestAnimationFrame(sync)).observe($('nvTapeList'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  /* ---------- clavier PC : ← → parcourir, espace écouter, Z vue agrandie ---------- */
  window.addEventListener('keydown', e => {
    if (G.state !== 'music' || !$('nvCassetteZoom').hidden) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const order = catalog.map(t => t.id), sel = $('nvTapeList').querySelector('.nv-tape-card.selected');
    const i = sel ? order.indexOf(sel.dataset.musicId) : -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); e.stopImmediatePropagation();
      const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length; pick(order[n]);
    } else if (e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); $('nvPreviewBtn').click(); }
    else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); e.stopImmediatePropagation(); $('nvZoomBtn').click(); }
  }, true);

  /* ---------- cassette insérée, vue de face, aux cotes du logement ---------- */
  const FAMC = { sector: '#3fe6f2', boss: '#ff5ea8', special: '#ffd36c' };
  function bayTape(t) {
    const LC = { sector: ['#39ddeb', '#5595ff', '#9c75ff', '#41dfa8', '#ffd166', '#f27cbd'], boss: ['#ff5b9d', '#ff7657', '#db61ee', '#a850d3', '#ff4778', '#a456ff'], special: ['#ffd36c', '#ffb84a', '#ffe05b', '#ffc05c', '#ffe58b', '#ffd36c'] };
    const c = (LC[t.kind] || LC.special)[(t.era | 0) % 6], fc = t.kind === 'boss' ? '#ff62b4' : t.kind === 'special' ? '#ffd36c' : '#4cf4ff';
    const ttl = esc(t.title), fam = t.kind === 'boss' ? 'BOSS SERIES' : t.kind === 'sector' ? 'SECTOR SERIES' : 'SPECIAL EDITION';
    /* viewBox 342×200 = logement ; axes des bobines en (88,93) et (232,93) */
    const reel = x => `<g class="nv-reel"><circle cx="${x}" cy="93" r="17" fill="#e9e4d8"/><circle cx="${x}" cy="93" r="7.5" fill="#1a1d26"/>` +
      [0, 60, 120, 180, 240, 300].map(a => `<rect x="${x - 1.6}" y="${93 - 14}" width="3.2" height="5" rx="1" fill="#1a1d26" transform="rotate(${a} ${x} 93)"/>`).join('') + `</g>`;
    return `<svg viewBox="0 0 342 200" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="bt-body" x2="0" y2="1"><stop stop-color="#3a4256"/><stop offset=".12" stop-color="#232a3b"/><stop offset="1" stop-color="#121722"/></linearGradient>
      <linearGradient id="bt-lab" x2="1" y2="1"><stop stop-color="${c}"/><stop offset=".52" stop-color="#27314f"/><stop offset="1" stop-color="#10172d"/></linearGradient><linearGradient id="bt-glint" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="bt-tape" cx=".5" cy=".5" r=".5"><stop stop-color="#6b4630"/><stop offset="1" stop-color="#2a1a12"/></radialGradient></defs>
      <rect x="3" y="3" width="336" height="194" rx="11" fill="url(#bt-body)" stroke="#8d98ad" stroke-width="2.5"/>
      <g transform="translate(20 12) scale(${302 / 234} ${54 / 47}) translate(-32 -28)">
        <rect x="32" y="28" width="234" height="47" rx="3" fill="url(#bt-lab)" stroke="${fc}" stroke-width="1.5"/>
        <path d="M36 31h226v3H36z" fill="url(#bt-glint)"/><path d="M37 31v41" stroke="${fc}" stroke-width="4"/>
        <text x="43" y="40" fill="#fff" font-size="8.5" font-family="system-ui,sans-serif" font-weight="1000" letter-spacing="1.05">NEO-VANGUARD</text>
        <text x="43" y="48" fill="#d2e9ff" font-size="4.4" font-family="system-ui,sans-serif" font-weight="800" letter-spacing="1.2">FM · ORIGINAL GAME MUSIC</text>
        <text x="42" y="62" fill="#fff" font-size="12.5" font-family="system-ui,sans-serif" font-weight="1000" letter-spacing=".15">${ttl}</text>
        <text x="43" y="70" fill="${fc}" font-size="5.1" font-family="system-ui,sans-serif" font-weight="900" letter-spacing=".85">${fam} · ${esc(String(t.id).toUpperCase())}</text>
        <g transform="translate(242 43)" fill="${fc}" opacity=".96"><path d="M0 9h5V4h4v5h6v4H9v5H5v-5H0zM16 0h4v4h-4zM19 18h5v5h-5z"/><path d="M5 27h17M8 30h12" stroke="#fff" stroke-width="1.3" stroke-opacity=".8"/></g>
      </g>
      <rect x="52" y="70" width="238" height="46" rx="23" fill="#0b0e15" stroke="#5c6680" stroke-width="2"/>
      <circle cx="88" cy="93" r="${t.kind === 'boss' ? 21 : 18}" fill="url(#bt-tape)"/><circle cx="232" cy="93" r="${t.kind === 'boss' ? 15 : 18}" fill="url(#bt-tape)"/>
      <rect x="132" y="80" width="78" height="26" rx="3" fill="rgba(160,190,220,.12)" stroke="rgba(200,220,255,.25)"/>
      ${reel(88)}${reel(232)}
      <path d="M78 196 L96 150 H246 L264 196 Z" fill="#1a2030" stroke="#59647c" stroke-width="2"/>
      <circle cx="122" cy="176" r="6" fill="#0b0e15"/><circle cx="220" cy="176" r="6" fill="#0b0e15"/>
      <rect x="160" y="168" width="22" height="12" rx="2" fill="#0b0e15"/>
      ${[[16, 16], [326, 16], [16, 184], [326, 184], [171, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#9aa4b8" stroke="#2a3040"/>`).join('')}
    </svg>`;
  }
  const ins = $('nvInsertedTape');
  /* ---------- couvercle : s'ouvre au choix d'une cassette, se referme à la lecture ---------- */
  const wm = $('nvWalkman');
  if (wm && !wm.querySelector('.nv-fm-lid-open')) {
    wm.insertAdjacentHTML('beforeend', '<div class="nv-fm-glass" aria-hidden="true"><i style="left:30%;top:58%;width:16%;height:22%"></i><i style="left:72%;top:14%;width:10%;height:16%"></i></div><img class="nv-fm-lid-closed" src="assets/music-shop/walkman-lid-closed.webp" alt="" aria-hidden="true"><img class="nv-fm-lid-open" src="assets/music-shop/walkman-lid-open.webp" alt="" aria-hidden="true">');
  }
  let lidT = 0;
  function lid(to) {
    if (!wm) return;
    const cur = wm.dataset.lid || 'open';
    if (to === 'open' && (cur === 'open' || cur === 'opening')) return;
    if (to === 'closed' && (cur === 'closed' || cur === 'closing')) return;
    clearTimeout(lidT);
    wm.dataset.lid = to === 'open' ? 'opening' : 'closing';
    if (to === 'closed') { try { const sx = $('nvShopSfx'); sx.src = 'assets/music-shop/sfx/tape-click.mp3'; sx.currentTime = 0; setTimeout(() => sx.play().catch(() => {}), 420); } catch (e) {} }
    lidT = setTimeout(() => { wm.dataset.lid = to; }, to === 'open' ? 520 : 640);
  }
  if (wm) wm.dataset.lid = 'open';
  const au = $('nvMusicAudio');
  if (au) au.addEventListener('play', () => {
    if (G.state !== 'music') return;
    const had = ins && ins.firstElementChild && ins.dataset.nvId === (curTrack() || {}).id;
    if (!had) { lid('open'); insertForListening(true); }
    setTimeout(() => { if (playing()) lid('closed'); }, had ? 80 : 780);
  });
  /* fin d'écoute d'une cassette non achetée : le couvercle se rouvre, la cassette ressort */
  if (au) au.addEventListener('pause', () => {
    if (G.state !== 'music') return;
    const t = curTrack(), own = Array.isArray(S.musicTracks) ? S.musicTracks : [];
    if (t && !own.includes(t.id)) lid('open');
  });
  let lastSel = null;
  new MutationObserver(() => {
    const sel = $('nvTapeList').querySelector('.nv-tape-card.selected'), id = sel ? sel.dataset.musicId : null;
    if (id !== lastSel) { lastSel = id; if (au && au.paused) lid('open'); }
  }).observe($('nvTapeList'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  const _open = window.openMusicShop;
  window.openMusicShop = function () { const r = _open.apply(this, arguments); clearTimeout(lidT); if (wm) wm.dataset.lid = 'open'; return r; };
  function fitTape() {
    if (!ins || ins.dataset.nvBay === '1') return;
    const sel = $('nvTapeList').querySelector('.nv-tape-card.selected');
    const t = catalog.find(x => x.id === (sel && sel.dataset.musicId)) || catalog.find(x => x.title === $('nvTrackTitle').textContent);
    if (!t || !ins.firstElementChild) return;
    const changed = ins.dataset.nvId !== t.id;
    ins.innerHTML = bayTape(t); ins.dataset.nvBay = '1'; ins.dataset.nvId = t.id;
    if (changed) { ins.classList.remove('nv-fm-new'); void ins.offsetWidth; ins.classList.add('nv-fm-new'); setTimeout(() => ins.classList.remove('nv-fm-new'), 700); }
  }
  const curTrack = () => { const sel = $('nvTapeList').querySelector('.nv-tape-card.selected'); return catalog.find(x => x.id === (sel && sel.dataset.musicId)) || catalog.find(x => x.title === $('nvTrackTitle').textContent); };
  const playing = () => au && !au.paused && G.state === 'music';
  function insertForListening(animate) {
    const t = curTrack(); if (!t || !ins) return;
    const isNew = ins.dataset.nvId !== t.id;
    ins.innerHTML = bayTape(t); ins.dataset.nvBay = '1'; ins.dataset.nvId = t.id;
    if (animate && isNew) { ins.classList.remove('nv-fm-new'); void ins.offsetWidth; ins.classList.add('nv-fm-new'); setTimeout(() => ins.classList.remove('nv-fm-new'), 700); }
  }
  /* pendant l'écoute, la cassette reste dans le baladeur, achetée ou non */
  if (ins) new MutationObserver(() => {
    if (ins.querySelector('.nv-cassette')) { ins.dataset.nvBay = ''; fitTape(); }
    else if (!ins.firstElementChild) { if (playing()) insertForListening(false); else ins.dataset.nvId = ''; }
  }).observe(ins, { childList: true });

  /* ---------- égaliseur : suit la musique réelle (analyse du son) ---------- */
  (() => {
    const bars = [...scr.querySelectorAll('.nv-eq i')]; if (!bars.length || !au) return;
    let ctx = null, an = null, data = null, raf = 0;
    const base = bars.map(b => parseFloat(b.style.height) || 12);
    function setup() {
      if (an) return true;
      try {
        ctx = (window.Audio2 && Audio2.ctx) || new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaElementSource(au);
        an = ctx.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = 0.72;
        src.connect(an); an.connect(ctx.destination);
        data = new Uint8Array(an.frequencyBinCount);
        window.nvFmAn = an;                 /* partagé avec la platine (couleurs, rythme) */
        return true;
      } catch (e) { an = null; return false; }
    }
    const N = bars.length;
    /* bandes réparties de façon logarithmique : les basses à gauche, les aigus à droite */
    const edges = Array.from({ length: N + 1 }, (_, i) => Math.round(2 + Math.pow(i / N, 1.7) * 104));
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!an) return;
      an.getByteFrequencyData(data);
      for (let i = 0; i < N; i++) {
        let m = 0; for (let k = edges[i]; k < Math.max(edges[i] + 1, edges[i + 1]); k++) m = Math.max(m, data[k] || 0);
        const v = Math.pow(Math.max(0, (m - 60) / 195), 1.25);
        bars[i].style.height = (4 + v * 38).toFixed(1) + 'px';
      }
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; bars.forEach((b, i) => { b.style.height = base[i] + 'px'; }); }
    au.addEventListener('play', () => { if (setup()) { try { ctx.resume && ctx.resume(); } catch (e) {} if (!raf) frame(); } });
    au.addEventListener('pause', stop); au.addEventListener('ended', stop);
  })();
  /* ---------- vue agrandie : la jaquette à plat, à côté du boîtier ---------- */
  const zArt = $('nvZoomArt');
  if (zArt) new MutationObserver(() => {
    const cas = zArt.querySelector('.nv-cassette');
    if (cas) { const t0 = curTrack(); if (t0) zArt.innerHTML = `<div class="nv-zoom-openw"><img class="nv-zoom-open" src="assets/music-shop/open/${t0.id}.webp" alt="">${window.nvCaseLabel ? nvCaseLabel(t0, true) : ''}</div>`; return; }
    const ci = zArt.querySelector('.nv-case-img'); if (!ci || zArt.querySelector('.nv-zoom-cover')) return;
    const t = curTrack(); if (!t) return;
    zArt.insertAdjacentHTML('afterbegin', `<img class="nv-zoom-cover" src="assets/music-shop/covers/${t.id}.webp" alt="Jaquette : ${esc(t.title)}">`);
  }).observe(zArt, { childList: true });
  requestAnimationFrame(() => { sync(); if (ins) { ins.dataset.nvBay = ''; fitTape(); } });
})();
