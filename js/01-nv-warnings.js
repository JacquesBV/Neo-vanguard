
/* ====================== AVERTISSEMENTS AU LANCEMENT ==========================
   1) santé : risques d'épilepsie photosensible ;
   2) fiction : personnages, sociétés, consoles et événements imaginaires.
   Affichés à chaque lancement, par-dessus tout, fermés d'un seul geste.    */
(function () {
  const TXT = {
    fr: { t: 'AVERTISSEMENT', h1: 'Santé — épilepsie', p1: 'Chez certaines personnes, des lumières clignotantes ou des motifs lumineux peuvent provoquer des crises d’épilepsie ou des pertes de conscience, même sans aucun antécédent. Ce jeu contient des flashs, des explosions et des changements de couleurs rapides. Si toi ou un membre de ta famille avez déjà eu des crises, demande l’avis d’un médecin avant de jouer. Arrête immédiatement et consulte un médecin en cas de vertiges, de troubles de la vue, de contractions des yeux ou des muscles, de mouvements involontaires, de désorientation ou de perte de conscience.',
      p2: 'Joue dans une pièce bien éclairée, à bonne distance de l’écran, et fais une pause de 10 à 15 minutes toutes les heures. Évite de jouer si tu es fatigué. Les secousses, le halo et l’effet CRT se règlent dans les options graphiques.',
      h2: 'Œuvre de fiction', p3: 'Neo Vanguard est une œuvre de fiction. Les personnages, organisations, lieux, consoles, marques et événements présentés sont imaginaires. Toute ressemblance avec des personnes, des entreprises ou des faits réels, existants ou ayant existé, serait purement fortuite.', ok: 'J’AI COMPRIS' },
    en: { t: 'WARNING', h1: 'Health — epilepsy', p1: 'In some people, flashing lights or light patterns can trigger epileptic seizures or loss of consciousness, even with no prior history. This game contains flashes, explosions and rapid colour changes. If you or anyone in your family has ever had seizures, ask a doctor before playing. Stop immediately and see a doctor if you experience dizziness, blurred vision, eye or muscle twitching, involuntary movements, disorientation or loss of consciousness.',
      p2: 'Play in a well-lit room, at a good distance from the screen, and take a 10 to 15 minute break every hour. Avoid playing when tired. Screen shake, glow and the CRT effect can be adjusted in the graphics options.',
      h2: 'A work of fiction', p3: 'Neo Vanguard is a work of fiction. The characters, organisations, places, consoles, brands and events depicted are imaginary. Any resemblance to real persons, companies or events, living or dead, existing or past, is purely coincidental.', ok: 'I UNDERSTAND' },
    es: { t: 'ADVERTENCIA', h1: 'Salud — epilepsia', p1: 'En algunas personas, las luces intermitentes o los patrones luminosos pueden provocar crisis epilépticas o pérdidas de conocimiento, incluso sin antecedentes. Este juego contiene destellos, explosiones y cambios de color rápidos. Si tú o algún familiar habéis tenido crisis, consulta a un médico antes de jugar. Detente de inmediato y consulta a un médico si sientes mareos, visión borrosa, espasmos en los ojos o los músculos, movimientos involuntarios, desorientación o pérdida de conocimiento.',
      p2: 'Juega en una habitación bien iluminada, a buena distancia de la pantalla, y descansa de 10 a 15 minutos cada hora. Evita jugar si estás cansado. Las sacudidas, el halo y el efecto CRT se ajustan en las opciones gráficas.',
      h2: 'Obra de ficción', p3: 'Neo Vanguard es una obra de ficción. Los personajes, organizaciones, lugares, consolas, marcas y sucesos presentados son imaginarios. Cualquier parecido con personas, empresas o hechos reales, existentes o pasados, es pura coincidencia.', ok: 'ENTENDIDO' },
    pt: { t: 'AVISO', h1: 'Saúde — epilepsia', p1: 'Em algumas pessoas, luzes piscantes ou padrões luminosos podem provocar crises epilépticas ou perda de consciência, mesmo sem histórico. Este jogo contém flashes, explosões e mudanças rápidas de cor. Se você ou alguém da sua família já teve crises, consulte um médico antes de jogar. Pare imediatamente e procure um médico se sentir tontura, visão turva, contrações nos olhos ou músculos, movimentos involuntários, desorientação ou perda de consciência.',
      p2: 'Jogue em um ambiente bem iluminado, a uma boa distância da tela, e faça uma pausa de 10 a 15 minutos a cada hora. Evite jogar cansado. O tremor de tela, o brilho e o efeito CRT podem ser ajustados nas opções gráficas.',
      h2: 'Obra de ficção', p3: 'Neo Vanguard é uma obra de ficção. Os personagens, organizações, lugares, consoles, marcas e acontecimentos apresentados são imaginários. Qualquer semelhança com pessoas, empresas ou fatos reais, existentes ou passados, é mera coincidência.', ok: 'ENTENDI' },
    ja: { t: '警告', h1: '健康上の注意 — てんかん', p1: 'ごくまれに、強い光の点滅や光のパターンによって、けいれんや意識の喪失などの発作を起こす人がいます。これまで発作の経験がない人でも起こることがあります。このゲームには閃光、爆発、急激な色の変化が含まれます。あなたやご家族に発作の経験がある場合は、遊ぶ前に医師に相談してください。めまい、視覚の異常、目や筋肉のけいれん、意識の混乱、意識の喪失などを感じたら、すぐにプレイを中止し医師の診察を受けてください。',
      p2: '部屋を明るくし、画面から離れて遊んでください。1時間ごとに10〜15分の休憩をとり、疲れているときは遊ばないでください。画面の揺れ、グロー、CRT効果はグラフィック設定で調整できます。',
      h2: 'フィクションです', p3: 'Neo Vanguard はフィクションです。登場する人物、団体、場所、ゲーム機、ブランド、出来事はすべて架空のものです。実在の人物、企業、出来事との類似はすべて偶然です。', ok: '了解' },
  };
  function show() {
    if (document.getElementById('nvWarn')) return;
    const curLang = () => { let l = 'fr'; try { l = LANG; } catch (e) {} return TXT[l] ? l : 'fr'; };
    let lang = curLang();
    const T = TXT[lang];
    const d = document.createElement('div'); d.id = 'nvWarn'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = `<style>
      #nvWarn{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));background:#03060f;color:#e8eefc;font-family:var(--ui-font,system-ui,-apple-system,"Segoe UI",sans-serif);overflow-y:auto;transition:opacity .35s}
      #nvWarn.off{opacity:0;pointer-events:none}
      #nvWarn .w{max-width:640px;width:100%;margin:auto}
      #nvWarn h1{margin:0 0 18px;font-size:clamp(22px,5vw,30px);letter-spacing:.18em;color:#ffd84a;text-align:center}
      #nvWarn h2{margin:18px 0 6px;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:#7fe6ff}
      #nvWarn p{margin:0 0 10px;font-size:clamp(13px,3.4vw,15px);line-height:1.55;color:#cfd8ee}
      #nvWarn button{display:block;margin:22px auto 0;padding:14px 34px;font:700 15px/1 inherit;font-family:inherit;letter-spacing:.14em;color:#03060f;background:#ffd84a;border:0;border-radius:10px;cursor:pointer}
      #nvWarn button:focus-visible{outline:3px solid #7fe6ff;outline-offset:3px}
    </style><div class="w"><h1>⚠ ${T.t}</h1><h2>${T.h1}</h2><p>${T.p1}</p><p>${T.p2}</p><h2>${T.h2}</h2><p>${T.p3}</p><button type="button">${T.ok}</button></div>`;
    document.body.appendChild(d);
    const btn = d.querySelector('button');
    const close = () => { OPEN = null; d.classList.add('off'); setTimeout(() => d.remove(), 400); };
    OPEN = { d, btn, close };
    /* la langue du joueur n'est connue qu'une fois la sauvegarde lue : on suit */
    const sync = setInterval(() => {
      if (!OPEN) { clearInterval(sync); return; }
      const l = curLang(); if (l === lang) return; lang = l;
      const X = TXT[l], q = sel => d.querySelector(sel);
      q('h1').textContent = '⚠ ' + X.t; const h = d.querySelectorAll('h2'), p = d.querySelectorAll('p');
      h[0].textContent = X.h1; h[1].textContent = X.h2; p[0].textContent = X.p1; p[1].textContent = X.p2; p[2].textContent = X.p3; btn.textContent = X.ok;
    }, 200);
    try { btn.focus(); } catch (e) {}
  }
  /* Ces écouteurs sont posés AVANT ceux du jeu (ce script est le premier de la
     page) : tant que l'avertissement est affiché, aucun geste ni aucune touche
     n'atteint l'écran d'entrée ou le jeu derrière. */
  let OPEN = null, until = 0;
  const block = ev => {
    if (!OPEN && performance.now() > until) return;
    ev.stopImmediatePropagation();
    if (!OPEN) { ev.preventDefault(); return; }          /* fin du geste qui a fermé */
    const onBtn = OPEN.btn.contains(ev.target);
    if (ev.type === 'keydown') {
      if (['Enter', ' ', 'Spacebar', 'Escape'].includes(ev.key)) { ev.preventDefault(); OPEN.close(); until = performance.now() + 400; }
      else if (ev.key !== 'Tab') ev.preventDefault();
      return;
    }
    if (ev.type === 'pointerdown' && onBtn) { ev.preventDefault(); OPEN.close(); until = performance.now() + 500; return; }
    if (ev.type === 'wheel' || ev.type === 'touchmove') return;  /* défilement du texte autorisé */
    if (!onBtn && ev.cancelable && ev.type !== 'touchstart') ev.preventDefault();
  };
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'keydown', 'keyup', 'keypress', 'wheel', 'touchmove']
    .forEach(t => addEventListener(t, block, { capture: true, passive: false }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
})();
