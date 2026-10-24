
/* ====================== GROS ENNEMIS : PIXELS À LA BONNE TAILLE ==============
   Les ennemis lourds (Scie-Mère, Orbiteur Alpha, Canonnière lourde…) réutilisent
   le sprite d'un petit ennemi agrandi 1,6 à 2,5 fois. En 8 et 16 bits, ce petit
   sprite était étiré : des pixels énormes, une silhouette illisible, sans
   rapport avec le reste du jeu. On les dessine désormais à leur vraie taille,
   avec des pixels de la même finesse que les autres sprites de l'ère.        */
(function () {
  const BIG = {};
  function bigId(id, sc) {
    const k = id + '@x' + sc.toFixed(2);
    if (!BIG[k]) {
      SIL[k] = SIL[id];
      SPRITE_H[k] = (SPRITE_H[id] || 60) * sc;
      if (POSE_AMP[id] !== undefined) POSE_AMP[k] = POSE_AMP[id] / sc;
      if (VEC[id]) VEC[k] = VEC[id];
      BIG[k] = 1;
    }
    return k;
  }
  /* drawSpriteTo garde sa taille d'affichage ; seule la planche cuite est
     plus détaillée (les sprites dessinés à partir d'images ne changent pas). */
  let CUR = 1;
  const _draw = drawSpriteTo;
  drawSpriteTo = function (g, K, id, x, y, opt) {
    const sc = (opt && opt.kind === 'enemy' && opt.scale) || 1;
    if (sc <= 1.2) return _draw.apply(this, arguments);
    const keep = CUR; CUR = Math.round(sc * 20) / 20;
    try { return _draw.apply(this, arguments); } finally { CUR = keep; }
  };
  const _bake = bakeSprite;
  bakeSprite = function (id, era, kind, hue, sat, light, frame) {
    if (CUR > 1.2 && era <= 2 && kind === 'enemy' && SIL[id]) id = bigId(id, CUR);
    return _bake.call(this, id, era, kind, hue, sat, light, frame);
  };
})();

/* ============================ SCIE-MÈRE : NOUVEAU DESSIN =====================
   Elle avait le sprite de la petite scie, agrandi. Elle a maintenant le sien :
   une lame à 12 dents crochues, une gorge sombre, six évidements, un moyeu
   boulonné et un œil central. En 8 et 16 bits, la rotation n'est plus faite
   par quarts de tour (les dents sautaient) : quatre images pré-tournées font
   avancer les dents d'un pixel à l'autre, comme une vraie scie.             */
(function () {
  const TAU = Math.PI * 2, N = 12, STEP = TAU / N;
  function parts(ph) {
    const out = [];
    /* dents crochues : la pointe est décalée dans le sens de rotation */
    for (let i = 0; i < N; i++) {
      const a = i * STEP + ph;
      const b0 = a - STEP * 0.36, b1 = a + STEP * 0.30, tip = a + STEP * 0.38;
      out.push(P([[Math.cos(b0) * 0.70, Math.sin(b0) * 0.70], [Math.cos(tip) * 1.0, Math.sin(tip) * 1.0],
                  [Math.cos(b1) * 0.80, Math.sin(b1) * 0.80], [Math.cos(b1) * 0.70, Math.sin(b1) * 0.70]], MAT.TRIM));
    }
    out.push(P(discPiece(0.80, 0, 0, 24), MAT.HULL));                       /* lame        */
    out.push(P(arcPiece(0.66, 0.58, 0, TAU, 24), MAT.DARK));                /* gorge       */
    out.push(P(discPiece(0.58, 0, 0, 20), MAT.WING));                      /* flasque     */
    for (let i = 0; i < 6; i++) {                                           /* évidements  */
      const a = i * TAU / 6 + ph * 0.5 + STEP / 2;
      out.push(P(ellipsePiece(0.085, 0.085, Math.cos(a) * 0.42, Math.sin(a) * 0.42, 8), MAT.DARK));
    }
    out.push(P(discPiece(0.31, 0, 0, 16), MAT.DARK));                       /* collerette  */
    out.push(P(discPiece(0.26, 0, 0, 14), MAT.HULL));                       /* moyeu       */
    for (let i = 0; i < 3; i++) {                                           /* boulons     */
      const a = i * TAU / 3 + ph * 0.5 + 0.5;
      out.push(P(discPiece(0.05, Math.cos(a) * 0.20, Math.sin(a) * 0.20, 6), MAT.ACCENT, 1));
    }
    out.push(P(discPiece(0.15, 0, 0, 12), MAT.GLOW));                       /* œil         */
    out.push(P(discPiece(0.05, 0, 0, 8), MAT.DARK));                        /* pupille     */
    return out;
  }
  const H = SPRITE_H.bladespin || 40;
  for (let k = 0; k < 4; k++) {
    const id = 'mothersaw' + (k ? k : '');
    SIL[id] = { w: 1.0, parts: parts(k * STEP / 4) };
    SPRITE_H[id] = H;
    POSE_AMP[id] = 0;
    try { VEC[id] = VEC._generic(id); } catch (e) {}
  }
  EID.mBlade = 'mothersaw';
  /* en 8 bits, chaque ennemi reçoit des « plaques de blindage » de vaisseau
     peintes par-dessus ; sur une lame ronde, elles dessinaient un visage
     sans rapport : la Scie-Mère garde son propre dessin. */
  const _pocket = addPocketEnemyDetail;
  addPocketEnemyDetail = function (sprite, id) {
    if (typeof id === 'string' && id.indexOf('mothersaw') === 0) return;
    return _pocket.apply(this, arguments);
  };
  const _draw = drawSpriteTo;
  drawSpriteTo = function (g, K, id, x, y, opt) {
    if (id === 'mothersaw' && opt && typeof R !== 'undefined' && R.era <= 2) {
      const r = (((opt.rot || 0) % STEP) + STEP) % STEP;
      const k = Math.floor(r / STEP * 4) & 3;
      return _draw.call(this, g, K, k ? 'mothersaw' + k : 'mothersaw', x, y, Object.assign({}, opt, { rot: 0, frame: 0 }));
    }
    return _draw.apply(this, arguments);
  };
})();
