
/* Boutique rangée par intention : Hangar · Vaisseaux · Armes · Améliorations ·
   Apparence · Revendre. En-tête compact et collant (pièces + onglets), Grozzmo
   en bande fine sur téléphone, styles de tirs dans Apparence, améliorations
   par familles, cartes triées (équipé, possédé, puis prix) et badge
   « Abordable ». Rien n'est supprimé : la revente devient un onglet. */
(() => {
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const t5 = (fr, en, es, pt, ja) => ({ fr, en, es, pt, ja });
  const tr = o => o[LG()] || o.en || o.fr;
  const TABS = [
    ['hangar', t5('Hangar', 'Hangar', 'Hangar', 'Hangar', 'ハンガー')],
    ['ships', t5('Vaisseaux', 'Ships', 'Naves', 'Naves', '機体')],
    ['weapons', t5('Armes', 'Weapons', 'Armas', 'Armas', '武器')],
    ['upgrades', t5('Améliorations', 'Upgrades', 'Mejoras', 'Melhorias', '強化')],
    ['custom', t5('Apparence', 'Look', 'Aspecto', 'Visual', '外観')],
    ['sell', t5('Revendre', 'Sell', 'Vender', 'Vender', '売却')]
  ];
  const TXT = {
    arms: t5('ARMES', 'WEAPONS', 'ARMAS', 'ARMAS', '武器'),
    bombs: t5('BOMBES', 'BOMBS', 'BOMBAS', 'BOMBAS', 'ボム'),
    shots: t5('STYLES DE TIRS', 'SHOT STYLES', 'ESTILOS DE DISPARO', 'ESTILOS DE DISPARO', '弾のスタイル'),
    afford: t5('ABORDABLE', 'AFFORDABLE', 'ASEQUIBLE', 'ACESSÍVEL', '購入可'),
    fam: {
      atk: t5('ATTAQUE', 'ATTACK', 'ATAQUE', 'ATAQUE', '攻撃'), def: t5('DÉFENSE', 'DEFENCE', 'DEFENSA', 'DEFESA', '防御'),
      fly: t5('PILOTAGE', 'HANDLING', 'PILOTAJE', 'PILOTAGEM', '機動'), loot: t5('BUTIN', 'LOOT', 'BOTÍN', 'SAQUE', '戦利品')
    }
  };
  const FAMS = [['atk', ['rate', 'dmg', 'drone']], ['def', ['hull', 'shield']], ['fly', ['engine']], ['loot', ['magnet', 'credit', 'luck']]];
  /* les styles de tirs sont rangés dans Apparence */
  const _route = shopRoute;
  shopRoute = function (tab) { if (tab === 'bulletSkins' || tab === 'projectiles') return 'custom'; return _route(tab); };
  const heading = (txt, extra) => { const h = document.createElement('div'); h.className = 'shop-group-title' + (extra ? ' ' + extra : ''); h.textContent = txt; return h; };
  const priceOf = el => { const p = el.querySelector('.cprice'); const m = p && p.textContent.replace(/\s/g, '').match(/(\d+)COINS/); return m ? +m[1] : 0; };
  const rank = el => el.classList.contains('sel') ? 0 : el.classList.contains('locked') ? 2 : 1;
  function sortRun(cards) {
    if (cards.length < 2) return;
    const anchor = cards[0].previousSibling, parent = cards[0].parentNode;
    const sorted = cards.slice().sort((a, b) => rank(a) - rank(b) || (rank(a) === 2 ? priceOf(a) - priceOf(b) : 0));
    let ref = anchor ? anchor.nextSibling : parent.firstChild;
    for (const c of sorted) { parent.insertBefore(c, ref); ref = c.nextSibling; }
  }
  function sortGroups(grid) {
    let run = [];
    for (const el of [...grid.children]) {
      if (el.classList.contains('shop-group-title')) { sortRun(run); run = []; }
      else if (el.classList.contains('shop-item') && el.querySelector('.cname')) run.push(el);
    }
    sortRun(run);
  }
  function affordBadges(grid) {
    for (const el of grid.querySelectorAll('.card.shop-item')) {
      const p = el.querySelector('.cprice'); if (!p || p.classList.contains('cant') || p.classList.contains('owned') || el.querySelector('.nv-afford')) continue;
      const price = priceOf(el); if (!price || price > S.credits) continue;
      const b = document.createElement('span'); b.className = 'badge nv-afford'; b.textContent = tr(TXT.afford); el.insertBefore(b, el.firstChild);
    }
  }
  function shotArt(card, skin) {
    if (card.querySelector('.nvArt')) return;
    const d = document.createElement('div'); d.className = 'nvArt'; d.style.setProperty('--nva', '63,182,255');
    const c = document.createElement('canvas'); c.width = 360; c.height = 200; d.appendChild(c);
    const g = c.getContext('2d'); g.fillStyle = '#070d1a'; g.fillRect(0, 0, 360, 200);
    [skin.glow, skin.main, skin.lite].forEach((col, j) => { g.fillStyle = col; g.fillRect(76 + j * 68, 88, 42, 24); g.fillRect(89 + j * 68, 68, 16, 64); });
    card.insertBefore(d, card.firstChild);
  }

  const _build = buildShop;
  buildShop = function () {
    const r = _build.apply(this, arguments);
    try {
      const scr = document.getElementById('scr-shop'), panel = scr && scr.querySelector('.panel'); if (!panel) return r;
      const grid = document.getElementById('shopGrid'), tabs = document.getElementById('shopTabs'), modes = document.getElementById('shopTradeModes');
      /* en-tête compact et collant : pièces + onglets */
      let top = panel.querySelector('.nv-shop-top');
      if (!top) { top = document.createElement('div'); top.className = 'nv-shop-top'; const ph = panel.querySelector('.phead'); panel.insertBefore(top, ph); top.appendChild(ph); }
      top.appendChild(tabs);
      if (modes) modes.classList.add('nv-hide');
      /* six onglets, dont « Revendre » */
      tabs.innerHTML = ''; tabs.classList.remove('shop-tabs-hidden'); tabs.classList.add('nv6');
      for (const [id, label] of TABS) {
        const b = document.createElement('button'); b.type = 'button';
        const sel = id === 'sell' ? shopMode === 'sell' : (shopMode !== 'sell' && shopTab === id);
        b.className = 'tab' + (sel ? ' sel' : ''); b.textContent = tr(label); b.setAttribute('aria-pressed', String(sel));
        b.onclick = () => id === 'sell' ? shopNavigate('sell', shopTab) : shopNavigate('buy', id);
        tabs.appendChild(b);
      }
      if (shopMode === 'sell') return r;
      if (shopTab === 'hangar') {
        /* la revente a son onglet : plus de bloc « matériaux » en double */
        for (const row of grid.querySelectorAll('.hrow')) { const lab = row.querySelector('.hlab'); if (lab && /MAT[ÉE]RIAU|MATERIAL|MATERIA/i.test(lab.textContent)) row.remove(); }
        return r;
      }
      if (shopTab === 'weapons') {
        const titles = [...grid.querySelectorAll('.shop-group-title')];
        const shotsTitle = titles.find(h => /PROJECTIL|STYLE|SKIN/i.test(h.textContent));
        if (shotsTitle) { let n = shotsTitle; while (n) { const nx = n.nextSibling; n.remove(); n = nx; } }
        if (titles[0]) titles[0].textContent = tr(TXT.arms);
        const bomb = [...grid.querySelectorAll('.card.shop-item')].find(c => /BOMB/i.test((c.querySelector('.cname') || {}).textContent || ''));
        if (bomb) grid.insertBefore(heading(tr(TXT.bombs)), bomb);
      } else if (shopTab === 'custom') {
        const titles = [...grid.querySelectorAll('.shop-group-title')];
        const before = titles[1] || null;   /* entre les livrées et les traînées */
        grid.insertBefore(heading(tr(TXT.shots)), before);
        for (const skin of BULLET_SKINS) { const card = shopItemCard('bulletSkins', skin); shotArt(card, skin); grid.insertBefore(card, before); }
      } else if (shopTab === 'upgrades') {
        const list = UPGRADES.filter(x => !x.consumable), cards = [...grid.querySelectorAll('.card.shop-item')];
        const byId = {}; list.forEach((u, i) => { if (cards[i]) byId[u.id] = cards[i]; });
        const placed = new Set();
        for (const [fam, ids] of FAMS) {
          const els = ids.map(id => byId[id]).filter(Boolean); if (!els.length) continue;
          grid.appendChild(heading(tr(TXT.fam[fam]), 'nv-fam')); els.forEach(e => { grid.appendChild(e); placed.add(e); });
        }
        cards.filter(c => !placed.has(c)).forEach(c => grid.appendChild(c));   /* une future amélioration reste visible */
      }
      if (shopTab !== 'upgrades') sortGroups(grid);
      affordBadges(grid);
    } catch (err) { console.warn('boutique', err); }
    return r;
  };
})();
