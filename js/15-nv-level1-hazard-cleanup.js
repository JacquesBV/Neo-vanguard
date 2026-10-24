
(() => {
  /* Les balles de la première mission restent attachées à leur tireur :
     celles d’un ennemi détruit ou sorti de l’écran s’effacent au tick suivant. */
  const fireWithSource = enemyFire;
  enemyFire = function (enemy, pattern, scale) {
    const first = G.ebullets.length;
    const result = fireWithSource(enemy, pattern, scale);
    for (let i = first; i < G.ebullets.length; i++) G.ebullets[i].source = enemy;
    return result;
  };
  const updateWithCleanup = updateEBullets;
  updateEBullets = function (dt) {
    if (R.era === 0 && G.level === 1) {
      for (let i = G.ebullets.length - 1; i >= 0; i--) {
        const b = G.ebullets[i];
        if (b.source && !G.enemies.includes(b.source)) G.ebullets.splice(i, 1);
      }
    }
    return updateWithCleanup(dt);
  };
})();
