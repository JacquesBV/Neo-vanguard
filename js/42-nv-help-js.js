
(() => {
  const scr = document.getElementById('scr-help'); if (!scr) return;
  const panel = scr.querySelector('.panel'); if (!panel) return;
  /* ---- textes (français → en, es, pt, ja) ---- */
  const TXT = {
    'Clavier': ['Keyboard', 'Teclado', 'Teclado', 'キーボード'],
    'Souris': ['Mouse', 'Ratón', 'Rato', 'マウス'],
    'Manette': ['Gamepad', 'Mando', 'Comando', 'ゲームパッド'],
    'Tactile': ['Touch', 'Táctil', 'Toque', 'タッチ'],
    'SOLO': ['SOLO', 'SOLO', 'SOLO', 'ひとり'],
    'À DEUX': ['TWO PLAYERS', 'A DOS', 'A DOIS', 'ふたり'],
    'Déplacer le vaisseau': ['Move the ship', 'Mover la nave', 'Mover a nave', '機体を動かす'],
    'Tirer': ['Fire', 'Disparar', 'Disparar', '射撃'],
    'Maintenir la touche (ou activer le tir automatique dans les options).': ['Hold the key (or turn on auto-fire in the options).', 'Mantén la tecla (o activa el disparo automático en las opciones).', 'Mantenha a tecla (ou ative o tiro automático nas opções).', 'キーを押し続ける（オプションで自動射撃も可）。'],
    'Bombe intelligente': ['Smart bomb', 'Bomba inteligente', 'Bomba inteligente', 'スマートボム'],
    'Gros dégâts à l’écran et efface tous les tirs ennemis.': ['Heavy damage on screen and wipes out every enemy bullet.', 'Gran daño en pantalla y borra todas las balas enemigas.', 'Grande dano no ecrã e apaga todos os tiros inimigos.', '画面全体に大ダメージ、敵弾をすべて消す。'],
    'Changer de set de tir': ['Switch weapon set', 'Cambiar de set de disparo', 'Trocar de conjunto de tiro', '武器セットを切り替え'],
    'Parmi les armes possédées.': ['Among the weapons you own.', 'Entre las armas que tienes.', 'Entre as armas que possui.', '所持している武器から。'],
    'arme précédente': ['previous weapon', 'arma anterior', 'arma anterior', '前の武器'],
    'Pause': ['Pause', 'Pausa', 'Pausa', 'ポーズ'],
    'Couper / remettre le son': ['Mute / unmute', 'Silenciar / activar sonido', 'Cortar / repor o som', 'ミュート切替'],
    'Plein écran': ['Fullscreen', 'Pantalla completa', 'Ecrã inteiro', 'フルスクリーン'],
    'Son': ['Sound', 'Sonido', 'Som', 'サウンド'],
    'Ctrl tire et lance aussi une bombe ; Maj lance une bombe. F (plein écran) sert au tir du joueur 2 à deux.': ['Ctrl fires and also drops a bomb; Shift drops a bomb. With two players, F (fullscreen) is player 2’s fire.', 'Ctrl dispara y también lanza una bomba; Mayús lanza una bomba. A dos, F (pantalla completa) es el disparo del jugador 2.', 'Ctrl dispara e também lança uma bomba; Shift lança uma bomba. A dois, F (ecrã inteiro) é o tiro do jogador 2.', 'Ctrlは射撃とボム両方、Shiftはボム。ふたりではF（フルスクリーン）が2Pの射撃。'],
    'En solo seulement : à deux, F tire pour le joueur 2.': ['Solo only: with two players, F fires for player 2.', 'Solo en solitario: a dos, F dispara para el jugador 2.', 'Só a solo: a dois, F dispara pelo jogador 2.', 'ひとりの時のみ。ふたりではFが2Pの射撃。'],
    'Joueur 1': ['Player 1', 'Jugador 1', 'Jogador 1', 'プレイヤー1'],
    'Joueur 2': ['Player 2', 'Jugador 2', 'Jogador 2', 'プレイヤー2'],
    'déplacer': ['move', 'mover', 'mover', '移動'],
    'tir': ['fire', 'disparo', 'tiro', '射撃'],
    'bombe': ['bomb', 'bomba', 'bomba', 'ボム'],
    'Touches communes': ['Shared keys', 'Teclas comunes', 'Teclas comuns', '共通キー'],
    'Scores, vies, bombes et puissance sont séparés ; les coins et l’arsenal restent communs.': ['Scores, lives, bombs and power are separate; coins and the arsenal stay shared.', 'Puntuación, vidas, bombas y potencia van por separado; las monedas y el arsenal son comunes.', 'Pontos, vidas, bombas e potência são separados; as moedas e o arsenal são comuns.', 'スコア・残機・ボム・パワーは別々、コインと武器庫は共通。'],
    'Survole une action pour voir ses touches.': ['Hover an action to see its keys.', 'Pasa el cursor por una acción para ver sus teclas.', 'Passe o rato numa ação para ver as teclas.', '操作にカーソルを合わせるとキーが光る。'],
    'Bouton gauche maintenu': ['Hold the left button', 'Mantén el botón izquierdo', 'Botão esquerdo premido', '左ボタン長押し'],
    'Tir continu pendant la mission.': ['Continuous fire during the mission.', 'Disparo continuo durante la misión.', 'Tiro contínuo durante a missão.', 'ミッション中は連射。'],
    'Déplacer la souris': ['Move the mouse', 'Mover el ratón', 'Mover o rato', 'マウスを動かす'],
    'Le vaisseau suit le curseur si l’option « Visée souris » est activée (le clavier reste prioritaire).': ['The ship follows the cursor if the “Mouse aim” option is on (the keyboard keeps priority).', 'La nave sigue el cursor si la opción «Apuntar con ratón» está activada (el teclado tiene prioridad).', 'A nave segue o cursor se a opção «Mira com rato» estiver ativa (o teclado tem prioridade).', '「マウス照準」オンでカーソルに追従（キーボード優先）。'],
    'Clic gauche / clic droit': ['Left click / right click', 'Clic izquierdo / derecho', 'Clique esquerdo / direito', '左クリック／右クリック'],
    'Dans l’histoire : page suivante / page précédente. Un clic passe aussi les transitions.': ['In the story: next page / previous page. A click also skips transitions.', 'En la historia: página siguiente / anterior. Un clic también salta las transiciones.', 'Na história: página seguinte / anterior. Um clique também salta as transições.', 'ストーリー：次／前のページ。クリックで演出もスキップ。'],
    'Stick gauche ou croix': ['Left stick or D-pad', 'Stick izquierdo o cruceta', 'Analógico esquerdo ou cruz', '左スティックか十字キー'],
    'Bouton du bas, gâchette ou bouton d’épaule droits': ['Bottom button, right trigger or right shoulder', 'Botón inferior, gatillo o botón de hombro derechos', 'Botão de baixo, gatilho ou botão de ombro direitos', '下ボタン・右トリガー・右肩ボタン'],
    'Bouton de droite, bouton de gauche ou gâchette gauche': ['Right button, left button or left trigger', 'Botón derecho, botón izquierdo o gatillo izquierdo', 'Botão da direita, da esquerda ou gatilho esquerdo', '右ボタン・左ボタン・左トリガー'],
    'Deux manettes : la première pilote le joueur 1, la seconde le joueur 2.': ['Two gamepads: the first drives player 1, the second player 2.', 'Dos mandos: el primero controla al jugador 1, el segundo al jugador 2.', 'Dois comandos: o primeiro controla o jogador 1, o segundo o jogador 2.', 'パッド2台：1台目が1P、2台目が2P。'],
    'Glisser le doigt': ['Slide your finger', 'Desliza el dedo', 'Deslize o dedo', '指をスライド'],
    'Le vaisseau suit, décalé pour rester visible sous le pouce. Le tir est automatique tant que le doigt reste posé.': ['The ship follows, offset so it stays visible under your thumb. Fire is automatic while your finger stays down.', 'La nave te sigue, desplazada para verse bajo el pulgar. El disparo es automático mientras el dedo esté apoyado.', 'A nave segue, desviada para se ver sob o polegar. O tiro é automático enquanto o dedo estiver pousado.', '機体は親指の上にずれて追従。指を置いている間は自動射撃。'],
    'Deux doigts, double tap ou bouton BOMBE': ['Two fingers, double tap or the BOMB button', 'Dos dedos, doble toque o botón BOMBA', 'Dois dedos, toque duplo ou botão BOMBA', '2本指・ダブルタップ・ボムボタン'],
    'Le bouton BOMBE est en bas à gauche.': ['The BOMB button is at the bottom left.', 'El botón BOMBA está abajo a la izquierda.', 'O botão BOMBA fica em baixo à esquerda.', 'ボムボタンは左下。'],
    'Bouton ARME': ['WEAPON button', 'Botón ARMA', 'Botão ARMA', '武器ボタン'],
    'En bas à droite ; PRÉC. et SUIV. passent d’une arme à l’autre.': ['Bottom right; PREV. and NEXT step through your weapons.', 'Abajo a la derecha; ANT. y SIG. pasan de un arma a otra.', 'Em baixo à direita; ANT. e SEG. passam de arma em arma.', '右下。前／次で武器を切り替え。'],
    'Bouton pause': ['Pause button', 'Botón de pausa', 'Botão de pausa', 'ポーズボタン'],
    'Dans la barre du bas. Une option met aussi en pause quand on lève le doigt.': ['In the bottom bar. An option also pauses when you lift your finger.', 'En la barra inferior. Una opción también pausa al levantar el dedo.', 'Na barra de baixo. Uma opção também pausa ao levantar o dedo.', '下のバーに。指を離すとポーズするオプションもあり。'],
    'Les boutons BOMBE et ARME n’apparaissent qu’en mission, sur écran tactile.': ['The BOMB and WEAPON buttons only appear during missions, on touch screens.', 'Los botones BOMBA y ARMA solo aparecen en misión, en pantalla táctil.', 'Os botões BOMBA e ARMA só aparecem em missão, em ecrã tátil.', 'ボム・武器ボタンはミッション中のタッチ画面のみ。'],
    'Modules à ramasser': ['Pick-ups', 'Módulos para recoger', 'Módulos a apanhar', '拾えるモジュール'],
    'Puissance': ['Power', 'Potencia', 'Potência', 'パワー'],
    'Tir plus fort, jusqu’à 5': ['Stronger fire, up to 5', 'Disparo más fuerte, hasta 5', 'Tiro mais forte, até 5', '射撃強化（最大5）'],
    'Bouclier': ['Shield', 'Escudo', 'Escudo', 'シールド'],
    'Encaisse un coup': ['Absorbs one hit', 'Absorbe un golpe', 'Absorve um golpe', '1発防ぐ'],
    'Coque': ['Hull', 'Casco', 'Casco', '装甲'],
    'Répare le vaisseau': ['Repairs the ship', 'Repara la nave', 'Repara a nave', '機体を修理'],
    'Coins': ['Coins', 'Monedas', 'Moedas', 'コイン'],
    'Pour la boutique': ['For the shop', 'Para la tienda', 'Para a loja', 'ショップ用'],
    'Bombe': ['Bomb', 'Bomba', 'Bomba', 'ボム'],
    'Une bombe de plus': ['One more bomb', 'Una bomba más', 'Mais uma bomba', 'ボム+1'],
    'Les coins gagnés en mission sont gardés : dépense-les en boutique pour améliorer vaisseaux, armes et équipements.': ['Coins earned in missions are kept: spend them in the shop to upgrade ships, weapons and gear.', 'Las monedas ganadas en misión se guardan: gástalas en la tienda para mejorar naves, armas y equipo.', 'As moedas ganhas em missão ficam guardadas: gaste-as na loja para melhorar naves, armas e equipamento.', 'ミッションで得たコインは保存され、ショップで機体・武器・装備の強化に使える。'],
    'Ctrl tire et lance aussi une bombe ; Maj lance une bombe.': ['Ctrl fires and also drops a bomb; Shift drops a bomb.', 'Ctrl dispara y también lanza una bomba; Mayús lanza una bomba.', 'Ctrl dispara e também lança uma bomba; Shift lança uma bomba.', 'Ctrlは射撃とボム両方、Shiftはボム。'],
    'Échap': ['Esc', 'Esc', 'Esc', 'Esc'], 'Espace': ['Space', 'Espacio', 'Espaço', 'スペース'], 'Entrée': ['Enter', 'Intro', 'Enter', 'Enter'], 'Maj': ['Shift', 'Mayús', 'Shift', 'Shift'], 'Ctrl': ['Ctrl', 'Ctrl', 'Ctrl', 'Ctrl'], 'Tab': ['Tab', 'Tab', 'Tab', 'Tab'],
    'ou': ['or', 'o', 'ou', 'または']
  };
  try { for (const k in TXT) if (!LDATA[k]) LDATA[k] = TXT[k]; LIDX = null; LCACHE.clear(); } catch (e) {}
  const t = s => { try { return typeof L === 'function' ? L(s) : s; } catch (e) { return s; } };
  const lang = () => (typeof LANG !== 'undefined' ? LANG : 'fr');
  const kbd = s => `<kbd>${s}</kbd>`;
  /* ---- le clavier ---- */
  const AZ = [
    [['f1', 'F1'], ['f2', 'F2'], ['f3', 'F3'], ['f4', 'F4']],
    [['²'], ['&'], ['é'], ['"'], ["'"], ['('], ['-'], ['è'], ['_'], ['ç'], ['à'], [')'], ['='], ['bksp', '⌫', 2]],
    [['tab', 'Tab', 1.5], ['a'], ['z'], ['e'], ['r'], ['t'], ['y'], ['u'], ['i'], ['o'], ['p'], ['^'], ['$'], ['enter', 'Entrée', 1.5]],
    [['caps', 'Verr. Maj', 1.75], ['q'], ['s'], ['d'], ['f'], ['g'], ['h'], ['j'], ['k'], ['l'], ['m'], ['ù'], ['*'], ['enter2', '↵', 1.25]],
    [['shift', 'Maj', 1.25], ['<'], ['w'], ['x'], ['c'], ['v'], ['b'], ['n'], [','], [';'], [':'], ['!'], ['shift', 'Maj', 2.75]],
    [['ctrl', 'Ctrl', 1.5], ['fn', 'Fn', 1.25], ['alt', 'Alt', 1.25], ['space', 'Espace', 7], ['altgr', 'Alt Gr', 1.25], ['fn', 'Fn', 1.25], ['ctrl', 'Ctrl', 1.5]]
  ];
  const QW = [
    AZ[0],
    [['`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['-'], ['='], ['bksp', '⌫', 2]],
    [['tab', 'Tab', 1.5], ['q'], ['w'], ['e'], ['r'], ['t'], ['y'], ['u'], ['i'], ['o'], ['p'], ['['], [']'], ['\\', '\\', 1.5]],
    [['caps', 'Caps', 1.75], ['a'], ['s'], ['d'], ['f'], ['g'], ['h'], ['j'], ['k'], ['l'], [';'], ["'"], ['enter', 'Enter', 2.25]],
    [['shift', 'Shift', 2.25], ['z'], ['x'], ['c'], ['v'], ['b'], ['n'], ['m'], [','], ['.'], ['/'], ['shift', 'Shift', 2.75]],
    AZ[5]
  ];
  function bindings(mode, az) {
    const up = az ? 'z' : 'w', left = az ? 'q' : 'a';
    if (mode === 'duo') return {
      p1: ['up', 'down', 'left', 'right', 'space', 'enter', 'ctrl', 'b', 'g'],
      p2: [up, left, 's', 'd', 'f', 'l', 'g', 'k'],
      pause: ['esc', 'p'], sound: ['m']
    };
    return {
      move: ['up', 'down', 'left', 'right', up, left, 's', 'd'],
      fire: ['space', 'enter', 'ctrl'],
      bomb: ['b', 'g', 'shift', 'ctrl'],
      weap: ['x', 'w', 'tab'],
      pause: ['esc', 'p'], sound: ['m'], full: ['f']
    };
  }
  const COL = { move: 'var(--hc-move)', fire: 'var(--hc-fire)', bomb: 'var(--hc-bomb)', weap: 'var(--hc-weap)', pause: 'var(--hc-pause)', sound: 'var(--hc-sound)', full: 'var(--hc-full)', p1: 'var(--hc-p1)', p2: 'var(--hc-p2)' };
  function keyboard(mode) {
    const az = lang() === 'fr', rows = az ? AZ : QW, B = bindings(mode, az);
    const catsOf = id => Object.keys(B).filter(c => B[c].includes(id));
    const key = ([id, label, w]) => {
      const cats = catsOf(id), lab = label === undefined ? id.toUpperCase() : t(label);
      const style = `--w:${w || 1};${cats.length ? '--c:' + COL[cats[0]] : ''}`;
      const dots = cats.length > 1 ? `<span class="dots">${cats.map(c => `<i style="--d:${COL[c]}"></i>`).join('')}</span>` : '';
      return `<span class="nvh-k${cats.length ? ' on' : ''}${/^f\d/.test(id) ? ' dim' : ''}${['up', 'down', 'left', 'right'].includes(id) ? ' big' : ''}" data-cats="${cats.join(' ')}" style="${style}">${lab}${dots}</span>`;
    };
    const gap = w => `<span class="nvh-k gap" data-cats="" style="--w:${w}"></span>`;
    const fn = `<div class="nvh-row fn">${key(['esc', 'Échap'])}${gap(1)}${rows[0].map(key).join('')}${gap(.5)}${[5, 6, 7, 8].map(n => key(['f' + n, 'F' + n])).join('')}${gap(.5)}${[9, 10, 11, 12].map(n => key(['f' + n, 'F' + n])).join('')}</div>`;
    const main = fn + rows.slice(1).map(r => `<div class="nvh-row">${r.map(key).join('')}</div>`).join('');
    const nav = `<div class="nvh-row fn"></div><div class="nvh-row"></div><div class="nvh-row"></div><div class="nvh-row"></div>` +
      `<div class="nvh-row">${gap(1)}${key(['up', '↑'])}${gap(1)}</div><div class="nvh-row">${key(['left', '←'])}${key(['down', '↓'])}${key(['right', '→'])}</div>`;
    return `<div class="nvh-kb"><div class="nvh-col">${main}</div><div class="nvh-col">${nav}</div></div>`;
  }
  const act = (cat, title, sub) => `<div class="nvh-act" data-cat="${cat}" style="--c:${COL[cat]}"><b>${title}</b><span>${sub || ''}</span></div>`;
  function kbList(mode) {
    const az = lang() === 'fr', up = az ? 'Z' : 'W', left = az ? 'Q' : 'A', mv = `${kbd('←')}${kbd('↑')}${kbd('↓')}${kbd('→')} ${t('ou')} ${kbd(up)}${kbd(left)}${kbd('S')}${kbd('D')}`;
    if (mode === 'duo') return act('p1', t('Joueur 1'), `${t('déplacer')} ${kbd('←')}${kbd('↑')}${kbd('↓')}${kbd('→')} · ${t('tir')} ${kbd(t('Espace'))} ${kbd(t('Entrée'))} ${kbd('Ctrl')} · ${t('bombe')} ${kbd('B')} ${kbd('G')}`) +
      act('p2', t('Joueur 2'), `${t('déplacer')} ${kbd(up)}${kbd(left)}${kbd('S')}${kbd('D')} · ${t('tir')} ${kbd('F')} ${kbd('L')} · ${t('bombe')} ${kbd('G')} ${kbd('K')}`) +
      act('pause', t('Touches communes'), `${t('Pause')} ${kbd(t('Échap'))} ${kbd('P')} · ${t('Couper / remettre le son')} ${kbd('M')}`) +
      `<div class="nvh-note">${t('Scores, vies, bombes et puissance sont séparés ; les coins et l’arsenal restent communs.')}<br>${t('Deux manettes : la première pilote le joueur 1, la seconde le joueur 2.')}</div>`;
    return act('move', t('Déplacer le vaisseau'), mv) +
      act('fire', t('Tirer'), `${kbd(t('Espace'))} ${kbd(t('Entrée'))} ${kbd('Ctrl')} — ${t('Maintenir la touche (ou activer le tir automatique dans les options).')}`) +
      act('bomb', t('Bombe intelligente'), `${kbd('B')} ${kbd('G')} ${kbd(t('Maj'))} — ${t('Gros dégâts à l’écran et efface tous les tirs ennemis.')}`) +
      act('weap', t('Changer de set de tir'), `${kbd('X')} ${kbd('W')} ${kbd('Tab')} — ${t('Parmi les armes possédées.')} ${kbd(t('Maj'))}+${kbd('Tab')} : ${t('arme précédente')}`) +
      `<div class="nvh-sys">${act('pause', t('Pause'), `${kbd(t('Échap'))} ${kbd('P')}`)}${act('sound', t('Son'), kbd('M'))}${act('full', t('Plein écran'), kbd('F'))}</div>`;
  }
  /* ---- dessins : souris, manette, téléphone ---- */
  const mouseSvg = () => `<svg class="nvh-svg" viewBox="0 0 320 300" aria-hidden="true"><defs>
      <linearGradient id="nvhM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5576"/><stop offset=".55" stop-color="#262e45"/><stop offset="1" stop-color="#151a28"/></linearGradient>
      <linearGradient id="nvhMs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g class="hit" data-cat="move" style="--c:var(--hc-move)" stroke="var(--hc-move)" stroke-width="4" fill="none" stroke-linecap="round">
      <path d="M40 150h-26m0 0 10-9m-10 9 10 9M280 150h26m0 0-10-9m10 9-10 9M160 24V4m0 0-9 10m9-10 9 10M160 290v-4"/></g>
    <path d="M160 36c-52 0-82 34-82 92v52c0 62 34 104 82 104s82-42 82-104v-52c0-58-30-92-82-92z" fill="url(#nvhM)" stroke="#0b0e16" stroke-width="3"/>
    <path class="hit" data-cat="fire" style="--c:var(--hc-fire)" d="M157 38c-46 2-76 34-77 88h77z" fill="var(--hc-fire)" fill-opacity=".85"/>
    <path class="hit" data-cat="story" style="--c:var(--hc-pause)" d="M163 38c46 2 76 34 77 88h-77z" fill="var(--hc-pause)" fill-opacity=".55"/>
    <rect x="151" y="62" width="18" height="40" rx="9" fill="#0e121c" stroke="#7d89aa" stroke-width="2"/><rect x="157" y="70" width="6" height="14" rx="3" fill="#c7d3ee"/>
    <path d="M90 120c4-40 30-70 66-78" stroke="url(#nvhMs)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="160" cy="258" r="4" fill="#3fe6f2" opacity=".8"/></svg>`;
  const padSvg = () => `<svg class="nvh-svg" viewBox="0 0 420 270" aria-hidden="true"><defs>
      <linearGradient id="nvhP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#47527a"/><stop offset=".5" stop-color="#283049"/><stop offset="1" stop-color="#161b2b"/></linearGradient></defs>
    <rect class="hit" data-cat="bomb" style="--c:var(--hc-bomb)" x="70" y="30" width="78" height="22" rx="10" fill="var(--hc-bomb)"/>
    <rect class="hit" data-cat="fire" style="--c:var(--hc-fire)" x="272" y="30" width="78" height="22" rx="10" fill="var(--hc-fire)"/>
    <rect class="hit" data-cat="fire" style="--c:var(--hc-fire)" x="282" y="50" width="70" height="14" rx="6" fill="var(--hc-fire)" opacity=".8"/>
    <path d="M110 52h200c52 0 84 40 96 102 10 52-4 96-40 98-30 2-46-26-62-54-8-14-20-20-36-20H152c-16 0-28 6-36 20-16 28-32 56-62 54-36-2-50-46-40-98 12-62 44-102 96-102z" fill="url(#nvhP)" stroke="#0b0e16" stroke-width="3"/>
    <g class="hit" data-cat="move" style="--c:var(--hc-move)">
      <circle cx="122" cy="118" r="30" fill="#0e121c" stroke="var(--hc-move)" stroke-width="3"/><circle cx="122" cy="118" r="18" fill="var(--hc-move)" opacity=".9"/>
      <path d="M152 168h18v-18h16v18h18v16h-18v18h-16v-18h-18z" fill="var(--hc-move)" transform="translate(-6 -2)"/></g>
    <g><circle class="hit" data-cat="fire" style="--c:var(--hc-fire)" cx="300" cy="152" r="15" fill="var(--hc-fire)"/>
      <circle class="hit" data-cat="bomb" style="--c:var(--hc-bomb)" cx="330" cy="122" r="15" fill="var(--hc-bomb)"/>
      <circle class="hit" data-cat="bomb" style="--c:var(--hc-bomb)" cx="270" cy="122" r="15" fill="var(--hc-bomb)"/>
      <circle cx="300" cy="92" r="15" fill="#3a4360" stroke="#59648a" stroke-width="2"/></g>
    <circle cx="262" cy="190" r="22" fill="#0e121c" stroke="#59648a" stroke-width="3"/><circle cx="262" cy="190" r="12" fill="#3a4360"/>
    <rect x="186" y="98" width="20" height="9" rx="4" fill="#59648a"/><rect x="214" y="98" width="20" height="9" rx="4" fill="#59648a"/></svg>`;
  const phoneSvg = () => `<svg class="nvh-svg" viewBox="0 0 300 330" aria-hidden="true" style="max-width:300px"><defs>
      <linearGradient id="nvhS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1430"/><stop offset="1" stop-color="#1a0b2e"/></linearGradient></defs>
    <rect x="60" y="6" width="180" height="318" rx="26" fill="#10141f" stroke="#4a5576" stroke-width="3"/>
    <rect x="70" y="18" width="160" height="294" rx="18" fill="url(#nvhS)"/>
    ${[[96, 60], [180, 92], [130, 130], [205, 40], [88, 150], [160, 210], [215, 175]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".7"/>`).join('')}
    <path d="M150 186l12 26-12-5-12 5z" fill="#e8ecff"/><path d="M150 180v-40" stroke="var(--hc-fire)" stroke-width="3" stroke-dasharray="6 6" class="hit" data-cat="fire" style="--c:var(--hc-fire)"/>
    <g class="hit" data-cat="move" style="--c:var(--hc-move)"><circle cx="150" cy="252" r="22" fill="var(--hc-move)" opacity=".22"/><circle cx="150" cy="252" r="11" fill="var(--hc-move)"/>
      <path d="M120 252h-18m60 0h18M150 278v14" stroke="var(--hc-move)" stroke-width="3" stroke-linecap="round"/></g>
    <g class="hit" data-cat="bomb" style="--c:var(--hc-bomb)"><rect x="78" y="276" width="44" height="22" rx="8" fill="var(--hc-bomb)"/><text x="100" y="291" text-anchor="middle" font-size="9" font-weight="900" fill="#1a0e04" font-family="system-ui">✹</text></g>
    <g class="hit" data-cat="weap" style="--c:var(--hc-weap)"><rect x="178" y="276" width="44" height="22" rx="8" fill="var(--hc-weap)"/><text x="200" y="291" text-anchor="middle" font-size="10" font-weight="900" fill="#0f0a22" font-family="system-ui">⇄</text></g>
    <g class="hit" data-cat="pause" style="--c:var(--hc-pause)"><rect x="138" y="24" width="24" height="16" rx="5" fill="var(--hc-pause)"/><path d="M146 28v8m8-8v8" stroke="#06140c" stroke-width="2.4"/></g></svg>`;
  /* ---- construction ---- */
  const ICON = {
    kb: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
    mouse: '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/></svg>',
    pad: '<svg viewBox="0 0 24 24"><path d="M6 9h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L15 14H9l-1.6 1.8A3 3 0 0 1 2 14v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3M16 12h.01M18 13.5h.01"/></svg>',
    touch: '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>'
  };
  let tab = 'kb', mode = 'solo';
  try { tab = (window.matchMedia && matchMedia('(hover:none)').matches) ? 'touch' : 'kb'; } catch (e) {}
  function build() {
    const head = panel.querySelector('.phead'), back = panel.querySelector('.row:last-child');
    const tabs = [['kb', 'Clavier'], ['mouse', 'Souris'], ['pad', 'Manette'], ['touch', 'Tactile']];
    const html = `<div class="nvh">
      <div class="nvh-tabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" class="nvh-tab${tab === id ? ' on' : ''}" data-tab="${id}" role="tab" aria-selected="${tab === id}">${ICON[id]}<span>${t(l)}</span></button>`).join('')}</div>
      <section class="nvh-pane${tab === 'kb' ? ' on' : ''}" data-pane="kb">
        <div class="nvh-art"><div class="nvh-mode"><button type="button" data-mode="solo" class="${mode === 'solo' ? 'on' : ''}">${t('SOLO')}</button><button type="button" data-mode="duo" class="${mode === 'duo' ? 'on' : ''}">${t('À DEUX')}</button></div>
          <div class="nvh-kbwrap">${keyboard(mode)}</div><div class="nvh-tip">${t('Survole une action pour voir ses touches.')}${mode === 'solo' ? '<br>' + t('Ctrl tire et lance aussi une bombe ; Maj lance une bombe. F (plein écran) sert au tir du joueur 2 à deux.') : ''}</div></div>
        <div class="nvh-list">${kbList(mode)}</div></section>
      <section class="nvh-pane${tab === 'mouse' ? ' on' : ''}" data-pane="mouse">
        <div class="nvh-art">${mouseSvg()}</div>
        <div class="nvh-list">${act('fire', t('Bouton gauche maintenu'), t('Tir continu pendant la mission.'))}${act('move', t('Déplacer la souris'), t('Le vaisseau suit le curseur si l’option « Visée souris » est activée (le clavier reste prioritaire).'))}${act('pause', t('Clic gauche / clic droit'), t('Dans l’histoire : page suivante / page précédente. Un clic passe aussi les transitions.'))}</div></section>
      <section class="nvh-pane${tab === 'pad' ? ' on' : ''}" data-pane="pad">
        <div class="nvh-art">${padSvg()}</div>
        <div class="nvh-list">${act('move', t('Déplacer le vaisseau'), t('Stick gauche ou croix'))}${act('fire', t('Tirer'), t('Bouton du bas, gâchette ou bouton d’épaule droits'))}${act('bomb', t('Bombe intelligente'), t('Bouton de droite, bouton de gauche ou gâchette gauche'))}<div class="nvh-note">${t('Deux manettes : la première pilote le joueur 1, la seconde le joueur 2.')}</div></div></section>
      <section class="nvh-pane${tab === 'touch' ? ' on' : ''}" data-pane="touch">
        <div class="nvh-art">${phoneSvg()}</div>
        <div class="nvh-list">${act('move', t('Glisser le doigt'), t('Le vaisseau suit, décalé pour rester visible sous le pouce. Le tir est automatique tant que le doigt reste posé.'))}${act('bomb', t('Deux doigts, double tap ou bouton BOMBE'), t('Le bouton BOMBE est en bas à gauche.'))}${act('weap', t('Bouton ARME'), t('En bas à droite ; PRÉC. et SUIV. passent d’une arme à l’autre.'))}${act('pause', t('Bouton pause'), t('Dans la barre du bas. Une option met aussi en pause quand on lève le doigt.'))}<div class="nvh-note">${t('Les boutons BOMBE et ARME n’apparaissent qu’en mission, sur écran tactile.')}</div></div></section>
      <div class="nvh-h">${t('Modules à ramasser')}</div>
      <div class="nvh-mods">${[['P', 'Puissance', 'Tir plus fort, jusqu’à 5', '#ff5ea8'], ['B', 'Bouclier', 'Encaisse un coup', '#3fe6f2'], ['V', 'Coque', 'Répare le vaisseau', '#6dffb0'], ['$', 'Coins', 'Pour la boutique', '#ffd36c'], ['✹', 'Bombe', 'Une bombe de plus', '#ffa045']]
        .map(([i, n, d, c]) => `<div class="nvh-mod" style="--c:${c}"><i>${i}</i><div><b>${t(n)}</b><span>${t(d)}</span></div></div>`).join('')}</div>
      <div class="nvh-coins">${t('Les coins gagnés en mission sont gardés : dépense-les en boutique pour améliorer vaisseaux, armes et équipements.').replace(/(coins|Coins|monedas|moedas|コイン)/, '<b>$1</b>')}</div>
    </div>`;
    [...panel.children].forEach(c => { if (c !== head && c !== back) c.remove(); });
    head.insertAdjacentHTML('afterend', html);
    wire();
  }
  function wire() {
    panel.querySelectorAll('.nvh-tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; try { Audio2.sfx('ui'); } catch (e) {} build(); }));
    panel.querySelectorAll('.nvh-mode button').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; try { Audio2.sfx('ui'); } catch (e) {} build(); }));
    /* survol d'une action : ses touches (ou zones du dessin) s'allument */
    panel.querySelectorAll('.nvh-pane').forEach(p => {
      const kb = p.querySelector('.nvh-kb'), sv = p.querySelector('.nvh-svg');
      p.querySelectorAll('.nvh-act').forEach(a => {
        const on = () => {
          const c = a.dataset.cat, cs = mode === 'duo' && c === 'pause' ? ['pause', 'sound'] : [c];
          if (kb) { kb.classList.add('focus'); kb.querySelectorAll('.nvh-k').forEach(k => k.classList.toggle('hit', k.dataset.cats.split(' ').some(x => cs.includes(x)))); }
          if (sv) { sv.classList.add('focus'); sv.querySelectorAll('.hit').forEach(h => h.classList.toggle('on', h.dataset.cat === c || (c === 'pause' && h.dataset.cat === 'story'))); }
        };
        const off = () => { kb && kb.classList.remove('focus'); sv && sv.classList.remove('focus'); };
        a.addEventListener('mouseenter', on); a.addEventListener('mouseleave', off);
        a.addEventListener('click', () => { on(); clearTimeout(a._t); a._t = setTimeout(off, 1600); });
      });
      /* survol d'une touche : l'action correspondante s'éclaire */
      if (kb) kb.querySelectorAll('.nvh-k.on').forEach(k => {
        k.addEventListener('mouseenter', () => { const cs = k.dataset.cats.split(' '); p.querySelectorAll('.nvh-act').forEach(a => a.classList.toggle('hl', cs.includes(a.dataset.cat))); });
        k.addEventListener('mouseleave', () => p.querySelectorAll('.nvh-act').forEach(a => a.classList.remove('hl')));
      });
    });
  }
  /* reconstruit à chaque ouverture (la langue a pu changer) */
  let wasOn = scr.classList.contains('on');
  new MutationObserver(() => { const on = scr.classList.contains('on'); if (on && !wasOn) build(); wasOn = on; }).observe(scr, { attributes: true, attributeFilter: ['class'] });
  build();
})();
