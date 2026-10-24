
/* Profils de performance par secteur, sur téléphone.
   Les secteurs n'ont pas le même coût graphique (palette LCD recalculée à
   chaque image en Game Boy, pétales de l'arcade, effets HD, VORAX…). Chaque
   secteur applique donc son propre profil au démarrage : résolution de rendu,
   qualité des effets et niveau du GPU. L'adaptation automatique peut encore
   baisser la qualité si le téléphone rame, mais jamais dépasser le profil. */
(() => {
  if (typeof IS_TOUCH === 'undefined' || typeof PERF === 'undefined') return;
  const PRESETS = {
    qualite:     { tier: 0, qual: 1,   gpu: 2, name: { fr: 'Qualité', en: 'Quality', es: 'Calidad', pt: 'Qualidade', ja: '画質優先' } },
    equilibre:   { tier: 1, qual: .86, gpu: 1, name: { fr: 'Équilibré', en: 'Balanced', es: 'Equilibrado', pt: 'Equilibrado', ja: 'バランス' } },
    fluide:      { tier: 2, qual: .72, gpu: 1, name: { fr: 'Fluide', en: 'Smooth', es: 'Fluido', pt: 'Fluido', ja: 'なめらか' } },
    performance: { tier: 3, qual: .55, gpu: 0, name: { fr: 'Performance max', en: 'Max performance', es: 'Rendimiento máx.', pt: 'Desempenho máx.', ja: '最大パフォーマンス' } }
  };
  /* profils d'usine : Game Boy et arcade recalculent beaucoup de pixels, la HD et VORAX empilent les effets */
  const FACTORY = l => l <= 4 ? 'fluide' : l <= 12 ? 'equilibre' : l <= 16 ? 'fluide' : l <= 20 ? 'equilibre' : l <= 23 ? 'fluide' : 'performance';
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const tr = o => o[LG()] || o.fr;
  const on = () => IS_TOUCH && S.opts.secProfiles !== 0 && (S.opts.graphics || 'auto') === 'auto';
  const pick = l => { const m = S.opts.secProf || {}; return PRESETS[m[l]] ? m[l] : FACTORY(l); };
  let active = null;
  function apply(level) {
    if (!on()) { active = null; return; }
    const p = PRESETS[pick(level)], base = (window.NV_AUTO_SUPPORT && window.NV_AUTO_SUPPORT.tier) | 0;
    active = p;
    if ((S.opts.mobRes || 'auto') === 'auto') { PERF.tier = Math.min(DPR_TIERS.length - 1, Math.max(base, p.tier)); PERF.cool = 240; PERF.bad = 0; PERF.n = 0; }
    R.qual = p.qual;
    if (typeof GPU !== 'undefined' && GPU.ready && (S.opts.gpu || 'auto') === 'auto') { GPU.q = p.gpu; try { gpuTier(); } catch (e) { } }
    try { sideRes = resizeView().sideRes; if (typeof syncTitleZone === 'function') syncTitleZone(); } catch (e) { }
  }
  window.nvSectorProfile = { apply, pick, PRESETS };
  const _start = startLevel;
  startLevel = function () { const r = _start.apply(this, arguments); apply(G.level | 0); return r; };
  const _aq = autoQuality;
  autoQuality = function () { const r = _aq.apply(this, arguments); if (active && on() && R.qual > active.qual) R.qual = active.qual; return r; };
  const _gq = gpuAutoQuality;
  gpuAutoQuality = function () { const r = _gq.apply(this, arguments); if (active && on() && typeof GPU !== 'undefined' && GPU.ready && GPU.q > active.gpu) { GPU.q = active.gpu; try { gpuTier(); } catch (e) { } } return r; };

  /* options : un interrupteur et la liste des 24 secteurs, modifiable */
  const T = {
    title: { fr: 'Profils téléphone par secteur', en: 'Phone profiles per sector', es: 'Perfiles de móvil por sector', pt: 'Perfis de telemóvel por setor', ja: 'セクター別スマホ設定' },
    hint: { fr: 'Chaque secteur applique ses réglages pour rester fluide · actif quand la qualité graphique est en Automatique', en: 'Each sector applies its own settings to stay smooth · active when graphics quality is Automatic', es: 'Cada sector aplica sus ajustes para ir fluido · activo con la calidad gráfica en Automático', pt: 'Cada setor aplica as suas definições para ficar fluido · ativo com a qualidade gráfica em Automático', ja: '各セクターが滑らかに動く設定を自動適用 · 画質が自動のとき有効' },
    on: { fr: 'Activés', en: 'On', es: 'Activados', pt: 'Ativados', ja: 'オン' },
    off: { fr: 'Désactivés', en: 'Off', es: 'Desactivados', pt: 'Desativados', ja: 'オフ' },
    list: { fr: 'Voir et modifier les 24 secteurs', en: 'View and edit the 24 sectors', es: 'Ver y editar los 24 sectores', pt: 'Ver e editar os 24 setores', ja: '24セクターを表示・編集' },
    reset: { fr: 'Revenir aux profils d’usine', en: 'Restore factory profiles', es: 'Restaurar perfiles de fábrica', pt: 'Repor perfis de fábrica', ja: '初期設定に戻す' },
    sec: { fr: 'Secteur', en: 'Sector', es: 'Sector', pt: 'Setor', ja: 'セクター' }
  };
  const _build = buildOptions;
  buildOptions = function () {
    const r = _build.apply(this, arguments);
    if (!IS_TOUCH) return r;
    try {
      const body = document.getElementById('optBody'); if (!body) return r;
      const sec = body.querySelector('[data-section="display"] .opt-section-body') || body;
      const old = sec.querySelector('.nv-secprof'); if (old) old.remove();
      const row = document.createElement('div'); row.className = 'opt nv-secprof'; row.style.flexWrap = 'wrap';
      const lab = document.createElement('label'); lab.textContent = tr(T.title);
      const hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = tr(T.hint); lab.appendChild(hint);
      const ctl = document.createElement('div'); ctl.className = 'ctl';
      const sw = document.createElement('select'); sw.className = 'sw';
      [['1', tr(T.on)], ['0', tr(T.off)]].forEach(([v, n]) => { const o = document.createElement('option'); o.value = v; o.textContent = n; sw.appendChild(o); });
      sw.value = S.opts.secProfiles === 0 ? '0' : '1';
      sw.onchange = () => { S.opts.secProfiles = sw.value === '1' ? 1 : 0; saveGame(); if (G.state === 'play' || G.state === 'pause') apply(G.level | 0); try { Audio2.sfx('ui'); } catch (e) { } };
      ctl.appendChild(sw);
      const det = document.createElement('details'); det.style.cssText = 'flex:1 0 100%;margin-top:8px';
      const sum = document.createElement('summary'); sum.textContent = tr(T.list); sum.style.cssText = 'cursor:pointer;font-weight:700;letter-spacing:.04em;padding:6px 0';
      det.appendChild(sum);
      const grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;padding:6px 0';
      for (let l = 1; l <= 24; l++) {
        const name = document.createElement('span'); name.style.cssText = 'font-size:12px;opacity:.9';
        let place = ''; try { place = L((SECTINFO[l - 1] || {}).lieu || ''); } catch (e) { }
        name.textContent = tr(T.sec) + ' ' + l + (place ? ' · ' + place : '');
        const s = document.createElement('select'); s.className = 'sw'; s.style.maxWidth = '170px';
        for (const k in PRESETS) { const o = document.createElement('option'); o.value = k; o.textContent = tr(PRESETS[k].name) + (k === FACTORY(l) ? ' ★' : ''); s.appendChild(o); }
        s.value = pick(l);
        s.onchange = () => { S.opts.secProf = Object.assign({}, S.opts.secProf || {}); if (s.value === FACTORY(l)) delete S.opts.secProf[l]; else S.opts.secProf[l] = s.value; saveGame(); if ((G.level | 0) === l && (G.state === 'play' || G.state === 'pause')) apply(l); };
        grid.append(name, s);
      }
      const rst = document.createElement('button'); rst.type = 'button'; rst.className = 'btn'; rst.textContent = tr(T.reset); rst.style.cssText = 'grid-column:1/-1;margin-top:6px';
      rst.onclick = () => { S.opts.secProf = {}; saveGame(); buildOptions(); };
      grid.appendChild(rst); det.appendChild(grid);
      row.append(lab, ctl, det);
      sec.insertBefore(row, sec.children[1] || null);
    } catch (err) { console.warn('profils secteur', err); }
    return r;
  };
})();
