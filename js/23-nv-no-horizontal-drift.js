
/* Sur PC, la navigation au clavier ou un défilement « doux » pouvait faire
   glisser horizontalement un conteneur censé être fixe (overflow caché) :
   tout l'écran partait vers le côté. Seuls les vrais bandeaux à défilement
   horizontal (overflow-x auto/scroll) ont le droit de défiler en largeur.   */
(() => {
  const fixX = el => {
    if (!el || !el.scrollLeft) return;
    const root = el === document.scrollingElement || el === document.documentElement || el === document.body;
    const ox = root ? 'hidden' : getComputedStyle(el).overflowX;
    if (root || ox === 'hidden' || ox === 'clip' || ox === 'visible') el.scrollLeft = 0;
  };
  document.addEventListener('scroll', e => fixX(e.target === document ? document.scrollingElement : e.target), true);
  addEventListener('scroll', () => { if (scrollX) scrollTo(0, scrollY); }, { passive: true });
  setInterval(() => { fixX(document.scrollingElement); fixX(document.body); if (scrollX) scrollTo(0, scrollY); for (const id of ['nvTitle', 'game', 'wrap', 'app', 'stage']) fixX(document.getElementById(id)); }, 1000);
})();
