/* NEO-VANGUARD PINBALL — rendu, audio, entrées et intégration au jeu principal. */
(function () {
  'use strict';

  const E = window.NVPinballEngine;
  if (!E) { console.error('NEO-VANGUARD PINBALL : moteur absent'); return; }

  const DIR = 'pinball/';
  const LANGS = ['fr', 'en', 'es', 'pt', 'ja'];
  const TX = {
    menuLocked: ['Bonus de fin de campagne', 'End-of-campaign bonus', 'Bonus de final de campaña', 'Bónus de fim de campanha', 'キャンペーンクリア特典'],
    menuUnlocked: ['Table bonus · 3 billes', 'Bonus table · 3 balls', 'Mesa bonus · 3 bolas', 'Mesa bónus · 3 bolas', 'ボーナステーブル・3球'],
    locked: ['Verrouillé', 'Locked', 'Bloqueado', 'Bloqueado', 'ロック中'],
    unlocked: ['Débloqué · prêt à jouer', 'Unlocked · ready to play', 'Desbloqueado · listo', 'Desbloqueado · pronto', '解放済み・プレイ可能'],
    lockCopy: ['Termine Neo-Vanguard pour débloquer ce cadeau', 'Finish Neo-Vanguard to unlock this gift', 'Termina Neo-Vanguard para desbloquear este regalo', 'Termina Neo-Vanguard para desbloquear este presente', 'Neo-Vanguardをクリアしてこの特典を解放しよう'],
    unlockedCopy: ['La table Néon Orbit est disponible. Score, missions et record sont indépendants de la campagne.', 'The Neon Orbit table is ready. Score, missions and record are separate from the campaign.', 'La mesa Neon Orbit está lista. Puntos, misiones y récord son independientes de la campaña.', 'A mesa Neon Orbit está pronta. Pontos, missões e recorde são independentes da campanha.', 'ネオンオービット台が解放されました。スコア・ミッション・記録は本編とは別です。'],
    play: ['▶ Jouer', '▶ Play', '▶ Jugar', '▶ Jogar', '▶ プレイ'],
    later: ['Plus tard', 'Later', 'Más tarde', 'Mais tarde', 'あとで'],
    back: ['◀ Retour au menu', '◀ Back to menu', '◀ Volver al menú', '◀ Voltar ao menu', '◀ メニューへ'],
    help: ['? Commandes', '? Controls', '? Controles', '? Controlos', '? 操作'],
    resume: ['Reprendre', 'Resume', 'Continuar', 'Continuar', '再開'],
    restart: ['Nouvelle partie', 'New game', 'Nueva partida', 'Novo jogo', 'ニューゲーム'],
    menu: ['Quitter le flipper', 'Leave pinball', 'Salir del pinball', 'Sair do pinball', 'ピンボールを終了'],
    replay: ['↻ Rejouer', '↻ Replay', '↻ Rejugar', '↻ Jogar novamente', '↻ リプレイ'],
    paused: ['PAUSE', 'PAUSED', 'PAUSA', 'PAUSA', 'ポーズ'],
    gameOver: ['PARTIE TERMINÉE', 'GAME OVER', 'FIN DE LA PARTIDA', 'FIM DE JOGO', 'ゲームオーバー'],
    loading: ['Chargement de la table…', 'Loading table…', 'Cargando mesa…', 'A carregar mesa…', '台を読み込み中…'],
    loadError: ['Ressources introuvables. Vérifie le dossier pinball/.', 'Assets not found. Check the pinball/ folder.', 'No se encontraron los recursos. Revisa la carpeta pinball/.', 'Recursos não encontrados. Verifica a pasta pinball/.', '素材が見つかりません。pinball/ を確認してください。'],
    controls: ['Commandes', 'Controls', 'Controles', 'Controlos', '操作'],
    firstHelp: ['Avant le premier lancer', 'Before your first launch', 'Antes del primer lanzamiento', 'Antes do primeiro lançamento', '最初の発射前に'],
    helpPc: ['← / → ou A / D : batteurs · Espace maintenu puis relâché : lance-bille · Échap : pause', '← / → or A / D: flippers · Hold and release Space: plunger · Esc: pause', '← / → o A / D: flippers · Mantén y suelta Espacio: lanzador · Esc: pausa', '← / → ou A / D: flippers · Mantém e solta Espaço: lançador · Esc: pausa', '← / → または A / D：フリッパー・スペース長押しで発射・Esc：ポーズ'],
    helpTouch: ['Maintiens les zones GAUCHE et DROITE indépendamment. Maintiens LANCER puis relâche.', 'Hold LEFT and RIGHT independently. Hold LAUNCH, then release.', 'Mantén IZQUIERDA y DERECHA por separado. Mantén LANZAR y suelta.', 'Mantém ESQUERDA e DIREITA separadamente. Mantém LANÇAR e solta.', '左右を別々に長押し。発射を長押しして離す。'],
    helpPad: ['Manette : gâchettes / D-pad pour les batteurs, A pour lancer, Start pour la pause.', 'Gamepad: triggers / D-pad for flippers, A to launch, Start to pause.', 'Mando: gatillos / cruceta para los flippers, A para lanzar, Start para pausa.', 'Comando: gatilhos / D-pad para os flippers, A para lançar, Start para pausa.', 'コントローラー：トリガー／十字キーでフリッパー、Aで発射、Startでポーズ。'],
    score: ['Score', 'Score', 'Puntos', 'Pontos', 'スコア'],
    best: ['Record local', 'Local record', 'Récord local', 'Recorde local', 'ローカルレコード'],
    balls: ['Billes', 'Balls', 'Bolas', 'Bolas', '残り球'],
    multiplier: ['Multiplicateur', 'Multiplier', 'Multiplicador', 'Multiplicador', '倍率'],
    sector: ['Secteur', 'Sector', 'Sector', 'Setor', 'セクター'],
    mission: ['Mission', 'Mission', 'Misión', 'Missão', 'ミッション'],
    saver: ['Protection', 'Ball saver', 'Protección', 'Proteção', 'ボールセーバー'],
    giftTitle: ['BONUS DÉBLOQUÉ', 'BONUS UNLOCKED', 'BONUS DESBLOQUEADO', 'BÓNUS DESBLOQUEADO', 'ボーナス解放'],
    giftCopy: ['Néon Orbit rejoint définitivement ton menu principal.', 'Neon Orbit is now permanently available from the main menu.', 'Neon Orbit ya está disponible siempre en el menú principal.', 'Neon Orbit fica disponível para sempre no menu principal.', 'ネオンオービットがメインメニューに追加されました。'],
    newRecord: ['NOUVEAU RECORD !', 'NEW RECORD!', '¡NUEVO RÉCORD!', 'NOVO RECORDE!', '新記録！'],
    pauseShort: ['Pause', 'Pause', 'Pausa', 'Pausa', 'ポーズ'],
    effects: ['Effets réduits', 'Reduced effects', 'Efectos reducidos', 'Efeitos reduzidos', 'エフェクト軽減'],
    mission0: ['Toucher les bumpers', 'Hit the bumpers', 'Golpea los bumpers', 'Toca nos bumpers', 'バンパーに当てる'],
    mission1: ['Valider la rampe gauche', 'Complete the left ramp', 'Completa la rampa izquierda', 'Completa a rampa esquerda', '左ランプを通過'],
    mission2: ['Valider la rampe droite', 'Complete the right ramp', 'Completa la rampa derecha', 'Completa a rampa direita', '右ランプを通過'],
    mission3: ['Compléter les deux banques', 'Complete both target banks', 'Completa los dos bancos', 'Completa os dois bancos', '左右のターゲットを完了'],
    vorax: ['Défi Vorax · réacteur', 'Vorax challenge · reactor', 'Desafío Vorax · reactor', 'Desafio Vorax · reator', 'VORAXチャレンジ・リアクター'],
    rearm: ['Réarmer Vorax · deux banques', 'Rearm Vorax · two banks', 'Rearma Vorax · dos bancos', 'Rearmar Vorax · dois bancos', 'VORAX再起動・2バンク'],
    ballSave: ['BILLE SAUVÉE', 'BALL SAVED', 'BOLA SALVADA', 'BOLA SALVADA', 'ボールセーブ'],
    multiball: ['MULTIBILLE · JACKPOT ACTIF', 'MULTIBALL · JACKPOT ACTIVE', 'MULTIBOLA · JACKPOT ACTIVO', 'MULTIBOLA · JACKPOT ATIVO', 'マルチボール・ジャックポット'],
    jackpot: ['JACKPOT DE RAMPE !', 'RAMP JACKPOT!', '¡JACKPOT DE RAMPA!', 'JACKPOT DA RAMPA!', 'ランプジャックポット！'],
    voraxStart: ['DÉFI VORAX · 5 IMPACTS · 45 S', 'VORAX CHALLENGE · 5 HITS · 45 S', 'DESAFÍO VORAX · 5 IMPACTOS · 45 S', 'DESAFIO VORAX · 5 IMPACTOS · 45 S', 'VORAX・5回命中・45秒'],
    voraxWin: ['VORAX VAINCU · 100 000', 'VORAX DEFEATED · 100,000', 'VORAX VENCIDO · 100 000', 'VORAX VENCIDO · 100 000', 'VORAX撃破・100,000'],
    voraxFailed: ['VORAX ÉCHAPPÉ · DEUX BANQUES POUR RÉARMER', 'VORAX ESCAPED · TWO BANKS TO REARM', 'VORAX ESCAPÓ · DOS BANCOS PARA REARMAR', 'VORAX ESCAPOU · DOIS BANCOS PARA REARMAR', 'VORAX失敗・2バンクで再挑戦'],
    sectorDone: ['SECTEUR {n} VALIDÉ', 'SECTOR {n} COMPLETE', 'SECTOR {n} COMPLETADO', 'SETOR {n} CONCLUÍDO', 'セクター{n}完了'],
    multiplierUp: ['MULTIPLICATEUR ×{n}', 'MULTIPLIER ×{n}', 'MULTIPLICADOR ×{n}', 'MULTIPLICADOR ×{n}', '倍率 ×{n}'],
    launchHelp: ['MAINTIENS PUIS RELÂCHE LE LANCE-BILLE', 'HOLD, THEN RELEASE THE PLUNGER', 'MANTÉN Y SUELTA EL LANZADOR', 'MANTÉM E SOLTA O LANÇADOR', '長押しして離して発射'],
    touchLeft: ['◀ GAUCHE', '◀ LEFT', '◀ IZQUIERDA', '◀ ESQUERDA', '◀ 左'],
    touchRight: ['DROITE ▶', 'RIGHT ▶', 'DERECHA ▶', 'DIREITA ▶', '右 ▶'],
    touchLaunch: ['▲ LANCER', '▲ LAUNCH', '▲ LANZAR', '▲ LANÇAR', '▲ 発射'],
    touchHold: ['MAINTENIR', 'HOLD', 'MANTENER', 'MANTER', '長押し']
  };

  const IMAGE_SOURCES = {
    table: DIR + 'assets/02_plateau_statique.png',
    mechanisms: DIR + 'assets/03_mecanismes_4x4.png',
    effects: DIR + 'assets/04_effets_4x4.png',
    ui: DIR + 'assets/06_interface_4x4.png'
  };
  const SOUND_SOURCES = {
    drain: 'bille_perdue.wav', bonus: 'bonus_debloque.wav', bumperCyan: 'bumper_cyan.wav',
    bumperMagenta: 'bumper_magenta.wav', targetDown: 'cible_abaissee.wav', target: 'cible_touchee.wav',
    over: 'fin_partie.wav', right: 'flipper_droit.wav', left: 'flipper_gauche.wav',
    jackpot: 'jackpot.wav', launch: 'lance_bille.wav', navigate: 'menu_navigation.wav',
    validate: 'menu_validation.wav', multiball: 'multibille.wav', ramp: 'rampe_validee.wav',
    metal: 'rebond_metal.wav', sector: 'secteur_valide.wav'
  };
  const GRID = [0, 314, 627, 940, 1254];
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const systemReduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  let root, canvas, ctx;
  let ui = {};
  let assets = null, loadPromise = null, railLayer = null;
  let game = null, raf = 0, lastTime = 0, session = 0;
  let running = false, loading = false, helpReturn = 'game';
  let listeners = [];
  let effects = [], popups = [], bumperFlash = [0, 0, 0];
  let messageUntil = 0, hudAt = 0, pendingGift = false, finaleFinished = false;
  let music = null;
  const soundPools = new Map();
  const activeSounds = [];
  const inputs = { left: new Set(), right: new Set(), plunger: new Set() };
  const pad = { left: false, right: false, plunger: false, pause: false };
  const memoryStore = { completed: false, giftSeen: false, best: 0, helpSeen: false, reducedEffects: systemReduced };

  function langIndex() {
    try { const current = typeof LANG !== 'undefined' ? LANG : window.LANG; const i = LANGS.indexOf(current); return i < 0 ? 0 : i; } catch (e) { return 0; }
  }
  function t(key, vars) {
    const row = TX[key] || [key];
    let text = row[langIndex()] || row[1] || row[0];
    if (vars) for (const k in vars) text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
    return text;
  }
  function fmt(n) { return Math.max(0, Math.floor(Number(n) || 0)).toLocaleString(langIndex() === 4 ? 'ja-JP' : langIndex() === 0 ? 'fr-FR' : 'en-US'); }
  function store() {
    try {
      if (typeof S !== 'undefined' && S && typeof S === 'object') {
        if (!S.pinball || typeof S.pinball !== 'object') S.pinball = {};
        const st = S.pinball;
        for (const k of ['completed', 'giftSeen', 'helpSeen']) if (typeof st[k] !== 'boolean') st[k] = !!memoryStore[k];
        if (!Number.isFinite(st.best)) st.best = memoryStore.best || 0;
        if (typeof st.reducedEffects !== 'boolean') st.reducedEffects = systemReduced;
        return st;
      }
    } catch (e) {}
    return memoryStore;
  }
  function persist() {
    const st = store();
    Object.assign(memoryStore, st);
    try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
  }
  function isFlipperUnlocked() {
    const st = store();
    try { return !!st.completed || (typeof S !== 'undefined' && ((S.victories | 0) > 0 || (S.nvCleared | 0) >= 24)); } catch (e) { return !!st.completed; }
  }
  function reducedEffects() { return !!store().reducedEffects || systemReduced; }
  function mainMusicStop() {
    try { if (typeof mxStop === 'function') mxStop(0.12); } catch (e) {}
    try { if (typeof Audio2 !== 'undefined') Audio2.stopMusic(); } catch (e) {}
  }
  function sfxVolume() {
    try { return Audio2.muted ? 0 : Math.max(0, Math.min(1, (S.opts.sfx | 0) / 100)); } catch (e) { return 0.7; }
  }
  function musicVolume() {
    try { return Audio2.muted ? 0 : Math.max(0, Math.min(1, (S.opts.music | 0) / 100)) * 0.55; } catch (e) { return 0.3; }
  }

  function buildUI() {
    root = document.getElementById('scr-flipper-menu');
    if (!root) return false;
    root.innerHTML = `
      <div class="nvp-view nvp-menu-view" id="nvpMenuView">
        <section class="nvp-menu-card" aria-labelledby="nvpMenuTitle">
          <div class="nvp-brand"><h1 id="nvpMenuTitle">NEO-VANGUARD <span>PINBALL</span></h1><p>NEON ORBIT · FIXED TABLE · 1024 × 1536</p></div>
          <div style="text-align:center"><span class="nvp-status" id="nvpMenuStatus"></span></div>
          <p class="nvp-lock-copy" id="nvpMenuCopy"></p>
          <img class="nvp-menu-art" id="nvpMenuArt" alt="Neo-Vanguard Pinball" hidden>
          <div class="nvp-record-row">
            <div class="nvp-record-chip"><small data-label="best"></small><b id="nvpMenuBest">0</b></div>
            <div class="nvp-record-chip"><small data-label="balls"></small><b>3</b></div>
            <div class="nvp-record-chip"><small data-label="sector"></small><b>24</b></div>
          </div>
          <div class="nvp-actions">
            <button class="nvp-btn primary" id="btnPlayFlipper" data-nvp="play"></button>
            <button class="nvp-btn" data-nvp="menuHelp"></button>
            <button class="nvp-btn" data-nvp="back"></button>
          </div>
          <div id="nvpMenuHelp" hidden style="max-width:650px;margin:18px auto 0;color:#b9cbe4;font-size:13px;line-height:1.6;text-align:left">
            <p data-help="pc"></p><p data-help="touch"></p><p data-help="pad"></p>
          </div>
        </section>
      </div>
      <div class="nvp-view nvp-gift-view" id="nvpGiftView" hidden>
        <section class="nvp-gift-card">
          <img id="nvpGiftArt" alt="Neo-Vanguard Pinball — bonus">
          <h2>${t('giftTitle')}</h2><p>${t('giftCopy')}</p>
          <div class="nvp-actions"><button class="nvp-btn amber" data-nvp="giftPlay">${t('play')}</button><button class="nvp-btn" data-nvp="later">${t('later')}</button></div>
        </section>
      </div>
      <div class="nvp-view nvp-game-view" id="nvpGameView" hidden>
        <header class="nvp-topbar">
          <div class="nvp-top-title"><b>NEO-VANGUARD PINBALL</b><small>NEON ORBIT · PHYSICS 240 HZ</small></div>
          <div class="nvp-top-actions">
            <button class="nvp-icon-btn" data-nvp="effects" id="nvpEffects" title="${t('effects')}">FX</button>
            <button class="nvp-icon-btn" data-nvp="help" aria-label="${t('controls')}">?</button>
            <button class="nvp-icon-btn" data-nvp="pause" aria-label="${t('pauseShort')}">Ⅱ</button>
            <button class="nvp-icon-btn" data-nvp="back" aria-label="${t('back')}">⌂</button>
          </div>
        </header>
        <div class="nvp-layout">
          <aside class="nvp-hud">
            <div class="nvp-hud-block score"><span class="nvp-hud-label" data-label="score"></span><b id="flipScore">0</b></div>
            <div class="nvp-hud-block"><span class="nvp-hud-label" data-label="best"></span><div class="nvp-hud-line"><b id="nvpBest">0</b></div></div>
            <div class="nvp-hud-block">
              <div class="nvp-hud-line"><span data-label="balls"></span><b id="flipBalls">3</b></div>
              <div class="nvp-hud-line"><span data-label="multiplier"></span><b class="nvp-multiplier" id="nvpMultiplier">×1</b></div>
              <div class="nvp-hud-line nvp-saver" id="nvpSaver" hidden><span data-label="saver"></span><b id="nvpSaverTime">8.0</b></div>
            </div>
          </aside>
          <div class="nvp-table-wrap" id="nvpTableWrap">
            <canvas id="flipperCanvas" width="1024" height="1536" aria-label="Table Neo-Vanguard Pinball"></canvas>
            <div class="nvp-canvas-message" id="nvpCanvasMessage"></div>
            <div class="nvp-overlay" id="nvpOverlay" hidden><div class="nvp-dialog" id="nvpDialog"></div></div>
          </div>
          <aside class="nvp-hud">
            <div class="nvp-hud-block"><span class="nvp-hud-label" data-label="sector"></span><div class="nvp-mission-name" id="nvpSectorName">—</div><div class="nvp-mission-console" id="nvpConsole">—</div></div>
            <div class="nvp-hud-block"><span class="nvp-hud-label" data-label="mission"></span><div class="nvp-mission-objective" id="nvpMission">—</div><div class="nvp-progress"><i id="nvpMissionFill"></i></div></div>
            <div class="nvp-hud-block"><div class="nvp-mission-objective" data-help="pc"></div></div>
          </aside>
        </div>
        <div class="nvp-touch-controls" aria-label="${t('controls')}">
          <button class="nvp-hold left" data-nvp-hold="left">◀ GAUCHE</button>
          <button class="nvp-hold plunger" data-nvp-hold="plunger">▲ LANCER<br><small>MAINTENIR</small></button>
          <button class="nvp-hold right" data-nvp-hold="right">DROITE ▶</button>
        </div>
      </div>`;
    canvas = document.getElementById('flipperCanvas');
    ctx = canvas.getContext('2d', { alpha: false });
    const ids = ['nvpMenuView', 'nvpGiftView', 'nvpGameView', 'nvpMenuStatus', 'nvpMenuCopy', 'nvpMenuArt', 'nvpMenuBest', 'nvpGiftArt', 'nvpOverlay', 'nvpDialog', 'nvpCanvasMessage', 'nvpBest', 'nvpMultiplier', 'nvpSaver', 'nvpSaverTime', 'nvpSectorName', 'nvpConsole', 'nvpMission', 'nvpMissionFill', 'nvpEffects', 'nvpMenuHelp'];
    for (const id of ids) ui[id] = document.getElementById(id);
    ui.score = document.getElementById('flipScore');
    ui.balls = document.getElementById('flipBalls');
    ui.play = document.getElementById('btnPlayFlipper');

    root.addEventListener('click', onAction);
    refreshFlipperButton();
    return true;
  }

  function showView(name) {
    ui.nvpMenuView.hidden = name !== 'menu';
    ui.nvpGiftView.hidden = name !== 'gift';
    ui.nvpGameView.hidden = name !== 'game';
  }

  function refreshFlipperButton() {
    if (!root) return;
    const unlocked = isFlipperUnlocked();
    document.querySelectorAll('[data-act="flipper-menu"]').forEach(tile => {
      tile.hidden = false;
      tile.style.display = '';
      tile.classList.toggle('nvp-locked', !unlocked);
      const sub = tile.querySelector('i');
      if (sub) sub.textContent = unlocked ? t('menuUnlocked') : t('menuLocked');
      const label = tile.querySelector('b');
      if (label) label.textContent = unlocked ? 'Flipper · Néon Orbit' : 'Flipper · 🔒';
    });
    ui.nvpMenuStatus.textContent = unlocked ? t('unlocked') : t('locked');
    ui.nvpMenuStatus.classList.toggle('unlocked', unlocked);
    ui.nvpMenuCopy.textContent = unlocked ? t('unlockedCopy') : t('lockCopy');
    ui.nvpMenuArt.hidden = !unlocked;
    if (unlocked && !ui.nvpMenuArt.src) ui.nvpMenuArt.src = DIR + 'assets/05_menu_deblocage.png';
    ui.nvpMenuBest.textContent = fmt(store().best);
    ui.play.disabled = !unlocked;
    ui.play.textContent = t('play');
    const buttons = root.querySelectorAll('[data-nvp="back"]');
    buttons.forEach(b => { if (!b.classList.contains('nvp-icon-btn')) b.textContent = t('back'); });
    const helpButton = root.querySelector('[data-nvp="menuHelp"]');
    if (helpButton) helpButton.textContent = t('help');
    root.querySelectorAll('[data-label]').forEach(el => { el.textContent = t(el.dataset.label); });
    root.querySelectorAll('[data-help]').forEach(el => { el.textContent = t('help' + el.dataset.help[0].toUpperCase() + el.dataset.help.slice(1)); });
    ui.nvpEffects.classList.toggle('active', reducedEffects());
    ui.nvpEffects.title = t('effects');
    const gift = root.querySelector('.nvp-gift-card');
    if (gift) {
      gift.querySelector('h2').textContent = t('giftTitle');
      gift.querySelector('p').textContent = t('giftCopy');
      gift.querySelector('[data-nvp="giftPlay"]').textContent = t('play');
      gift.querySelector('[data-nvp="later"]').textContent = t('later');
    }
    const touch = root.querySelector('.nvp-touch-controls');
    if (touch) {
      touch.setAttribute('aria-label', t('controls'));
      touch.querySelector('[data-nvp-hold="left"]').textContent = t('touchLeft');
      touch.querySelector('[data-nvp-hold="right"]').textContent = t('touchRight');
      touch.querySelector('[data-nvp-hold="plunger"]').innerHTML = t('touchLaunch') + '<br><small>' + t('touchHold') + '</small>';
    }
    const help = root.querySelector('[data-nvp="help"]');
    const pause = root.querySelector('[data-nvp="pause"]');
    const home = root.querySelector('.nvp-top-actions [data-nvp="back"]');
    if (help) help.setAttribute('aria-label', t('controls'));
    if (pause) pause.setAttribute('aria-label', t('pauseShort'));
    if (home) home.setAttribute('aria-label', t('back'));
  }

  function showMenu() {
    stopGame();
    showView('menu');
    refreshFlipperButton();
  }

  function showGift() {
    if (!isFlipperUnlocked() || running) return;
    const st = store();
    st.giftSeen = true;
    persist();
    showView('gift');
    ui.nvpGiftArt.src = DIR + 'assets/05_menu_deblocage.png';
    try {
      G.prevScreen = 'title'; G.state = 'flipper-menu'; showScreen('flipper-menu');
    } catch (e) {}
    mainMusicStop();
    playSound('bonus', 0.8);
  }

  function markCompleted() {
    const st = store();
    const first = !st.completed;
    st.completed = true;
    if (!st.giftSeen) pendingGift = true;
    persist();
    refreshFlipperButton();
    if (first) {
      try { window.dispatchEvent(new CustomEvent('nv:pinball-complete', { detail: { best: st.best } })); } catch (e) {}
    }
  }

  function installHooks() {
    if (installHooks.done) return;
    installHooks.done = true;
    try {
      const previousVictory = showVictoryScreen;
      showVictoryScreen = function () {
        const out = previousVictory.apply(this, arguments);
        markCompleted();
        return out;
      };
    } catch (e) {}
    try {
      const previousRefresh = refreshUI;
      refreshUI = function () {
        const out = previousRefresh.apply(this, arguments);
        refreshFlipperButton();
        return out;
      };
    } catch (e) {}
    try {
      window.addEventListener('nv:finale-finished', () => { finaleFinished = true; });
      const previousTitle = backToTitle;
      backToTitle = function () {
        const offerGift = pendingGift && finaleFinished;
        finaleFinished = false;
        const out = previousTitle.apply(this, arguments);
        if (offerGift) { pendingGift = false; showGift(); }
        return out;
      };
    } catch (e) {}
    try {
      const previousLang = lSetLang;
      lSetLang = function () {
        const out = previousLang.apply(this, arguments);
        refreshFlipperButton();
        return out;
      };
    } catch (e) {}
  }

  function loadAssets() {
    if (assets) return Promise.resolve(assets);
    if (loadPromise) return loadPromise;
    const entries = Object.entries(IMAGE_SOURCES);
    loadPromise = Promise.all(entries.map(([key, src]) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve([key, image]);
      image.onerror = () => reject(new Error(src));
      image.src = src;
    }))).then(list => {
      assets = {};
      for (const [key, image] of list) assets[key] = image;
      buildRailLayer();
      return assets;
    }).catch(err => { loadPromise = null; throw err; });
    return loadPromise;
  }

  function buildRailLayer() {
    railLayer = document.createElement('canvas');
    railLayer.width = E.WIDTH; railLayer.height = E.HEIGHT;
    const g = railLayer.getContext('2d');
    g.drawImage(assets.table, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    g.strokeStyle = '#fff';
    g.lineWidth = 88;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const side of ['left', 'right']) {
      const ramp = E.RAMPS[side];
      g.beginPath();
      ramp.points.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  }

  function ensureMusic() {
    if (music) return music;
    music = new Audio(DIR + 'audio/musique_neon_orbit_120bpm_boucle_32s.wav');
    music.loop = true;
    music.preload = 'auto';
    return music;
  }
  function startMusic() {
    const a = ensureMusic();
    a.volume = musicVolume();
    const promise = a.play();
    if (promise && promise.catch) promise.catch(() => {});
  }
  function duckMusic(duck) { if (music) music.volume = musicVolume() * (duck ? 0.16 : 1); }
  function stopAudio() {
    if (music) { music.pause(); try { music.currentTime = 0; } catch (e) {} }
    while (activeSounds.length) { const a = activeSounds.pop(); try { a.pause(); a.currentTime = 0; } catch (e) {} }
  }
  function playSound(name, gain, vary) {
    const file = SOUND_SOURCES[name];
    const volume = sfxVolume();
    if (!file || volume <= 0) return;
    if (activeSounds.length >= (coarse ? 6 : 10)) {
      const old = activeSounds.shift();
      try { old.pause(); old.currentTime = 0; } catch (e) {}
    }
    let pool = soundPools.get(name);
    if (!pool) { pool = []; soundPools.set(name, pool); }
    let a = pool.find(item => item.paused || item.ended);
    if (!a) {
      if (pool.length >= 3) return;
      a = new Audio(DIR + 'audio/' + file);
      a.preload = 'auto';
      pool.push(a);
    }
    a.volume = Math.max(0, Math.min(1, volume * (gain === undefined ? 0.72 : gain)));
    if (vary) a.playbackRate = 0.96 + Math.random() * 0.08;
    else a.playbackRate = 1;
    try { a.currentTime = 0; } catch (e) {}
    if (!activeSounds.includes(a)) activeSounds.push(a);
    a.onended = () => { const i = activeSounds.indexOf(a); if (i >= 0) activeSounds.splice(i, 1); };
    const promise = a.play();
    if (promise && promise.catch) promise.catch(() => {});
  }

  function onAction(event) {
    const button = event.target.closest('[data-nvp]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    const action = button.dataset.nvp;
    try { if (typeof Audio2 !== 'undefined') { Audio2.init(); Audio2.unlock(); } } catch (e) {}
    if (!['play', 'giftPlay'].includes(action)) playSound('navigate', 0.45);
    switch (action) {
      case 'play': case 'giftPlay': play(); break;
      case 'back': back(); break;
      case 'later': stopGame(); try { backToTitle(); } catch (e) { showMenu(); } break;
      case 'menuHelp': ui.nvpMenuHelp.hidden = !ui.nvpMenuHelp.hidden; break;
      case 'pause': togglePause(); break;
      case 'resume': resume(); break;
      case 'help': showHelp('game'); break;
      case 'helpClose': closeHelp(); break;
      case 'restart': case 'replay': restart(); break;
      case 'effects':
        store().reducedEffects = !store().reducedEffects;
        persist(); refreshFlipperButton();
        break;
    }
  }

  async function play() {
    if (!isFlipperUnlocked() || running || loading) return;
    const id = ++session;
    loading = true;
    showView('game');
    mainMusicStop();
    startMusic();                         /* appel direct depuis le geste utilisateur */
    showLoading();
    try {
      await loadAssets();
      if (id !== session) return;
      beginSession();
    } catch (err) {
      console.error('NEO-VANGUARD PINBALL — chargement', err);
      if (id === session) showError();
    } finally {
      if (id === session) loading = false;
    }
  }

  function beginSession() {
    stopInput();
    game = new E.Game();
    running = true;
    effects = []; popups = []; bumperFlash = [0, 0, 0];
    messageUntil = 0;
    bindInput();
    lastTime = performance.now();
    if (!store().helpSeen) {
      helpReturn = 'first';
      game.setPaused(true);
      showHelp('first');
      showCanvasMessage(t('launchHelp'), 4000);
    } else hideOverlay();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function restart() {
    if (!game || !assets) return;
    stopInput();
    game.start();
    running = true;
    effects = []; popups = []; bumperFlash = [0, 0, 0];
    bindInput();
    hideOverlay();
    duckMusic(false);
    startMusic();
    lastTime = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stopGame() {
    session++;
    loading = false;
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    stopInput();
    stopAudio();
    if (game) game.releaseControls();
    game = null;
    hideOverlay();
  }

  function back() {
    stopGame();
    try {
      if (typeof gotoReturn === 'function') gotoReturn();
      else if (typeof backToTitle === 'function') backToTitle();
      else showMenu();
    } catch (e) { showMenu(); }
  }

  function showLoading() {
    ui.nvpOverlay.hidden = false;
    ui.nvpDialog.innerHTML = `<h2>NEON ORBIT</h2><p>${t('loading')}</p><div class="nvp-loading"><i></i></div>`;
  }
  function showError() {
    ui.nvpOverlay.hidden = false;
    ui.nvpDialog.innerHTML = `<h2>⚠</h2><p>${t('loadError')}</p><div class="nvp-actions"><button class="nvp-btn" data-nvp="back">${t('back')}</button></div>`;
  }
  function hideOverlay() { if (ui.nvpOverlay) ui.nvpOverlay.hidden = true; }

  function showHelp(mode) {
    if (!game) return;
    helpReturn = mode === 'first' ? 'first' : (game.paused ? 'pause' : 'game');
    game.setPaused(true);
    releaseAllInputs();
    duckMusic(true);
    ui.nvpOverlay.hidden = false;
    ui.nvpDialog.innerHTML = `<h2>${mode === 'first' ? t('firstHelp') : t('controls')}</h2>
      <div class="nvp-help-grid"><div><b>PC</b>${t('helpPc')}</div><div><b>TOUCH</b>${t('helpTouch')}</div></div>
      <p>${t('helpPad')}</p><p>${t('launchHelp')}</p>
      <div class="nvp-actions"><button class="nvp-btn primary" data-nvp="helpClose">${mode === 'first' ? t('play') : t('resume')}</button></div>`;
  }
  function closeHelp() {
    if (!game) return;
    if (helpReturn === 'first') { store().helpSeen = true; persist(); }
    if (helpReturn === 'pause') { showPause(); return; }
    resume();
  }
  function showPause() {
    if (!game) return;
    game.setPaused(true);
    releaseAllInputs();
    duckMusic(true);
    ui.nvpOverlay.hidden = false;
    ui.nvpDialog.innerHTML = `<h2>${t('paused')}</h2><div class="nvp-actions"><button class="nvp-btn primary" data-nvp="resume">${t('resume')}</button><button class="nvp-btn" data-nvp="restart">${t('restart')}</button><button class="nvp-btn danger" data-nvp="back">${t('menu')}</button></div>`;
  }
  function showGameOver(score) {
    const st = store();
    const record = score > (st.best || 0);
    if (record) { st.best = score; persist(); }
    duckMusic(true);
    ui.nvpOverlay.hidden = false;
    ui.nvpDialog.innerHTML = `<h2>${t('gameOver')}</h2>${record ? `<p style="color:#ffd166">${t('newRecord')}</p>` : ''}<div class="nvp-big-score">${fmt(score)}</div><p>${t('best')} · ${fmt(st.best)}</p><div class="nvp-actions"><button class="nvp-btn primary" data-nvp="replay">${t('replay')}</button><button class="nvp-btn" data-nvp="back">${t('back')}</button></div>`;
    refreshFlipperButton();
  }
  function togglePause() {
    if (!game || !running || game.state === 'over') return;
    if (game.paused && !ui.nvpOverlay.hidden && helpReturn === 'pause') { resume(); return; }
    if (game.paused) resume(); else showPause();
  }
  function resume() {
    if (!game) return;
    hideOverlay();
    game.setPaused(false);
    pad.left = pad.right = pad.plunger = false;
    duckMusic(false);
    lastTime = performance.now();
  }

  function listen(target, type, fn, options) {
    target.addEventListener(type, fn, options);
    listeners.push([target, type, fn, options]);
  }
  function setInput(control, source, held) {
    if (!game) return;
    const set = inputs[control];
    const wasHeld = set.size > 0;
    if (held) set.add(source); else set.delete(source);
    const isHeld = set.size > 0;
    if (wasHeld === isHeld) return;
    if (control === 'plunger') game.setPlunger(isHeld);
    else game.setFlipper(control, isHeld);
  }
  function cancelInput(control, source) {
    if (!game) return;
    inputs[control].delete(source);
    if (control === 'plunger' && !inputs.plunger.size) {
      game.plungerHeld = false;
      for (const ball of game.balls) if (ball.ready) ball.charge = 0;
    } else if (control !== 'plunger') game.setFlipper(control, inputs[control].size > 0);
  }
  function releaseAllInputs() {
    for (const key in inputs) inputs[key].clear();
    document.querySelectorAll('[data-nvp-hold].pressed').forEach(el => el.classList.remove('pressed'));
    if (game) {
      game.releaseControls();
      for (const ball of game.balls) if (ball.ready) ball.charge = 0;
    }
  }
  function bindHold(button) {
    const control = button.dataset.nvpHold;
    const active = new Set();
    const down = event => {
      if (!game || game.paused || game.state === 'over') return;
      event.preventDefault(); event.stopPropagation();
      try { button.setPointerCapture(event.pointerId); } catch (e) {}
      active.add(event.pointerId);
      button.classList.add('pressed');
      setInput(control, 'pointer-' + event.pointerId, true);
    };
    const up = event => {
      if (!active.has(event.pointerId)) return;
      event.preventDefault(); event.stopPropagation();
      active.delete(event.pointerId);
      if (!active.size) button.classList.remove('pressed');
      setInput(control, 'pointer-' + event.pointerId, false);
    };
    const cancel = event => {
      if (!active.has(event.pointerId)) return;
      active.delete(event.pointerId);
      if (!active.size) button.classList.remove('pressed');
      cancelInput(control, 'pointer-' + event.pointerId);
    };
    listen(button, 'pointerdown', down, { passive: false });
    listen(button, 'pointerup', up, { passive: false });
    listen(button, 'pointercancel', cancel, { passive: false });
    listen(button, 'lostpointercapture', cancel, { passive: false });
    listen(button, 'contextmenu', event => event.preventDefault());
  }
  function bindInput() {
    releaseAllInputs();
    const keyMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'plunger' };
    listen(window, 'keydown', event => {
      if (!running || !game) return;
      if (event.code === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) togglePause();
        return;
      }
      const control = keyMap[event.code];
      if (!control) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!game.paused && game.state !== 'over') setInput(control, 'key-' + event.code, true);
    }, true);
    listen(window, 'keyup', event => {
      const control = keyMap[event.code];
      if (!control || !game) return;
      event.preventDefault(); event.stopImmediatePropagation();
      setInput(control, 'key-' + event.code, false);
    }, true);
    document.querySelectorAll('[data-nvp-hold]').forEach(bindHold);
    listen(window, 'blur', () => { releaseAllInputs(); if (game && running && !game.paused && game.state !== 'over') showPause(); });
    listen(document, 'visibilitychange', () => { if (document.hidden) { releaseAllInputs(); if (game && running && !game.paused && game.state !== 'over') showPause(); } });
  }
  function stopInput() {
    releaseAllInputs();
    for (const [target, type, fn, options] of listeners) target.removeEventListener(type, fn, options);
    listeners = [];
    for (const key in pad) pad[key] = false;
  }

  function pollGamepad() {
    if (!game || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let p = null;
    for (const item of pads) if (item && item.connected) { p = item; break; }
    if (!p) return;
    const pressed = i => !!(p.buttons[i] && p.buttons[i].pressed);
    const state = {
      left: pressed(6) || pressed(4) || pressed(14) || (p.axes[0] || 0) < -0.55,
      right: pressed(7) || pressed(5) || pressed(15) || (p.axes[0] || 0) > 0.55,
      plunger: pressed(0),
      pause: pressed(9)
    };
    for (const key of ['left', 'right', 'plunger']) {
      if (state[key] !== pad[key] && !game.paused && game.state !== 'over') setInput(key, 'gamepad-' + key, state[key]);
      pad[key] = state[key];
    }
    if (state.pause && !pad.pause) togglePause();
    pad.pause = state.pause;
  }

  function showCanvasMessage(text, duration) {
    ui.nvpCanvasMessage.textContent = text;
    ui.nvpCanvasMessage.classList.add('show');
    messageUntil = performance.now() + (duration || 1800);
  }
  function addEffect(kind, x, y, size) {
    const cap = reducedEffects() ? 8 : (coarse ? 20 : 40);
    if (effects.length >= cap) effects.shift();
    effects.push({ kind, x, y, size: size || 160, t: 0, duration: reducedEffects() ? 0.12 : 0.2 });
  }
  function addPopup(text, x, y, color) {
    if (popups.length >= 12) popups.shift();
    popups.push({ text, x, y, color: color || '#ffd166', t: 0, duration: 0.9 });
  }

  function handleEvents(events) {
    for (const event of events) {
      switch (event.type) {
        case 'launch':
          messageUntil = 0;
          if (ui.nvpCanvasMessage) ui.nvpCanvasMessage.classList.remove('show');
          playSound('launch', 0.72);
          break;
        case 'flipper': playSound(event.side, 0.48); break;
        case 'metal': playSound('metal', 0.3, true); break;
        case 'post': case 'sling': playSound('metal', 0.52, true); addEffect('spark', event.x, event.y, 105); break;
        case 'bumper':
          bumperFlash[event.index] = 0.17;
          playSound(event.index % 2 ? 'bumperMagenta' : 'bumperCyan', 0.68, true);
          addEffect(event.index % 2 ? 'magenta' : 'cyan', event.x, event.y, 185);
          break;
        case 'target': playSound('target', 0.62); addEffect('spark', event.x, event.y, 110); break;
        case 'bank': playSound('targetDown', 0.7); playSound('bonus', 0.5); showCanvasMessage(event.side === 'left' ? 'BANQUE CYAN · 5 000' : 'BANQUE MAGENTA · 5 000'); break;
        case 'multiplier': playSound('bonus', 0.65); showCanvasMessage(t('multiplierUp', { n: event.value })); break;
        case 'rampEnter': break;
        case 'ramp': playSound('ramp', 0.72); addEffect(event.side === 'left' ? 'cyan' : 'magenta', event.x, event.y, 200); break;
        case 'jackpot': playSound('jackpot', 0.82); showCanvasMessage(t('jackpot')); addEffect('spark', event.x, event.y, 260); break;
        case 'sector': playSound('sector', 0.75); showCanvasMessage(t('sectorDone', { n: event.sector }), 2300); break;
        case 'voraxStart': playSound('bonus', 0.75); showCanvasMessage(t('voraxStart'), 2800); break;
        case 'reactor': playSound('bumperMagenta', 0.8); addEffect('magenta', event.x, event.y, 240); break;
        case 'voraxWin': playSound('jackpot', 0.9); showCanvasMessage(t('voraxWin'), 2800); break;
        case 'multiball': playSound('multiball', 0.85); showCanvasMessage(t('multiball'), 2500); break;
        case 'voraxFailed': playSound('drain', 0.55); showCanvasMessage(t('voraxFailed'), 2800); break;
        case 'ballSave': playSound('bonus', 0.68); showCanvasMessage(t('ballSave')); break;
        case 'drain': playSound('drain', 0.58); break;
        case 'gameOver': playSound('over', 0.78); showGameOver(event.score); break;
        case 'score': if (event.base >= 500) addPopup('+' + fmt(event.points), event.x, event.y - 35, event.kind === 'jackpot' ? '#ff5bd8' : '#ffd166'); break;
      }
    }
  }

  function sourceRect(index) {
    const col = index % 4, row = Math.floor(index / 4);
    return [GRID[col], GRID[row], GRID[col + 1] - GRID[col], GRID[row + 1] - GRID[row]];
  }
  function drawFrame(image, index, x, y, width, height, alpha) {
    const r = sourceRect(index);
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(image, r[0], r[1], r[2], r[3], x - width / 2, y - height / 2, width, height);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }
  function drawFlipper(f) {
    const left = f.side === 'left';
    const r = sourceRect(left ? 0 : 1);
    const scale = f.length / (left ? 218 : 227);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(left ? f.angle : f.angle - Math.PI);
    ctx.scale(scale, scale);
    ctx.drawImage(assets.mechanisms, r[0], r[1], r[2], r[3], left ? -75 : -250, -164, r[2], r[3]);
    ctx.restore();
  }
  function drawInserts(time) {
    const calm = reducedEffects();
    ctx.save();
    if (!calm) ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const on = Math.floor(time * 8) % 5 === i;
      ctx.globalAlpha = calm ? 0.45 : (on ? 0.95 : 0.28);
      ctx.fillStyle = on ? '#ffe58a' : '#d89b32';
      ctx.beginPath();
      ctx.moveTo(512, 592 + i * 49);
      ctx.lineTo(498, 615 + i * 49);
      ctx.lineTo(526, 615 + i * 49);
      ctx.closePath(); ctx.fill();
    }
    for (const side of ['left', 'right']) {
      const ramp = E.RAMPS[side];
      for (let i = 0; i < 8; i++) {
        const phase = ((time * 0.75 + i / 8) % 1);
        const p = E.sampleRamp(ramp, phase * ramp.length);
        ctx.globalAlpha = calm ? 0.18 : 0.2 + 0.5 * Math.sin((phase + time) * Math.PI) ** 2;
        ctx.fillStyle = side === 'left' ? '#61e8ff' : '#ff64d8';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawMechanisms(time) {
    for (const target of game.targets) {
      const index = target.down ? 10 : ((game.missionType() === 3 && !game.campaignComplete) ? 9 : 8);
      drawFrame(assets.mechanisms, index, target.x, target.y + (target.down ? 13 : 0), 59, 59);
    }
    for (let i = 0; i < E.BUMPERS.length; i++) {
      const b = E.BUMPERS[i];
      const flash = bumperFlash[i];
      const index = flash > 0.1 ? 6 : (flash > 0 ? 5 : 4);
      const scale = flash > 0.1 ? 0.94 : 1;
      drawFrame(assets.mechanisms, index, b.x, b.y, 142 * scale, 142 * scale);
    }
    for (const p of E.POSTS) drawFrame(assets.mechanisms, 7, p.x, p.y, 51, 51);
    for (const f of game.flippers) drawFlipper(f);

    if (game.challenge) {
      const pulse = 0.5 + 0.5 * Math.sin(time * (reducedEffects() ? 3 : 8));
      ctx.save();
      ctx.globalAlpha = 0.35 + pulse * 0.45;
      ctx.strokeStyle = '#ff334f'; ctx.lineWidth = 5 + pulse * 4;
      if (!reducedEffects()) { ctx.shadowColor = '#ff183e'; ctx.shadowBlur = 25; }
      ctx.beginPath(); ctx.arc(E.REACTOR.x, E.REACTOR.y, E.REACTOR.r + 7 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }
  function drawBall(ball, shadow) {
    if (shadow) {
      drawFrame(assets.mechanisms, 15, ball.x + 5, ball.y + 10, 50, 50, ball.ramp ? 0.18 : 0.42);
      return;
    }
    const index = ball.x < 400 ? 13 : (ball.x > 630 ? 14 : 12);
    drawFrame(assets.mechanisms, index, ball.x, ball.y, 55, 55);
  }
  function drawEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      fx.t += dt;
      const p = fx.t / fx.duration;
      if (p >= 1) { effects.splice(i, 1); continue; }
      const start = fx.kind === 'cyan' ? 0 : fx.kind === 'magenta' ? 4 : 8;
      const frame = start + Math.min(3, Math.floor(p * 4));
      ctx.save();
      ctx.globalAlpha = (1 - p) * (reducedEffects() ? 0.55 : 0.85);
      if (!reducedEffects()) ctx.globalCompositeOperation = 'lighter';
      drawFrame(assets.effects, frame, fx.x, fx.y, fx.size * (0.75 + p * 0.5), fx.size * (0.75 + p * 0.5));
      ctx.restore();
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      const popup = popups[i];
      popup.t += dt;
      const p = popup.t / popup.duration;
      if (p >= 1) { popups.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - p) * 1.8);
      ctx.fillStyle = popup.color;
      ctx.font = '900 22px ui-monospace, monospace';
      ctx.textAlign = 'center';
      if (!reducedEffects()) { ctx.shadowColor = popup.color; ctx.shadowBlur = 8; }
      ctx.fillText(popup.text, popup.x, popup.y - p * 42);
      ctx.restore();
    }
  }
  function drawPlunger() {
    const ball = game.balls.find(b => b.ready);
    const charge = ball ? ball.charge : 0;
    drawFrame(assets.mechanisms, 11, 970, 1452 + charge * 27, 74, 74);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(916, 1270, 14, 164);
    const gradient = ctx.createLinearGradient(0, 1434, 0, 1270);
    gradient.addColorStop(0, '#ff9f43'); gradient.addColorStop(1, '#fff1a6');
    ctx.fillStyle = gradient; ctx.fillRect(918, 1432 - charge * 160, 10, charge * 160);
    ctx.restore();
  }
  function drawDisplay() {
    ctx.save();
    ctx.beginPath(); ctx.rect(304, 10, 414, 68); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(304, 10, 414, 68);
    ctx.textAlign = 'center';
    ctx.fillStyle = game.challenge ? '#ff665f' : '#ffd166';
    if (!reducedEffects()) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; }
    ctx.font = '900 28px ui-monospace, monospace';
    ctx.fillText(String(game.score).padStart(8, '0'), 511, 40);
    ctx.shadowBlur = 0;
    ctx.font = '700 12px ui-monospace, monospace';
    const mission = game.missionInfo();
    const right = game.challenge ? Math.max(0, mission.time).toFixed(1) + ' S' : '×' + E.MULTIPLIERS[game.multiplierIndex];
    ctx.fillText('S' + String(game.sector).padStart(2, '0') + ' · B' + game.stock + ' · ' + right + ' · ' + mission.progress + '/' + mission.target, 511, 64);
    ctx.restore();
  }
  function render(dt, time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(assets.table, 0, 0, E.WIDTH, E.HEIGHT);
    drawInserts(time);
    drawMechanisms(time);

    const ground = game.balls.filter(b => !b.ramp);
    const elevated = game.balls.filter(b => b.ramp);
    for (const ball of ground) drawBall(ball, true);
    for (const ball of ground) drawBall(ball, false);
    if (railLayer) ctx.drawImage(railLayer, 0, 0);
    for (const ball of elevated) drawBall(ball, true);
    for (const ball of elevated) drawBall(ball, false);

    drawPlunger();
    drawEffects(game.paused ? 0 : dt);
    drawDisplay();
    for (let i = 0; i < bumperFlash.length; i++) bumperFlash[i] = Math.max(0, bumperFlash[i] - dt);
  }

  function sectorData(number) {
    let name = t('sector') + ' ' + number, consoleName = '';
    try {
      const info = SECTINFO[number - 1];
      if (info && info.lieu) name = typeof L === 'function' ? L(info.lieu) : info.lieu;
    } catch (e) {}
    try {
      const catalog = JSON.parse(document.getElementById('nvMusicCatalog').textContent);
      const eras = catalog.filter(item => item.kind === 'sector');
      const era = eras[Math.floor((number - 1) / 4)];
      if (era) consoleName = (typeof L === 'function' ? L(era.title) : era.title) + ' · ' + era.levels;
    } catch (e) {}
    return { name, consoleName };
  }
  function missionText(info) {
    let base;
    if (info.type === 'vorax') base = t('vorax');
    else if (info.type === 'rearm') base = t('rearm');
    else base = t('mission' + info.type);
    return base + ' · ' + info.progress + '/' + info.target + (info.type === 'vorax' ? ' · ' + Math.max(0, info.time).toFixed(1) + ' s' : '');
  }
  function updateHud(now) {
    if (now < hudAt || !game) return;
    hudAt = now + 90;
    const st = store();
    ui.score.textContent = fmt(game.score);
    ui.nvpBest.textContent = fmt(Math.max(st.best, game.score));
    ui.balls.textContent = game.stock + (game.balls.length > 1 ? ' (+' + (game.balls.length - 1) + ')' : '');
    ui.nvpMultiplier.textContent = '×' + E.MULTIPLIERS[game.multiplierIndex];
    const saver = game.balls.length === 1 ? Math.max(0, game.balls[0].saver) : 0;
    ui.nvpSaver.hidden = saver <= 0;
    ui.nvpSaverTime.textContent = saver.toFixed(1) + ' s';
    const data = sectorData(game.sector);
    ui.nvpSectorName.textContent = data.name;
    ui.nvpConsole.textContent = data.consoleName;
    const mission = game.missionInfo();
    ui.nvpMission.textContent = missionText(mission);
    ui.nvpMission.classList.toggle('nvp-vorax', mission.type === 'vorax');
    ui.nvpMissionFill.style.width = Math.min(100, mission.progress / Math.max(1, mission.target) * 100) + '%';
  }

  function frame(now) {
    if (!running || !game || !assets) return;
    const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    pollGamepad();
    game.advance(dt);
    handleEvents(game.drainEvents());
    render(dt, now / 1000);
    updateHud(now);
    if (messageUntil && now >= messageUntil) { ui.nvpCanvasMessage.classList.remove('show'); messageUntil = 0; }
    raf = requestAnimationFrame(frame);
  }

  /* API publique et points d'entrée conservés pour le menu existant. */
  window.isFlipperUnlocked = isFlipperUnlocked;
  window.refreshFlipperButton = refreshFlipperButton;
  window.startFlipperGame = play;
  window.NVPinballAccess = { isUnlocked: isFlipperUnlocked, code: 'CAFAITFLIPPER' };
  window.NVPinball = {
    play, back, showMenu, showGift, refresh: refreshFlipperButton, isUnlocked: isFlipperUnlocked,
    markCompleted,
    get game() { return game; },
    get running() { return running; },
    get assets() { return assets; }
  };

  if (buildUI()) {
    installHooks();
    window.addEventListener('nv:pinball-unlocked', refreshFlipperButton);
    window.addEventListener('load', () => { refreshFlipperButton(); installHooks(); });
    if (document.readyState === 'complete') setTimeout(refreshFlipperButton, 0);
  }
})();
