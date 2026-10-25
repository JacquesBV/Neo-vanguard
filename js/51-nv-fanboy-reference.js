/* FanBoy KFM-01 — coque portable et verre LCD, SANS AUCUNE retouche des encres.
 * Le rendu authentique passe uniquement par la présentation physique et la
 * cadence : la palette interne (GB4), les livrées, le terrain et les sprites
 * restent EXACTEMENT tels que le moteur les peint — aucune conversion de
 * teinte, aucune inversion de polarité, aucun recalcul de décor.
 * Ce module ajoute seulement :
 *   · la coque portable originale autour de l'écran (PC et mobile) ;
 *   · le verre LCD : grille de pixels physique, matte neutre et reflet de
 *     lumière ambiante sur la vitre (blanc neutre, jamais teinté) ;
 *   · le cadrage du viewport FanBoy (160×144 natifs, pixels carrés) ;
 *   · la désactivation des masques CRT / phosphores / flou shader sur cette
 *     génération (un LCD n'a pas de tube).
 */
(() => {
  'use strict';
  const active = () => R.era === 0 && G.eraIdx === 0 && G.state !== 'story' && G.state !== 'title';
  const framed = () => active() && S.opts.gbBezel !== 0;

  /* Migration unique : les défauts d'animation authentiques de l'écran LCD.
     Encres et couleurs ne sont jamais touchées. */
  if (S.opts.fanboyGlassV4 !== 1) {
    S.opts.fanboyGlassV4 = 1;
    S.opts.gbFlicker = 1;            /* clignotement des sprites comme sur l'écran d'origine */
    S.opts.gbBezel = 1;              /* coque autour de l'écran */
    saveGame();
  }

  /* Cadrage : la coque réserve ses marges autour du viewport 160×144.
     Pendant le démarrage console, l'écran ne bouge pas : une baisse
     automatique de résolution en plein boot ferait tressauter la vitre. */
  const oldResize = resizeView;
  let pinS = null;
  resizeView = function () {
    const result = oldResize.apply(this, arguments);
    if (!framed()) { pinS = null; return result; }
    if (G.state === 'intro') {
      if (pinS !== null && pinS !== PF.s) {
        PF.s = pinS; PF.w = L_W * PF.s; PF.h = L_H * PF.s;
        PF.x = Math.round((view.w - PF.w) * .5 * view.dpr) / view.dpr;
        PF.y = Math.round((view.h - PF.h) * .5 * view.dpr) / view.dpr;
        gpuResize();          /* resynchronise le calque GPU (uniforme uPF) */
      } else if (pinS === null) pinS = PF.s;
      return result;
    }
    pinS = null;
    const W = view.w, H = view.h, d = view.dpr;
    const touchPad = IS_TOUCH ? 64 : 0;
    const side = Math.max(22, Math.min(44, W * .085));
    const top = 42, bottom = 58;
    const availableW = Math.max(1, W - result.sideRes * 2 - side * 2);
    const availableH = Math.max(1, H - touchPad - top - bottom);
    const scale = Math.min(availableW / L_W, availableH / L_H);
    const sourceScale = Math.max(.2, R.S || 1);
    const whole = Math.floor(scale * d / sourceScale);
    PF.s = whole >= 1 ? sourceScale * whole / d : scale;
    PF.w = L_W * PF.s; PF.h = L_H * PF.s;
    PF.x = Math.round((W - PF.w) * .5 * d) / d;
    PF.y = Math.round((top + (availableH - PF.h) * .5) * d) / d;
    R.vig = null; R.fog = null; gpuResize();
    return result;
  };

  // Coque biseautée symétrique, bandeau horizontal, voyant à droite.
  // Aucun logo constructeur, slogan d'origine ou marque déposée.
  function panel(x, y, w, h, cut) {
    ctx.beginPath(); ctx.moveTo(x + cut, y); ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut); ctx.lineTo(x + w, y + h - cut);
    ctx.lineTo(x + w - cut, y + h); ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut); ctx.lineTo(x, y + cut); ctx.closePath();
  }
  const oldFrame = drawMachineFrame;
  drawMachineFrame = function () {
    if (!active()) return oldFrame.apply(this, arguments);
    if (!framed()) return;
    const side = Math.min(PF.x - 5, 34), x = PF.x - side, y = PF.y - 33;
    const w = PF.w + side * 2, h = PF.h + 80;
    ctx.save();
    const shell = ctx.createLinearGradient(x, y, x + w, y + h);
    shell.addColorStop(0, '#e0e1d8'); shell.addColorStop(.45, '#c8ccc1'); shell.addColorStop(1, '#afb8ac');
    panel(x, y, w, h, 13); ctx.fillStyle = shell; ctx.fill();
    ctx.strokeStyle = '#788577'; ctx.lineWidth = 1.5; ctx.stroke();
    panel(x + 5, y + 5, w - 10, PF.h + 46, 9);
    ctx.fillStyle = '#535a53'; ctx.fill();
    ctx.strokeStyle = '#394039'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#a8b8a1'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '600 8px sans-serif';
    ctx.fillText('KFM-01  /  DOT DISPLAY', PF.x + 2, PF.y - 17, PF.w - 32);
    ctx.fillStyle = '#e84036'; ctx.shadowColor = '#ff3c20'; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(PF.x + PF.w - 7, PF.y - 17, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#31382c'; ctx.lineWidth = 3;
    ctx.strokeRect(PF.x - 1.5, PF.y - 1.5, PF.w + 3, PF.h + 3);
    const cy = PF.y + PF.h + 30;
    const fs = Math.min(22, PF.w * .084);
    ctx.font = `700 ${fs}px sans-serif`; ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillStyle = '#274c45'; ctx.fillText('FANBOY', PF.x + PF.w * .5, cy, PF.w * .70);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    // Insigne en losange double, distinct de toute lettre de console existante.
    const ex = PF.x + 7;
    ctx.strokeStyle = '#3e7564'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex + 5, cy - 7); ctx.lineTo(ex - 2, cy);
    ctx.lineTo(ex + 5, cy + 7); ctx.moveTo(ex + 10, cy - 7);
    ctx.lineTo(ex + 17, cy); ctx.lineTo(ex + 10, cy + 7); ctx.stroke();
    ctx.fillStyle = '#6d7d6c';
    for (let i = 0; i < 3; i++) ctx.fillRect(PF.x + PF.w - 16 + i * 5, cy - 6, 2, 12);
    ctx.restore();
  };

  /* Le verre : grille de pixels, matte et REFLET DE LUMIÈRE ambiante.
     Uniquement du blanc et du gris neutres — la teinte du jeu n'est jamais
     modifiée, le reflet se pose sur la vitre comme dans une vraie pièce. */
  const oldGlass = drawScreenGlass;
  let grid = null, gridKey = '';
  drawScreenGlass = function () {
    if (!active()) return oldGlass.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(PF.x, PF.y, PF.w, PF.h); ctx.clip();
    // Grille de sortie physique : évite de rééchantillonner les sprites natifs.
    const step = Math.max(2, Math.round(PF.w * view.dpr / R.bufC.w));
    const key = step + ':' + view.dpr;
    if (key !== gridKey) {
      const tile = document.createElement('canvas'); tile.width = tile.height = step;
      const g = tile.getContext('2d'); g.fillStyle = 'rgba(16,18,16,.05)';
      g.fillRect(0, 0, 1, step); g.fillRect(1, 0, step - 1, 1);
      grid = ctx.createPattern(tile, 'repeat'); gridKey = key;
    }
    if (grid) {
      ctx.save(); ctx.translate(PF.x, PF.y); ctx.scale(1 / view.dpr, 1 / view.dpr);
      ctx.fillStyle = grid; ctx.fillRect(0, 0, PF.w * view.dpr, PF.h * view.dpr); ctx.restore();
    }
    // Matte de la dalle : ombre neutre en haut et en bas, fixe sur la vitre.
    const shade = ctx.createLinearGradient(0, PF.y, 0, PF.y + PF.h);
    shade.addColorStop(0, 'rgba(10,12,10,.12)'); shade.addColorStop(.12, 'rgba(10,12,10,0)');
    shade.addColorStop(.72, 'rgba(10,12,10,.025)'); shade.addColorStop(1, 'rgba(10,12,10,.10)');
    ctx.fillStyle = shade; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    // Reflet de la lumière ambiante sur un LCD passif : large highlight doux,
    // fixé à la vitre (il ne suit pas le monde qui défile). Blanc neutre.
    const reflection = ctx.createLinearGradient(PF.x, PF.y + PF.h, PF.x + PF.w, PF.y);
    reflection.addColorStop(0, 'rgba(255,255,255,0)');
    reflection.addColorStop(.52, 'rgba(255,255,255,.015)');
    reflection.addColorStop(.80, 'rgba(255,255,255,.06)');
    reflection.addColorStop(1, 'rgba(255,255,255,.16)');
    ctx.fillStyle = reflection; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    // Balayage plus marqué dans le coin supérieur droit, comme une fenêtre.
    const glint = ctx.createLinearGradient(PF.x + PF.w * .74, 0, PF.x + PF.w, 0);
    glint.addColorStop(0, 'rgba(255,255,255,0)');
    glint.addColorStop(.55, 'rgba(255,255,255,.025)');
    glint.addColorStop(.82, 'rgba(255,255,255,.085)');
    glint.addColorStop(1, 'rgba(255,255,255,.015)');
    ctx.fillStyle = glint; ctx.fillRect(PF.x + PF.w * .74, PF.y, PF.w * .26, PF.h);
    // Liseré lumineux du bord haut de la vitre.
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1 / view.dpr;
    ctx.beginPath(); ctx.moveTo(PF.x, PF.y + 1 / view.dpr);
    ctx.lineTo(PF.x + PF.w, PF.y + 1 / view.dpr); ctx.stroke();
    ctx.restore();
  };

  /* La coque complète remplace le simple cadre peint par le module 24 :
     on l'écarte le temps du HUD pour ne pas doubler les bordures. */
  const oldHUD = drawHUD;
  drawHUD = function () {
    if (!framed()) return oldHUD.apply(this, arguments);
    const bezel = S.opts.gbBezel; S.opts.gbBezel = 0;
    try { return oldHUD.apply(this, arguments); } finally { S.opts.gbBezel = bezel; }
  };

  // Le FanBoy n'a ni masque CRT, ni phosphores RGB, ni flou shader global.
  const oldPresent = presentFrame;
  presentFrame = function () {
    if (!active()) return oldPresent.apply(this, arguments);
    const keys = ['crt', 'crtMask', 'crtVignette', 'shaderSmooth'];
    const saved = keys.map(k => S.opts[k]);
    Object.assign(S.opts, { crt: 'off', crtMask: 'off', crtVignette: 0, shaderSmooth: false });
    try { return oldPresent.apply(this, arguments); }
    finally { keys.forEach((k, i) => { if (saved[i] === undefined) delete S.opts[k]; else S.opts[k] = saved[i]; }); }
  };

  // Entrer/sortir d'un menu restaure les marges de viewport appropriées.
  const oldRender = render;
  let lastFrameState = null;
  render = function () {
    const state = framed();
    if (state !== lastFrameState) { lastFrameState = state; sideRes = resizeView().sideRes; }
    return oldRender.apply(this, arguments);
  };

  window.NV_FANBOY_REFERENCE = Object.freeze({ revision: 4, shell: true, glass: true, inks: 'untouched' });
})();
