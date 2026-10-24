
/* Options : rangement final. Toutes les lignes existantes sont DÉPLACÉES
   (avec leurs commandes) dans des onglets clairs ; aucune n'est supprimée.
   Une ligne inconnue atterrit dans « Général › Autres réglages ». */
(() => {
  const LG = () => (typeof LANG === 'string' ? LANG : 'fr');
  const tr = o => (typeof o === 'string' ? o : (o[LG()] || o.en || o.fr));
  const t5 = (fr, en, es, pt, ja) => ({ fr, en, es: es || en, pt: pt || en, ja: ja || en });
  const SPEC = [
    { key: 'general', title: t5('Général', 'General', 'General', 'Geral', '一般'), desc: t5('Langue, écran et confort', 'Language, screen and comfort', 'Idioma, pantalla y comodidad', 'Idioma, ecrã e conforto', '言語・画面・快適さ'),
      groups: [[null, ['Langue', 'Language', 'Plein écran', 'Fullscreen', 'Écran toujours allumé', 'Keep screen awake', 'Vibrations', 'Haptics', 'Pause automatique', 'Auto-pause']]] },
    { key: 'gameplay', title: t5('Jeu', 'Game', 'Juego', 'Jogo', 'ゲーム'), desc: t5('Difficulté et façon de jouer', 'Difficulty and play style', 'Dificultad y estilo de juego', 'Dificuldade e estilo de jogo', '難易度と遊び方'),
      groups: [[null, ['Difficulté', '2 joueurs', 'Fantôme du record', 'Secousses', 'Screen shake']]] },
    { key: 'controls', title: t5('Commandes', 'Controls', 'Controles', 'Comandos', '操作'), desc: t5('Tir, visée et boutons tactiles', 'Firing, aiming and touch buttons', 'Disparo, puntería y botones táctiles', 'Disparo, mira e botões táteis', '射撃・照準・タッチボタン'),
      groups: [[null, ['Tir automatique', 'Visée souris']], [t5('Boutons tactiles', 'Touch buttons', 'Botones táctiles', 'Botões táteis', 'タッチボタン'), ['Taille des boutons', 'Button size', 'Opacité des boutons', 'Button opacity', 'Mode gaucher', 'Left-handed mode']]] },
    { key: 'display', title: t5('Image', 'Picture', 'Imagen', 'Imagem', '映像'), desc: t5('Qualité, lumières et effets visuels', 'Quality, lights and visual effects', 'Calidad, luces y efectos', 'Qualidade, luzes e efeitos', '画質・光・エフェクト'),
      groups: [[null, ['Profil de qualité', 'Quality profile']],
        [t5('Lumières et particules', 'Lights and particles', 'Luces y partículas', 'Luzes e partículas', '光とパーティクル'), ['Éclairage dynamique', 'Dynamic lighting', 'Intensité des halos lumineux', 'Glow intensity', 'Portée des halos', 'Glow radius', 'Densité des particules', 'Particle density', 'Lissage HD', 'HD smoothing']],
        [t5('Post-traitement (moteur GPU)', 'Post-processing (GPU engine)', 'Posprocesado (motor GPU)', 'Pós-processamento (motor GPU)', 'ポストエフェクト（GPU）'), ['Halo lumineux (bloom)', 'Glow (bloom)', 'Aberration chromatique', 'Chromatic aberration', 'Grain de pellicule', 'Film grain', 'Vignettage', 'Vignette', 'Flou de mouvement', 'Motion blur']],
        [t5('Réinitialiser', 'Reset', 'Restablecer', 'Repor', 'リセット'), ['Réglages graphiques par défaut', 'Default graphics settings']]] },
    { key: 'retro', title: t5('Rétro & CRT', 'Retro & CRT', 'Retro y CRT', 'Retro e CRT', 'レトロ＆CRT'), desc: t5('Rendu des vieilles consoles et des écrans cathodiques', 'Old console look and CRT screens', 'Aspecto de consolas antiguas y pantallas CRT', 'Visual de consolas antigas e ecrãs CRT', '昔のゲーム機とブラウン管の見た目'),
      groups: [[null, ['Profil de rendu', 'Render preset', 'Profil machine', 'Machine profile', 'Raster natif des consoles', 'Console native raster', 'Cadre arcade (PC)', 'Arcade bezel (PC)']],
        [t5('Écran cathodique', 'CRT screen', 'Pantalla CRT', 'Ecrã CRT', 'ブラウン管'), ['Standard vidéo', 'Video standard', 'Mode de scanlines', 'Scanline mode', 'Lignes de balayage', 'Scanline strength', 'Masque phosphore', 'Phosphor mask', 'Masque de tube', 'Display mask', 'Vignettage CRT', 'CRT vignette']],
        [t5('Couleurs et contours', 'Colours and outlines', 'Colores y contornos', 'Cores e contornos', '色と輪郭'), ['Contours des sprites', 'Sprite outlines', 'Filtre couleur', 'Colour filter', 'Lissage de l’image', 'Image smoothing']],
        [t5('Secteurs FanBoy', 'FanBoy sectors', 'Sectores FanBoy', 'Setores FanBoy', 'FanBoyセクター'), ['Rémanence LCD', 'LCD ghosting', 'Contraste LCD', 'LCD contrast', 'Clignotement des sprites', 'Sprite flicker', 'Cadre de console (PC)', 'Console frame (PC)']]] },
    { key: 'perf', title: t5('Performance', 'Performance', 'Rendimiento', 'Desempenho', 'パフォーマンス'), desc: t5('Fluidité, résolution et batterie', 'Smoothness, resolution and battery', 'Fluidez, resolución y batería', 'Fluidez, resolução e bateria', '滑らかさ・解像度・バッテリー'),
      groups: [[null, ['Profils téléphone par secteur', 'Phone profiles per sector', 'Résolution du rendu', 'Render resolution', 'Fréquence d’images', 'Frame rate', 'Moteur de rendu', 'Render engine', 'Économie de batterie', 'Battery saver', 'Filtrage haute qualité', 'High-quality filtering', 'Compteur FPS', 'FPS counter']]] },
    { key: 'audio', title: t5('Son', 'Sound', 'Sonido', 'Som', 'サウンド'), desc: t5('Volumes, voix du droïde et sortie audio', 'Volumes, droid voice and audio output', 'Volúmenes, voz del droide y salida', 'Volumes, voz do droide e saída', '音量・ドロイドの声・出力'),
      groups: [[t5('Volumes', 'Volumes', 'Volúmenes', 'Volumes', '音量'), ['Musique', 'Music', 'Effets', 'Effects', 'Bande originale', 'Soundtrack']],
        [t5('Voix du droïde', 'Droid voice', 'Voz del droide', 'Voz do droide', 'ドロイドの声'), ['Voix IA du droïde', 'Préréglage', 'Preset', 'Genre de la voix', 'Voice gender', 'Échantillon de voix', 'Voice sample', 'Hauteur de la voix', 'Voice pitch', 'Débit', 'Speaking rate', 'Volume de la voix', 'Voice volume', 'Pause entre les phrases', 'Pause between sentences', 'Bourdonnement de transmission', 'Transmission hum', 'Bips de début et de fin', 'Start and end beeps', 'Annonces en vol', 'In-flight announcements', 'Effet robot', 'Robot effect', '#voicepreview']],
        [t5('Sortie audio', 'Audio output', 'Salida de audio', 'Saída de áudio', '音声出力'), ['Canaux de sortie', 'Output channels', 'Gain de sortie', 'Output gain', 'Compression dynamique', 'Dynamic range compression', 'Réverbération et écho', 'Reverb and echo', 'Latence audio', 'Audio latency']],
        [t5('Secteurs FanBoy', 'FanBoy sectors', 'Sectores FanBoy', 'Setores FanBoy', 'FanBoyセクター'), ['Puce sonore FanBoy', 'FanBoy sound chip', 'Sortie sonore FanBoy', 'FanBoy audio output']]] },
    { key: 'save', title: t5('Sauvegarde', 'Save', 'Guardado', 'Gravação', 'セーブ'), desc: t5('Exporter, importer ou effacer ta progression', 'Export, import or erase your progress', 'Exportar, importar o borrar tu progreso', 'Exportar, importar ou apagar o progresso', '進行状況の書き出し・読み込み・消去'),
      groups: [[null, ['Sauvegarde', 'Save data', 'Réinitialiser', 'Reset']]] }
  ];
  const OLDKEY = { shaders: 'retro', mobile: 'perf', pc: 'perf', interface: 'general', displayAdvanced: 'display' };
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  function labelOf(row) {
    const l = row.querySelector('label');
    if (l) { for (const n of l.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return n.textContent.trim(); return (l.firstChild && l.firstChild.textContent || '').trim(); }
    if (/▶|écouter|preview|escuchar|ouvir/i.test(row.textContent)) return '#voicepreview';
    return '';
  }
  function sub(parent, text) { const d = document.createElement('div'); d.className = 'opt-sub'; d.textContent = tr(text); parent.appendChild(d); }

  const _build = buildOptions;
  buildOptions = function () {
    const r = _build.apply(this, arguments);
    try {
      const body = document.getElementById('optBody'); if (!body) return r;
      const oldSecs = [...body.querySelectorAll('.opt-section')];
      if (!oldSecs.length) return r;
      const rows = [];
      for (const s of oldSecs) for (const row of s.querySelectorAll('.opt')) if (!row.parentElement.closest('.opt')) rows.push({ row, label: norm(labelOf(row)), used: false });
      const shop = body.querySelector('.opt-shop-link');
      const oldTabs = body.querySelector('#optTabs');
      const made = [];
      for (const S0 of SPEC) {
        const sec = document.createElement('section'); sec.className = 'opt-section'; sec.dataset.section = S0.key;
        sec.innerHTML = '<div class="opt-section-head"><h2 class="opt-section-title"></h2><p class="opt-section-desc"></p></div><div class="opt-section-body"></div>';
        sec.querySelector('.opt-section-title').textContent = tr(S0.title);
        sec.querySelector('.opt-section-desc').textContent = tr(S0.desc);
        const sb = sec.querySelector('.opt-section-body');
        for (const [title, labels] of S0.groups) {
          const want = labels.map(norm), found = [];
          for (const w of want) { const it = rows.find(x => !x.used && x.label === w); if (it) { it.used = true; found.push(it.row); } }
          if (!found.length) continue;
          if (title) sub(sb, title);
          found.forEach(n => sb.appendChild(n));
        }
        made.push(sec);
      }
      const rest = rows.filter(x => !x.used);
      if (rest.length) { const g = made[0].querySelector('.opt-section-body'); sub(g, t5('Autres réglages', 'Other settings', 'Otros ajustes', 'Outras definições', 'その他')); rest.forEach(x => g.appendChild(x.row)); }
      oldSecs.forEach(s => s.remove());
      if (oldTabs) oldTabs.remove();
      const live = made.filter(s => s.querySelector('.opt'));
      live.forEach(s => body.appendChild(s));
      const tabs = document.createElement('nav'); tabs.id = 'optTabs'; tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', tr(t5('Catégories des options', 'Option categories', 'Categorías', 'Categorias', 'カテゴリー')));
      body.insertBefore(tabs, body.firstChild);
      const activate = key => {
        S.opts.optTab = key;
        tabs.querySelectorAll('button[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
        live.forEach(sec => { sec.hidden = sec.dataset.section !== key; sec.setAttribute('aria-hidden', String(sec.hidden)); });
        const cur = tabs.querySelector('button[aria-selected="true"]'); if (cur && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = Math.max(0, cur.offsetLeft - (tabs.clientWidth - cur.offsetWidth) / 2);
      };
      for (const sec of live) {
        const key = sec.dataset.section, spec = SPEC.find(x => x.key === key);
        const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = key; b.textContent = tr(spec.title);
        b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'opt-panel-' + key);
        sec.id = 'opt-panel-' + key; sec.setAttribute('role', 'tabpanel');
        b.onclick = () => { activate(key); saveGame(); try { Audio2.sfx('ui'); } catch (e) { } };
        tabs.appendChild(b);
      }
      if (shop) shop.remove();   /* le hangar est sur l'écran titre */
      let want = OLDKEY[S.opts.optTab] || S.opts.optTab || 'general';
      if (!live.some(s => s.dataset.section === want)) want = live[0].dataset.section;
      activate(want);
    } catch (err) { console.warn('rangement des options', err); }
    return r;
  };
})();
