
/* Écran titre rangé par intention : JOUER · À PLUSIEURS · HANGAR & PROGRESSION ·
   RÉGLAGES. Les boutons d'origine sont déplacés (mêmes data-act, mêmes
   textes traduits) ; « Commandes » passe dans Options › Commandes. Le style
   et le cadre arcade du PC sont conservés : seules les positions changent. */
(() => {
  const root = document.getElementById('nvTitle'); if (!root) return;
  const left = root.querySelector('.nv-left'), prim = root.querySelector('.nv-primary'), grid = document.getElementById('nvSecondary'), secB = document.getElementById('nvSecB');
  if (!left || !prim || !grid || !secB) return;
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const H = {
    multi: { fr: 'À PLUSIEURS', en: 'MULTIPLAYER', es: 'MULTIJUGADOR', pt: 'MULTIJOGADOR', ja: 'マルチプレイ' },
    prog: { fr: 'HANGAR & PROGRESSION', en: 'HANGAR & PROGRESS', es: 'HANGAR Y PROGRESO', pt: 'HANGAR E PROGRESSO', ja: 'ハンガー＆進行' },
    set: { fr: 'RÉGLAGES', en: 'SETTINGS', es: 'AJUSTES', pt: 'DEFINIÇÕES', ja: '設定' }
  };
  const btn = a => root.querySelector('[data-act="' + a + '"]');
  /* un gros bouton devient une tuile, en gardant ses propres nœuds de texte */
  function toTile(b) {
    if (!b || b.classList.contains('tile')) return b;
    const bi = b.querySelector('.bi'), bl = b.querySelector('.bl');
    b.className = 'tile' + (b.dataset.act === 'daily' ? ' daily' : '');
    if (bi) { bi.className = 'ti'; }
    if (bl) { while (bl.firstChild) b.appendChild(bl.firstChild); bl.remove(); }
    return b;
  }
  const head = (id) => { const d = document.createElement('div'); d.className = 'nv-sec'; d.id = id; return d; };
  const mkGrid = (id) => { const d = document.createElement('div'); d.className = 'nv-secondary nv-grid-tight'; d.id = id; return d; };

  /* JOUER : continuer, nouvelle campagne, défi du jour */
  for (const a of ['continue', 'play', 'daily']) { const b = btn(a); if (b) prim.appendChild(b); }
  /* À PLUSIEURS */
  const hMulti = head('nvSecMulti'), gMulti = mkGrid('nvMulti');
  for (const a of ['play2', 'online']) { const b = toTile(btn(a)); if (b) gMulti.appendChild(b); }
  /* HANGAR & PROGRESSION (la grille d'origine) */
  const shop = btn('shop'); if (shop) { shop.classList.add('nv-hangar'); grid.appendChild(shop); }
  const fm = btn('music-shop'); if (fm) { fm.classList.add('nv-hangar'); grid.appendChild(fm); }
  for (const a of ['records', 'story', 'cheats', 'credits']) { const b = toTile(btn(a)); if (b) grid.appendChild(b); }
  /* RÉGLAGES */
  const hSet = head('nvSecSet'), gSet = mkGrid('nvSettings');
  for (const a of ['options', 'fullscreen']) { const b = btn(a); if (b) gSet.appendChild(b); }
  /* l'aide des commandes vit maintenant dans Options › Commandes */
  const help = btn('help'); if (help) { help.hidden = true; help.style.display = 'none'; gSet.appendChild(help); }
  /* ordre final dans la colonne */
  const more = document.getElementById('nvMoreToggle');
  prim.after(hMulti); hMulti.after(gMulti); gMulti.after(secB); secB.after(grid); grid.after(hSet); hSet.after(gSet);
  if (more) more.remove();
  left.classList.add('nv-reorg', 'more-open');
  const texts = () => {
    const t = o => o[LG()] || o.en;
    hMulti.textContent = t(H.multi); secB.textContent = t(H.prog); hSet.textContent = t(H.set);
  };
  const _nt = window.nvTitleTexts;
  window.nvTitleTexts = function () { try { _nt && _nt.apply(this, arguments); } catch (e) { } texts(); };
  texts();
  /* « Plus d'options » n'existe plus : ignorer les appels qui le cherchent */
  if (!document.getElementById('nvMoreToggle')) { const ghost = document.createElement('button'); ghost.id = 'nvMoreToggle'; ghost.hidden = true; ghost.style.display = 'none'; root.appendChild(ghost); }

  /* Options › Commandes : bouton « Voir les commandes » */
  const HELP = { fr: ['Aide des commandes', 'Clavier, souris, manette et doigt', 'VOIR'], en: ['Controls help', 'Keyboard, mouse, gamepad and finger', 'VIEW'], es: ['Ayuda de controles', 'Teclado, ratón, mando y dedo', 'VER'], pt: ['Ajuda dos comandos', 'Teclado, rato, comando e dedo', 'VER'], ja: ['操作ガイド', 'キーボード・マウス・パッド・指', '見る'] };
  const _build = buildOptions;
  buildOptions = function () {
    const r = _build.apply(this, arguments);
    try {
      const body = document.querySelector('#optBody [data-section="controls"] .opt-section-body'); if (!body || body.querySelector('.nv-helprow')) return r;
      const t = HELP[LG()] || HELP.en;
      const row = document.createElement('div'); row.className = 'opt nv-helprow';
      const w = document.createElement('div'), lab = document.createElement('label'); lab.textContent = t[0];
      const hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = t[1]; lab.appendChild(hint); w.appendChild(lab);
      const ctl = document.createElement('div'); ctl.className = 'ctl';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.dataset.act = 'help'; b.textContent = t[2];
      ctl.appendChild(b); row.append(w, ctl); body.insertBefore(row, body.firstChild);
    } catch (e) { }
    return r;
  };

  /* Pause : le menu des codes n'apparaît que si au moins un code a été trouvé */
  const syncPause = () => { const pc = document.querySelector('[data-act="pause-cheats"]'); if (!pc) return; const any = S && S.cheats && Object.keys(S.cheats.found || {}).some(k => S.cheats.found[k]); pc.style.display = any ? '' : 'none'; };
  const pause = document.getElementById('scr-pause');
  if (pause) new MutationObserver(syncPause).observe(pause, { attributes: true, attributeFilter: ['class'] });
  syncPause();
})();
