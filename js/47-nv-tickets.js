
/* =============================================================================
   TICKETS À GRATTER (pack « Réaliste V3 ») + CODE CAFAITFLIPPER
   -----------------------------------------------------------------------------
   · Après le générique, le ticket LÉGENDAIRE remplace l'ancien cadeau de fin.
     Il révèle CAFAITFLIPPER ; le gratter ne débloque rien : seule la saisie
     dans CODES valide le code.
   · Le code fonctionne à tout moment (ticket obtenu ou non) et ne se valide
     qu'une fois : une seule information persistante, S.unlocks.pinball.
   · Assets : assets/tickets/ (bases 1536×1024 sans numéro, récompense et
     surface 440×245, pastilles, sons).
   ========================================================================== */
(function () {
  'use strict';
  const DIR = 'assets/tickets/';
  const TW = 1536, TH = 1024;                                /* ticket source      */
  const ZONE = { x: 1020, y: 435, w: 440, h: 245 };          /* zone à gratter     */
  const SERIAL = { cx: 1225, cy: 933, px: 29, ink: '#242421' };
  const ROT = -4;                                            /* inclinaison (deg)  */
  const REVEAL_AT = 0.65;
  const CODE = 'CAFAITFLIPPER';

  /* ---- raretés : extensible, couleurs et rangs du manifest ---------------- */
  const RARITIES = {
    casual:     { id: 'casual',     label: 'CASUAL',     rank: 1, color: 'rgb(167,169,164)', base: DIR + 'base_casual.webp',     pastille: DIR + 'pastille_casual.png' },
    peu_commun: { id: 'peu_commun', label: 'PEU COMMUN', rank: 2, color: 'rgb(112,166,123)', base: DIR + 'base_peu_commun.webp', pastille: DIR + 'pastille_peu_commun.png' },
    rare:       { id: 'rare',       label: 'RARE',       rank: 3, color: 'rgb(105,155,193)', base: DIR + 'base_rare.webp',       pastille: DIR + 'pastille_rare.png' },
    epique:     { id: 'epique',     label: 'ÉPIQUE',     rank: 4, color: 'rgb(164,126,179)', base: DIR + 'base_epique.webp',     pastille: DIR + 'pastille_epique.png' },
    legendaire: { id: 'legendaire', label: 'LÉGENDAIRE', rank: 5, color: 'rgb(199,165,92)',  base: DIR + 'base_legendaire.webp', pastille: DIR + 'pastille_legendaire.png' },
  };
  /* Modèles de tickets. Seul celui de fin a une récompense : les autres
     raretés sont prêtes pour de futures récompenses (aucun lot inventé). */
  const MODELS = {
    /* collection 01 : ticket de fin, après le générique */
    finale: { id: 'finale', collection: 1, rarity: 'legendaire', reward: DIR + 'recompense_fin.png', code: CODE },
    /* collection 02 : offert en battant le boss du secteur 12 (bilan de secteur) */
    neo_melodies_002: { id: 'neo_melodies_002', collection: 2, rarity: 'epique', base: DIR + 'neomelodies_base_epique.webp', reward: DIR + 'neomelodies_recompense.png', code: 'NEOMELODIES' },
  };

  /* ---- textes d'interface (FR, EN, ES, PT, JA) ---------------------------- */
  const TX = {
    kicker:  ['RÉCOMPENSE LÉGENDAIRE', 'LEGENDARY REWARD', 'RECOMPENSA LEGENDARIA', 'RECOMPENSA LENDÁRIA', '伝説の報酬'],
    kickerE: ['RÉCOMPENSE ÉPIQUE', 'EPIC REWARD', 'RECOMPENSA ÉPICA', 'RECOMPENSA ÉPICA', 'エピック報酬'],
    cont:    ['Continuer', 'Continue', 'Continuar', 'Continuar', '続ける'],
    mine:    ['Mes tickets', 'My tickets', 'Mis boletos', 'Meus bilhetes', 'マイチケット'],
    see:     ['Voir le ticket', 'View ticket', 'Ver el boleto', 'Ver o bilhete', 'チケットを見る'],
    scr:     ['intact', 'unscratched', 'sin rascar', 'intacto', '未使用'],
    rev:     ['révélé', 'revealed', 'revelado', 'revelado', '公開済み'],
    title:   ['TICKET MYSTÈRE', 'MYSTERY TICKET', 'BOLETO MISTERIOSO', 'BILHETE MISTERIOSO', 'ミステリーチケット'],
    sub:     ['Gratte la zone argentée avec ton doigt, ou avec la souris en maintenant le clic.', 'Scratch the silver area with your finger, or with the mouse while holding the button.', 'Rasca la zona plateada con el dedo, o con el ratón manteniendo el clic.', 'Raspe a área prateada com o dedo, ou com o mouse segurando o botão.', '銀色の部分を指で、またはマウスのボタンを押したままこすってください。'],
    revealA: ['Révéler le ticket', 'Reveal the ticket', 'Revelar el boleto', 'Revelar o bilhete', 'チケットを表示'],
    revealH: ['Pour qui ne peut pas faire le geste de grattage.', 'For players who cannot use the scratch gesture.', 'Para quien no pueda hacer el gesto de rascar.', 'Para quem não consegue fazer o gesto de raspar.', 'こする操作ができない方向け。'],
    codeL:   ['Code révélé', 'Revealed code', 'Código revelado', 'Código revelado', '判明したコード'],
    codeH:   ['À saisir dans la rubrique CODES.', 'Enter it in the CODES section.', 'Introdúcelo en la sección CÓDIGOS.', 'Digite-o na seção CÓDIGOS.', '「コード」画面で入力してください。'],
    copy:    ['Copier le code', 'Copy the code', 'Copiar el código', 'Copiar o código', 'コードをコピー'],
    copied:  ['Code copié.', 'Code copied.', 'Código copiado.', 'Código copiado.', 'コピーしました。'],
    copyKo:  ['Copie impossible : sélectionne le code ci-dessus et copie-le à la main.', 'Copy failed: select the code above and copy it manually.', 'No se pudo copiar: selecciona el código y cópialo a mano.', 'Não foi possível copiar: selecione o código e copie manualmente.', 'コピーできませんでした。上のコードを選択して手動でコピーしてください。'],
    codes:   ['Aller aux codes', 'Go to codes', 'Ir a los códigos', 'Ir para os códigos', 'コード画面へ'],
    menu:    ['Retour au menu', 'Back to menu', 'Volver al menú', 'Voltar ao menu', 'メニューに戻る'],
    serialL: ['Numéro de série', 'Serial number', 'Número de serie', 'Número de série', 'シリアル番号'],
    ticketL: ['Ticket à gratter légendaire', 'Legendary scratch ticket', 'Boleto de rasca legendario', 'Bilhete de raspar lendário', '伝説のスクラッチチケット'],
  };
  const li = () => { try { const i = LANGS.findIndex(x => x.id === LANG); return i < 0 ? 0 : i; } catch (e) { return 0; } };
  const t = k => TX[k][li()] || TX[k][0];
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const IS_COARSE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);   /* moins de particules au doigt */

  /* =========================================================================
     SAUVEGARDE — tout passe par S (et saveGame) ; en cas d'échec du stockage,
     le ticket reste utilisable en mémoire.
     ====================================================================== */
  function store() {
    try {
      if (!S.tickets || typeof S.tickets !== 'object') S.tickets = {};
      if (!S.tickets.items || typeof S.tickets.items !== 'object') S.tickets.items = {};
      if (!(S.tickets.next > 0)) S.tickets.next = 1;
      /* un compteur d'exemplaires par collection (NV-001-…, NV-002-…) ;
         « next » reste celui de la collection 01, déjà sauvegardé */
      if (!S.tickets.counters || typeof S.tickets.counters !== 'object') S.tickets.counters = {};
      return S.tickets;
    } catch (e) { return (store.mem = store.mem || { items: {}, next: 1, counters: {} }); }
  }
  function persist() { try { saveGame(); } catch (e) {} }
  const fmtSerial = (col, n) => 'NV-' + String(col).padStart(3, '0') + '-' + String(n).padStart(6, '0');
  function nextNumber(st, col) {
    if (col === 1) return st.next++;
    const k = String(col); const n = st.counters[k] > 0 ? st.counters[k] : 1; st.counters[k] = n + 1; return n;
  }
  /* attribue un exemplaire une seule fois ; le numéro ne change plus ensuite */
  function award(modelId) {
    const st = store(), m = MODELS[modelId]; if (!m) return null;
    let it = st.items[modelId];
    if (!it) {
      it = st.items[modelId] = { model: modelId, collection: m.collection, rarity: m.rarity, serial: fmtSerial(m.collection, nextNumber(st, m.collection)), awardedAt: Date.now(), progress: 0, revealed: false, mask: null };
      persist();
    }
    return it;
  }

  /* =========================================================================
     CODES DE TICKET — une seule logique pour tous, une seule donnée
     persistante par code (S.unlocks[clé]). Chaque code marche à tout moment,
     ticket obtenu ou non, et ne se valide qu'une fois.
     ====================================================================== */
  const TICKET_CODES = {
    CAFAITFLIPPER: { key: 'pinball',
      ok: 'Code du ticket validé. Termine Neo-Vanguard pour débloquer la table Néon Orbit.',
      again: 'Code du ticket déjà validé. La table Néon Orbit se débloque après la fin de la campagne.' },
    NEOMELODIES: { key: 'cassettes',
      ok: 'Code validé ! Le menu complet des cassettes audio est maintenant déverrouillé.',
      again: 'Ce code a déjà été saisi et validé. Le menu complet des cassettes audio est déjà déverrouillé.' },
  };
  function isUnlocked(key) { try { return !!(S.unlocks && S.unlocks[key]); } catch (e) { return false; } }
  function validateTicketCode(code) {
    const c = TICKET_CODES[code];
    if (!S.unlocks || typeof S.unlocks !== 'object') S.unlocks = {};
    if (S.unlocks[c.key]) return false;                      /* déjà validé : rien à refaire */
    S.unlocks[c.key] = { code, at: Date.now() };             /* déverrouillage = validation */
    persist();
    try { window.dispatchEvent(new CustomEvent('nv:unlock', { detail: { key: c.key, code } })); } catch (e) {}
    if (c.key === 'pinball') {
      try { window.dispatchEvent(new CustomEvent('nv:pinball-unlocked', { detail: { code } })); } catch (e) {}
      try { if (window.NV_PINBALL && typeof NV_PINBALL.unlock === 'function') NV_PINBALL.unlock(); } catch (e) {}
    }
    return true;
  }
  /* API publique pour le jeu de flipper (absent de ce dépôt pour l'instant) */
  window.NVPinballAccess = { isUnlocked: () => isUnlocked('pinball'), code: 'CAFAITFLIPPER' };
  window.NVUnlocks = { isUnlocked };

  const _try = tryCheatCode;
  tryCheatCode = function (raw) {
    const code = String(raw == null ? '' : raw).trim().toUpperCase();
    if (!TICKET_CODES[code]) return _try.apply(this, arguments);
    const banner = document.getElementById('cheatBanner'); if (banner) banner.hidden = true;
    const first = validateTicketCode(code), c = TICKET_CODES[code];
    try { Audio2.sfx(first ? 'levelup' : 'ui'); } catch (e) {}
    flashCheatMsg(first ? c.ok : c.again, first ? 'ok' : 'secret');
    /* le message reste lisible plus longtemps que les messages courts */
    clearTimeout(flashCheatMsg.t);
    flashCheatMsg.t = setTimeout(() => { const el = document.getElementById('cheatStatus'); if (el) { el.textContent = ''; el.className = 'cheatmsg'; } }, 9000);
    if (c.key === 'cassettes') paintCassetteTile();
  };

  /* =========================================================================
     MENU DES CASSETTES : grisé et inaccessible tant que NEOMELODIES n'a pas
     été validé dans CODES.
     ====================================================================== */
  const LOCK_TX = {
    sub:  ['Verrouillé · code de ticket requis', 'Locked · ticket code required', 'Bloqueado · código de boleto requerido', 'Bloqueado · código de bilhete necessário', 'ロック中 · チケットのコードが必要'],
    msg:  ['Menu des cassettes verrouillé : saisis le code de ton ticket dans CODES.', 'Cassette menu locked: enter your ticket code in CODES.', 'Menú de casetes bloqueado: introduce el código de tu boleto en CÓDIGOS.', 'Menu de cassetes bloqueado: digite o código do seu bilhete em CÓDIGOS.', 'カセットメニューはロック中です。「コード」でチケットのコードを入力してください。'],
  };
  const lt = k => LOCK_TX[k][li()] || LOCK_TX[k][0];
  const lockCss = `
  .tile.nv-music-tile.nv-locked{filter:grayscale(1) brightness(.62);opacity:.7;cursor:not-allowed;border-color:rgba(160,160,170,.35)!important;background:rgba(255,255,255,.03)!important}
  .tile.nv-music-tile.nv-locked .ti{color:#9a9aa6!important}
  .tile.nv-music-tile.nv-locked:hover{transform:none!important;box-shadow:none!important}
  .tile.nv-music-tile.nv-locked b::after{content:" 🔒";filter:grayscale(1)}`;
  function paintCassetteTile() {
    if (!document.getElementById('nv-lock-style')) { const st = document.createElement('style'); st.id = 'nv-lock-style'; st.textContent = lockCss; document.head.appendChild(st); }
    const locked = !isUnlocked('cassettes');
    document.querySelectorAll('[data-act="music-shop"]').forEach(b => {
      if (b.dataset.subOrig === undefined) { const i = b.querySelector('i'); b.dataset.subOrig = i ? i.textContent : ''; }
      b.classList.toggle('nv-locked', locked);
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      const i = b.querySelector('i'); if (i) i.textContent = locked ? lt('sub') : b.dataset.subOrig;
      b.title = locked ? lt('msg') : '';
    });
  }
  function guardShop() {
    if (window.openMusicShop && !window.openMusicShop.__nvGuard) {
      const _open = window.openMusicShop;
      const guarded = function () {
        if (!isUnlocked('cassettes')) {
          try { Audio2.sfx('back'); } catch (e) {}
          try { toast(lt('msg'), true); } catch (e) {}
          paintCassetteTile();
          return;
        }
        return _open.apply(this, arguments);
      };
      guarded.__nvGuard = true;
      window.openMusicShop = guarded;
    }
    paintCassetteTile();
  }
  /* posé après tous les scripts (qui enveloppent openMusicShop à leur tour) */
  if (document.readyState === 'complete') guardShop(); else window.addEventListener('load', guardShop);
  /* l'affichage du menu peut être reconstruit (langue, hangar) : on repeint */
  document.addEventListener('click', () => setTimeout(paintCassetteTile, 0), true);
  window.addEventListener('nv:unlock', paintCassetteTile);

  /* =========================================================================
     IMAGES ET SONS
     ====================================================================== */
  const imgCache = {};
  function loadImg(src) {
    if (!imgCache[src]) imgCache[src] = new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
    return imgCache[src];
  }
  const SND = { buf: {}, rub: null };
  function audioCtx() { try { if (!Audio2.ctx) Audio2.init(); if (Audio2.ctx && Audio2.ctx.state === 'suspended') Audio2.ctx.resume(); return Audio2.ok ? Audio2.ctx : null; } catch (e) { return null; } }
  function loadSound(name) {
    const c = audioCtx(); if (!c) return Promise.resolve(null);
    if (!SND.buf[name]) SND.buf[name] = fetch(DIR + name).then(r => r.arrayBuffer()).then(a => new Promise((res, rej) => c.decodeAudioData(a, res, rej))).catch(() => null);
    return SND.buf[name];
  }
  /* frottement : boucle à gain nul, montée/descente courtes pendant le geste */
  function rubStart() {
    const c = audioCtx(); if (!c || SND.rub) return;
    loadSound('frottement.wav').then(buf => {
      if (!buf || SND.rub || !Audio2.sfxGain) return;
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(g); g.connect(Audio2.sfxGain); src.start();
      SND.rub = { src, g };
    });
  }
  function rubLevel(on) {
    const r = SND.rub, c = Audio2.ctx; if (!r || !c) return;
    const now = c.currentTime;
    r.g.gain.cancelScheduledValues(now);
    r.g.gain.setTargetAtTime(on && !Audio2.muted ? 0.32 : 0, now, on ? 0.03 : 0.06);
  }
  function rubStop() {
    const r = SND.rub; if (!r) return; SND.rub = null;
    try { const now = Audio2.ctx.currentTime; r.g.gain.cancelScheduledValues(now); r.g.gain.setTargetAtTime(0, now, 0.04); r.src.stop(now + 0.25); } catch (e) {}
  }
  function chime() {
    loadSound('revelation.wav').then(buf => {
      const c = Audio2.ctx; if (!buf || !c || !Audio2.sfxGain || Audio2.muted) return;
      const s = c.createBufferSource(); s.buffer = buf; const g = c.createGain(); g.gain.value = 0.55;
      s.connect(g); g.connect(Audio2.sfxGain); s.start();
    });
  }

  /* =========================================================================
     STYLE
     ====================================================================== */
  const css = `
  .nvt{width:100%;display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px 4px 14px;box-sizing:border-box;-webkit-overflow-scrolling:touch}
  .nvt-kicker{margin:0 0 6px;color:#ffd783;font:800 10px/1.4 var(--mono,monospace);letter-spacing:.32em}
  .nvt-title{margin:0;color:#f7fbff;font:900 clamp(20px,4.6vw,34px)/1.05 var(--ui-font,system-ui,sans-serif);letter-spacing:.09em;text-shadow:0 3px 24px #000}
  .nvt-sub{margin:8px 0 0;max-width:520px;color:#b8cbe4;font:400 clamp(12px,2vw,15px)/1.45 var(--ui-font,system-ui,sans-serif)}
  .nvt-stage{position:relative;width:var(--nvt-w,600px);height:calc(var(--nvt-w,600px) * .6667);margin:calc(var(--nvt-w,600px) * .07) auto calc(var(--nvt-w,600px) * .06);flex:none}
  .nvt-card{position:absolute;inset:0;transform:rotate(${ROT}deg);transform-origin:50% 50%;filter:drop-shadow(0 14px 22px rgba(0,0,0,.55)) drop-shadow(0 3px 5px rgba(0,0,0,.45))}
  .nvt-card>img,.nvt-card>canvas,.nvt-card>.nvt-pt{position:absolute;display:block;-webkit-user-drag:none;user-select:none}
  .nvt-base{inset:0;width:100%;height:100%}
  .nvt-reward,.nvt-scratch{left:${ZONE.x / TW * 100}%;top:${ZONE.y / TH * 100}%;width:${ZONE.w / TW * 100}%;height:${ZONE.h / TH * 100}%}
  .nvt-reward{visibility:hidden}
  .nvt-card.ready .nvt-reward{visibility:visible}
  .nvt-scratch{pointer-events:none;transition:opacity .45s ease}
  .nvt-scratch.gone{opacity:0}
  /* zone de prise du geste : la surface + une petite marge, pour qu'un geste
     commencé au bord gratte aussi ; l'effacement, lui, reste borné à la surface */
  .nvt-hit{position:absolute;left:${(ZONE.x - 40) / TW * 100}%;top:${(ZONE.y - 40) / TH * 100}%;width:${(ZONE.w + 80) / TW * 100}%;height:${(ZONE.h + 80) / TH * 100}%;touch-action:none;cursor:crosshair}
  .nvt.revealed .nvt-hit,.nvt-hit.off{pointer-events:none;cursor:default}
  .nvt-serial{left:${(1060 / TW) * 100}%;top:${(900 / TH) * 100}%;width:${(330 / TW) * 100}%;height:${(66 / TH) * 100}%;pointer-events:none}
  .nvt-dust{left:${(ZONE.x - 60) / TW * 100}%;top:${(ZONE.y - 40) / TH * 100}%;width:${(ZONE.w + 120) / TW * 100}%;height:${(ZONE.h + 140) / TH * 100}%;pointer-events:none}
  .nvt-pt{width:0;height:0;pointer-events:none}
  .nvt-out{display:none;flex-direction:column;align-items:center;gap:6px;margin-top:2px}
  .nvt.revealed .nvt-out{display:flex}
  .nvt-code-l{margin:0;color:#9fb3d1;font:700 10px/1.4 var(--mono,monospace);letter-spacing:.24em;text-transform:uppercase}
  .nvt-code{margin:0;padding:6px 14px;border-radius:8px;background:rgba(244,232,205,.95);color:#242421;font:800 clamp(18px,4.2vw,26px)/1.2 Verdana,"DejaVu Sans","Segoe UI",sans-serif;letter-spacing:.06em;user-select:text;-webkit-user-select:text;cursor:text}
  .nvt-code-h{margin:0;color:#b8cbe4;font:400 13px/1.4 var(--ui-font,system-ui,sans-serif)}
  .nvt-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px}
  .nvt-btn{min-height:44px;padding:10px 16px;border-radius:8px;border:1px solid rgba(113,228,255,.6);background:rgba(10,28,44,.85);color:#dff7ff;font:800 12px/1.2 var(--ui-font,system-ui,sans-serif);letter-spacing:.08em;cursor:pointer}
  .nvt-btn.prim{background:linear-gradient(135deg,#73eaff,#47b9e8);color:#06121c;border-color:transparent}
  .nvt-btn:focus-visible{outline:3px solid #ffd783;outline-offset:3px}
  .nvt-msg{min-height:18px;margin:4px 0 0;color:#9fe8b8;font:600 12px/1.4 var(--ui-font,system-ui,sans-serif)}
  .nvt-msg.bad{color:#ffb0b8}
  .nvt-a11y{margin-top:2px}
  .nvt.revealed .nvt-a11y,.nvt.revealed .nvt-sub{display:none}
  .nvt-a11y-h{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  @media (prefers-reduced-motion: reduce){.nvt-scratch{transition:none}}
  `;
  function injectCss() { if (document.getElementById('nvt-style')) return; const s = document.createElement('style'); s.id = 'nvt-style'; s.textContent = css; document.head.appendChild(s); }

  /* =========================================================================
     LE TICKET
     ====================================================================== */
  let CUR = null;   /* ticket affiché */

  function sizeStage(root) {
    const stage = root.querySelector('.nvt-stage'); if (!stage) return;
    const vw = Math.min(window.innerWidth || 800, document.documentElement.clientWidth || 9999);
    const vh = window.innerHeight || 600;
    /* le ticket incliné doit tenir : largeur et hauteur disponibles */
    const maxW = Math.min(680, vw * (vw < 520 ? 0.95 : 0.9) - 8);
    const maxH = vh * (vh < 520 ? 0.62 : 0.5);
    const w = Math.max(240, Math.min(maxW, maxH * 1.5));
    root.style.setProperty('--nvt-w', Math.round(w) + 'px');
  }

  function drawSerial(cv, text) {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(60, Math.round(r.width ? (r.width * dpr) : 330)), H = Math.max(12, Math.round(W * 66 / 330));
    const k = W / 330;   /* px canvas par px source */
    if (cv.width !== W) cv.width = W; if (cv.height !== H) cv.height = H;
    const g = cv.getContext('2d'); g.clearRect(0, 0, W, H);
    g.fillStyle = SERIAL.ink; g.globalAlpha = 0.86;
    g.font = `bold ${Math.round(SERIAL.px * k)}px "DejaVu Sans", Verdana, "Segoe UI", Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    try { g.letterSpacing = (0.6 * k) + 'px'; } catch (e) {}
    g.fillText(text, (SERIAL.cx - 1060) * k, (SERIAL.cy - 900) * k);
    /* usure : quelques mouchetures retirées, toujours les mêmes pour ce numéro */
    let s = 0; for (const ch of text) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.55;
    for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(rnd() * W, (0.25 + rnd() * 0.5) * H, (0.35 + rnd() * 0.9) * k, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }

  function build(container, item, cb) {
    injectCss();
    const m = MODELS[item.model], R = RARITIES[item.rarity];
    const root = document.createElement('div'); root.className = 'nvt'; root.setAttribute('role', 'group'); root.setAttribute('aria-label', t('ticketL') + ' · ' + R.label);
    root.innerHTML = `
      <p class="nvt-kicker"></p><h2 class="nvt-title"></h2><p class="nvt-sub"></p>
      <div class="nvt-stage">
        <div class="nvt-card" aria-hidden="true">
          <img class="nvt-base" alt="" draggable="false">
          <canvas class="nvt-serial"></canvas>
          <img class="nvt-reward" alt="" draggable="false">
          <canvas class="nvt-scratch"></canvas>
          <canvas class="nvt-dust"></canvas>
          <div class="nvt-hit"></div>
          <span class="nvt-pt" style="left:0;top:0"></span><span class="nvt-pt" style="left:100%;top:0"></span><span class="nvt-pt" style="left:0;top:100%"></span>
        </div>
      </div>
      <p class="nvt-a11y-h"></p>
      <button type="button" class="nvt-btn nvt-a11y"></button>
      <div class="nvt-out" aria-live="polite">
        <p class="nvt-code-l"></p><p class="nvt-code" tabindex="0"></p><p class="nvt-code-h"></p>
        <div class="nvt-btns"><button type="button" class="nvt-btn prim nvt-copy"></button><button type="button" class="nvt-btn nvt-codes"></button><button type="button" class="nvt-btn nvt-menu"></button></div>
        <p class="nvt-msg" role="status"></p>
      </div>`;
    const q = s => root.querySelector(s);
    q('.nvt-kicker').textContent = item.rarity === 'epique' ? t('kickerE') : t('kicker'); q('.nvt-title').textContent = t('title'); q('.nvt-sub').textContent = t('sub');
    q('.nvt-a11y').textContent = t('revealA'); q('.nvt-a11y').title = t('revealH');
    q('.nvt-a11y-h').textContent = t('serialL') + ' ' + item.serial;
    q('.nvt-code-l').textContent = t('codeL'); q('.nvt-code-h').textContent = t('codeH');
    q('.nvt-copy').textContent = t('copy'); q('.nvt-codes').textContent = t('codes'); q('.nvt-menu').textContent = (cb && cb.menuLabel) || t('menu');
    container.appendChild(root);
    sizeStage(root);

    const card = q('.nvt-card'), cv = q('.nvt-scratch'), dust = q('.nvt-dust'), hit = q('.nvt-hit'), pts = root.querySelectorAll('.nvt-pt');
    const st = { root, item, card, cv, dust, done: !!item.revealed, active: false, last: null, lastMove: 0, dirty: false, parts: [], raf: 0, sampleT: 0, saveT: 0, surface: null, cb };
    CUR = st;

    /* ----- composition : base → numéro → récompense → surface --------------- */
    const baseSrc = m.base || R.base;
    q('.nvt-base').src = baseSrc;
    q('.nvt-reward').src = m.reward;
    const serialCv = q('.nvt-serial');
    const redrawSerial = () => drawSerial(serialCv, item.serial);
    loadImg(baseSrc).then(() => requestAnimationFrame(redrawSerial)).catch(() => {});
    requestAnimationFrame(redrawSerial);

    /* ----- canvas de grattage : résolution plafonnée ------------------------- */
    function sizeCanvas() {
      const r = cv.getBoundingClientRect();
      const cssW = cv.offsetWidth || (r.width || 300);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(Math.min(ZONE.w * 2, Math.max(120, cssW * dpr)));
      const H = Math.round(W * ZONE.h / ZONE.w);
      if (cv.width === W && cv.height === H) return;
      /* garder ce qui est déjà gratté lors d'un redimensionnement */
      let keep = null;
      if (cv.width && st.surface) { keep = document.createElement('canvas'); keep.width = cv.width; keep.height = cv.height; keep.getContext('2d').drawImage(cv, 0, 0); }
      cv.width = W; cv.height = H;
      paintSurface(keep);
      const d = Math.min(2, window.devicePixelRatio || 1);
      dust.width = Math.round((dust.offsetWidth || 300) * d); dust.height = Math.round((dust.offsetHeight || 200) * d);
    }
    function paintSurface(fromCanvas) {
      const g = cv.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
      if (st.done) return;
      if (fromCanvas) { g.drawImage(fromCanvas, 0, 0, cv.width, cv.height); return; }
      if (!st.surface) return;
      g.drawImage(st.surface, 0, 0, cv.width, cv.height);
      if (item.mask) {          /* reprise : masque réduit sauvegardé (blanc = intact) */
        const im = new Image();
        im.onload = () => {
          const tmp = document.createElement('canvas'); tmp.width = im.width; tmp.height = im.height;
          const tg = tmp.getContext('2d'); tg.drawImage(im, 0, 0);
          const d = tg.getImageData(0, 0, tmp.width, tmp.height), a = d.data;
          for (let i = 0; i < a.length; i += 4) { const v = a[i]; a[i] = a[i + 1] = a[i + 2] = 0; a[i + 3] = 255 - v; }   /* noir (effacé) → opaque */
          tg.putImageData(d, 0, 0);
          g.save(); g.globalCompositeOperation = 'destination-out'; g.imageSmoothingEnabled = true; g.drawImage(tmp, 0, 0, cv.width, cv.height); g.restore();
          sample(true);
        };
        im.src = item.mask;
      }
    }
    loadImg(DIR + 'surface_argentee.png').then(img => {
      st.surface = img; sizeCanvas(); paintSurface();
      card.classList.add('ready');      /* la récompense n'apparaît qu'une fois couverte */
    }).catch(() => {
      /* image absente : une surface argentée unie la remplace, le code reste caché */
      const f = document.createElement('canvas'); f.width = ZONE.w; f.height = ZONE.h; const fg = f.getContext('2d');
      const gr = fg.createLinearGradient(0, 0, ZONE.w, ZONE.h); gr.addColorStop(0, '#c9ccd1'); gr.addColorStop(.5, '#eef0f2'); gr.addColorStop(1, '#a9adb3');
      fg.fillStyle = gr; fg.fillRect(0, 0, ZONE.w, ZONE.h);
      st.surface = f; sizeCanvas(); paintSurface(); card.classList.add('ready');
    });
    if (st.done) { cv.classList.add('gone'); card.classList.add('ready'); showOut(false); }

    /* ----- repère local : inverse de la transformation complète --------------
       Trois repères vides posés aux coins (0,0), (W,0), (0,H) du ticket donnent
       leur position écran réelle (rotation, échelle, transformations parentes).
       On en tire la matrice affine locale→écran, puis on l'inverse.          */
    function toLocal(ev) {
      const a = pts[0].getBoundingClientRect(), b = pts[1].getBoundingClientRect(), c = pts[2].getBoundingClientRect();
      const ox = a.left, oy = a.top, ux = b.left - ox, uy = b.top - oy, vx = c.left - ox, vy = c.top - oy;
      const det = ux * vy - uy * vx; if (!det) return null;
      const px = ev.clientX - ox, py = ev.clientY - oy;
      const s = (px * vy - py * vx) / det, tt = (ux * py - uy * px) / det;   /* fractions 0..1 du ticket */
      return { tx: s * TW, ty: tt * TH, cssPerSrc: Math.hypot(ux, uy) / TW };
    }
    const toCanvas = p => ({ x: (p.tx - ZONE.x) / ZONE.w * cv.width, y: (p.ty - ZONE.y) / ZONE.h * cv.height });
    function brushR(p) {
      /* 36 à 46 px CSS de diamètre à l'écran selon la taille de la zone,
         converti en pixels du canvas (petite zone sur téléphone → 36 px) */
      const zoneCssH = ZONE.h * p.cssPerSrc;
      const cssDiam = Math.max(36, Math.min(46, zoneCssH * 0.42));
      const srcDiam = cssDiam / Math.max(0.05, p.cssPerSrc);
      return srcDiam / 2 * cv.width / ZONE.w;
    }
    function scratchTo(p) {
      const g = cv.getContext('2d'), c = toCanvas(p), r = brushR(p);
      g.save(); g.globalCompositeOperation = 'destination-out';
      g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.clip();       /* jamais hors de la surface */
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = r * 2;
      if (st.last) { g.beginPath(); g.moveTo(st.last.x, st.last.y); g.lineTo(c.x, c.y); g.stroke(); }   /* tracé continu */
      g.beginPath(); g.arc(c.x, c.y, r, 0, Math.PI * 2); g.fill();
      g.restore();
      st.last = c; st.dirty = true;
      if (c.x > -r && c.y > -r && c.x < cv.width + r && c.y < cv.height + r) spawnDust(p);
    }

    /* ----- poussière argentée (plafonnée) ------------------------------------ */
    const MAXP = IS_COARSE ? 22 : 44;
    function spawnDust(p) {
      if (reduced() || st.parts.length >= MAXP) return;
      const dx = (p.tx - (ZONE.x - 60)) / (ZONE.w + 120) * dust.width, dy = (p.ty - (ZONE.y - 40)) / (ZONE.h + 140) * dust.height;
      for (let i = 0; i < 2 && st.parts.length < MAXP; i++) st.parts.push({ x: dx + (Math.random() - .5) * 10, y: dy + (Math.random() - .5) * 6, vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 40, life: 0.55 + Math.random() * 0.4, t: 0, r: 0.8 + Math.random() * 1.6 });
      if (!st.raf) { st.lt = performance.now(); st.raf = requestAnimationFrame(tick); }
    }
    function tick(now) {
      const dt = Math.min(0.05, (now - st.lt) / 1000); st.lt = now;
      const g = dust.getContext('2d'); g.clearRect(0, 0, dust.width, dust.height);
      const k = (dust.width / (dust.offsetWidth || dust.width)) || 1;
      for (let i = st.parts.length - 1; i >= 0; i--) {
        const q2 = st.parts[i]; q2.t += dt; if (q2.t >= q2.life) { st.parts.splice(i, 1); continue; }
        q2.vy += 260 * dt; q2.x += q2.vx * dt * k; q2.y += q2.vy * dt * k;
        g.globalAlpha = 0.75 * (1 - q2.t / q2.life); g.fillStyle = i % 3 ? '#d9dde2' : '#9aa1aa';
        g.beginPath(); g.arc(q2.x, q2.y, q2.r * k, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      st.raf = st.parts.length ? requestAnimationFrame(tick) : 0;
    }

    /* ----- progression : masque réduit, fréquence limitée --------------------- */
    const SM = document.createElement('canvas'); SM.width = 88; SM.height = 49;
    function sample(force) {
      const now = performance.now();
      if (!force && now - st.sampleT < 140) return; st.sampleT = now;
      const g = SM.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, SM.width, SM.height); g.drawImage(cv, 0, 0, SM.width, SM.height);
      const a = g.getImageData(0, 0, SM.width, SM.height).data; let off = 0;
      for (let i = 3; i < a.length; i += 4) if (a[i] < 128) off++;
      item.progress = off / (SM.width * SM.height);
      if (item.progress >= REVEAL_AT && !st.done) finishReveal(false);
    }
    function saveMask(force) {
      const now = performance.now();
      if (!force && now - st.saveT < 1500) return; st.saveT = now;
      if (!st.dirty || st.done) return; st.dirty = false;
      try {
        const g = SM.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, SM.width, SM.height); g.drawImage(cv, 0, 0, SM.width, SM.height);
        const d = g.getImageData(0, 0, SM.width, SM.height), a = d.data;
        for (let i = 0; i < a.length; i += 4) { const v = a[i + 3]; a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255; }   /* blanc = intact, noir = effacé */
        const out = document.createElement('canvas'); out.width = SM.width; out.height = SM.height; out.getContext('2d').putImageData(d, 0, 0);
        item.mask = out.toDataURL('image/png');
      } catch (e) {}
      persist();
    }

    /* ----- révélation ---------------------------------------------------------- */
    function finishReveal(instant) {
      if (st.done && item.revealed) return;
      st.done = true; item.revealed = true; item.progress = 1; item.mask = null; item.revealedAt = item.revealedAt || Date.now();
      endGesture();
      persist();
      if (instant || reduced()) cv.classList.add('gone');
      else requestAnimationFrame(() => cv.classList.add('gone'));    /* courte dissipation */
      chime();
      setTimeout(() => showOut(true), instant || reduced() ? 0 : 420);
    }
    function showOut(focus) {
      root.classList.add('revealed');
      const code = q('.nvt-code'); code.textContent = m.code;
      if (focus) setTimeout(() => { try { q('.nvt-copy').focus({ preventScroll: true }); } catch (e) {} }, 60);
    }

    /* ----- geste --------------------------------------------------------------- */
    function endGesture(ev) {
      if (ev && st.pid !== undefined && ev.pointerId !== st.pid) return;
      if (st.active) { st.active = false; st.last = null; try { hit.releasePointerCapture(st.pid); } catch (e) {} }
      st.pid = undefined;
      rubLevel(false); rubStop();
      if (!st.done) { sample(true); saveMask(true); }
    }
    hit.addEventListener('pointerdown', ev => {
      if (st.done || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      ev.preventDefault(); ev.stopPropagation();
      st.active = true; st.pid = ev.pointerId; st.last = null;
      try { hit.setPointerCapture(ev.pointerId); } catch (e) {}
      rubStart();
      const p = toLocal(ev); if (p) scratchTo(p);
    });
    hit.addEventListener('pointermove', ev => {
      if (!st.active || ev.pointerId !== st.pid) return;
      ev.preventDefault();
      const evs = typeof ev.getCoalescedEvents === 'function' ? ev.getCoalescedEvents() : null;
      for (const e of (evs && evs.length ? evs : [ev])) { const p = toLocal(e); if (p) scratchTo(p); }
      rubLevel(true); clearTimeout(st.quiet); st.quiet = setTimeout(() => rubLevel(false), 110);   /* bruit seulement en mouvement */
      sample(false); saveMask(false);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => hit.addEventListener(type, endGesture));
    hit.addEventListener('touchstart', ev => { if (!st.done) ev.preventDefault(); }, { passive: false });
    hit.addEventListener('contextmenu', ev => ev.preventDefault());

    /* ----- boutons -------------------------------------------------------------- */
    q('.nvt-a11y').addEventListener('click', () => { try { Audio2.init(); } catch (e) {} finishReveal(false); });
    q('.nvt-copy').addEventListener('click', () => {
      const msg = q('.nvt-msg');
      const ok = () => { msg.className = 'nvt-msg'; msg.textContent = t('copied'); };
      const ko = () => { msg.className = 'nvt-msg bad'; msg.textContent = t('copyKo'); try { const r = document.createRange(); r.selectNodeContents(q('.nvt-code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {} };
      const legacy = () => { try { const ta = document.createElement('textarea'); ta.value = m.code; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:-9999px'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); r ? ok() : ko(); } catch (e) { ko(); } };
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(m.code).then(ok, legacy); else legacy(); } catch (e) { legacy(); }
    });
    q('.nvt-codes').addEventListener('click', () => { cleanup(); cb && cb.codes && cb.codes(); });
    q('.nvt-menu').addEventListener('click', () => { cleanup(); cb && cb.menu && cb.menu(); });

    /* ----- redimensionnement, orientation, arrière-plan ---------------------- */
    const onResize = () => { sizeStage(root); requestAnimationFrame(() => { sizeCanvas(); redrawSerial(); }); };
    const onHide = () => { if (document.hidden) endGesture(); };
    window.addEventListener('resize', onResize); window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onHide); window.addEventListener('blur', endGesture);
    function cleanup() {
      endGesture();
      window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onHide); window.removeEventListener('blur', endGesture);
      if (st.raf) cancelAnimationFrame(st.raf);
      if (CUR === st) CUR = null;
    }
    st.cleanup = cleanup; st.toLocal = toLocal; st.finishReveal = finishReveal;
    return st;
  }

  /* =========================================================================
     API
     ====================================================================== */
  window.NVTickets = {
    RARITIES, MODELS, award,
    get: id => store().items[id] || null,
    list: () => Object.values(store().items),
    /* affiche le ticket de fin (attribué une seule fois) dans `container` */
    showFinale(container, cb) {
      if (CUR) CUR.cleanup();
      const item = award('finale');
      container.innerHTML = '';
      return build(container, item, cb);
    },
    close() { if (CUR) CUR.cleanup(); },
    /* ouvre un ticket déjà attribué dans une fenêtre par-dessus l'écran courant */
    open(modelId, opt) {
      const item = store().items[modelId]; if (!item) return null;
      opt = opt || {};
      if (CUR) CUR.cleanup();
      injectCss(); injectOverlayCss();
      let ov = document.getElementById('nvtOverlay');
      if (!ov) { ov = document.createElement('div'); ov.id = 'nvtOverlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); document.body.appendChild(ov); }
      ov.innerHTML = '<div class="nvto-in"></div>';
      const back = document.activeElement;
      const closeOv = () => { if (CUR) CUR.cleanup(); ov.remove(); document.removeEventListener('keydown', onKey, true); try { back && back.focus && back.focus(); } catch (e) {} };
      const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeOv(); } else if (['Enter', ' '].includes(e.key) && e.target && e.target.closest && e.target.closest('#nvtOverlay')) e.stopImmediatePropagation(); };
      document.addEventListener('keydown', onKey, true);
      return build(ov.firstChild, item, {
        menuLabel: opt.menuLabel || t('cont'),
        menu: () => { closeOv(); if (opt.onClose) opt.onClose(); },
        codes: () => { closeOv(); setTimeout(() => { const b = document.createElement('button'); b.type = 'button'; b.dataset.act = 'cheats'; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, 60); },
      });
    },
    _cur: () => CUR,
  };
  function injectOverlayCss() {
    if (document.getElementById('nvto-style')) return;
    const st = document.createElement('style'); st.id = 'nvto-style';
    st.textContent = `#nvtOverlay{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:max(18px,env(safe-area-inset-top)) 10px max(18px,env(safe-area-inset-bottom));background:rgba(3,5,14,.93);backdrop-filter:blur(3px)}
    #nvtOverlay .nvto-in{width:min(760px,100%);margin:auto 0}`;
    document.head.appendChild(st);
  }

  /* ---- attribution du ticket NEOMELODIES : boss du secteur 12 vaincu ----------
     Une seule fois. S'il n'a pas encore été révélé, il se rouvre au prochain
     bilan du secteur 12 ; sinon il reste consultable dans CODES. */
  const _clear = showClearScreen;
  showClearScreen = function () {
    const r = _clear.apply(this, arguments);
    try {
      if ((G.level | 0) === 12) {
        const it = award('neo_melodies_002');
        if (it && !it.revealed) setTimeout(() => { if (G.state === 'clear') window.NVTickets.open('neo_melodies_002'); }, 1700);
      }
    } catch (e) { console.warn('ticket secteur 12', e); }
    return r;
  };

  /* ---- CODES : tickets obtenus, consultables ---------------------------------- */
  const _bc = buildCheats;
  buildCheats = function () {
    const r = _bc.apply(this, arguments);
    try {
      const grid = document.getElementById('cheatGrid'); if (!grid) return r;
      let box = document.getElementById('nvtMine'); if (box) box.remove();
      const items = Object.values(store().items).filter(it => MODELS[it.model]).sort((a, b) => (a.collection || 1) - (b.collection || 1));
      if (!items.length) return r;
      box = document.createElement('div'); box.id = 'nvtMine';
      box.style.cssText = 'margin:0 0 12px;padding:10px 12px;border:1px solid rgba(255,215,131,.35);border-radius:10px;background:rgba(255,215,131,.05)';
      box.innerHTML = '<b style="display:block;margin-bottom:6px;color:#ffd783;font-size:11px;letter-spacing:.16em">' + t('mine').toUpperCase() + '</b>';
      for (const it of items) {
        const R = RARITIES[it.rarity];
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small';
        b.style.cssText = 'margin:3px 6px 3px 0;border-color:' + R.color;
        b.textContent = t('see') + ' · ' + R.label + ' · ' + it.serial + ' · ' + (it.revealed ? t('rev') : t('scr'));
        b.addEventListener('click', ev => { ev.stopPropagation(); window.NVTickets.open(it.model, { onClose: () => { try { buildCheats(); } catch (e) {} } }); });
        box.appendChild(b);
      }
      grid.parentNode.insertBefore(box, grid);
    } catch (e) {}
    return r;
  };
})();
