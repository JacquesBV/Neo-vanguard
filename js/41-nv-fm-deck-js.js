
(() => {
  const $ = id => document.getElementById(id);
  const scr = $('scr-music'), au = $('nvMusicAudio'), info = scr && scr.querySelector('.nv-music-info'), wm = $('nvWalkman');
  if (!scr || !au || !info) return;
  const catalog = JSON.parse($('nvMusicCatalog').textContent);
  try {
    Object.assign(LDATA, {
      'Cassette précédente': ['Previous cassette', 'Casete anterior', 'Fita anterior', '前のカセット'],
      'Retour rapide': ['Rewind', 'Rebobinar', 'Rebobinar', '巻き戻し'],
      'Lecture / pause': ['Play / pause', 'Reproducir / pausa', 'Reproduzir / pausa', '再生 / 一時停止'],
      'Stop': ['Stop', 'Parar', 'Parar', '停止'],
      'Avance rapide': ['Fast forward', 'Avance rápido', 'Avanço rápido', '早送り'],
      'Cassette suivante': ['Next cassette', 'Casete siguiente', 'Próxima fita', '次のカセット'],
      'Répétition': ['Repeat', 'Repetir', 'Repetir', 'リピート'],
      'Volume': ['Volume', 'Volumen', 'Volume', '音量'],
      'LECTURE': ['PLAY', 'REPRODUCIENDO', 'TOCANDO', '再生中'],
      'EN PAUSE': ['PAUSED', 'EN PAUSA', 'EM PAUSA', '一時停止中'],
      'INSÈRE UNE CASSETTE': ['INSERT A CASSETTE', 'INSERTA UN CASETE', 'INSIRA UMA FITA', 'カセットを入れてね']
    });
    LIDX = null; LCACHE.clear();
  } catch (e) {}
  const tr = s => (window.nvTr ? nvTr(s) : s);
  const ico = {
    prev: '<path d="M6 5h2v14H6zM20 5v14L9 12z"/>', rw: '<path d="M11 6v12L2 12zM21 6v12l-9-6z"/>',
    play: '<path d="M7 4.5v15L20 12z"/>', pause: '<path d="M6 5h4.5v14H6zM13.5 5H18v14h-4.5z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>', ff: '<path d="M3 6v12l9-6zM13 6v12l9-6z"/>',
    next: '<path d="M16 5h2v14h-2zM4 5v14l11-7z"/>', rep: '<path d="M7 7h9V4l5 4.5-5 4.5V10H8a2 2 0 0 0-2 2v1H3v-1a5 5 0 0 1 4-5zm10 10H8v3l-5-4.5L8 11v3h8a2 2 0 0 0 2-2v-1h3v1a5 5 0 0 1-4 5z"/>',
    vol: '<path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 9h4l5-4v14l-5-4H4z"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ico[k]}</svg>`;
  const deck = document.createElement('div'); deck.className = 'nv-deck';
  deck.innerHTML = `<div class="nv-deck-lcd"><span class="nv-deck-count"><b>0</b><b>0</b><b>0</b></span><span class="nv-deck-marq"><span></span></span><span class="nv-deck-time"><span class="nv-deck-tt">0:00 / 0:00</span> <em class="nv-deck-bpm"></em></span></div>
    <div class="nv-deck-tape" role="slider" aria-valuemin="0" aria-valuemax="100" tabindex="0"><i></i><b></b></div>
    <div class="nv-deck-keys">
      <button type="button" data-k="prev">${svg('prev')}</button><button type="button" data-k="rw">${svg('rw')}</button>
      <button type="button" data-k="play" class="play">${svg('play')}</button><button type="button" data-k="stop">${svg('stop')}</button>
      <button type="button" data-k="ff">${svg('ff')}</button><button type="button" data-k="next">${svg('next')}</button>
      <button type="button" data-k="rep" class="rep">${svg('rep')}<small></small></button>
      <label class="nv-deck-vol">${svg('vol')}<input type="range" min="0" max="100" step="1"></label>
    </div>`;
  info.insertBefore(deck, info.firstChild);
  const Q = s => deck.querySelector(s), keys = k => deck.querySelector(`[data-k="${k}"]`);
  const TIPS = { prev: 'Cassette précédente', rw: 'Retour rapide', play: 'Lecture / pause', stop: 'Stop', ff: 'Avance rapide', next: 'Cassette suivante', rep: 'Répétition' };
  const tips = () => { for (const k in TIPS) { const b = keys(k); b.title = tr(TIPS[k]); b.setAttribute('aria-label', tr(TIPS[k])); } Q('.nv-deck-vol').title = tr('Volume'); };
  /* ---------- état ---------- */
  const curT = () => { const sel = $('nvTapeList').querySelector('.nv-tape-card.selected'); return catalog.find(x => x.id === (sel && sel.dataset.musicId)) || null; };
  const srcOf = t => 'assets/music-shop/mp3/' + t.file;
  const loaded = () => { const t = curT(); return t && au.getAttribute('src') === srcOf(t); };
  let rep = 'off';
  try { rep = localStorage.getItem('nvFmRep') || 'off'; } catch (e) {}
  let vol = (S.opts && S.opts.fmVol !== undefined) ? S.opts.fmVol : Math.round(Math.max(0, Math.min(1, (Number(S.opts && S.opts.music) || 50) / 100)) * 100);
  const applyVol = () => { try { au.volume = Math.max(0, Math.min(1, vol / 100)); } catch (e) {} Q('.nv-deck-vol input').value = vol; };
  Q('.nv-deck-vol input').addEventListener('input', e => { vol = +e.target.value; S.opts.fmVol = vol; applyVol(); });
  Q('.nv-deck-vol input').addEventListener('change', () => { try { saveGame(); } catch (e) {} });
  const _open = window.openMusicShop;
  window.openMusicShop = function () { const r = _open.apply(this, arguments); applyVol(); tips(); paint(); return r; };
  /* ---------- sons de mécanique ---------- */
  const ctx = () => (window.Audio2 && Audio2.ctx) || null;
  function clunk() {
    try { const s = $('nvShopSfx'); s.src = 'assets/music-shop/sfx/tape-click.mp3'; s.currentTime = 0; s.volume = Math.min(1, (Number(S.opts.sfx) || 70) / 100) * 0.8; s.play().catch(() => {}); } catch (e) {}
  }
  let whirr = null;
  function whirrStart(fast) {
    const c = ctx(); if (!c || whirr) return;
    try {
      const len = c.sampleRate * 1, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fast ? 2400 : 1800; bp.Q.value = 2.5;
      const g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.03 * Math.min(1, (Number(S.opts.sfx) || 70) / 100), c.currentTime, 0.05);
      const lfo = c.createOscillator(); lfo.frequency.value = 9; const lg = c.createGain(); lg.gain.value = 600; lfo.connect(lg); lg.connect(bp.frequency);
      n.connect(bp); bp.connect(g); g.connect(c.destination); n.start(); lfo.start();
      whirr = { n, g, lfo, c };
    } catch (e) { whirr = null; }
  }
  function whirrStop() { if (!whirr) return; const w = whirr; whirr = null; try { w.g.gain.setTargetAtTime(0.0001, w.c.currentTime, 0.04); w.n.stop(w.c.currentTime + 0.2); w.lfo.stop(w.c.currentTime + 0.2); } catch (e) {} }
  /* ---------- la bande qui démarre / qui ralentit ---------- */
  let ramp = 0;
  const pitchFree = on => { try { au.preservesPitch = !on; au.mozPreservesPitch = !on; au.webkitPreservesPitch = !on; } catch (e) {} };
  function rateTo(from, to, ms, then) {
    cancelAnimationFrame(ramp); pitchFree(true);
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
      try { au.playbackRate = from + (to - from) * e; } catch (er) {}
      if (k < 1) ramp = requestAnimationFrame(step); else { if (then) then(); }
    };
    ramp = requestAnimationFrame(step);
  }
  function tapeStop(after) {
    if (au.paused) { if (after) after(); return; }
    wm && wm.classList.add('nv-slow');
    rateTo(1, 0.32, 420, () => { au.pause(); try { au.playbackRate = 1; } catch (e) {} pitchFree(false); wm && wm.classList.remove('nv-slow'); if (after) after(); });
  }
  async function tapeStart() {
    try { au.playbackRate = 0.55; } catch (e) {}
    try { await au.play(); } catch (e) { return; }
    rateTo(0.55, 1, 380, () => pitchFree(false));
  }
  /* ---------- commandes ---------- */
  const pv = $('nvPreviewBtn');
  /* le bouton « Écouter » reprend là où la bande s'est arrêtée (au lieu de tout recommencer) */
  pv.addEventListener('click', e => {
    if (!au.paused) { e.stopImmediatePropagation(); tapeStop(); return; }
    if (loaded() && au.currentTime > 0.2 && au.currentTime < (au.duration || 1e9) - 0.3) { e.stopImmediatePropagation(); tapeStart(); }
  }, true);
  function playPause() {
    const t = curT(); if (!t) return;
    clunk();
    if (!au.paused) { tapeStop(); return; }
    if (loaded()) tapeStart(); else pv.click();
  }
  function stop() { clunk(); tapeStop(() => { try { au.currentTime = 0; } catch (e) {} paint(); }); }
  function neighbour(d) {
    const t = curT(), i = t ? catalog.indexOf(t) : -1, n = catalog[(i + d + catalog.length) % catalog.length];
    const card = $('nvTapeList').querySelector(`.nv-tape-card[data-music-id="${n.id}"]`);
    const wasPlaying = !au.paused;
    if (wasPlaying) { au.pause(); }
    if (card) card.click();
    if (wasPlaying) setTimeout(() => pv.click(), 120);
  }
  let hold = 0, holdT0 = 0, holdDir = 0;
  function seekBy(sec) { if (!au.getAttribute('src') || !isFinite(au.duration)) return; au.currentTime = Math.max(0, Math.min(au.duration - 0.25, au.currentTime + sec)); paint(); }
  function holdStart(dir) {
    if (!au.getAttribute('src')) return;
    holdDir = dir; holdT0 = performance.now();
    clearInterval(hold);
    hold = setInterval(() => {
      if (performance.now() - holdT0 < 260) return;
      if (!whirr) { whirrStart(dir > 0); wm && wm.classList.add(dir > 0 ? 'nv-ff' : 'nv-rw'); if (!au.paused) { au.muted = true; } }
      seekBy(dir * 0.9);
    }, 60);
  }
  function holdEnd() {
    if (!holdDir) return;
    clearInterval(hold);
    const short = performance.now() - holdT0 < 260;
    if (short) seekBy(holdDir * 10);
    holdDir = 0; whirrStop(); au.muted = false;
    wm && wm.classList.remove('nv-ff', 'nv-rw');
  }
  for (const [k, dir] of [['rw', -1], ['ff', 1]]) {
    const b = keys(k);
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('down'); clunk(); holdStart(dir); });
    const up = () => { b.classList.remove('down'); holdEnd(); };
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); clunk(); seekBy(dir * 10); } });
  }
  keys('play').addEventListener('click', playPause);
  keys('stop').addEventListener('click', stop);
  keys('prev').addEventListener('click', () => { clunk(); if (au.currentTime > 3 && loaded()) { au.currentTime = 0; paint(); } else neighbour(-1); });
  keys('next').addEventListener('click', () => { clunk(); neighbour(1); });
  keys('rep').addEventListener('click', () => { clunk(); rep = rep === 'off' ? 'one' : rep === 'one' ? 'all' : 'off'; try { localStorage.setItem('nvFmRep', rep); } catch (e) {} paint(); });
  /* fin de bande : répétition d'une piste ou de toute la vitrine */
  au.addEventListener('ended', () => {
    if (G.state !== 'music') return;
    if (rep === 'one') setTimeout(() => { au.currentTime = 0; tapeStart(); }, 250);
    else if (rep === 'all') setTimeout(() => { neighbour(1); setTimeout(() => { if (au.paused) pv.click(); }, 260); }, 350);
  });
  /* glisser sur la bande */
  const bar = Q('.nv-deck-tape');
  const seekAt = x => { const r = bar.getBoundingClientRect(); const k = Math.max(0, Math.min(1, (x - r.left) / r.width)); if (isFinite(au.duration) && au.getAttribute('src')) { au.currentTime = k * au.duration; paint(); } };
  let drag = false;
  bar.addEventListener('pointerdown', e => { drag = true; bar.setPointerCapture(e.pointerId); seekAt(e.clientX); });
  bar.addEventListener('pointermove', e => { if (drag) seekAt(e.clientX); });
  bar.addEventListener('pointerup', () => { drag = false; });
  bar.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); seekBy(5); } else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); seekBy(-5); } });
  /* touches dessinées sur le baladeur (stop · lecture · retour · avance · pause) */
  if (wm) {
    [['stop', 31], ['play', 40.6], ['rw', 50.1], ['ff', 59.7], ['pause', 69.2]].forEach(([k, x]) => {
      const h = document.createElement('button'); h.type = 'button'; h.className = 'nv-wm-hot'; h.style.left = (x - 4.5) + '%';
      h.setAttribute('aria-label', tr(TIPS[k] || 'Lecture / pause'));
      if (k === 'rw' || k === 'ff') {
        const dir = k === 'ff' ? 1 : -1;
        h.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); clunk(); holdStart(dir); });
        const up = () => holdEnd(); h.addEventListener('pointerup', up); h.addEventListener('pointerleave', up); h.addEventListener('pointercancel', up);
        h.addEventListener('click', e => e.stopPropagation());
      } else h.addEventListener('click', e => { e.stopPropagation(); if (k === 'stop') stop(); else if (k === 'pause') { if (!au.paused) { clunk(); tapeStop(); } } else { if (au.paused) playPause(); } });
      wm.appendChild(h);
    });
  }
  /* ---------- affichage ---------- */
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let lastMarq = '', lastCount = '';
  const cnt0 = c => String(Math.floor(c * 1.7) % 1000).padStart(3, '0');
  /* le compteur « 000 » du baladeur tourne aussi */
  let wmCount = null;
  if (wm) { wmCount = document.createElement('span'); wmCount.className = 'nv-wm-count'; wmCount.textContent = '000'; wm.appendChild(wmCount); }
  function paint() {
    const t = curT(), on = !au.paused, isLoaded = loaded();
    deck.classList.toggle('on', on);
    keys('play').innerHTML = svg(on ? 'pause' : 'play');
    const rb = keys('rep'); rb.classList.toggle('on', rep !== 'off'); rb.querySelector('small').textContent = rep === 'one' ? '1' : rep === 'all' ? '∞' : '';
    const d = isLoaded && isFinite(au.duration) ? au.duration : 0, c = isLoaded ? au.currentTime : 0;
    bar.style.setProperty('--p', (d ? c / d * 100 : 0).toFixed(2) + '%'); bar.setAttribute('aria-valuenow', d ? Math.round(c / d * 100) : 0);
    Q('.nv-deck-tt').textContent = fmt(c) + ' / ' + fmt(d);
    if (wmCount) wmCount.textContent = cnt0(c);
    const cnt = cnt0(c);
    if (cnt !== lastCount) { const bs = deck.querySelectorAll('.nv-deck-count b'); [...cnt].forEach((ch, i) => { if (bs[i].textContent !== ch) { bs[i].textContent = ch; bs[i].classList.add('roll'); setTimeout(() => bs[i].classList.remove('roll'), 120); } }); lastCount = cnt; }
    const sub = t ? (t.kind === 'sector' ? tr('Secteurs') + ' ' + t.levels : t.kind === 'boss' ? tr(t.levels) : tr('Thème spécial')) : '';
    const m = t ? `${on ? '▶ ' + tr('LECTURE') : isLoaded && c > 0 ? 'Ⅱ ' + tr('EN PAUSE') : '■'} · ${tr(t.title)} · ${sub} · NEO-VANGUARD FM` : tr('INSÈRE UNE CASSETTE');
    if (m !== lastMarq) { const mq = Q('.nv-deck-marq'); mq.firstElementChild.textContent = m; mq.classList.toggle('still', !t); lastMarq = m; }
    /* bobines : la bande passe de la gauche vers la droite */
    const k = d ? c / d : 0, tapes = document.querySelectorAll('#nvInsertedTape circle[fill="url(#bt-tape)"]');
    if (tapes.length === 2) { tapes[0].setAttribute('r', (13 + (1 - k) * 10).toFixed(1)); tapes[1].setAttribute('r', (13 + k * 10).toFixed(1)); }
  }
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'seeked', 'emptied'].forEach(ev => au.addEventListener(ev, paint));
  new MutationObserver(paint).observe($('nvTapeList'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  /* ---------- rythme : couleurs, chapeaux, tempo, notes ---------- */
  const eqBars = () => [...scr.querySelectorAll('.nv-eq i')];
  let raf = 0, hue = 300, beat = 0, avg = 0, lastBeat = 0, beats = [], caps = [], data = null, bpm = 0;
  const notesHost = scr.querySelector('.nv-walkman-wrap') || wm;
  function note(h) {
    if (!notesHost || notesHost.querySelectorAll('.nv-note').length > 10) return;
    const n = document.createElement('span'); n.className = 'nv-note'; n.textContent = ['♪', '♫', '♬', '♩'][Math.random() * 4 | 0];
    n.style.cssText = `left:${15 + Math.random() * 70}%;top:${30 + Math.random() * 30}%;--h:${h | 0};--dx:${(Math.random() * 80 - 40) | 0}px;--r:${(Math.random() * 60 - 30) | 0}deg;font-size:${16 + Math.random() * 14 | 0}px`;
    notesHost.appendChild(n); setTimeout(() => n.remove(), 1900);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const bars = eqBars(), an = window.nvFmAn;
    let bass = 0;
    if (an && !au.paused) {
      if (!data || data.length !== an.frequencyBinCount) data = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(data);
      for (let i = 1; i < 7; i++) bass += data[i]; bass /= 6;
      avg = avg ? avg * 0.94 + bass * 0.06 : bass;
      if (bass > avg * 1.22 && bass > 110 && now - lastBeat > 230) {
        if (lastBeat) { beats.push(now - lastBeat); if (beats.length > 12) beats.shift(); }
        lastBeat = now; beat = 1; hue += 38;
        if (Math.random() < 0.55) note(hue);
        const ok = beats.filter(x => x > 260 && x < 1500).sort((a, b) => a - b);
        if (ok.length >= 4) { let b = 60000 / ok[ok.length >> 1]; while (b < 75) b *= 2; while (b > 180) b /= 2; bpm = bpm ? bpm * 0.7 + b * 0.3 : b; }
      }
    }
    hue = (hue + 0.25) % 360; beat *= 0.9;
    scr.style.setProperty('--nv-beat', beat.toFixed(3)); scr.style.setProperty('--nv-hue', hue.toFixed(0));
    const N = bars.length;
    bars.forEach((b, i) => {
      const hgt = parseFloat(b.style.height) || 4, v = Math.min(1, (hgt - 4) / 38);
      const h = (hue + i * (300 / N)) % 360, l = 48 + v * 22 + beat * 12;
      b.style.background = au.paused ? '' : `linear-gradient(to top, hsl(${h},95%,${l - 14}%), hsl(${(h + 45) % 360},100%,${Math.min(88, l + 8)}%))`;
      b.style.boxShadow = au.paused ? '' : `0 0 ${4 + v * 10 + beat * 8}px hsla(${h},100%,60%,${0.35 + v * 0.4})`;
      caps[i] = Math.max((caps[i] || 0) - 0.55, hgt);
      b.style.setProperty('--cap', (caps[i] - hgt + 2).toFixed(1) + 'px');
      b.style.setProperty('--capo', au.paused ? 0 : 0.9);
      b.style.setProperty('--capc', `hsl(${(h + 180) % 360},100%,80%)`);
    });
    Q('.nv-deck-bpm').textContent = bpm && !au.paused ? '♩' + Math.round(bpm) : '';
    if (au.paused && beat < 0.01 && !holdDir) { cancelAnimationFrame(raf); raf = 0; bars.forEach(b => { b.style.background = ''; b.style.boxShadow = ''; b.style.setProperty('--capo', 0); }); scr.style.setProperty('--nv-beat', 0); }
  }
  au.addEventListener('play', () => { if (!raf) raf = requestAnimationFrame(frame); });
  au.addEventListener('loadstart', () => { beats = []; bpm = 0; lastBeat = 0; avg = 0; });
  /* raccourcis clavier en plus : S stop, R répétition, [ ] retour / avance, - + volume */
  window.addEventListener('keydown', e => {
    if (G.state !== 'music' || !$('nvCassetteZoom').hidden || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    const k = e.key;
    if (k === 's' || k === 'S') { e.preventDefault(); stop(); }
    else if (k === 'r' || k === 'R') { e.preventDefault(); keys('rep').click(); }
    else if (k === '[') { e.preventDefault(); clunk(); seekBy(-10); }
    else if (k === ']') { e.preventDefault(); clunk(); seekBy(10); }
    else if (k === '-' || k === '+' || k === '=') { e.preventDefault(); vol = Math.max(0, Math.min(100, vol + (k === '-' ? -5 : 5))); S.opts.fmVol = vol; applyVol(); }
  }, true);
  /* en quittant la boutique : plus de bruit de bande */
  const _close = window.closeMusicShop;
  window.closeMusicShop = function () { cancelAnimationFrame(ramp); holdEnd(); whirrStop(); try { au.playbackRate = 1; } catch (e) {} pitchFree(false); return _close.apply(this, arguments); };
  applyVol(); tips(); paint();
})();
