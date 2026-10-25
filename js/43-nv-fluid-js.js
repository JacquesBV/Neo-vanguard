
(() => {
  if (typeof startLevel !== 'function' || typeof PERF === 'undefined') return;
  const $ = id => document.getElementById(id);
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const T5 = (fr, en, es, pt, ja) => ({ fr, en, es, pt, ja })[LG()] || fr;
  const o = S.opts;
  /* ---------- réglages : du plus beau au plus léger ---------- */
  const P = [
    { id: 'qualite', tier: 0, qual: 1, gpu: 2, n: () => T5('Qualité', 'Quality', 'Calidad', 'Qualidade', '画質優先') },
    { id: 'equilibre', tier: 1, qual: .86, gpu: 1, n: () => T5('Équilibré', 'Balanced', 'Equilibrado', 'Equilibrado', 'バランス') },
    { id: 'fluide', tier: 2, qual: .72, gpu: 1, n: () => T5('Fluide', 'Smooth', 'Fluido', 'Fluido', 'なめらか') },
    { id: 'perf', tier: 3, qual: .55, gpu: 0, n: () => T5('Performance', 'Performance', 'Rendimiento', 'Desempenho', '軽量') },
    { id: 'mini', tier: 4, qual: .45, gpu: 0, n: () => T5('Minimal', 'Minimal', 'Mínimo', 'Mínimo', '最軽量') }
  ];
  const CLS = { 2: () => T5('Puissant', 'Powerful', 'Potente', 'Potente', '高性能'), 1: () => T5('Correct', 'Capable', 'Correcto', 'Correto', '標準'), 0: () => T5('Modeste', 'Modest', 'Modesto', 'Modesto', '控えめ') };
  /* priorité choisie par le joueur : seuil de charge accepté */
  const PRIO = { smooth: .42, balanced: .58, beauty: .78 };
  const prio = () => PRIO[o.nvPrio] ? o.nvPrio : 'balanced';
  /* migration : l'ancien profil de qualité devient une priorité ; l'ancien système par secteur s'efface */
  if (o.nvPrio === undefined) {
    o.nvPrio = o.graphics === 'economy' ? 'smooth' : o.graphics === 'ultra' ? 'beauty' : 'balanced';
    o.graphics = 'auto';
  }
  o.secProfiles = 0;
  /* ---------- empreinte de l'appareil ---------- */
  function fingerprint() {
    let gpu = '';
    try { const c = document.createElement('canvas'), gl = c.getContext('webgl'); const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (gl ? gl.getParameter(gl.RENDERER) : ''); } catch (e) {}
    const s = [IS_TOUCH ? 'm' : 'd', navigator.hardwareConcurrency || 0, navigator.deviceMemory || 0, Math.round((window.devicePixelRatio || 1) * 100), Math.max(screen.width, screen.height), Math.min(screen.width, screen.height), gpu, (navigator.userAgent.match(/(Chrome|Firefox|Safari|Edg)\/\d+/) || [''])[0]].join('|');
    let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  const FP = fingerprint();
  function cal() {
    if (!o.nvCal || o.nvCal.fp !== FP || o.nvCal.v !== 1) o.nvCal = { fp: FP, v: 1, cls: null, lv: {}, hz: 0 };
    return o.nvCal;
  }
  /* ---------- application d'un réglage ---------- */
  let active = null;
  const manualRes = () => IS_TOUCH ? (o.mobRes || 'auto') !== 'auto' : (o.resolution || 'auto') !== 'auto';
  function apply(i) {
    const p = P[Math.max(0, Math.min(P.length - 1, i))]; active = p;
    if (!manualRes()) { PERF.tier = Math.min(DPR_TIERS.length - 1, p.tier); PERF.cool = 300; PERF.bad = 0; PERF.n = 0; }
    R.qual = p.qual;
    if (typeof GPU !== 'undefined' && GPU.ready && (o.gpu || 'auto') === 'auto') { GPU.q = p.gpu; try { gpuTier(); } catch (e) {} }
    try { sideRes = resizeView().sideRes; if (typeof syncTitleZone === 'function') syncTitleZone(); } catch (e) {}
  }
  /* la qualité automatique peut encore baisser en cas de coup dur, jamais dépasser le réglage retenu */
  const CAL = { on: false };
  { const _aq = autoQuality; autoQuality = function () { if (CAL.on) return; const r = _aq.apply(this, arguments); if (active && R.qual > active.qual) R.qual = active.qual; return r; }; }
  { const _gq = gpuAutoQuality; gpuAutoQuality = function () { if (CAL.on) return; const r = _gq.apply(this, arguments); if (active && typeof GPU !== 'undefined' && GPU.ready && GPU.q > active.gpu && (o.gpu || 'auto') === 'auto') { GPU.q = active.gpu; try { gpuTier(); } catch (e) {} } return r; }; }
  { const _pa = perfAdapt; perfAdapt = function () { if (CAL.on) return; return _pa.apply(this, arguments); }; }
  /* ---------- mesure : intervalle entre deux images et temps de rendu ---------- */
  const M = { iv: [], cpu: [], last: 0 };
  { const _r = render; render = function () { const t0 = performance.now(); if (M.last) M.iv.push(t0 - M.last); M.last = t0; const r = _r.apply(this, arguments); M.cpu.push(performance.now() - t0); return r; }; }
  { const _u = update; update = function (dt) { if (CAL.on) return; return _u.apply(this, arguments); }; }   /* l'écran de chargement fige la partie */
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
  const pct = (a, q) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(b.length * q))] : 0; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const target = () => { let cap = 60; try { cap = nvCap(); } catch (e) {} const hz = cal().hz || 60; return Math.max(30, Math.min(cap, hz, IS_TOUCH ? 60 : 144)); };
  /* ---------- l'écran ---------- */
  const TIPS = [
    () => T5('Astuce : frôler les tirs ennemis remplit la jauge de GRAZE.', 'Tip: grazing enemy shots fills the GRAZE gauge.', 'Consejo: rozar las balas enemigas llena el medidor GRAZE.', 'Dica: raspar os tiros inimigos enche a barra GRAZE.', 'ヒント：敵弾をかすめるとGRAZEゲージが貯まる。'),
    () => T5('Astuce : la bombe efface tous les tirs à l’écran.', 'Tip: the bomb wipes every bullet on screen.', 'Consejo: la bomba borra todas las balas de la pantalla.', 'Dica: a bomba apaga todos os tiros do ecrã.', 'ヒント：ボムは画面上の弾をすべて消す。'),
    () => T5('Astuce : les coins gagnés sont gardés pour la boutique.', 'Tip: coins you earn are kept for the shop.', 'Consejo: las monedas ganadas se guardan para la tienda.', 'Dica: as moedas ganhas ficam para a loja.', 'ヒント：獲得コインはショップ用に保存される。'),
    () => T5('Astuce : change de set de tir pour chaque type d’ennemi.', 'Tip: switch weapon sets for each enemy type.', 'Consejo: cambia de set de disparo según el enemigo.', 'Dica: troca de conjunto de tiro conforme o inimigo.', 'ヒント：敵に合わせて武器セットを切り替えよう。')
  ];
  const ui = { box: $('nvLoad'), bar: $('nvlBar'), st: $('nvlSt'), res: $('nvlRes'), sec: $('nvlSec'), tip: $('nvlTip') };
  const prog = p => ui.bar.style.setProperty('--p', Math.round(p * 100) + '%');
  const say = s => { ui.st.textContent = s; };
  function chip(html) { const s = document.createElement('span'); s.innerHTML = html; ui.res.appendChild(s); requestAnimationFrame(() => s.classList.add('on')); }
  function show(level) {
    ui.res.innerHTML = ''; prog(0); say('');
    let name = ''; try { name = (ERAS[G.eraIdx] && (ERAS[G.eraIdx].sys || ERAS[G.eraIdx].name)) || ''; } catch (e) {}
    ui.sec.innerHTML = `${T5('SECTEUR', 'SECTOR', 'SECTOR', 'SETOR', 'セクター')} <b>${String(level).padStart(2, '0')}</b>${name ? ' · ' + (typeof L === 'function' ? L(name) : name) : ''}`;
    ui.tip.textContent = TIPS[(level + (Date.now() / 1000 | 0)) % TIPS.length]();
    ui.box.classList.remove('out'); ui.box.classList.add('on');
  }
  function hide() { ui.box.classList.add('out'); setTimeout(() => { ui.box.classList.remove('on', 'out'); }, 340); }
  /* ---------- le calibrage d'un secteur ---------- */
  async function measure(ms) { M.iv = []; M.cpu = []; M.last = 0; await wait(ms); return { iv: med(M.iv.slice(2)), cpu: pct(M.cpu.slice(2), .75), n: M.iv.length }; }
  async function calibrate(level, token) {
    const c = cal(), budget = 1000 / target(), thr = PRIO[prio()];
    say(T5('Analyse de l’appareil…', 'Analysing your device…', 'Analizando el dispositivo…', 'A analisar o aparelho…', 'デバイスを分析中…'));
    if (!c.hz) { const m0 = await measure(450); if (token !== RUN) return null; const hz = m0.iv > 0 ? 1000 / m0.iv : 60; c.hz = hz > 100 ? Math.round(hz / 30) * 30 : hz > 70 ? 90 : 60; }
    prog(.15);
    let i = prio() === 'smooth' ? 1 : 0, chosen = null, first = null;
    const trials = [];
    for (; i < P.length; i++) {
      apply(i); say(T5('Mesure du rendu · ', 'Measuring rendering · ', 'Midiendo el render · ', 'A medir a imagem · ', '描画を測定中・') + P[i].n());
      await wait(120); const m = await measure(560); if (token !== RUN) return null;
      if (!first) first = m;
      prog(.15 + .75 * (i + 1) / P.length);
      if (m.n < 6) continue;                                   /* trop peu d'images : on allège */
      trials.push({ i, iv: m.iv, cpu: m.cpu });
      if (m.iv <= budget * 1.12 && m.cpu <= budget * thr) { chosen = i; break; }
      /* alléger n'accélère plus rien : la cadence est bridée ailleurs (navigateur, économie
         d'énergie, écran) — inutile d'enlaidir le jeu, on garde le plus beau réglage tenable */
      if (trials.length >= 3) {
        const best = Math.min(...trials.map(t => t.iv)), worst = Math.max(...trials.map(t => t.iv));
        if (worst - best < best * 0.12) { const ok = trials.find(t => t.cpu <= budget * thr); if (ok) { chosen = ok.i; break; } }
      }
    }
    if (chosen === null) {
      const best = trials.length ? Math.min(...trials.map(t => t.iv)) : 0;
      const ok = trials.find(t => t.iv <= best * 1.1 && t.cpu <= budget * thr);
      chosen = ok ? ok.i : P.length - 1;
    }
    if (c.cls === null && first) { const load = first.cpu / budget; c.cls = load < .3 ? 2 : load < .62 ? 1 : 0; }
    c.lv[level] = chosen; saveGame();
    return chosen;
  }
  /* ---------- à chaque secteur ---------- */
  let RUN = 0;
  async function run(level) {
    const token = ++RUN, c = cal(), known = c.lv[level];
    CAL.on = true; show(level);
    try {
      let idx;
      if (known !== undefined && P[known]) {
        say(T5('Chargement du secteur…', 'Loading sector…', 'Cargando el sector…', 'A carregar o setor…', 'セクター読み込み中…'));
        for (let k = 1; k <= 6; k++) { prog(k / 6); await wait(110); if (token !== RUN) return; }
        idx = known; apply(idx);
      } else {
        idx = await calibrate(level, token); if (token !== RUN || idx === null) return;
      }
      prog(1);
      say(T5('Prêt.', 'Ready.', 'Listo.', 'Pronto.', '準備完了。'));
      chip(`${T5('Appareil', 'Device', 'Dispositivo', 'Aparelho', 'デバイス')} : <b>${c.cls === null ? '—' : CLS[c.cls]()}</b>`);
      chip(`${T5('Réglage', 'Setting', 'Ajuste', 'Definição', '設定')} : <b>${P[idx].n()}</b>`);
      chip(`<b>${target()}</b> ${T5('i/s visés', 'fps target', 'fps objetivo', 'fps alvo', 'fps目標')}`);
      await wait(known !== undefined ? 380 : 900);
    } catch (e) { console.warn('calibrage', e); }
    finally {
      /* séquence stricte : l'écran d'analyse s'efface d'abord, et la partie ne
         reprend qu'une fois l'overlay disparu — aucune superposition. */
      if (token === RUN) {
        hide(); learn.n = 0; learn.t = 0;
        await wait(420);
        if (token === RUN) CAL.on = false;
      }
    }
  }
  const _sl = startLevel;
  startLevel = function () {
    const r = _sl.apply(this, arguments);
    try {
      const lv = G.level | 0, c = cal();
      if (typeof NET !== 'undefined' && NET.role && NET.state === 'ready') { if (c.lv[lv] !== undefined) apply(c.lv[lv]); }
      else run(lv);
    } catch (e) { CAL.on = false; }
    return r;
  };
  /* l'analyse de l'appareil est EXCLUSIVE : pendant l'écran de chargement, ni
     clavier, ni souris, ni doigt n'atteignent le jeu (F11 reste libre). */
  addEventListener('keydown', e => { if (CAL.on && e.key !== 'F11') { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  for (const ev of ['pointerdown', 'mousedown', 'touchstart']) {
    addEventListener(ev, e => { if (CAL.on) { e.stopImmediatePropagation(); e.preventDefault(); } }, { capture: true, passive: false });
  }
  /* ---------- apprentissage en jouant : si le secteur rame, il sera allégé ---------- */
  const learn = { t: 0, n: 0 };
  setInterval(() => {
    try {
      if (CAL.on || document.hidden || G.state !== 'play' || !active) return;
      const tg = target(), c = cal(), lv = G.level | 0;
      if (R.fps < tg * 0.8) learn.n++; else learn.n = Math.max(0, learn.n - 1);
      if (learn.n >= 8 && c.lv[lv] !== undefined && c.lv[lv] < P.length - 1) { c.lv[lv]++; apply(c.lv[lv]); learn.n = 0; saveGame(); }
    } catch (e) {}
  }, 1000);
  /* ---------- menu pause : où en est la fluidité ---------- */
  const pauseLine = () => {
    const pan = document.querySelector('#scr-pause .panel'); if (!pan) return;
    let d = $('nvPauseFluid'); if (!d) { d = document.createElement('div'); d.id = 'nvPauseFluid'; pan.appendChild(d); }
    const c = cal();
    d.textContent = `${T5('Appareil', 'Device', 'Dispositivo', 'Aparelho', 'デバイス')} : ${c.cls === null ? '—' : CLS[c.cls]()} · ${active ? active.n() : '—'} · ${Math.round(R.fps || 0)} / ${target()} ${T5('i/s', 'fps', 'fps', 'fps', 'fps')}`;
  };
  { const _p = pauseGame; pauseGame = function () { const r = _p.apply(this, arguments); try { pauseLine(); } catch (e) {} return r; }; }
  /* ---------- options : un choix de priorité, le reste devient « avancé » ---------- */
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  function rowByLabel(body, labels) {
    const want = labels.map(norm);
    return [...body.querySelectorAll('.opt')].find(r => { const l = r.querySelector('label'); if (!l) return false; const t = norm([...l.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ') || l.textContent); return want.includes(t); });
  }
  const _bo = buildOptions;
  buildOptions = function () {
    const r = _bo.apply(this, arguments);
    try {
      const body = $('optBody'); if (!body) return r;
      body.querySelectorAll('.nv-secprof').forEach(n => n.remove());
      const old = rowByLabel(body, ['Profils téléphone par secteur', 'Phone profiles per sector']); if (old) old.remove();
      const qp = rowByLabel(body, ['Profil de qualité', 'Quality profile']);
      if (qp) {
        const lab = qp.querySelector('label'), hint = lab.querySelector('.hint'), ctl = qp.querySelector('.ctl');
        lab.firstChild.textContent = T5('Fluidité automatique', 'Automatic smoothness', 'Fluidez automática', 'Fluidez automática', '自動なめらか設定');
        const H = { smooth: T5('Priorité à la fluidité : le jeu garde une bonne marge, même au cœur des combats.', 'Smoothness first: the game keeps a big safety margin, even in heavy fights.', 'Prioridad a la fluidez: el juego guarda mucho margen, incluso en combate.', 'Prioridade à fluidez: o jogo guarda boa margem, mesmo nos combates.', 'なめらかさ優先：激しい戦闘でも余裕を確保。'),
          balanced: T5('Le meilleur compromis : chaque secteur est mesuré sur ton appareil, puis réglé au plus beau qui reste fluide.', 'Best balance: each sector is measured on your device, then set to the nicest look that stays smooth.', 'El mejor equilibrio: cada sector se mide en tu dispositivo y se ajusta a lo más bonito que siga fluido.', 'O melhor equilíbrio: cada setor é medido no teu aparelho e ajustado ao mais bonito que fique fluido.', '最適バランス：各セクターを実測し、なめらかさを保てる最高画質に。'),
          beauty: T5('Priorité à la beauté : tous les effets tant que l’appareil suit.', 'Looks first: every effect as long as the device keeps up.', 'Prioridad a la belleza: todos los efectos mientras el dispositivo aguante.', 'Prioridade à beleza: todos os efeitos enquanto o aparelho aguentar.', '画質優先：端末が追いつく限りすべてのエフェクト。') };
        hint.textContent = H[prio()] + ' ' + T5('Tes shaders et filtres ne sont jamais touchés.', 'Your shaders and filters are never changed.', 'Tus shaders y filtros nunca se tocan.', 'Os teus shaders e filtros nunca mudam.', 'シェーダーとフィルターは変更しない。');
        ctl.innerHTML = '';
        const seg = document.createElement('div'); seg.className = 'seg';
        [['smooth', T5('FLUIDITÉ', 'SMOOTH', 'FLUIDEZ', 'FLUIDEZ', 'なめらか')], ['balanced', T5('ÉQUILIBRE', 'BALANCED', 'EQUILIBRIO', 'EQUILÍBRIO', 'バランス')], ['beauty', T5('BEAUTÉ', 'LOOKS', 'BELLEZA', 'BELEZA', '画質')]].forEach(([v, l]) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.className = prio() === v ? 'sel' : '';
          b.onclick = () => { o.nvPrio = v; o.graphics = 'auto'; cal().lv = {}; saveGame(); try { Audio2.sfx('ui'); } catch (e) {} toast(T5('Appliqué dès le prochain secteur', 'Applied from the next sector', 'Se aplica desde el próximo sector', 'Aplicado a partir do próximo setor', '次のセクターから適用'), true); buildOptions(); };
          seg.appendChild(b);
        });
        ctl.appendChild(seg);
        /* état de l'appareil + nouveau test */
        const st = document.createElement('div'); st.className = 'opt';
        const c = cal(), n = Object.keys(c.lv).length;
        st.innerHTML = `<div><label>${T5('Ton appareil', 'Your device', 'Tu dispositivo', 'O teu aparelho', 'あなたのデバイス')}<span class="hint">${T5('Mesuré pendant l’écran de chargement de chaque nouveau secteur, puis retenu', 'Measured during the loading screen of each new sector, then remembered', 'Medido durante la pantalla de carga de cada sector nuevo y luego recordado', 'Medido no ecrã de carregamento de cada setor novo e depois guardado', '新しいセクターの読み込み画面で測定して記憶')}</span></label></div><div class="ctl nv-fl-stat"><span class="chip">${c.cls === null ? T5('Pas encore mesuré', 'Not measured yet', 'Aún sin medir', 'Ainda não medido', '未測定') : CLS[c.cls]()}</span><span class="chip">${n}/24 ${T5('secteurs réglés', 'sectors tuned', 'sectores ajustados', 'setores ajustados', 'セクター調整済み')}</span></div>`;
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sw'; btn.textContent = T5('↻ RE-TESTER MON APPAREIL', '↻ RE-TEST MY DEVICE', '↻ VOLVER A PROBAR', '↻ TESTAR DE NOVO', '↻ 再テスト');
        btn.onclick = () => { o.nvCal = null; cal(); saveGame(); try { Audio2.sfx('ui'); } catch (e) {} toast(T5('Nouvelle mesure au prochain secteur', 'New measurement at the next sector', 'Nueva medición en el próximo sector', 'Nova medição no próximo setor', '次のセクターで再測定'), true); buildOptions(); };
        st.querySelector('.ctl').appendChild(btn);
        qp.after(st);
      }
      /* onglet Performance : les réglages manuels deviennent facultatifs, repliés */
      const perf = body.querySelector('[data-section="perf"] .opt-section-body');
      if (perf && !perf.querySelector('.nv-fl-adv')) {
        const rows = [...perf.children].filter(x => !x.classList.contains('nv-fl-adv'));
        const bar = document.createElement('div'); bar.className = 'nv-fl-adv';
        const open = !!o.nvAdvOpen;
        bar.innerHTML = `<span>${T5('La fluidité est réglée automatiquement (onglet Image). Ces réglages manuels sont facultatifs et passent en priorité si tu les changes.', 'Smoothness is tuned automatically (Picture tab). These manual settings are optional and take priority if you change them.', 'La fluidez se ajusta sola (pestaña Imagen). Estos ajustes manuales son opcionales y tienen prioridad si los cambias.', 'A fluidez é ajustada sozinha (separador Imagem). Estas definições manuais são opcionais e têm prioridade se as mudares.', 'なめらかさは自動調整（映像タブ）。手動設定は任意で、変更すると優先される。')}</span>`;
        const t = document.createElement('button'); t.type = 'button'; t.className = 'sw'; t.textContent = open ? T5('▾ MASQUER', '▾ HIDE', '▾ OCULTAR', '▾ OCULTAR', '▾ 隠す') : T5('▸ RÉGLAGES AVANCÉS', '▸ ADVANCED SETTINGS', '▸ AJUSTES AVANZADOS', '▸ DEFINIÇÕES AVANÇADAS', '▸ 詳細設定');
        t.onclick = () => { o.nvAdvOpen = open ? 0 : 1; saveGame(); buildOptions(); };
        bar.appendChild(t); perf.insertBefore(bar, perf.firstChild);
        if (!open) rows.forEach(x => x.classList.add('nv-fl-hide'));
      }
    } catch (e) { console.warn('options fluidité', e); }
    return r;
  };
  window.nvFluid = { cal, apply, P, run, CAL, target };
})();
